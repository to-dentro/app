import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { auth, db } from '../config/firebase.js';

const legacyLists = {
  universities: 'to-dentro-saved-universities',
  courses: 'to-dentro-saved-courses',
  comparisons: 'to-dentro-saved-comparisons',
  reminders: 'to-dentro-reminders',
  calendarDates: 'to-dentro-calendar-dates',
  communityPosts: 'to-dentro-community-posts',
  communityReplies: 'to-dentro-community-replies'
};

function reference() {
  if (!db || !auth?.currentUser) throw new Error('Entre na sua conta para acessar seus dados salvos.');
  return doc(db, 'users', auth.currentUser.uid);
}

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function removeLocal(key) {
  try { localStorage.removeItem(key); } catch { /* Os dados já estão no Firebase. */ }
}

function listItems(kind, items) {
  if (!Array.isArray(items)) return [];
  const objects = !['universities', 'courses', 'comparisons'].includes(kind);
  return items.filter(item => objects ? typeof item?.id === 'string' : typeof item === 'string');
}

export async function updateSavedList(kind, update) {
  const ref = reference();
  const key = `${legacyLists[kind]}:${ref.id}`;
  const next = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Conclua seu cadastro para salvar seus dados.');
    const stored = listItems(kind, snapshot.data().savedItems?.[kind]);
    const legacy = listItems(kind, readLocal(key));
    const entries = [...legacy, ...stored];
    const merged = [...new Map(entries.map(item => [typeof item === 'string' ? item : item.id, item])).values()];
    const items = update(merged);
    transaction.update(ref, { [`savedItems.${kind}`]: items, updatedAt: serverTimestamp() });
    return items;
  });
  removeLocal(key);
  return next;
}

export async function getSavedList(kind) {
  if (!auth?.currentUser) return [];
  const ref = reference();
  const key = `${legacyLists[kind]}:${ref.id}`;
  const snapshot = await getDocFromServer(ref);
  const stored = snapshot.data()?.savedItems?.[kind];
  if (snapshot.exists() && listItems(kind, readLocal(key)).length) return updateSavedList(kind, items => items);
  return listItems(kind, stored);
}

export function isVocationalMap(map) {
  return map?.version === 1 && !map.demonstrative
    && typeof map.profile === 'string' && typeof map.message === 'string'
    && Number.isInteger(map.valid) && map.valid >= 0 && map.valid <= 30
    && Array.isArray(map.points) && map.points.length === 6 && map.points.every(score => Number.isInteger(score) && score >= 0 && score <= 15)
    && Array.isArray(map.highlights) && map.highlights.every(index => Number.isInteger(index) && index >= 0 && index < 6)
    && Array.isArray(map.values) && map.values.every(value => typeof value === 'string')
    && Array.isArray(map.suggestions) && map.suggestions.every(course => typeof course?.name === 'string'
      && (course.axis === null || (Number.isInteger(course.axis) && course.axis >= 0 && course.axis < 6)));
}

export async function getVocationalMap() {
  if (!auth?.currentUser) return null;
  const ref = reference();
  const snapshot = await getDocFromServer(ref);
  if (!snapshot.exists()) return null;
  const saved = snapshot.data().vocationalMap;
  if (isVocationalMap(saved)) return saved;
  const key = `to-dentro-interest-map:${ref.id}`;
  const legacy = readLocal(key);
  if (!isVocationalMap(legacy)) return null;
  const map = await runTransaction(db, async transaction => {
    const latest = (await transaction.get(ref)).data()?.vocationalMap;
    if (isVocationalMap(latest)) return latest;
    transaction.update(ref, { vocationalMap: legacy, updatedAt: serverTimestamp() });
    return legacy;
  });
  removeLocal(key);
  return map;
}

export async function saveVocationalMap(map) {
  const ref = reference();
  if (!isVocationalMap(map)) throw new Error('Conclua o teste antes de salvar seu mapa.');
  await runTransaction(db, async transaction => {
    if (!(await transaction.get(ref)).exists()) throw new Error('Conclua seu cadastro para salvar seu mapa.');
    transaction.update(ref, { vocationalMap: map, updatedAt: serverTimestamp() });
  });
  removeLocal(`to-dentro-interest-map:${ref.id}`);
}
