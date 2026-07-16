#!/usr/bin/env node
// Verifies the content pipeline from scripts/gen-index.js

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

const ROOT        = path.resolve(__dirname, '..');
const STORIES_DIR  = path.join(ROOT, 'posts', 'personal', 'stories');
const DATA_DIR     = path.join(ROOT, 'data', 'personal-stories');
const INDEX_FILE   = path.join(DATA_DIR, 'index.json');

const PORTFOLIO_PROJECTS_DIR = path.join(ROOT, 'posts', 'portfolio', 'projects');
const PORTFOLIO_INDEX_FILE   = path.join(ROOT, 'data', 'portfolio', 'index.json');

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

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

function slugDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

console.log('Regenerating data/personal-stories/index.json...');
execSync('node scripts/gen-index.js', { cwd: ROOT, stdio: 'inherit' });

try {
  execSync(`git diff --exit-code -- ${JSON.stringify(path.relative(ROOT, INDEX_FILE))}`, {
    cwd: ROOT,
    stdio: 'pipe',
  });
  console.log('index.json is up to date.');
} catch {
  fail(
    'data/personal-stories/index.json',
    'is out of date — run `node scripts/gen-index.js` and commit the result'
  );
}

try {
  execSync(`git diff --exit-code -- ${JSON.stringify(path.relative(ROOT, PORTFOLIO_INDEX_FILE))}`, {
    cwd: ROOT,
    stdio: 'pipe',
  });
  console.log('data/portfolio/index.json is up to date.');
} catch {
  fail(
    'data/portfolio/index.json',
    'is out of date — run `node scripts/gen-index.js` and commit the result'
  );
}

// Validate a bundle's frontmatter `image:` field actually resolves to a
// file inside <bundleDir>/images/. gen-index.js silently falls back to ''
// when it doesn't, which would ship a story with a broken card thumbnail.
function checkImage(rel, bundleDir, imageField) {
  if (!imageField) return;
  if (!fs.existsSync(path.join(bundleDir, 'images', imageField))) {
    fail(rel, `frontmatter image "${imageField}" not found in images/ subfolder`);
  }
}

// Validate Markdown stories: posts/personal/stories/<slug>/<slug>.md
const seenSlugs = new Map();

slugDirs(STORIES_DIR).forEach(slug => {
  const bundleDir = path.join(STORIES_DIR, slug);
  const file = path.join(bundleDir, slug + '.md');
  const rel = path.join('posts', 'personal', 'stories', slug, slug + '.md');

  if (!fs.existsSync(file)) {
    fail(path.join('posts', 'personal', 'stories', slug), `folder has no ${slug}.md`);
    return;
  }

  const raw = fs.readFileSync(file, 'utf8');
  const meta = parseFrontmatter(raw);

  if (!meta) {
    fail(rel, 'frontmatter did not parse (missing or malformed --- fences)');
    return;
  }

  if (meta.draft === 'true') return; // intentionally excluded, nothing to validate

  ['title', 'image', 'description'].forEach(field => {
    if (!meta[field]) fail(rel, `missing required frontmatter field "${field}"`);
  });

  checkImage(rel, bundleDir, meta.image);

  if (seenSlugs.has(slug)) {
    fail(rel, `duplicate slug "${slug}" (also used by ${seenSlugs.get(slug)})`);
  } else {
    seenSlugs.set(slug, rel);
  }
});

// Validate branching stories: data/personal-stories/<slug>/<slug>.json (TO-BE Removed later)
slugDirs(DATA_DIR).forEach(slug => {
  const bundleDir = path.join(DATA_DIR, slug);
  const file = path.join(bundleDir, slug + '.json');
  const rel = path.join('data', 'personal-stories', slug, slug + '.json');

  if (!fs.existsSync(file)) {
    fail(path.join('data', 'personal-stories', slug), `folder has no ${slug}.json`);
    return;
  }

  const raw = fs.readFileSync(file, 'utf8');

  let story;
  try {
    story = JSON.parse(raw);
  } catch (err) {
    fail(rel, `invalid JSON — ${err.message}`);
    return;
  }

  if (story.draft === true) return; // intentionally excluded, nothing to validate

  ['slug', 'title', 'image'].forEach(field => {
    if (!story[field]) fail(rel, `missing required field "${field}"`);
  });

  checkImage(rel, bundleDir, story.image);

  const storySlug = story.slug || slug;
  if (seenSlugs.has(storySlug)) {
    fail(rel, `duplicate slug "${storySlug}" (also used by ${seenSlugs.get(storySlug)})`);
  } else {
    seenSlugs.set(storySlug, rel);
  }

  if (!Array.isArray(story.nodes) || story.nodes.length === 0) {
    fail(rel, 'missing or empty "nodes" array');
    return;
  }

  const ids = story.nodes.map(n => n.id);
  if (!ids.includes(1)) {
    fail(rel, 'no node with id 1 — story.js always starts at node id 1, this story cannot load');
  }

  story.nodes.forEach(node => {
    (node.routes || []).forEach(route => {
      if (route.nextText != null && route.nextText > 0 && !ids.includes(route.nextText)) {
        fail(rel, `node ${node.id} has a route pointing to nonexistent node id ${route.nextText}`);
      }
    });
  });
});

// Validate portfolio project write-ups: posts/portfolio/projects/<slug>/<slug>.md
// (independent slug space from personal-stories, since readers look these up
// via an explicit ?catalog=portfolio param, not by guessing)
const seenPortfolioSlugs = new Map();

slugDirs(PORTFOLIO_PROJECTS_DIR).forEach(slug => {
  const bundleDir = path.join(PORTFOLIO_PROJECTS_DIR, slug);
  const file = path.join(bundleDir, slug + '.md');
  const rel = path.join('posts', 'portfolio', 'projects', slug, slug + '.md');

  if (!fs.existsSync(file)) {
    fail(path.join('posts', 'portfolio', 'projects', slug), `folder has no ${slug}.md`);
    return;
  }

  const raw = fs.readFileSync(file, 'utf8');
  const meta = parseFrontmatter(raw);

  if (!meta) {
    fail(rel, 'frontmatter did not parse (missing or malformed --- fences)');
    return;
  }

  if (meta.draft === 'true') return; // intentionally excluded, nothing to validate

  ['title', 'description'].forEach(field => {
    if (!meta[field]) fail(rel, `missing required frontmatter field "${field}"`);
  });

  if (meta.image) checkImage(rel, bundleDir, meta.image);

  const linkType = meta.linkType || 'internal';
  if (!['internal', 'external', 'none'].includes(linkType)) {
    fail(rel, `invalid linkType "${linkType}" — must be "internal", "external", or "none"`);
  }
  if (linkType === 'external' && !meta.linkUrl) {
    fail(rel, 'linkType is "external" but no linkUrl is set');
  }

  if (seenPortfolioSlugs.has(slug)) {
    fail(rel, `duplicate slug "${slug}" (also used by ${seenPortfolioSlugs.get(slug)})`);
  } else {
    seenPortfolioSlugs.set(slug, rel);
  }
});

if (errors.length > 0) {
  console.error(`\n${errors.length} content problem${errors.length === 1 ? '' : 's'} found:\n`);
  errors.forEach(e => console.error(`  - ${e}`));
  console.error('');
  process.exit(1);
}

console.log('\nAll content files are valid.');
