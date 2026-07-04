(function () {
  var mount = document.getElementById('story-list-mount');
  if (!mount) return;

  var bookSVG = '<span><svg xmlns="http://www.w3.org/2000/svg" fill="black" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></span>';

  function buildCard(story) {
    var href = story.type === 'branching'
      ? 'story.html?story=' + story.slug
      : 'reader.html?post=' + story.slug;
    var genres = (story.genres || []).map(function (g) { return '<li>' + g + '</li>'; }).join('');
    return '<div class="story-list-card">'
      + '<a class="story-list-card-img" href="' + href + '" style="background-image: url(' + story.image + ')"></a>'
      + '<div class="story-list-right">'
      + '<div class="story-data-list"><p>' + bookSVG + (story.series || '—') + '</p></div>'
      + '<div class="story-title-list" data-aos="fade-up"><a href="' + href + '"><h1>' + story.title + '</h1></a></div>'
      + '<div class="story-preview" data-aos="zoom-in"><a href="' + href + '"><p>' + story.preview + '</p></a></div>'
      + '<div class="story-genre"><ul>' + genres + '</ul></div>'
      + '</div>'
      + '</div>';
  }

  fetch('data/personal-stories/index.json')
    .then(function (r) { if (!r.ok) throw new Error('index not found'); return r.json(); })
    .then(function (stories) {
      mount.innerHTML = stories.map(buildCard).join('');
      if (window.AOS) AOS.refresh();
    })
    .catch(function () {
      mount.innerHTML = '<p style="text-align:center;color:#555;padding:2rem;">Could not load stories.</p>';
    });
})();
