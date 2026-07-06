(function () {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('post');
  var catalogKey = params.get('catalog') || 'stories';
  if (!slug) return;

  function parseFrontmatter(raw) {
    var match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };
    var meta = {};
    match[1].split('\n').forEach(function (line) {
      var idx = line.indexOf(': ');
      if (idx === -1) return;
      meta[line.slice(0, idx).trim()] = line.slice(idx + 2).trim();
    });
    return { meta: meta, body: match[2] };
  }

  getCatalogEntry(catalogKey, slug)
    .then(function (entry) { return fetch(entry.contentPath); })
    .then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
    .then(function (raw) {
      var parsed = parseFrontmatter(raw);
      var meta = parsed.meta;

      var titleEl  = document.getElementById('title');
      var bodyEl   = document.getElementById('story-body');
      var genresEl = document.getElementById('story-genres');
      var seriesEl = document.getElementById('reader-series');
      var pageTitleEl = document.getElementById('page-title');

      if (titleEl)  titleEl.textContent = meta.title || slug;
      if (bodyEl)   bodyEl.innerHTML = marked.parse(parsed.body);
      if (seriesEl) seriesEl.textContent = meta.series || '';
      if (genresEl && meta.genres) {
        genresEl.innerHTML = meta.genres.split(',')
          .map(function (g) { return '<li>' + g.trim() + '</li>'; })
          .join('');
      }
      if (pageTitleEl && meta.title) {
        pageTitleEl.textContent = meta.title + ' — Someday Under the Blue Sky';
      }
    })
    .catch(function (err) {
      console.error(err);
      var titleEl = document.getElementById('title');
      if (titleEl) titleEl.textContent = 'Story not found';
    });
})();
