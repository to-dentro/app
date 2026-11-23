import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
  updatePassword,
  verifyBeforeUpdateEmail,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { auth } from '../config/firebase.js';

function requireAuth() {
  if (!auth) {
    const error = new Error('Preencha o firebaseConfig em config/firebase.js antes de usar a autenticação.');
    error.code = 'auth/firebase-not-configured';
    throw error;
  }
  return auth;
}

export function createAccount(email, password) {
  return createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export function logout() {
  return signOut(requireAuth());
}

export function resetPassword(email) {
  const firebaseAuth = requireAuth();
  firebaseAuth.languageCode = 'pt-BR';
  return sendPasswordResetEmail(firebaseAuth, email.trim().toLowerCase());
}

export function observeAuth(callback, onError) {
  return onAuthStateChanged(requireAuth(), callback, onError);
}

export function getCurrentUser() {
  return requireAuth().currentUser;
}

export function authReady() {
  return requireAuth().authStateReady();
}

export function setDisplayName(displayName) {
  const user = requireAuth().currentUser;
  if (!user) throw Object.assign(new Error('Entre para atualizar seu nome.'), {code:'profile/not-authenticated'});
  return updateProfile(user, {displayName: displayName.trim()});
}

async function confirmCurrentPassword(password) {
  const user = getCurrentUser();
  if (!user?.email) throw Object.assign(new Error('Entre para gerenciar sua conta.'), { code: 'profile/not-authenticated' });
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  return user;
}

export async function refreshAccount() {
  const user = getCurrentUser();
  if (!user) return null;
  const previousEmail = user.email;
  await reload(user);
  if (user.email !== previousEmail) await user.getIdToken(true);
  return user;
}

export async function requestEmailChange(currentEmail, newEmail, password) {
  const firebaseAuth = requireAuth();
  const accountEmail = firebaseAuth.currentUser?.email?.toLowerCase();
  if (currentEmail.trim().toLowerCase() !== accountEmail) {
    throw Object.assign(new Error('Confira o e-mail atual da sua conta.'), { code: 'profile/current-email-mismatch' });
  }
  const email = newEmail.trim().toLowerCase();
  if (email === accountEmail) {
    throw Object.assign(new Error('Informe um e-mail diferente do atual.'), { code: 'profile/same-email' });
  }
  const user = await confirmCurrentPassword(password);
  firebaseAuth.languageCode = 'pt-BR';
  await verifyBeforeUpdateEmail(user, email);
}

export async function changePassword(currentPassword, newPassword) {
  const user = await confirmCurrentPassword(currentPassword);
  await updatePassword(user, newPassword);
}
