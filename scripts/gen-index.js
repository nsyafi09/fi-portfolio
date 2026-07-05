#!/usr/bin/env node
// Regenerates data/personal-stories/index.json from:
//   - posts/personal/stories/*.md  (linear stories, type: "linear")
//   - data/personal-stories/*.json (branching stories, type: "branching") — skips draft: true and index.json itself
//
// Future: portfolio posts (posts/portfolio/**) will need a separate catalog for the portfolio side.
//
// Usage: node scripts/gen-index.js

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const STORIES_DIR = path.join(ROOT, 'posts', 'personal', 'stories');
const DATA_DIR    = path.join(ROOT, 'data', 'personal-stories');
const INDEX_FILE  = path.join(DATA_DIR, 'index.json');

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

const entries = [];

// --- Linear stories from posts/personal/stories/*.md ---
if (fs.existsSync(STORIES_DIR)) {
  fs.readdirSync(STORIES_DIR)
    .filter(f => f.endsWith('.md'))
    .forEach(file => {
      const raw  = fs.readFileSync(path.join(STORIES_DIR, file), 'utf8');
      const meta = parseFrontmatter(raw);
      if (!meta || meta.draft === 'true') return;

      const slug   = file.replace(/\.md$/, '');
      const genres = meta.genres
        ? meta.genres.split(',').map(g => g.trim())
        : [];

      entries.push({
        slug,
        type:        'linear',
        title:       meta.title    || slug,
        series:      meta.series   || '',
        language:    meta.language || 'en',
        preview:     meta.description || '',
        genres,
        image:       meta.image    || '',
        contentPath: 'posts/personal/stories/' + file,
      });
    });
}

// --- Branching stories from data/personal-stories/*.json ---
if (fs.existsSync(DATA_DIR)) {
  fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .forEach(file => {
      const raw  = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      let story;
      try { story = JSON.parse(raw); } catch { return; }
      if (story.draft === true) return;

      const autoPreview = story.nodes && story.nodes[0] && story.nodes[0].text
        ? stripHtml(story.nodes[0].text).slice(0, 120)
        : '';

      entries.push({
        slug:        story.slug     || file.replace(/\.json$/, ''),
        type:        'branching',
        title:       story.title    || '',
        series:      story.series   || '',
        language:    story.language || 'en',
        preview:     story.preview  || autoPreview,
        genres:      story.genres   || [],
        image:       story.image    || '',
        contentPath: 'data/personal-stories/' + file,
      });
    });
}

fs.writeFileSync(INDEX_FILE, JSON.stringify(entries, null, 2) + '\n');
console.log(`Wrote ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to data/personal-stories/index.json`);
entries.forEach(e => console.log(`  [${e.type}] ${e.slug}  →  ${e.contentPath}`));
