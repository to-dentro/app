(async () => {
  'use strict';
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;
  const form = document.querySelector('#profile-preferences-form');
  const status = document.querySelector('#preferences-status');
  const root = new URL('../../', location.href);
  try {
    const [profiles, preferences, ui] = await Promise.all([
      import(new URL('services/profile.js', root).href),
      import(new URL('services/preferences.js', root).href),
      import(new URL('services/account-ui.js', root).href),
      window.ToDentroCoursesReady,
    ]);
    const profile = await profiles.getProfile();
    if (!profile) {
      status.textContent = 'Conclua seu cadastro para editar suas preferências.';
      return;
    }
    const saved = preferences.normalizePreferences(profile.preferences);
    const catalog = window.ToDentroCourseCatalog;
    const cities = window.ToDentroData.source.general.cities;
    const labels = preferences.preferenceOptions;
    const collator = new Intl.Collator('pt-BR');
    const alphabetical = (a, b) => collator.compare(a[1], b[1]);
    const areas = Object.entries(catalog.areas).sort(alphabetical);
    const sections = [
      ['institutionTypes', 'Tipo de instituição', Object.entries(labels.institutionTypes)],
      ['cityIds', 'Cidades', cities.map(city => [city.id, city.name]), 'Buscar cidade'],
      ['modeIds', 'Modalidades', Object.entries(labels.modeIds)],
      ['periodIds', 'Turnos', Object.entries(labels.periodIds)],
      ['admissionMethodIds', 'Formas de ingresso', Object.entries(labels.admissionMethodIds)],
      ['areaIds', 'Áreas de interesse', areas],
      ['courseIds', 'Cursos de interesse', catalog.courses.map(course => [course.id, course.name, course.area]).sort(alphabetical), 'Buscar por curso ou área'],
    ];
    const fields = document.querySelector('#profile-preference-fields');
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const chipSelections = new Map();
    for (const [key, title, options, searchLabel] of sections) {
      const courses = key === 'courseIds';
      const collapsible = key === 'areaIds';
      const chips = !courses && !collapsible;
      const selected = new Set(saved[key]);
      if (chips) chipSelections.set(key, selected);
      const group = document.createElement(collapsible ? 'details' : 'fieldset');
      group.className = 'study-preference';
      const heading = document.createElement(collapsible ? 'summary' : 'legend');
      heading.textContent = title;
      group.append(heading);
      const list = document.createElement('div');
      list.className = courses || collapsible ? 'study-option-list' : 'study-option-chips';
      const rows = [];
      function makeOption([id, name], field, checked) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = field;
        input.value = id;
        input.checked = checked;
        const text = document.createElement('span');
        text.textContent = name;
        label.append(input, text);
        return { label, input };
      }
      const known = new Set(options.map(([id]) => id));
      for (const [id, name, area] of [...options, ...saved[key].filter(id => !known.has(id)).map(id => [id, id])]) {
        if (chips) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = name;
          button.setAttribute('aria-pressed', String(selected.has(id)));
          button.addEventListener('click', () => {
            if (selected.has(id)) selected.delete(id);
            else selected.add(id);
            button.setAttribute('aria-pressed', String(selected.has(id)));
          });
          rows.push({ label: button, text: normalize(name) });
          list.append(button);
          continue;
        }
        const row = makeOption([id, name], key, saved[key].includes(id));
        rows.push({ ...row, area, text: normalize(`${name} ${catalog.areas[area] || ''}`) });
        list.append(row.label);
      }
      function selectedCount() {
        return rows.filter(row => row.input.checked).length;
      }
      if (collapsible) {
        const count = document.createElement('span');
        count.className = 'study-selection-count';
        const updateCount = () => { count.textContent = `${selectedCount()} selecionadas`; };
        heading.append(count);
        group.addEventListener('change', updateCount);
        updateCount();
      }

      let search;
      if (searchLabel) {
        const searchBox = document.createElement('div');
        searchBox.className = 'study-search';
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.textContent = 'search';
        icon.setAttribute('aria-hidden', 'true');
        search = document.createElement('input');
        search.type = 'search';
        search.placeholder = searchLabel;
        search.setAttribute('aria-label', searchLabel);
        searchBox.append(icon, search);
        group.append(searchBox);
      }

      if (courses) {
        const picker = document.createElement('select');
        picker.className = 'study-course-area';
        picker.setAttribute('aria-label', 'Mostrar cursos por área');
        picker.append(new Option('Meus cursos selecionados', ''), new Option('Todas as áreas', '*'),
          ...areas.map(([id, name]) => new Option(name, id)));
        const discovery = makeOption(['yes', 'Ainda estou descobrindo'], 'discoveringCourses', saved.discoveringCourses);
        discovery.label.className = 'study-discovery';
        const count = document.createElement('p');
        count.className = 'study-selection-count';
        const empty = document.createElement('p');
        empty.className = 'study-selection-count';
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'study-more';
        more.textContent = 'Mostrar mais cursos';
        const pageSize = 10;
        let limit = pageSize;
        function renderCourses() {
          const terms = normalize(search.value).split(/\s+/).filter(Boolean);
          const scope = picker.value;
          let matches = 0;
          for (const row of rows) {
            const inScope = scope === '*' || (!scope && (terms.length || row.input.checked)) || row.area === scope;
            row.label.hidden = !inScope || !terms.every(term => row.text.includes(term)) || ++matches > limit;
          }
          const total = selectedCount();
          count.textContent = total === 1 ? '1 curso selecionado' : `${total} cursos selecionados`;
          empty.hidden = matches > 0;
          empty.textContent = scope || terms.length ? 'Nenhum curso encontrado.' : 'Busque um curso ou escolha uma área para explorar.';
          more.hidden = matches <= limit;
        }
        const resetList = () => { limit = pageSize; renderCourses(); };
        search.addEventListener('input', resetList);
        picker.addEventListener('change', resetList);
        more.addEventListener('click', () => { limit += pageSize; renderCourses(); });
        discovery.input.addEventListener('change', () => {
          if (discovery.input.checked) rows.forEach(row => { row.input.checked = false; });
          renderCourses();
        });
        list.addEventListener('change', event => {
          if (event.target.checked) discovery.input.checked = false;
          renderCourses();
        });
        group.append(picker, count, list, empty, more, discovery.label);
        renderCourses();
      } else {
        group.append(list);
        if (search) {
          const empty = document.createElement('p');
          empty.className = 'study-selection-count';
          empty.textContent = 'Nenhuma cidade encontrada.';
          empty.hidden = true;
          group.append(empty);
          search.addEventListener('input', () => {
            const terms = normalize(search.value).split(/\s+/);
            for (const row of rows) row.label.hidden = !terms.every(term => row.text.includes(term));
            empty.hidden = rows.some(row => !row.label.hidden);
          });
        }
      }
      fields.append(group);
    }
    form.hidden = false;
    status.textContent = '';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      if (button.disabled) return;
      button.disabled = true;
      const values = new FormData(form);
      const next = Object.fromEntries(sections.map(([key]) => [key, chipSelections.has(key) ? [...chipSelections.get(key)] : values.getAll(key)]));
      next.discoveringCourses = values.has('discoveringCourses');
      status.textContent = 'Salvando preferências…';
      try {
        await profiles.updatePreferences(next);
        window.ToDentroNavigation.returnTo('./perfil.html?preferencias=salvas');
      } catch (error) {
        status.textContent = ui.accountErrorMessage(error);
        button.disabled = false;
      }
    });
  } catch {
    status.textContent = 'Não foi possível carregar suas preferências. Recarregue a página para tentar novamente.';
  }
})();
