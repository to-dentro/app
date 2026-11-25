// Recomendação permanente no desktop e apresentação na primeira visita do navegador.
const desktop = window.matchMedia('(min-width: 1024px)');
const welcomeKey = 'to-dentro-desktop-welcome-seen';
let welcomed = false;

function hasSeenWelcome() {
  if (welcomed) return true;
  try { return localStorage.getItem(welcomeKey) === '1'; }
  catch { return false; }
}

function showWelcome() {
  if (hasSeenWelcome() || document.querySelector('.device-dialog') || typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog'); dialog.className = 'device-dialog';
  dialog.setAttribute('aria-labelledby', 'device-dialog-title');
  dialog.setAttribute('aria-describedby', 'device-dialog-description');
  const icon = document.createElement('span'); icon.className = 'device-dialog-icon material-symbols-outlined';
  icon.textContent = 'smartphone'; icon.setAttribute('aria-hidden', 'true');
  const title = document.createElement('h2'); title.id = 'device-dialog-title';
  title.textContent = 'O Tô Dentro foi pensado para o celular.';
  const description = document.createElement('p'); description.id = 'device-dialog-description';
  description.textContent = 'Leve suas descobertas com você: abra o Tô Dentro no seu celular para aproveitar a experiência mobile. Você também pode continuar explorando pelo computador.';
  const button = document.createElement('button'); button.type = 'button'; button.className = 'button button-ink';
  button.textContent = 'Continuar no computador'; button.autofocus = true;
  button.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialog.remove());
  dialog.append(icon, title, description, button);
  document.body.append(dialog);
  dialog.showModal();
  welcomed = true;
  try { localStorage.setItem(welcomeKey, '1'); }
  catch { /* A apresentação ainda aparece só uma vez nesta página. */ }
}

function showTip() {
  if (!desktop.matches) { document.querySelector('.device-dialog[open]')?.close(); return; }
  if (document.querySelector('.device-tip')) { showWelcome(); return; }
  const aside = document.createElement('aside'); aside.className = 'device-tip';
  aside.setAttribute('aria-label', 'Experiência no celular');
  const icon = document.createElement('span'); icon.className = 'material-symbols-outlined';
  icon.textContent = 'smartphone'; icon.setAttribute('aria-hidden', 'true');
  const text = document.createElement('p');
  const title = document.createElement('strong'); title.textContent = 'Pensado para acompanhar você no celular.';
  const description = document.createElement('span'); description.textContent = 'Você também pode explorar por aqui. Para a experiência mobile, abra o Tô Dentro no seu celular.';
  text.append(title, description);
  aside.append(icon, text); document.body.prepend(aside);
  showWelcome();
}

showTip();
desktop.addEventListener('change', showTip);
