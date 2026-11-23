(async () => {
  'use strict';
  const form = document.querySelector('#preferences-form');
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  if (window.ToDentroCoursesReady) await window.ToDentroCoursesReady;
  const params = new URLSearchParams(location.search);
  if (params.get('return') === 'perfil') {
    location.replace('./preferencias.html');
    return;
  }
  const data = window.ToDentroData;
  const catalog = window.ToDentroCourseCatalog;
  const fields = ['city', 'type', 'mode', 'admission', 'course', 'area', 'period'];
  const values = name => params.getAll(name).flatMap(value => value.split(','));
  const addChecks = (container, name, options) => {
    container.replaceChildren();
    for (const { id, name: text } of options) {
      const label = document.createElement('label');
      label.className = 'preference-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = name;
      input.value = id;
      label.append(input, document.createElement('span'));
      label.lastChild.textContent = text;
      container.append(label);
    }
  };
  addChecks(form.querySelector('input[name="city"]').closest('.preference-options'), 'city', data.source.general.cities);
  addChecks(document.querySelector('#filter-periods'), 'period', data.source.general.periods);
  const courses = document.querySelector('#course-choice');
  const areas = document.querySelector('#course-area');
  courses.replaceChildren(...catalog.courses.map(course => new Option(course.name, course.value)));
  areas.replaceChildren(...Object.entries(catalog.areas).map(([id, name]) => new Option(name, id)));
  if (!params.has('city') && params.has('region')) params.set('city', params.get('region') === 'sp' ? 'sao-paulo' : params.get('region'));
  for (const input of form.querySelectorAll('input[type="checkbox"]')) input.checked = values(input.name).includes(input.value);
  for (const select of [courses, areas]) {
    for (const option of select.options) option.selected = values(select.name).includes(option.value);
  }
  document.querySelector('#preserved-query').value = params.get('busca') || '';
  document.querySelector('#preserved-sort').value = params.get('sort') || 'relevance';
  const map = params.get('return') === 'mapa';
  const destination = map ? './mapa.html' : './buscar-universidades.html';
  const returnParams = new URLSearchParams(params);
  returnParams.delete('return');
  document.querySelector('#filters-back').href = `${destination}?${returnParams}`;
  document.querySelector('#clear-filters').addEventListener('click', () => {
    for (const input of form.querySelectorAll('input[type="checkbox"]')) input.checked = false;
    for (const select of [courses, areas]) select.selectedIndex = -1;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const state = new URLSearchParams(new FormData(form));
    for (const name of fields) if (!state.has(name)) state.set(name, '');
    if (map) {
      for (const name of ['universidade', 'campus', 'from', 'cidade']) if (params.has(name)) state.set(name, params.get(name));
    }
    window.ToDentroNavigation.returnTo(`${destination}?${state}`);
  });
  submit.disabled = false;
})();
