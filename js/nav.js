(function () {
  var el = document.getElementById('nav-root');
  if (!el) return;
  el.innerHTML = `
    <nav class="nav-container">
      <a class="nav-logo" href="index.html">
        <p>Someday Under the Blue Sky</p>
      </a>
      <ul class="nav-list">
        <li><a href="index.html">Home</a></li>
        <li><a href="storylist.html">Story</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="portfolio.html">Portfolio &#x2197;</a></li>
      </ul>
    </nav>
  `;
})();
