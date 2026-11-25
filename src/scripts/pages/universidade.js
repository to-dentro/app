(async () => {
  'use strict';
  if(window.ToDentroCoursesReady)await window.ToDentroCoursesReady;
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  const params = new URLSearchParams(location.search);
  const university = window.ToDentroUniversities.find(item => item.id === params.get('id'));
  // Permitir retorno apenas às telas locais conhecidas, preservando a busca.
  const from = window.ToDentroNavigation.from(params, '../../index.html', './buscar-universidades.html', './mapa.html', './salvos.html');
  if (from) document.querySelector('#university-back').href = from.href;
  if (!university) {
    document.querySelector('#university-not-found').hidden = false;
    return;
  }
  document.title = `${university.acronym} | Tô Dentro`;
  const coursesUrl = new URL('./cursos.html', location.href);
  coursesUrl.searchParams.set('universidade', university.id);
  coursesUrl.searchParams.set('from', location.pathname + location.search);
  document.querySelector('#university-courses-link').href = coursesUrl.href;
  document.querySelector('#university-cutoff-link').href=`./buscar-nota-de-corte.html?${new URLSearchParams({universidade:university.id})}`;
  const opportunitiesUrl = new URL('./oportunidades.html', location.href);
  opportunitiesUrl.searchParams.set('universidade', university.id);
  opportunitiesUrl.searchParams.set('from', location.pathname + location.search);
  document.querySelector('#university-opportunities-link').href = opportunitiesUrl.href;
  const communityUrl = new URL('./comunidade.html', location.href);
  communityUrl.searchParams.set('universidade', university.id);
  communityUrl.searchParams.set('from', location.pathname + location.search);
  document.querySelector('#university-community').href = communityUrl.href;
  const calendarUrl = new URL('./calendario.html', location.href);
  calendarUrl.searchParams.set('from', location.pathname + location.search);
  calendarUrl.searchParams.set('universidade', university.id);
  document.querySelector('#university-calendar').href = calendarUrl.href;
  const values = {
    'university-name': university.name,
    'university-location': [university.acronym, university.category || (university.public ? 'Pública' : 'Particular')].join(' · '),
    'university-description': university.description,
    'university-tuition': university.tuition || (university.free ? 'Gratuita' : 'Com mensalidade'),
  };
  for (const [id, text] of Object.entries(values)) document.getElementById(id).textContent = text;
  const admissionList = document.querySelector('#university-admission');
  const methods = [];
  const notes = [];
  for (const part of (university.admission || '').split(/[;·\n]+|\s+e\/ou\s+|\s+e\s+(?=seleções específicas|processo misto)/i)) {
    const text = part.trim();
    if (!text) continue;
    if (/^consultar\b/i.test(text)) {
      notes.push(`Consulte ${text.slice('consultar '.length).replace(/\.$/, '')}.`);
    } else {
      methods.push(text[0].toLocaleUpperCase('pt-BR') + text.slice(1));
    }
  }
  for (const method of methods) {
    const item = document.createElement('li');
    item.textContent = method;
    admissionList.append(item);
  }
  admissionList.hidden = !methods.length;
  document.querySelector('#university-admission-note').textContent = notes.join(' ') || (methods.length
    ? 'Confira a edição e o edital aplicável ao curso.'
    : 'As formas de ingresso ainda não foram cadastradas.');
  document.querySelector('#university-official-site').href = university.website;
  const gallery = document.querySelector('#university-gallery-track');
  const photos = (university.photos || []).slice(0, 3);
  const slides = photos.length > 1 ? [...photos, photos[0]] : photos;
  for (const [index, photo] of slides.entries()) {
    const image = document.createElement('img');
    const repeated = index === photos.length;
    image.alt = repeated ? '' : photo.alt;
    if (repeated) image.setAttribute('aria-hidden', 'true');
    image.width = 900;
    image.height = 370;
    image.referrerPolicy = 'no-referrer';
    if (photo.position) image.style.objectPosition = photo.position;
    image.addEventListener('error', () => {
      const fallback = Object.assign(document.createElement('p'), { className: 'gallery-placeholder gallery-photo-error', textContent: 'Imagem indisponível no momento.' });
      if (repeated) fallback.setAttribute('aria-hidden', 'true');
      image.replaceWith(fallback);
    });
    image.src = photo.src;
    gallery.append(image);
  }
  if (!photos.length) {
    const placeholder = document.createElement('p');
    placeholder.className = 'gallery-placeholder';
    placeholder.textContent = `Fotos da ${university.acronym} em breve`;
    gallery.append(placeholder);
  }
  if (photos.length > 1) {
    const dots = document.querySelector('#university-gallery-dots');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const figure = gallery.closest('figure');
    let active = 0;
    let lastInteraction = 0;

    const buttons = photos.map((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Foto ${index + 1} de ${photos.length}: ${photo.alt}`);
      button.addEventListener('click', () => {
        lastInteraction = Date.now();
        showPhoto(index);
      });
      dots.append(button);
      return button;
    });

    function updateIndicator(index) {
      active = index;
      buttons.forEach((button, position) => button.setAttribute('aria-current', String(position === index)));
    }

    function showPhoto(index) {
      gallery.scrollTo({ left: index * gallery.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }

    gallery.addEventListener('scroll', () => {
      if (!gallery.clientWidth) return;
      const end = gallery.scrollWidth - gallery.clientWidth;
      if (gallery.scrollLeft >= end - 1) {
        // A última posição repete a primeira foto, então o salto fica invisível.
        gallery.scrollTo({ left: 0, behavior: 'instant' });
        updateIndicator(0);
        return;
      }
      const index = Math.max(0, Math.round(gallery.scrollLeft / gallery.clientWidth)) % photos.length;
      if (index !== active) updateIndicator(index);
    }, { passive: true });
    gallery.addEventListener('pointerdown', () => { lastInteraction = Date.now(); });
    updateIndicator(0);
    dots.hidden = false;
    window.setInterval(() => {
      if (Date.now() - lastInteraction >= 5000 && !document.hidden && !reducedMotion.matches && !figure.matches(':hover, :focus-within')) {
        showPhoto(active + 1);
      }
    }, 5000);
  }
  for (const button of document.querySelectorAll('[data-detail]')) {
    button.addEventListener('click', () => document.getElementById(button.dataset.detail).showModal());
  }
  document.querySelector('#university-content').hidden = false;
  const saveButton = document.querySelector('#save-university');
  saveButton.hidden = false;
  const accountData = () => import('../../../services/user-saved-data.js');
  let saved = false;
  function updateSaved() {
    saveButton.setAttribute('aria-pressed', String(saved));
    const label = saved ? 'Remover universidade dos salvos' : 'Salvar universidade';
    saveButton.setAttribute('aria-label', label);
    saveButton.title = label;
  }
  const status = document.querySelector('#save-status');
  saveButton.addEventListener('click', async () => {
    if (!window.ToDentroAuth.requireLogin('Entre para salvar universidades.')) return;
    saveButton.disabled = true;
    try {
      const { updateSavedList } = await accountData();
      const ids = await updateSavedList('universities', current => current.includes(university.id)
        ? current.filter(id => id !== university.id)
        : [...current, university.id]);
      saved = ids.includes(university.id);
      updateSaved();
      status.classList.add('visually-hidden');
      status.textContent = saved ? 'Universidade salva nas suas escolhas.' : 'Universidade removida das suas escolhas.';
    } catch {
      status.classList.remove('visually-hidden');
      status.textContent = 'Não foi possível atualizar seus salvos. Tente novamente.';
    } finally {
      saveButton.disabled = false;
    }
  });
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isAuthenticated()) {
    saveButton.disabled = true;
    try {
      saved = (await (await accountData()).getSavedList('universities')).includes(university.id);
    } catch {
      status.classList.remove('visually-hidden');
      status.textContent = 'Não foi possível carregar seus salvos.';
    } finally {
      saveButton.disabled = false;
    }
  }
  updateSaved();
})();
