(async () => {
  'use strict';
  if (window.ToDentroUniversitiesReady) await window.ToDentroUniversitiesReady;
  await window.ToDentroAuth.ready;
  const params = new URLSearchParams(location.search);
  const appRoot = new URL('../../', location.href);
  const { getCommunityPost } = await import(new URL('services/community.js', appRoot).href);
  let localPosts = [];
  if (window.ToDentroAuth.isAuthenticated()) {
    try {
      const { getSavedList } = await import('../../../services/user-saved-data.js');
      localPosts = await getSavedList('communityPosts');
    } catch { /* Os relatos públicos e demonstrativos continuam disponíveis. */ }
  }
  let post = [...window.ToDentroCommunity, ...localPosts].find(item => item && item.id === params.get('id') && typeof item.title === 'string' && typeof item.text === 'string' && typeof item.author === 'string');
  let loadError = false;
  if (!post) {
    try { post = await getCommunityPost(params.get('id')); } catch { loadError = true; }
  }
  const back = new URL('./comunidade.html', location.href);
  const from = window.ToDentroNavigation.from(params, back);
  if (from) back.search = from.search;
  document.querySelector('#experience-back').href = back.href;
  if (!post) {
    const notice = document.querySelector('#experience-not-found');
    if (loadError) notice.querySelector('p').textContent = 'Não foi possível carregar este relato agora. Confira sua conexão e tente novamente.';
    notice.hidden = false; return;
  }
  const university = window.ToDentroUniversities.find(item => item.id === post.universityId);
  document.title = `${post.title} | Tô Dentro`;
  document.querySelector('#experience-demo').hidden = !window.ToDentroCommunity.includes(post);
  document.querySelector('#experience-title').textContent = post.title;
  document.querySelector('#experience-author').textContent = [post.author, university?.acronym, post.course].filter(Boolean).join(' · ');
  document.querySelector('#experience-role').textContent = post.role || 'Membro da comunidade';
  const period = document.querySelector('#experience-period');
  if (post.experiencePeriod || post.since) { period.textContent = post.experiencePeriod || `Desde ${post.since}`; period.hidden = false; }
  document.querySelector('#experience-text').textContent = post.text;
  const more = new URL('./comunidade.html', location.href);
  if (university) more.searchParams.set('universidade', university.id);
  document.querySelector('#experience-more').href = more.href;
  document.querySelector('#experience-more').textContent = university ? `Ver mais experiências da ${university.acronym}` : 'Ver mais experiências';
  const share = new URL('./compartilhar-experiencia.html', location.href);
  if (university) share.searchParams.set('universidade', university.id);
  share.searchParams.set('from', location.pathname + location.search);
  document.querySelector('#experience-share').href = share.href;
  document.querySelector('#experience-content').hidden = false;
})();
