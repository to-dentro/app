import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  query,
  where,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { auth, db } from '../config/firebase.js';

async function deleteInBatches(references) {
  for (let start = 0; start < references.length; start += 400) {
    const batch = writeBatch(db);
    references.slice(start, start + 400).forEach(reference => batch.delete(reference));
    await batch.commit();
  }
}

function clearLocalAccountData(uid) {
  const suffix = `:${uid}`;
  for (const store of [localStorage, sessionStorage]) {
    try {
      for (let index = store.length - 1; index >= 0; index -= 1) {
        const key = store.key(index);
        if (key?.endsWith(suffix)) store.removeItem(key);
      }
    } catch { /* A remoção da conta continua mesmo sem acesso ao armazenamento local. */ }
  }
}

export async function deleteAccount(password) {
  const user = auth?.currentUser;
  if (!user?.email || !db) throw new Error('Não foi possível acessar a conta e os dados no Firebase.');
  if (!password) throw new Error('Digite sua senha para confirmar a exclusão da conta.');

  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

  const posts = (await getDocsFromServer(collection(db, 'communityPosts'))).docs;
  const ownPosts = posts.filter(post => post.get('uid') === user.uid);
  const replyReferences = [];
  for (let start = 0; start < posts.length; start += 10) {
    const replies = await Promise.all(posts.slice(start, start + 10).map(post => {
      const thread = collection(db, 'communityPosts', post.id, 'replies');
      return getDocsFromServer(post.get('uid') === user.uid ? thread : query(thread, where('uid', '==', user.uid)));
    }));
    for (const result of replies) replyReferences.push(...result.docs.map(reply => reply.ref));
  }
  await deleteInBatches(replyReferences);
  await deleteInBatches(ownPosts.map(snapshot => snapshot.ref));
  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
  clearLocalAccountData(user.uid);
}
