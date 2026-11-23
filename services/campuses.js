import { collection, getDocsFromServer } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { db } from '../config/firebase.js';

const campusReads = new Map();

export function readUniversityCampuses(universityId) {
  if (!campusReads.has(universityId)) {
    const read = getDocsFromServer(collection(db, 'universities', universityId, 'campuses'))
      .then(snapshot => snapshot.docs.map(document => ({ ...document.data(), id: document.id })))
      .catch(error => {
        campusReads.delete(universityId);
        throw error;
      });
    campusReads.set(universityId, read);
  }
  return campusReads.get(universityId);
}

export function mergeCampus(record, university, mock = null) {
  if (!record.id || record.universityId !== university.id || typeof record.name !== 'string' || typeof record.city !== 'string' || typeof record.state !== 'string') throw new Error('Registro de campus incompleto ou vinculado a outra universidade.');
  const {latitude, longitude} = record;
  const located = typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  return {
    id: record.id, universityId: university.id,
    name: record.name, label: record.name, city: record.city, state: record.state,
    latitude: located ? latitude : null, longitude: located ? longitude : null,
    coordinates: located ? [latitude, longitude] : null,
    acronym: university.acronym, public: university.public,
    courses: mock?.courses || [], mode: mock ? (mock.mode || university.mode) : null,
    admissionMethods: university.admissionMethods || [],
    dataSource: 'firestore',
  };
}

export async function getCampuses(universities, mocks = []) {
  if (!db) throw new Error('O Firebase não está configurado.');
  const mockIndex = new Map(mocks.map(campus => [`${campus.universityId}:${campus.id}`, campus]));
  const results = await Promise.all(universities.map(async university => {
    const records = await readUniversityCampuses(university.id);
    return records.map(record => mergeCampus(record, university, mockIndex.get(`${university.id}:${record.id}`)));
  }));
  return results.flat().sort((a,b) => `${a.acronym} ${a.name}`.localeCompare(`${b.acronym} ${b.name}`, 'pt-BR'));
}
