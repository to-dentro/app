(async () => {
  'use strict';
  if (window.ToDentroCoursesReady) await window.ToDentroCoursesReady;
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;
  const params = new URLSearchParams(location.search);
  const list = document.querySelector('#saved-list');
  const empty = document.querySelector('#saved-empty');
  const explore = document.querySelector('#saved-explore');
  const categories = [...document.querySelectorAll('[data-category]')];
  const accountData = () => import('../../../services/user-saved-data.js');
  const kinds = { universidades: 'universities', cursos: 'courses', comparacoes: 'comparisons' };
  let request = 0;
  if (params.get('from') === 'perfil') document.querySelector('#saved-back').href = './perfil.html';
  async function render(category) {
    const current = ++request;
    list.replaceChildren();
    empty.hidden = false;
    empty.textContent = 'Carregando suas escolhas…';
    for (const button of categories) button.setAttribute('aria-pressed', String(button.dataset.category === category));
    let saved;
    try {
      saved = await (await accountData()).getSavedList(kinds[category]);
    } catch {
      if (current === request) empty.textContent = 'Não foi possível carregar seus salvos. Selecione a categoria para tentar novamente.';
      return;
    }
    if (current !== request) return;
    if (category === 'universidades') {
      if (saved.includes(params.get('saved'))) document.querySelector('#saved-message-title').textContent = '✓ Universidade salva!';
      for (const id of saved) {
        if (!window.ToDentroUniversities.some(item => item.id === id)) continue;
        const card = document.createElement('td-university-card'); card.setAttribute('university-id', id); card.setAttribute('variant', 'saved'); list.append(card);
      }
    }
    if (category === 'cursos') {
      for (const id of saved) {
        if (typeof id !== 'string') continue;
        const selection = window.ToDentroData.resolveSavedCourse(id);
        if (!selection) continue;
        const { university, course, offering, campus } = selection;
        const card = document.createElement('article'); card.className = 'course-card';
        const title = document.createElement('h2'); title.textContent = course.name;
        const context = document.createElement('p'); context.textContent = `${university.acronym}${campus ? ` · ${campus.label}` : ''}`;
        const link = document.createElement('a'); link.className = 'button button-yellow'; link.textContent = 'Conhecer curso';
        link.href = `./curso.html?${new URLSearchParams({ universidade: university.id, curso: course.id, ...(offering ? {oferta: offering.id} : {}) })}`;
        card.append(title, context, link); list.append(card);
      }
    }
    if (category === 'comparacoes') {
      for (const value of saved) {
        if (typeof value !== 'string') continue;
        const state = new URLSearchParams(value);
        const course = window.ToDentroData.getCourse(state.get('curso'));
        const selection = window.ToDentroComparison.readSelection(state);
        if (!course || selection.length < 2) continue;
        const card = document.createElement('article'); card.className = 'course-card';
        const title = document.createElement('h2'); title.textContent = course.name;
        const summary = document.createElement('p'); summary.textContent = selection.map(item => `${item.university.acronym} · ${item.campus.name} · ${item.process.name} · ${item.reference.edition}`).join(' | ');
        const link = document.createElement('a'); link.className = 'button button-yellow'; link.textContent = 'Ver comparação'; link.href = `./comparacao-notas.html?${state}`;
        card.append(title, summary, link); list.append(card);
      }
    }
    empty.hidden = list.children.length > 0;
    empty.textContent = category === 'universidades' ? 'Nenhuma universidade salva. Explore instituições para começar.'
      : 'Você ainda não tem cursos salvos. Toque no coração na página de um curso para guardar sua escolha.';
    if (category === 'comparacoes') empty.textContent = 'Você ainda não tem comparações salvas.';
    explore.href = category === 'comparacoes' ? './filtros-comparacao.html' : './buscar-universidades.html';
    explore.textContent = category === 'comparacoes' ? 'Montar comparação' : 'Explorar mais instituições';
  }
  for (const button of categories) button.addEventListener('click', () => render(button.dataset.category));
  render(['universidades', 'cursos', 'comparacoes'].includes(params.get('categoria')) ? params.get('categoria') : 'universidades');
})();
