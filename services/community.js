import {
  addDoc,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { auth, db } from '../config/firebase.js';

const postLimit = 100;
const replyLimit = 100;

function currentUser() {
  if (!db || !auth?.currentUser) {
    throw Object.assign(new Error('Entre na sua conta para participar da comunidade.'), { code: 'community/not-authenticated' });
  }
  return auth.currentUser;
}

function publishedDate(data) {
  const value = data.publishedAt;
  return value?.toDate ? value.toDate().toISOString() : (typeof value === 'string' ? value : '');
}

function mapDocument(snapshot) {
  const data = snapshot.data();
  return { ...data, id: snapshot.id, publishedAt: publishedDate(data) };
}

async function authorFields(user) {
  const profile = await getDocFromServer(doc(db, 'users', user.uid));
  if (!profile.exists()) throw new Error('Conclua seu cadastro antes de publicar na comunidade.');
  const author = profile.data().displayName.trim().slice(0, 120);
  return { uid: user.uid, author, initials: author.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toLocaleUpperCase('pt-BR') };
}

export async function getCommunityPosts() {
  if (!db) throw new Error('O Firebase não está configurado.');
  const posts = await getDocsFromServer(query(collection(db, 'communityPosts'), orderBy('publishedAt', 'desc'), limit(postLimit)));
  return posts.docs.map(mapDocument);
}

export async function getCommunityPost(postId) {
  if (!db || !postId) return null;
  const snapshot = await getDocFromServer(doc(db, 'communityPosts', postId));
  return snapshot.exists() ? mapDocument(snapshot) : null;
}

export async function getCommunityReplies(postId) {
  if (!db || !postId) return [];
  const replies = await getDocsFromServer(query(
    collection(db, 'communityPosts', postId, 'replies'),
    orderBy('publishedAt', 'asc'),
    limit(replyLimit),
  ));
  return replies.docs.map(mapDocument);
}

export async function createCommunityPost(input) {
  const user = currentUser();
  const category = input.category;
  if (!['experiencias', 'duvidas'].includes(category)) throw new Error('Tipo de publicação inválido.');
  const payload = {
    ...(await authorFields(user)),
    category,
    title: input.title.trim(),
    text: input.text.trim(),
    universityId: input.universityId || null,
    course: input.course || '',
    topic: input.topic || '',
    role: input.role || '',
    startYear: input.startYear || '',
    endYear: input.endYear || '',
    ongoing: input.ongoing === true,
    experiencePeriod: input.experiencePeriod || '',
    publishedAt: serverTimestamp(),
  };
  if (!payload.title || payload.title.length > 150 || !payload.text || payload.text.length > 10000) {
    throw new Error('Confira o título e o texto da publicação.');
  }
  const reference = await addDoc(collection(db, 'communityPosts'), payload);
  return reference.id;
}

export async function createCommunityReply(postId, { text, source = '' }) {
  const user = currentUser();
  const cleanText = text.trim();
  if (!postId || !cleanText || cleanText.length > 10000 || source.length > 2000) throw new Error('Confira sua resposta e a fonte indicada.');
  const reference = await addDoc(collection(db, 'communityPosts', postId, 'replies'), {
    ...(await authorFields(user)), text: cleanText, source, publishedAt: serverTimestamp(),
  });
  return reference.id;
}
