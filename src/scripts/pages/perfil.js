(async () => {
  'use strict';
  const encouragements = [
    'O sucesso é a soma de pequenos esforços repetidos diariamente.',
    'A jornada mais longa começa com um único passo.',
    'Comece pelo que dá para fazer hoje.',
    'A vida é uma jornada, não uma corrida.',
    'Cada questão que você revisa ajuda a entender um pouco mais.',
    'Um simulado difícil mostra o que vale revisar.',
    'Sua nota mede uma prova, não tudo o que você sabe.',
    'Pedir ajuda também faz parte de aprender.',
    'Você pode fazer uma pausa e retomar no seu ritmo.',
    'Uma página hoje já é mais do que você tinha lido ontem.',
    'Quando o plano apertar, escolha uma tarefa que caiba no seu dia.',
    'O que parece difícil agora pode ficar mais claro na próxima revisão.',
    'Descansar também faz parte da preparação.',
    'Vale reconhecer o que você já aprendeu enquanto se prepara para o que falta.',
    'Se o dia de hoje saiu do plano, amanhã você pode recomeçar.',
  ];
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric',
  });
  function showDailyEncouragement() {
    const parts = localDate.formatToParts(new Date());
    const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
    const day = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day) / 86_400_000;
    const text = document.querySelector('#profile-encouragement-text');
    if (text) text.textContent = encouragements[day % encouragements.length];
  }
  showDailyEncouragement();
  window.addEventListener('pageshow', showDailyEncouragement);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) showDailyEncouragement();
  });
  setInterval(showDailyEncouragement, 60_000);

  if (window.ToDentroCoursesReady) await window.ToDentroCoursesReady;
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;
  const root = new URL('../../', location.href);
  const status = document.querySelector('#profile-status');
  const retry = document.querySelector('#profile-retry');
  const edit = document.querySelector('#edit-preferences');
  const [profiles, preferencesService, ui] = await Promise.all([
    import(new URL('services/profile.js', root).href), import(new URL('services/preferences.js', root).href),
    import(new URL('services/account-ui.js', root).href),
  ]);
  const data = window.ToDentroData;
  document.querySelector('#profile-name').textContent = window.ToDentroAuth.user.displayName || 'Meu perfil';
  document.querySelector('#profile-email').textContent = window.ToDentroAuth.user.email || '';
  const labels = preferencesService.preferenceOptions;
  function render(profile) {
    const preferences = preferencesService.normalizePreferences(profile.preferences);
    const text = (id, values, fallback) => { document.querySelector(`#profile-${id}`).textContent = values.length ? values.join(', ') : fallback; };
    document.querySelector('#profile-name').textContent = profile.displayName;
    document.querySelector('#profile-email').textContent = window.ToDentroAuth.user.email || profile.email;
    text('city', preferences.cityIds.map(id => data.source.general.cities.find(item => item.id === id)?.name || id), 'Sem preferência de cidade');
    text('type', preferences.institutionTypes.map(id => labels.institutionTypes[id]), 'Sem preferência de instituição');
    text('mode', preferences.modeIds.map(id => labels.modeIds[id]), 'Sem preferência de modalidade');
    text('period', preferences.periodIds.map(id => labels.periodIds[id]), 'Sem preferência de turno');
    text('admission', preferences.admissionMethodIds.map(id => labels.admissionMethodIds[id]), 'Todas');
    text('area', preferences.areaIds.map(id => data.views.courseCatalog.areas[id] || id), 'Todas as áreas');
    text('course', preferences.courseIds.map(id => data.getCourse(id)?.name || id), preferences.discoveringCourses ? 'Ainda estou descobrindo' : 'Sem preferência de curso');
    edit.hidden = false;
  }
  async function loadProfile() {
    retry.hidden = true;
    edit.hidden = true;
    status.textContent = 'Carregando suas preferências…';
    status.hidden = false;
    try {
      const profile = await profiles.getProfile();
      if (!profile) {
        status.textContent = 'Sua conta está conectada. Conclua o cadastro para salvar seu perfil. ';
        const link = document.createElement('a'); link.href = './cadastro.html'; link.textContent = 'Concluir cadastro';
        status.append(link);
        return;
      }
      status.hidden = true;
      if (new URLSearchParams(location.search).get('preferencias') === 'salvas') {
        status.textContent = 'Preferências salvas.';
        status.hidden = false;
        history.replaceState(null, '', location.pathname);
      }
      render(profile);
    } catch (error) {
      status.textContent = ui.accountErrorMessage(error);
      status.hidden = false;
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', loadProfile);
  await loadProfile();
})();
