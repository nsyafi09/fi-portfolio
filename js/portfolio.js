/*
 * Future migration note:
 * Card content (title, summary, writeup, links) could be extracted into
 * a cards.json file and loaded via fetch(), replacing the HTML content
 * with rendered templates. The data-card-id attribute on each .pf-card
 * is the key for that future lookup.
 */

document.querySelectorAll('.pf-card-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.pf-card');
    const expanded = card.querySelector('.pf-card-expanded');
    const isOpen = !expanded.hidden;

    expanded.hidden = isOpen;
    btn.textContent = isOpen ? '+' : '−';
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});
