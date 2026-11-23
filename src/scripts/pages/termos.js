(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('from') !== 'configuracoes') return;
  const back = document.querySelector('#terms-back');
  back.href = './configuracoes.html';
  back.setAttribute('aria-label', 'Voltar às configurações');
})();
