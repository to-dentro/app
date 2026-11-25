(() => {
  'use strict';
  const { calculate, readAnswers, dimensions, courseUrl, prioritizeSuggestions } = window.ToDentroVocational;
  const home = document.querySelector('#home-vocational-result');
  const profile = document.querySelector('#profile-vocational-result');
  const invitation = document.querySelector('#home-vocational-invitation');
  const courses = home?.querySelector('#home-vocational-courses');
  const carousel = courses?.querySelector('.vocational-carousel');
  let rendered = '';
  let request = 0;

  function render(map) {
    const signature = JSON.stringify(map);
    if (signature === rendered) return;
    rendered = signature;
    if (home) {
      home.hidden = !map;
      invitation.hidden = Boolean(map);
      if (!map) return;
      home.querySelector('#home-vocational-title').textContent = map.profile;
      const result = home.querySelector('a.button');
      carousel.replaceChildren(...map.suggestions.map(course => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = courseUrl(result.href, course);
        const icon = document.createElement('span');
        icon.className = 'vocational-course-icon material-symbols-outlined';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = dimensions[course.axis].icon;
        const name = document.createElement('span');
        name.textContent = course.name;
        link.append(icon, name);
        item.append(link);
        return item;
      }));
      carousel.scrollLeft = 0;
      courses.hidden = !map.suggestions.length;
    }
    if (profile) {
      profile.hidden = !map;
      if (!map) return;
      profile.querySelector('#profile-vocational-name').textContent = map.profile;
      const interests = profile.querySelector('#profile-vocational-interests');
      interests.textContent = map.highlights.map(index => dimensions[index].name).join(' + ');
      interests.hidden = !map.highlights.length;
    }
  }

  async function refresh() {
    const current = ++request;
    await window.ToDentroAuth.ready;
    if (!window.ToDentroAuth.isAuthenticated() || current !== request) return;
    const draft = calculate(readAnswers());
    if (draft) render(draft);
    try {
      const { getVocationalMap } = await import('../../../services/user-saved-data.js');
      const saved = await getVocationalMap();
      if (current === request && !draft) render(saved ? prioritizeSuggestions(saved) : null);
    } catch { /* O resultado da sessão continua disponível. */ }
  }

  refresh();
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
})();
