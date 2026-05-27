/**
 * Homepage - Dynamic presentation listing with tag filtering
 * Reads from presentations.json and renders cards
 */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('presentations-grid');
  const filterBtn = document.getElementById('filter-btn');
  const filterPopup = document.getElementById('filter-popup');
  const filterTagsContainer = document.getElementById('filter-tags');
  const filterCount = document.getElementById('filter-count');
  const filterClear = document.getElementById('filter-clear');

  let allPresentations = [];
  let allTags = [];
  let selectedTags = new Set();

  try {
    const response = await fetch('./presentations.json');
    const data = await response.json();

    if (data.presentations.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>No presentations yet. Check back soon!</p></div>`;
      return;
    }

    // Sort by date (newest first)
    allPresentations = data.presentations.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // Extract all unique tags sorted alphabetically
    const tagSet = new Set();
    allPresentations.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    allTags = [...tagSet].sort((a, b) => a.localeCompare(b));

    // Render cards
    grid.innerHTML = allPresentations.map(pres => renderCard(pres)).join('');

    // Render filter tags
    filterTagsContainer.innerHTML = allTags.map(tag =>
      `<button class="filter-tag-chip" data-tag="${tag}">${tag}</button>`
    ).join('');

    // Filter tag click handlers
    filterTagsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-tag-chip');
      if (!chip) return;
      const tag = chip.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        chip.classList.remove('selected');
      } else {
        selectedTags.add(tag);
        chip.classList.add('selected');
      }
      applyFilters();
    });

    // Toggle popup
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = filterPopup.hidden;
      filterPopup.hidden = !isHidden;
      filterBtn.classList.toggle('active', isHidden);
    });

    // Close popup on outside click
    document.addEventListener('click', (e) => {
      if (!filterPopup.hidden && !filterPopup.contains(e.target) && !filterBtn.contains(e.target)) {
        filterPopup.hidden = true;
        filterBtn.classList.remove('active');
      }
    });

    // Clear all filters
    filterClear.addEventListener('click', () => {
      selectedTags.clear();
      filterTagsContainer.querySelectorAll('.filter-tag-chip.selected').forEach(c => c.classList.remove('selected'));
      applyFilters();
    });

  } catch (error) {
    console.error('Failed to load presentations:', error);
    grid.innerHTML = `<div class="empty-state"><p>Unable to load presentations.</p></div>`;
  }

  function applyFilters() {
    const cards = grid.querySelectorAll('.presentation-card');
    cards.forEach((card, i) => {
      const pres = allPresentations[i];
      const presTags = pres.tags || [];
      if (selectedTags.size === 0 || [...selectedTags].some(t => presTags.includes(t))) {
        card.classList.remove('filtered-out');
      } else {
        card.classList.add('filtered-out');
      }
    });

    // Update count badge
    if (selectedTags.size > 0) {
      filterCount.textContent = selectedTags.size;
      filterCount.hidden = false;
      filterBtn.classList.add('active');
    } else {
      filterCount.hidden = true;
      if (filterPopup.hidden) filterBtn.classList.remove('active');
    }
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
    <article class="presentation-card" data-tags="${(pres.tags || []).join(',')}">
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
