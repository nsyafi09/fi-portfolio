(function () {
  const storyEl  = document.getElementById('story');
  const routesEl = document.getElementById('routes');
  const titleEl  = document.getElementById('title');
  const genresEl = document.getElementById('story-genres');

  if (!storyEl && !titleEl) return;

  let state = {};

  function startGame(nodes) {
    state = {};
    showStoryNode(nodes, 1);
  }

  function showStoryNode(nodes, id) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    if (storyEl) storyEl.innerHTML = node.text;
    if (titleEl) titleEl.textContent = node.title;
    if (!routesEl) return;
    while (routesEl.firstChild) routesEl.removeChild(routesEl.firstChild);
    node.routes.forEach(function (route) {
      if (route.requiredState != null && !route.requiredState(state)) return;
      const a = document.createElement('a');
      a.innerText = route.text;
      a.setAttribute('href', '#top');
      a.addEventListener('click', function () {
        if (route.nextText <= 0) return startGame(nodes);
        state = Object.assign(state, route.setState);
        showStoryNode(nodes, route.nextText);
      });
      routesEl.appendChild(a);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('story') || 'voyager-x';

  fetch('data/personal-stories/' + slug + '.json')
    .then(function (r) {
      if (!r.ok) throw new Error('Story not found: ' + slug);
      return r.json();
    })
    .then(function (data) {
      document.title = data.title + ' — Someday Under the Blue Sky';
      startGame(data.nodes);
      if (genresEl && data.genres) {
        genresEl.innerHTML = data.genres
          .map(function (g) { return '<li>' + g + '</li>'; })
          .join('');
      }
    })
    .catch(function (err) {
      console.error(err);
      if (titleEl) titleEl.textContent = 'Story not found';
      if (storyEl) storyEl.textContent = '';
    });

  // Exposed globally because onclick="showChat()" in story.html requires it
  const chat = document.getElementById('chatBox');
  if (chat) {
    chat.style.display = 'none';
    window.showChat = function () {
      chat.style.display = chat.style.display === 'none' ? 'block' : 'none';
    };
  }
})();
