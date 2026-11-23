export const preferenceOptions = Object.freeze({
  institutionTypes: { publica: 'Pública', privada: 'Privada' },
  modeIds: { presencial: 'Presencial', ead: 'A distância', hibrida: 'Híbrida' },
  periodIds: { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral' },
  admissionMethodIds: { sisu: 'Sisu', enem: 'Enem', prouni: 'ProUni', vestibular: 'Vestibular próprio' },
});

export function normalizePreferences(input = {}) {
  const list = key => [...new Set(Array.isArray(input[key]) ? input[key].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()) : [])];
  const selected = key => list(key).filter(value => Object.hasOwn(preferenceOptions[key], value));
  const ids = key => list(key).filter(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)).slice(0, 50);
  const discoveringCourses = input.discoveringCourses === true;
  return {
    institutionTypes: selected('institutionTypes'), cityIds: ids('cityIds'),
    modeIds: selected('modeIds'), periodIds: selected('periodIds'),
    courseIds: discoveringCourses ? [] : ids('courseIds'), areaIds: ids('areaIds'),
    admissionMethodIds: selected('admissionMethodIds'), discoveringCourses,
  };
}

export function signupPreferences({ institutionType, cityIds, modeIds, periodIds, courseIds, discoveringCourses }) {
  return normalizePreferences({ institutionTypes: institutionType === 'todas' ? [] : [institutionType], cityIds, modeIds, periodIds, courseIds, discoveringCourses });
}

export function preferencesToFilters(input, catalog) {
  const preferences = normalizePreferences(input);
  const params = new URLSearchParams();
  const append = (name, values) => { if (!values.length) params.set(name, ''); else values.forEach(value => params.append(name, value)); };
  append('city', preferences.cityIds);
  append('type', preferences.institutionTypes.map(value => value === 'privada' ? 'particular' : value));
  append('mode', preferences.modeIds);
  append('period', preferences.periodIds);
  append('admission', preferences.admissionMethodIds);
  append('course', preferences.courseIds.map(id => catalog.getCourse(id)?.value).filter(Boolean));
  append('area', preferences.areaIds);
  return params;
}
