/**
 * Homepage - Dynamic presentation listing
 * Reads from presentations.json and renders cards
 */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('presentations-grid');
  
  try {
    const response = await fetch('./presentations.json');
    const data = await response.json();
    
    if (data.presentations.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No presentations yet. Check back soon!</p>
        </div>
      `;
      return;
    }

    // Sort by date (newest first)
    const sorted = data.presentations.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    grid.innerHTML = sorted.map(pres => renderCard(pres)).join('');
  } catch (error) {
    console.error('Failed to load presentations:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <p>Unable to load presentations.</p>
      </div>
    `;
  }
});

function renderCard(pres) {
  const eventsHtml = pres.events && pres.events.length > 0
    ? `<span class="events-count">${pres.events.length} event${pres.events.length > 1 ? 's' : ''}</span>`
    : '';

  const tagsHtml = pres.tags
    ? pres.tags.map(t => `<span class="card-tag">${t}</span>`).join(' ')
    : '';

  const actionsHtml = `
    <div class="card-actions">
      <a href="./presentations/${pres.slug}/" class="card-btn primary no-advance">View Details</a>
      <a href="./presentations/${pres.slug}/slides.html" class="card-btn secondary no-advance">Slides ↗</a>
    </div>
  `;

  return `
    <article class="presentation-card">
      ${tagsHtml}
      <h3 class="card-title">${pres.title}</h3>
      <p class="card-abstract">${pres.abstract}</p>
      <div class="card-meta">
        ${eventsHtml}
        <span>${pres.date || ''}</span>
      </div>
      ${actionsHtml}
    </article>
  `;
}
