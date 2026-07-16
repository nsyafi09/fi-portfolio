#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const STORIES_DIR = path.join(ROOT, 'posts', 'personal', 'stories');
const DATA_DIR     = path.join(ROOT, 'data', 'personal-stories');
const INDEX_FILE  = path.join(DATA_DIR, 'index.json');

const PORTFOLIO_PROJECTS_DIR = path.join(ROOT, 'posts', 'portfolio', 'projects');
const PORTFOLIO_DATA_DIR     = path.join(ROOT, 'data', 'portfolio');
const PORTFOLIO_INDEX_FILE   = path.join(PORTFOLIO_DATA_DIR, 'index.json');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(': ');
    if (idx === -1) return;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 2).trim();
  });
  return meta;
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// Each story/project is a folder named after its slug, containing
// <slug>.md (or .json) plus an optional images/ subfolder. `imageField` is
// just the bare filename inside that images/ folder — this resolves it to
// the full site-relative path, or '' if the file isn't there.
function resolveImage(bundleDir, contentRelDir, imageField) {
  if (!imageField) return '';
  if (!fs.existsSync(path.join(bundleDir, 'images', imageField))) return '';
  return contentRelDir + '/images/' + imageField;
}

function slugDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

const entries = [];

// from posts/personal/stories/<slug>/<slug>.md
slugDirs(STORIES_DIR).forEach(slug => {
  const bundleDir = path.join(STORIES_DIR, slug);
  const file = path.join(bundleDir, slug + '.md');
  if (!fs.existsSync(file)) return;

  const raw  = fs.readFileSync(file, 'utf8');
  const meta = parseFrontmatter(raw);
  if (!meta || meta.draft === 'true') return;

  const genres = meta.genres
    ? meta.genres.split(',').map(g => g.trim())
    : [];
  const contentRelDir = 'posts/personal/stories/' + slug;

  entries.push({
    slug,
    type:        'linear',
    title:       meta.title    || slug,
    series:      meta.series   || '',
    language:    meta.language || 'en',
    preview:     meta.description || '',
    genres,
    image:       resolveImage(bundleDir, contentRelDir, meta.image),
    contentPath: contentRelDir + '/' + slug + '.md',
  });
});

// from data/personal-stories/<slug>/<slug>.json (branching stories, TO-BE removed later)
slugDirs(DATA_DIR).forEach(slug => {
  const bundleDir = path.join(DATA_DIR, slug);
  const file = path.join(bundleDir, slug + '.json');
  if (!fs.existsSync(file)) return;

  const raw = fs.readFileSync(file, 'utf8');
  let story;
  try { story = JSON.parse(raw); } catch { return; }
  if (story.draft === true) return;

  const autoPreview = story.nodes && story.nodes[0] && story.nodes[0].text
    ? stripHtml(story.nodes[0].text).slice(0, 120)
    : '';
  const contentRelDir = 'data/personal-stories/' + slug;

  entries.push({
    slug:        story.slug     || slug,
    type:        'branching',
    title:       story.title    || '',
    series:      story.series   || '',
    language:    story.language || 'en',
    preview:     story.preview  || autoPreview,
    genres:      story.genres   || [],
    image:       resolveImage(bundleDir, contentRelDir, story.image),
    contentPath: contentRelDir + '/' + slug + '.json',
  });
});

fs.writeFileSync(INDEX_FILE, JSON.stringify(entries, null, 2) + '\n');
console.log(`Wrote ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to data/personal-stories/index.json`);
entries.forEach(e => console.log(`  [${e.type}] ${e.slug}  →  ${e.contentPath}`));

// --- Portfolio projects from posts/portfolio/projects/<slug>/<slug>.md ---
const portfolioEntries = [];

slugDirs(PORTFOLIO_PROJECTS_DIR).forEach(slug => {
  const bundleDir = path.join(PORTFOLIO_PROJECTS_DIR, slug);
  const file = path.join(bundleDir, slug + '.md');
  if (!fs.existsSync(file)) return;

  const raw  = fs.readFileSync(file, 'utf8');
  const meta = parseFrontmatter(raw);
  if (!meta || meta.draft === 'true') return;

  const tags = meta.tags
    ? meta.tags.split(',').map(t => t.trim())
    : [];
  const contentRelDir = 'posts/portfolio/projects/' + slug;

  portfolioEntries.push({
    slug,
    title:       meta.title       || slug,
    preview:     meta.description || '',
    tags,
    linkType:    meta.linkType    || 'internal',
    linkUrl:     meta.linkUrl     || null,
    image:       resolveImage(bundleDir, contentRelDir, meta.image),
    contentPath: contentRelDir + '/' + slug + '.md',
  });
});

if (!fs.existsSync(PORTFOLIO_DATA_DIR)) fs.mkdirSync(PORTFOLIO_DATA_DIR, { recursive: true });
fs.writeFileSync(PORTFOLIO_INDEX_FILE, JSON.stringify(portfolioEntries, null, 2) + '\n');
console.log(`Wrote ${portfolioEntries.length} entr${portfolioEntries.length === 1 ? 'y' : 'ies'} to data/portfolio/index.json`);
portfolioEntries.forEach(e => console.log(`  [project] ${e.slug}  →  ${e.contentPath}`));
