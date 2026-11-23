(async () => {
  'use strict';
  if (window.ToDentroCoursesReady) await window.ToDentroCoursesReady;
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;
  const params = new URLSearchParams(location.search);
  const university = document.querySelector('#question-university');
  const course = document.querySelector('#question-course');
  const topic = document.querySelector('#question-topic');
  const title = document.querySelector('#question-title');
  const text = document.querySelector('#question-text');
  const form = document.querySelector('#experience-form');
  const status = document.querySelector('#question-status');
  const { createCommunityPost } = await import(new URL('services/community.js', new URL('../../', location.href)).href);
  for (const item of window.ToDentroUniversities) university.append(new Option(`${item.acronym} — ${item.name}`, item.id));
  for (const item of window.ToDentroCourseCatalog.courses) course.append(new Option(item.name, item.name));
  university.value = window.ToDentroUniversities.some(item => item.id === params.get('universidade')) ? params.get('universidade') : '';
  const back = new URL('./comunidade.html?categoria=duvidas', location.href);
  const from = window.ToDentroNavigation.from(params, back, './duvida.html');
  if (from) { back.pathname = from.pathname; back.search = from.search; }
  back.searchParams.set('categoria', 'duvidas');
  document.querySelector('#question-back').href = back.href;
  document.querySelector('#question-cancel').href = back.href;
  for (const field of [title, text]) field.addEventListener('input', () => field.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    for (const field of [title, text]) field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo.');
    if (!form.reportValidity()) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const postId = await createCommunityPost({ category: 'duvidas', title: title.value, text: text.value,
        universityId: university.value, course: course.value, topic: topic.value });
      const destination = new URL('./comunidade.html?categoria=duvidas', location.href);
      if (university.value) destination.searchParams.set('universidade', university.value);
      destination.searchParams.set('publicado', postId);
      location.href = destination.href;
    } catch {
      status.textContent = 'Não foi possível publicar no Firebase. Sua dúvida continua aqui; tente novamente.';
      submit.disabled = false;
    }
  });
})();
