window.ToDentroCourseCatalog = window.ToDentroData.views.courseCatalog;

if (typeof document !== 'undefined' && document.currentScript) {
  const root = new URL('../../', document.currentScript.src);
  const temporaryErrors = new Set(['unavailable', 'deadline-exceeded']);

  async function readAcademics(getAcademics, universities) {
    try {
      return await getAcademics(universities);
    } catch (error) {
      if (!temporaryErrors.has(error.code)) throw error;
      await new Promise(resolve => setTimeout(resolve, 800));
      return getAcademics(universities);
    }
  }

  window.ToDentroCoursesReady = (async () => {
    const localCourses = await import('./private-courses.js');
    const universitiesReady = window.ToDentroUniversitiesReady ? await window.ToDentroUniversitiesReady : true;
    const universities = localCourses.addPrivateUniversities(window.ToDentroUniversities || window.ToDentroData.views.universities);
    const apply = records => {
      window.ToDentroData.applyUniversities(universities);
      window.ToDentroData.applyAcademics(localCourses.addPrivateCourses(records, universities, window.ToDentroData));
      window.ToDentroCourseCatalog = window.ToDentroData.views.courseCatalog;
      window.ToDentroUniversities = window.ToDentroData.views.universities;
    };
    if (!universitiesReady) {
      window.ToDentroCoursesError = window.ToDentroUniversitiesError;
      apply([]);
      return false;
    }
    try {
      const service = await import(new URL('services/academics.js', root).href);
      const records = await readAcademics(service.getAcademics, universities);
      apply(records);
      return true;
    } catch (error) {
      apply([]);
      window.ToDentroCoursesError = error;
      const notice = document.createElement('p');
      notice.setAttribute('role', 'alert');
      const reason = error.code === 'permission-denied'
        ? 'O Firebase bloqueou o acesso a cursos e notas.'
        : temporaryErrors.has(error.code)
          ? 'Não foi possível conectar ao Firebase para carregar cursos e notas.'
          : 'Não foi possível carregar cursos e notas do Firebase.';
      notice.textContent = `${reason} Exibindo os dados locais disponíveis. Recarregue para tentar novamente.`;
      document.querySelector('main')?.prepend(notice);
      return false;
    }
  })();
}
