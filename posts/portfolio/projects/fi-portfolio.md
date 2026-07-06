---
title: fi-portfolio — Personal Site & Story Platform
description: A two-sided personal site combining a QA portfolio and an interactive story platform, built with a hand-rolled markdown content pipeline and GitHub Actions CI.
tags: JavaScript, GitHub Actions, Static Site, Content Pipeline
linkType: internal
date: 2026-07-06
---

This site is the one you're reading this on — a personal project that grew from a simple resume page into a small content platform with its own build pipeline and CI.

## What it is

Two halves living in one repo: a QA engineering portfolio, and "Someday Under the Blue Sky," an interactive story site with both linear (markdown) stories and branching (choose-your-path) stories.

## The content pipeline

Rather than hardcoding story data as HTML strings inside JavaScript (which is how it started), content now lives as source files:

- Linear stories are plain `.md` files with frontmatter (title, genres, description, image).
- Branching stories are `.json` files with a node graph (id, text, routes).

A small Node script (`scripts/gen-index.js`, no external dependencies) scans both source directories and generates a catalog (`index.json`) that the front-end fetches to build the story list and resolve individual stories by slug. Adding a new story is: drop a file in the right folder, run the script, commit both.

## Catalog-aware readers

The reader pages (`reader.js` for markdown, `story.js` for branching JSON) don't hardcode file paths — they resolve a slug through a shared catalog helper (`js/catalog.js`) that looks up the right content file from the generated index. This is what lets the same reader pattern serve both personal stories and portfolio project write-ups (like this one) from different catalogs, without duplicating the fetch/render logic per content type.

## CI and deployment

A GitHub Actions workflow regenerates the catalog and deploys the site to GitHub Pages on every push to `main`. A separate workflow runs on pull requests that touch content, validating that every story/project file has the fields the front-end expects, that the committed catalog isn't stale, and that branching stories have a valid node graph — catching broken content before it ships, not after.

## The portfolio side

The Work history card is data-driven from a single JSON file rather than hardcoded HTML, so updating a role or adding a new skill tag doesn't require touching markup. This project write-up system follows the same principle, one level up.
