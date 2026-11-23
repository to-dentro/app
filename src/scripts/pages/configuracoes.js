(async () => {
  'use strict';
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;
  const root = new URL('../../', location.href);
  const settingsStatus = document.querySelector('#settings-status');
  const dialog = document.querySelector('#delete-account-dialog');
  const deleteForm = document.querySelector('#delete-account-form');
  const deleteStatus = document.querySelector('#delete-account-status');
  const titles = { inicio: 'Configurações', conta: 'Gerenciamento de conta', email: 'Alterar e-mail', senha: 'Alterar senha' };
  const selected = new URLSearchParams(location.search).get('tela');
  const view = selected === 'dados' ? 'conta' : Object.hasOwn(titles, selected) ? selected : 'inicio';
  const title = titles[view];
  document.querySelector('.profile-header h1').textContent = title;
  document.title = `${title} | Tô Dentro`;
  const back = document.querySelector('.profile-back');
  if (view !== 'inicio') {
    back.href = view === 'conta' ? './configuracoes.html' : './configuracoes.html?tela=conta';
    back.setAttribute('aria-label', view === 'conta' ? 'Voltar às configurações' : 'Voltar ao gerenciamento de conta');
  }
  for (const panel of document.querySelectorAll('[data-settings-view]')) panel.hidden = panel.dataset.settingsView !== view;
  const showStatus = text => {
    settingsStatus.textContent = text;
    settingsStatus.hidden = !text;
  };
  const user = window.ToDentroAuth.user;
  const nameField = document.querySelector('#settings-name');
  const accountEmail = document.querySelector('#settings-account-email');
  nameField.value = user.displayName || '';
  accountEmail.textContent = user.email || '';
  const loadProfiles = () => import(new URL('services/profile.js', root).href);
  const loadAuth = () => import(new URL('services/auth.js', root).href);
  const { accountErrorMessage } = await import(new URL('services/account-ui.js', root).href);

  function bindForm(id, submit) {
    const form = document.querySelector(id);
    const button = form.querySelector('[type="submit"]');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      const values = new FormData(form);
      button.disabled = true;
      showStatus('Salvando…');
      try { await submit(values, form); }
      catch (error) {
        showStatus(['profile/same-email', 'profile/current-email-mismatch'].includes(error.code) ? error.message
          : error.code === 'auth/requires-recent-login' || error.code === 'auth/user-token-expired'
            ? 'Entre novamente na sua conta para concluir a alteração.'
            : accountErrorMessage(error));
      } finally { button.disabled = false; }
    });
    button.disabled = false;
  }

  bindForm('#settings-name-form', async values => {
    const profiles = await loadProfiles();
    const updated = await profiles.updateProfileIdentity(values.get('displayName'));
    nameField.value = updated.displayName;
    accountEmail.textContent = updated.email;
    try {
      await (await loadAuth()).setDisplayName(updated.displayName);
      showStatus('Nome atualizado.');
    } catch {
      showStatus('Nome salvo no perfil. Salve novamente para sincronizar com sua conta.');
    }
  });
  bindForm('#settings-email-form', async (values, form) => {
    await (await loadAuth()).requestEmailChange(values.get('currentEmail'), values.get('email'), values.get('password'));
    form.elements.password.value = '';
    showStatus('Enviamos um link ao novo e-mail. Confirme o endereço e entre novamente para atualizar seus dados.');
  });
  bindForm('#settings-password-form', async (values, form) => {
    await (await loadAuth()).changePassword(values.get('currentPassword'), values.get('newPassword'));
    form.reset();
    showStatus('Senha atualizada.');
  });

  const recover = document.querySelector('#settings-recover-password');
  recover.disabled = false;
  recover.addEventListener('click', async () => {
    recover.disabled = true;
    showStatus('Enviando link de recuperação…');
    try {
      await (await loadAuth()).resetPassword(user.email);
      showStatus(`Enviamos um link de recuperação para ${user.email}.`);
    } catch (error) { showStatus(accountErrorMessage(error)); }
    finally { recover.disabled = false; }
  });

  if (view === 'conta') {
    const saveName = document.querySelector('#settings-name-form [type="submit"]');
    saveName.disabled = true;
    const loadName = async () => {
      const profiles = await loadProfiles();
      const profile = await profiles.getProfile();
      if (profile) {
        nameField.value = profile.displayName;
        if (profile.email !== user.email) await profiles.updateProfileIdentity();
      }
    };
    loadName().catch(() => {
      if (!nameField.value) showStatus('Não foi possível carregar seu nome salvo. Você pode preenchê-lo e salvar.');
    }).finally(() => {
      nameField.disabled = false;
      saveName.disabled = false;
    });
  }

  document.querySelector('#settings-logout').addEventListener('click', async event => {
    const button = event.currentTarget; button.disabled = true;
    try { await (await loadAuth()).logout(); location.replace(new URL('index.html', root).href); }
    catch { settingsStatus.textContent = 'Não foi possível sair da conta. Tente novamente.'; settingsStatus.hidden = false; button.disabled = false; }
  });

  const deleteButton = document.querySelector('#confirm-delete-account');
  const cancelDelete = document.querySelector('#cancel-delete-account');
  const passwordField = document.querySelector('#delete-account-password');
  document.querySelector('#open-delete-account').addEventListener('click', () => {
    deleteForm.reset();
    deleteStatus.hidden = true;
    dialog.showModal();
  });
  cancelDelete.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => {
    if (deleteButton.disabled) event.preventDefault();
  });
  deleteForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (deleteButton.disabled || !deleteForm.reportValidity()) return;
    const password = passwordField.value;
    deleteButton.disabled = true;
    cancelDelete.disabled = true;
    passwordField.disabled = true;
    deleteStatus.hidden = false;
    deleteStatus.textContent = 'Excluindo seus dados e sua conta…';
    try {
      const { deleteAccount } = await import(new URL('services/account.js', root).href);
      await deleteAccount(password);
      location.replace(new URL('index.html', root).href);
    } catch (error) {
      deleteStatus.textContent = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
        ? 'A senha não confere. Confira e tente novamente.'
        : error.code === 'auth/requires-recent-login'
          ? 'Entre novamente na sua conta e repita a exclusão.'
          : 'Não foi possível concluir a exclusão. Tente novamente para finalizar.';
      deleteButton.disabled = false;
      cancelDelete.disabled = false;
      passwordField.disabled = false;
      passwordField.value = '';
      passwordField.focus();
    }
  });
})();
