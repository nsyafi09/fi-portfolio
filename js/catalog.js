window.CATALOGS = {
  stories: 'data/personal-stories/index.json',
  portfolio: 'data/portfolio/index.json'
};

window.getCatalogEntry = function (catalogKey, slug) {
  var path = window.CATALOGS[catalogKey] || window.CATALOGS.stories;
  return fetch(path)
    .then(function (r) {
      if (!r.ok) throw new Error('catalog not found: ' + path);
      return r.json();
    })
    .then(function (entries) {
      var entry = entries.find(function (e) { return e.slug === slug; });
      if (!entry) throw new Error('no catalog entry for slug: ' + slug);
      return entry;
    });
};
