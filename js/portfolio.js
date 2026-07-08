document.querySelectorAll('.pf-card-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.pf-card');
    if (!card) return;
    const expanded = card.querySelector('.pf-card-expanded');
    if (!expanded) return;

    const isOpen = !expanded.hidden;
    expanded.hidden = isOpen;
    btn.textContent = isOpen ? '▸' : '▾';
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});

function bindWorkToggles() {
  document.querySelectorAll('.pf-work-more-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.pf-work-role-entry, .pf-work-item');
      if (!item) return;
      const details = item.querySelector('.pf-work-details');
      if (!details) return;

      const isOpen = !details.hidden;
      details.hidden = isOpen;
      btn.textContent = isOpen ? '▸ More detail' : '▾ Less detail';
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

function renderPosition(position) {
  const tags = position.skills.map(s => `<span>${s}</span>`).join('');
  const highlights = position.highlights.map(h => `<li>${h}</li>`).join('');
  const details = position.details.map(d => `<li>${d}</li>`).join('');
  return `
    <li class="pf-work-role-entry">
      <div class="pf-work-role-header">
        <span class="pf-work-role-title">${position.title} · ${position.department}</span>
        <span class="pf-work-period">${position.period}</span>
      </div>
      <div class="pf-work-tags">${tags}</div>
      <ul class="pf-work-highlights">${highlights}</ul>
      <button class="pf-work-more-toggle" aria-expanded="false">▸ More detail</button>
      <ul class="pf-work-details" hidden>${details}</ul>
    </li>
  `;
}

function renderCompany(company) {
  const positions = company.positions.map(renderPosition).join('');
  return `
    <li class="pf-work-item">
      <div class="pf-work-header">
        <span class="pf-work-company">${company.company}</span>
        <span class="pf-work-company-location">${company.location}</span>
      </div>
      <ul class="pf-work-roles">${positions}</ul>
    </li>
  `;
}

const workMount = document.getElementById('work-list-mount');
if (workMount) {
  fetch('data/portfolio/work.json')
    .then(r => {
      if (!r.ok) throw new Error('work data not found');
      return r.json();
    })
    .then(companies => {
      workMount.innerHTML = companies.map(renderCompany).join('');
      bindWorkToggles();
    })
    .catch(err => {
      console.error(err);
      workMount.innerHTML = '<p>Could not load work history.</p>';
    });
}

function renderProjectLink(project) {
  const label = `${project.title} →`;
  if (project.linkType === 'internal') {
    return `<li><a href="reader.html?post=${project.slug}&catalog=portfolio">${label}</a></li>`;
  }
  if (project.linkType === 'external' && project.linkUrl) {
    return `<li><a href="${project.linkUrl}" target="_blank" rel="noopener">${label}</a></li>`;
  }
  return `<li><span>${label}</span></li>`;
}

const projectsMount = document.getElementById('projects-list-mount');
if (projectsMount) {
  fetch('data/portfolio/index.json')
    .then(r => {
      if (!r.ok) throw new Error('projects data not found');
      return r.json();
    })
    .then(projects => {
      projectsMount.innerHTML = `<ul class="pf-card-links">${projects.map(renderProjectLink).join('')}</ul>`;
    })
    .catch(err => {
      console.error(err);
      projectsMount.innerHTML = '<p>Could not load projects.</p>';
    });
}
