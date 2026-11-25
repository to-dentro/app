(() => {
  'use strict';
  const dialog = document.querySelector('.upcoming-dialog');
  for (const button of document.querySelectorAll('[data-upcoming]')) {
    button.addEventListener('click', () => {
      dialog.querySelector('h2').textContent = button.dataset.upcoming;
      dialog.showModal();
    });
  }
})();
