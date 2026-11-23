import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { auth, db } from '../config/firebase.js';
import { normalizePreferences } from './preferences.js';

function profileReference() {
  if (!db || !auth?.currentUser) {
    const error = new Error('Entre na sua conta para acessar o perfil.');
    error.code = 'profile/not-authenticated';
    throw error;
  }
  return { user: auth.currentUser, reference: doc(db, 'users', auth.currentUser.uid) };
}

export async function getProfile() {
  const { reference } = profileReference();
  const snapshot = await getDocFromServer(reference);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveRegistrationProfile({ displayName, preferences }) {
  const { user, reference } = profileReference();
  const name = displayName.trim();
  if (!name || name.length > 120) throw Object.assign(new Error('Informe um nome com até 120 caracteres.'), {code: 'profile/invalid-name'});
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    const existing = snapshot.exists() ? snapshot.data() : null;
    transaction.set(reference, {
      uid: user.uid, displayName: name, email: user.email,
      preferences: normalizePreferences(preferences), schemaVersion: 1,
      createdAt: existing?.createdAt || serverTimestamp(),
      termsAcceptedAt: existing?.termsAcceptedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updatePreferences(preferences) {
  const { reference, user } = profileReference();
  const normalized = normalizePreferences(preferences);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw Object.assign(new Error('Conclua seu cadastro antes de editar as preferências.'), {code:'profile/incomplete'});
    transaction.update(reference, { preferences: normalized, email: user.email, updatedAt: serverTimestamp() });
  });
  return normalized;
}

export async function updateProfileIdentity(displayName) {
  const { reference, user } = profileReference();
  const name = displayName?.trim();
  if (displayName !== undefined && (!name || name.length > 120)) {
    throw Object.assign(new Error('Informe um nome com até 120 caracteres.'), { code: 'profile/invalid-name' });
  }
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) {
      if (name) throw Object.assign(new Error('Conclua seu cadastro antes de editar seus dados.'), { code: 'profile/incomplete' });
      return null;
    }
    const current = snapshot.data();
    const nextName = name ?? current.displayName;
    if (current.email !== user.email || current.displayName !== nextName) {
      transaction.update(reference, { displayName: nextName, email: user.email, updatedAt: serverTimestamp() });
    }
    return { ...current, displayName: nextName, email: user.email };
  });
}
