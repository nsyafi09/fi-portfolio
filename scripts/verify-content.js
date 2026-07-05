#!/usr/bin/env node
// Verifies the content pipeline that scripts/gen-index.js drives.
//   1. Regenerates data/personal-stories/index.json and fails if it's stale
//      relative to what's committed (someone edited content but forgot to
//      re-run the gen script).
//   2. Validates every posts/personal/stories/*.md and
//      data/personal-stories/*.json file against the assumptions the
//      front-end (js/story.js, js/reader.js, js/storylist.js) makes at
//      runtime — assumptions gen-index.js itself does not check.
//
// Usage: node scripts/verify-content.js

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

const ROOT        = path.resolve(__dirname, '..');
const STORIES_DIR  = path.join(ROOT, 'posts', 'personal', 'stories');
const DATA_DIR     = path.join(ROOT, 'data', 'personal-stories');
const INDEX_FILE   = path.join(DATA_DIR, 'index.json');

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

// --- Step 1: regenerate the index and check it isn't stale ---

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

// --- Step 2: validate markdown (linear) stories ---

const seenSlugs = new Map(); // slug -> file that first claimed it

if (fs.existsSync(STORIES_DIR)) {
  fs.readdirSync(STORIES_DIR)
    .filter(f => f.endsWith('.md'))
    .forEach(file => {
      const rel = path.join('posts', 'personal', 'stories', file);
      const raw = fs.readFileSync(path.join(STORIES_DIR, file), 'utf8');
      const meta = parseFrontmatter(raw);

      if (!meta) {
        fail(rel, 'frontmatter did not parse (missing or malformed --- fences)');
        return;
      }

      if (meta.draft === 'true') return; // intentionally excluded, nothing to validate

      ['title', 'image', 'description'].forEach(field => {
        if (!meta[field]) fail(rel, `missing required frontmatter field "${field}"`);
      });

      const slug = file.replace(/\.md$/, '');
      if (seenSlugs.has(slug)) {
        fail(rel, `duplicate slug "${slug}" (also used by ${seenSlugs.get(slug)})`);
      } else {
        seenSlugs.set(slug, rel);
      }
    });
}

// --- Step 3: validate JSON (branching) stories ---

if (fs.existsSync(DATA_DIR)) {
  fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .forEach(file => {
      const rel = path.join('data', 'personal-stories', file);
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');

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

      const slug = story.slug || file.replace(/\.json$/, '');
      if (seenSlugs.has(slug)) {
        fail(rel, `duplicate slug "${slug}" (also used by ${seenSlugs.get(slug)})`);
      } else {
        seenSlugs.set(slug, rel);
      }

      if (!Array.isArray(story.nodes) || story.nodes.length === 0) {
        fail(rel, 'missing or empty "nodes" array');
        return;
      }

      const ids = story.nodes.map(n => n.id);
      if (!ids.includes(1)) {
        fail(rel, 'no node with id 1 — story.js always starts at node id 1, this story cannot load');
      }

      // story.js treats route.nextText <= 0 as a "restart the story" sentinel
      // (see showStoryNode: `if (route.nextText <= 0) return startGame(nodes)`),
      // so only positive ids need to resolve to a real node.
      story.nodes.forEach(node => {
        (node.routes || []).forEach(route => {
          if (route.nextText != null && route.nextText > 0 && !ids.includes(route.nextText)) {
            fail(rel, `node ${node.id} has a route pointing to nonexistent node id ${route.nextText}`);
          }
        });
      });
    });
}

// --- Report ---

if (errors.length > 0) {
  console.error(`\n${errors.length} content problem${errors.length === 1 ? '' : 's'} found:\n`);
  errors.forEach(e => console.error(`  - ${e}`));
  console.error('');
  process.exit(1);
}

console.log('\nAll content files are valid.');
