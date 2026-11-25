(async () => {
  'use strict';
  if (window.ToDentroCoursesReady) await window.ToDentroCoursesReady;
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  if (window.ToDentroCampusesReady) await window.ToDentroCampusesReady;
  await window.ToDentroAuth.ready;

  const fields = ['city', 'type', 'course', 'mode', 'area', 'period', 'admission'];
  const params = new URLSearchParams(location.search);
  const catalog = window.ToDentroData;
  const note = document.querySelector('#search-filter-note');
  const searchHasFilters = fields.some(name => params.has(name)) || params.has('region');
  if (window.ToDentroAuth.isAuthenticated() && !searchHasFilters && !params.get('busca')?.trim()) {
    try {
      const root = new URL('../../', location.href);
      const { loadSearchPreferences } = await import(new URL('services/search-preferences.js', root).href);
      const initial = await loadSearchPreferences(params, catalog);
      for (const name of fields) {
        for (const value of initial.getAll(name)) params.append(name, value);
      }
      if (fields.some(name => params.getAll(name).some(Boolean))) {
        note.textContent = 'Filtros iniciais do seu perfil. Você pode ajustá-los nesta busca.';
        note.hidden = false;
      }
    } catch {
      note.textContent = 'Suas preferências não carregaram. Você ainda pode usar os filtros da busca.';
      note.hidden = false;
    }
  }
  if (!params.has('city') && params.has('region')) {
    params.set('city', params.get('region') === 'sp' ? 'sao-paulo' : params.get('region'));
  }
  const filters = Object.fromEntries(fields.map(name => [name, params.getAll(name).flatMap(value => value.split(',')).filter(Boolean)]));
  filters.type = filters.type.map(value => value === 'privada' ? 'particular' : value);

  const query = document.querySelector('#university-query');
  const list = document.querySelector('.university-results-list');
  const count = document.querySelector('#results-count');
  const sort = document.querySelector('#sort-universities');
  const clear = document.querySelector('#clear-search-filters');
  const badge = document.querySelector('#active-filter-count');
  const filtersLink = document.querySelector('#open-filters');
  const collator = new Intl.Collator('pt-BR');
  const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  const liveCampuses = new Map();
  for (const campus of window.ToDentroCampuses || []) {
    if (!liveCampuses.has(campus.universityId)) liveCampuses.set(campus.universityId, []);
    liveCampuses.get(campus.universityId).push(campus);
  }

  list.replaceChildren();
  const institutions = window.ToDentroUniversities.map(university => {
    const card = document.createElement('td-university-card');
    card.setAttribute('university-id', university.id);
    card.setAttribute('variant', 'featured');
    card.render();
    list.append(card);

    const campuses = liveCampuses.get(university.id) || catalog.getCampuses(university.id);
    const cities = [...new Set([university.city, ...campuses.map(campus => campus.city)].map(normalize).filter(Boolean))];
    const offerings = catalog.getOfferings({ universityId: university.id });
    const courses = university.courses.map(normalize);
    return {
      card, university, cities, courses,
      areas: courses.map(name => catalog.getCourse(name, university.id)?.area),
      modes: [university.mode, ...offerings.map(offer => offer.modeId)],
      periods: offerings.length ? offerings.map(offer => offer.periodId) : university.periods,
      names: [normalize(university.name), normalize(university.acronym)].filter(Boolean),
    };
  });

  function relevance(item, text, terms) {
    const fields = [...item.names, ...item.cities, ...item.courses];
    if (!terms.every(term => fields.some(value => value.includes(term)))) return -1;
    if (!text) return 0;
    if (item.names.includes(text)) return 4;
    if (item.names.some(value => value.startsWith(text))) return 3;
    if (fields.includes(text)) return 2;
    return fields.some(value => value.includes(text)) ? 1 : 0;
  }

  function updateResults() {
    const text = normalize(query.value);
    const terms = text.split(' ').filter(Boolean);
    const match = (key, options) => !filters[key].length || filters[key].some(value => options.includes(value));
    const visible = [];
    for (const item of institutions) {
      const { card, university } = item;
      const score = relevance(item, text, terms);
      card.hidden = score < 0
        || !match('city', item.cities.map(city => city.replaceAll(' ', '-')))
        || !match('type', [university.public ? 'publica' : 'particular'])
        || !match('course', item.courses)
        || !match('area', item.areas)
        || !match('period', item.periods)
        || !match('mode', item.modes)
        || !match('admission', university.admissionMethods || []);
      if (!card.hidden) visible.push({ ...item, score });
    }
    visible.sort((a, b) => (sort.value === 'acronym'
      ? collator.compare(a.university.acronym || a.university.name, b.university.acronym || b.university.name)
      : b.score - a.score)
      || collator.compare(a.university.name, b.university.name));
    for (const { card } of visible) list.append(card);

    count.textContent = visible.length === 1 ? '1 instituição encontrada' : `${visible.length} instituições encontradas`;
    document.querySelector('#search-empty').hidden = visible.length > 0;
    const active = fields.filter(name => filters[name].length).length;
    badge.textContent = active;
    badge.hidden = !active;
    clear.hidden = !active;
    filtersLink.setAttribute('aria-label', active ? `Filtros: ${active} categorias ativas` : 'Filtros');
    const state = new URLSearchParams({ busca: query.value, sort: sort.value });
    for (const name of fields) state.set(name, filters[name].join(','));
    filtersLink.href = `./filtros.html?${state}`;
    for (const { card } of visible) {
      const link = card.querySelector('a');
      if (!link) continue;
      const destination = new URL(link.href);
      destination.searchParams.set('from', `${location.pathname}?${state}`);
      link.href = destination.href;
    }
  }

  query.value = params.get('busca') || '';
  sort.value = ['acronym', 'name'].includes(params.get('sort')) ? 'acronym' : 'relevance';
  query.addEventListener('input', updateResults);
  sort.addEventListener('change', updateResults);
  filtersLink.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const current = new URL(location.href);
    current.search = new URL(filtersLink.href).search;
    history.replaceState(history.state, '', current.href);
  });
  document.querySelector('.university-search-form').addEventListener('submit', event => {
    event.preventDefault();
    updateResults();
  });
  clear.addEventListener('click', () => {
    for (const name of fields) filters[name] = [];
    note.hidden = true;
    updateResults();
    filtersLink.focus();
  });
  updateResults();
})();
