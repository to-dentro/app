(async () => {
  'use strict';
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  await window.ToDentroAuth.ready;
  const params = new URLSearchParams(location.search);
  const appRoot = new URL('../../', location.href);
  const { getCommunityPosts } = await import(new URL('services/community.js', appRoot).href);
  let remotePosts = [];
  let communityLoadError = '';
  try {
    remotePosts = await getCommunityPosts();
  } catch {
    communityLoadError = 'Não foi possível carregar os relatos compartilhados agora. Confira sua conexão e tente novamente.';
  }
  let localPosts = [], localReplies = [];
  if (window.ToDentroAuth.isAuthenticated()) {
    try {
      const { getSavedList } = await import('../../../services/user-saved-data.js');
      const [posts, replies] = await Promise.all([getSavedList('communityPosts'), getSavedList('communityReplies')]);
      localPosts = posts.filter(post => typeof post.author === 'string' && typeof post.title === 'string' && typeof post.text === 'string'
        && ['experiencias', 'duvidas'].includes(post.category));
      localReplies = replies.filter(item => typeof item.questionId === 'string' && typeof item.text === 'string');
    } catch { /* Os relatos públicos e demonstrativos continuam disponíveis. */ }
  }
  const universityId = params.get('universidade');
  const university = window.ToDentroUniversities.find(item => item.id === universityId);
  const feed = document.querySelector('#community-feed');
  const empty = document.querySelector('#community-empty');
  const buttons = [...document.querySelectorAll('[data-category]')];
  const back = document.querySelector('#community-back');
  const query = document.querySelector('#community-query');
  const sort = document.querySelector('#community-sort');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  let selectedCategory = 'experiencias';
  query.value = params.get('busca') || '';
  sort.value = params.get('ordem') === 'antigos' ? 'antigos' : 'recentes';
  const questionUniversity = document.querySelector('#questions-university');
  const questionTopic = document.querySelector('#questions-topic');
  const topicLabels = { ingresso: 'Ingresso', pesquisa: 'Pesquisa', permanencia: 'Permanência', 'vida-academica': 'Vida acadêmica' };
  let admissionOnly = false;
  for (const item of window.ToDentroUniversities) {
    questionUniversity.append(new Option(item.acronym, item.id));
  }
  questionUniversity.value = university?.id || '';

  if (university) {
    const fallback = new URL('./universidade.html', location.href);
    fallback.searchParams.set('id', university.id);
    back.href = fallback.href;
    const context = document.querySelector('#community-context');
    context.textContent = `Relatos de ${university.acronym} e dicas para o vestibular`;
    context.hidden = false;
    document.title = `Comunidade • ${university.acronym} | Tô Dentro`;
  }
  const details = new URL('./universidade.html', location.href);
  const from = window.ToDentroNavigation.from(params, '../../index.html', details);
  if (from && (from.pathname !== details.pathname || from.searchParams.get('id') === university?.id)) back.href = from.href;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function render(category) {
    selectedCategory = category;
    const doubts = category === 'duvidas';
    document.querySelector('#community-title').textContent = doubts ? 'Tire suas dúvidas' : 'Quem vive, compartilha.';
    document.querySelector('.community-intro').textContent = doubts ? 'Pergunte, responda e troque informações.' : 'Experiências reais ajudam novas escolhas.';
    document.querySelector('#community-search').hidden = doubts;
    document.querySelector('#question-filters').hidden = !doubts;
    document.querySelector('#community-share').textContent = doubts ? 'Criar uma dúvida' : 'Compartilhar minha experiência';
    document.querySelector('#community-notice-title').textContent = doubts ? 'Uma comunidade acolhedora' : 'Conteúdo da comunidade';
    document.querySelector('#community-notice-text').textContent = doubts ? 'Não compartilhe documentos ou dados pessoais. Respeite outras pessoas e indique suas fontes.' : 'Relatos são pessoais e não são conteúdos oficiais. Consulte fontes oficiais para editais e regras.';
    if (communityLoadError) document.querySelector('#community-notice-text').textContent += ` ${communityLoadError}`;
    const terms = doubts ? [] : normalize(query.value).split(/\s+/).filter(Boolean);
    const filteredUniversity = doubts ? questionUniversity.value : universityId;
    const allPosts = [...window.ToDentroCommunity, ...localPosts, ...remotePosts];
    const posts = allPosts.filter(post => post.category === category
      && (!filteredUniversity || post.universityId === filteredUniversity)
      && (!doubts || ((!admissionOnly || post.topic === 'ingresso') && (!questionTopic.value || post.topic === questionTopic.value)))
      && terms.every(term => {
        const institution = window.ToDentroUniversities.find(item => item.id === post.universityId);
        return normalize(`${post.author} ${post.title} ${post.text} ${post.course || ''} ${institution?.name || ''} ${institution?.acronym || ''}`).includes(term);
      })).sort((a, b) => sort.value === 'antigos'
        ? (a.publishedAt || '').localeCompare(b.publishedAt || '')
        : (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    feed.replaceChildren();
    for (const post of posts) {
      const article = element('article', 'community-post');
      if (window.ToDentroCommunity.includes(post)) {
        article.append(element('p', 'demo-content-label', 'Conteúdo de demonstração'));
      }
      const author = element('header', 'post-author');
      const initials = post.initials || post.author.split(/\s+/).map(name => name[0]).slice(0, 2).join('');
      const fallbackAvatar = () => {
        const placeholder = element('span', 'post-avatar', initials);
        placeholder.setAttribute('aria-hidden', 'true');
        return placeholder;
      };
      const avatar = post.avatar ? element('img', 'post-avatar') : fallbackAvatar();
      if (post.avatar) {
        avatar.src = post.avatar; avatar.alt = ''; avatar.width = 48; avatar.height = 48;
        avatar.addEventListener('error', () => avatar.replaceWith(fallbackAvatar()));
      }
      const authorText = element('div', 'post-author-info');
      const institution = window.ToDentroUniversities.find(item => item.id === post.universityId);
      authorText.append(element('p', 'post-author-name', post.author));
      if (institution || post.course || (doubts && post.topic)) authorText.append(element('p', 'post-institution', [institution?.acronym, post.course, doubts ? topicLabels[post.topic] : ''].filter(Boolean).join(' · ')));
      if (!doubts) authorText.append(element('p', 'post-author-description', `${post.role || 'Estudante'}${post.experiencePeriod ? ` · ${post.experiencePeriod}` : post.since ? ` desde ${post.since}` : ''}`));
      author.append(avatar, authorText);
      if (doubts) {
        article.classList.add('community-question');
        const count = (Array.isArray(post.replies) ? post.replies.length : 0) + localReplies.filter(item => item.questionId === post.id).length;
        const open = element('a', 'button button-yellow', 'Abrir discussão');
        const discussion = new URL('./duvida.html', location.href); discussion.searchParams.set('id', post.id);
        const state = new URLSearchParams(params); state.set('categoria', 'duvidas'); state.set('universidade', questionUniversity.value); state.set('ordem', sort.value);
        discussion.searchParams.set('from', `${location.pathname}?${state}`); open.href = discussion.href;
        article.append(author, element('h2', 'post-title', post.title));
        if (Array.isArray(post.replies)) article.append(element('p', 'question-response-count', `${count} ${count === 1 ? 'resposta' : 'respostas'}`));
        article.append(open);
        feed.append(article); continue;
      }
      const read = element('a', 'button button-yellow', category === 'duvidas' ? 'Ler dúvida' : 'Ler experiência');
      read.setAttribute('aria-label', `Ler ${category === 'duvidas' ? 'dúvida' : 'experiência'} de ${post.author}`);
      const destination = new URL('./experiencia.html', location.href);
      destination.searchParams.set('id', post.id);
      const state = new URLSearchParams(params); state.set('busca', query.value); state.set('ordem', sort.value);
      destination.searchParams.set('from', `${location.pathname}?${state}`); read.href = destination.href;
      article.append(author, element('h2', 'post-title', post.title), element('p', 'post-text', post.text), read);
      feed.append(article);
    }
    empty.hidden = posts.length > 0;
    empty.textContent = communityLoadError && posts.length === 0 ? communityLoadError
      : universityId && !university ? 'Universidade não encontrada. Volte à busca para escolher uma instituição.'
      : category === 'duvidas' ? 'Ainda não há dúvidas nesta seleção.'
      : 'Nenhum relato encontrado nesta seleção. Tente outro assunto, universidade ou curso.';
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.category === category));
    document.querySelector('#questions-all').setAttribute('aria-pressed', String(!questionUniversity.value && !questionTopic.value && !admissionOnly));
    document.querySelector('#questions-admission').setAttribute('aria-pressed', String(admissionOnly));
  }
  for (const button of buttons) button.addEventListener('click', () => render(button.dataset.category));
  query.addEventListener('input', () => render(selectedCategory));
  sort.addEventListener('change', () => render(selectedCategory));
  document.querySelector('#community-search').addEventListener('submit', event => { event.preventDefault(); render(selectedCategory); });
  document.querySelector('#community-share').addEventListener('click', () => {
    if (!window.ToDentroAuth.requireLogin('Entre para publicar na comunidade.')) return;
    if (selectedCategory === 'duvidas') {
      const destination = new URL('./criar-duvida.html', location.href);
      if (questionUniversity.value) destination.searchParams.set('universidade', questionUniversity.value);
      const state = new URLSearchParams(params); state.set('categoria', 'duvidas'); state.set('universidade', questionUniversity.value);
      destination.searchParams.set('from', `${location.pathname}?${state}`);
      location.href = destination.href; return;
    }
    const destination = new URL('./compartilhar-experiencia.html', location.href);
    if (university) destination.searchParams.set('universidade', university.id);
    destination.searchParams.set('from', location.pathname + location.search);
    location.href = destination.href;
  });
  questionUniversity.addEventListener('change', () => render('duvidas'));
  questionTopic.addEventListener('change', () => { admissionOnly = false; render('duvidas'); });
  document.querySelector('#questions-all').addEventListener('click', () => { questionUniversity.value = ''; questionTopic.value = ''; admissionOnly = false; render('duvidas'); });
  document.querySelector('#questions-admission').addEventListener('click', () => { admissionOnly = !admissionOnly; questionTopic.value = ''; render('duvidas'); });
  render(params.get('categoria') === 'duvidas' ? 'duvidas' : 'experiencias');
})();
