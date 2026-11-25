(async () => {
  'use strict';
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;
  const params = new URLSearchParams(location.search);
  const accountData = () => import('../../../services/user-saved-data.js');
  const back = new URL('./calendario.html', location.href);
  const from = window.ToDentroNavigation.from(params, back);
  if (from) back.search = from.search;
  document.querySelector('#reminder-back').href = back.href;
  document.querySelector('#cancel-reminder').href = back.href;
  const form = document.querySelector('#reminder-form');
  const title = document.querySelector('#reminder-title');
  const date = document.querySelector('#reminder-date');
  const time = document.querySelector('#reminder-time');
  const category = document.querySelector('#reminder-category');
  const university = document.querySelector('#reminder-university');
  const description = document.querySelector('#reminder-description');
  const status = document.querySelector('#reminder-status');
  for (const item of window.ToDentroUniversities) university.append(new Option(item.acronym, item.id));
  let reminders = [];
  try {
    reminders = await (await accountData()).getSavedList('reminders');
  } catch {
    status.textContent = 'Não foi possível carregar seus lembretes. Recarregue a página para tentar novamente.';
    if (params.has('id')) {
      form.querySelector('button[type="submit"]').disabled = true;
      return;
    }
  }
  const reminder = reminders.find(item => item.id === params.get('id'));
  if (params.has('id') && !reminder) {
    status.textContent = 'Lembrete não encontrado. Volte ao calendário para escolher outro.';
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }
  if (reminder) {
    document.title = 'Editar lembrete | Tô Dentro';
    document.querySelector('#reminder-heading').textContent = 'Editar lembrete';
    title.value = reminder.title; date.value = reminder.date; time.value = reminder.time || '';
    category.value = ['pessoal', 'estudo', 'inscricao', 'prova', 'resultado'].includes(reminder.reminderCategory) ? reminder.reminderCategory : 'pessoal';
    university.value = window.ToDentroUniversities.some(item => item.id === reminder.universityId) ? reminder.universityId : '';
    description.value = reminder.description || '';
    document.querySelector('#delete-reminder').hidden = false;
  } else {
    date.value = /^\d{4}-\d{2}-\d{2}$/.test(params.get('data') || '') ? params.get('data') : '';
  }
  title.addEventListener('input', () => title.setCustomValidity(''));
  const submit = form.querySelector('button[type="submit"]');
  const remove = document.querySelector('#delete-reminder');
  async function save(update, selectedDate) {
    if (submit.disabled) return;
    submit.disabled = remove.disabled = true;
    try {
      await (await accountData()).updateSavedList('reminders', latest => {
        if (reminder && !latest.some(item => item.id === reminder.id)) throw new Error('Missing reminder');
        return update(latest);
      });
    } catch {
      status.textContent = 'Não foi possível salvar na sua conta. Seus dados continuam no formulário.';
      submit.disabled = remove.disabled = false;
      return;
    }
    const destination = new URL(back.href);
    if (selectedDate) {
      destination.searchParams.set('mes', `${selectedDate.slice(0, 7)}-01`);
      destination.searchParams.set('categoria', 'lembretes');
      destination.searchParams.delete('universidade');
    }
    window.ToDentroNavigation.returnTo(destination.href);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    title.setCustomValidity(title.value.trim() ? '' : 'Escreva um título para o lembrete.');
    if (!form.reportValidity()) return;
    const entry = { id: reminder?.id || crypto.randomUUID(), title: title.value.trim(), date: date.value, time: time.value,
      reminderCategory: category.value, universityId: university.value, description: description.value.trim() };
    save(latest => reminder ? latest.map(item => item.id === reminder.id ? entry : item) : [...latest, entry], entry.date);
  });
  document.querySelector('#delete-reminder').addEventListener('click', () => {
    if (reminder) save(latest => latest.filter(item => item.id !== reminder.id));
  });
})();
