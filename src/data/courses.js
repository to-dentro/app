window.ToDentroCourseCatalog = window.ToDentroData.views.courseCatalog;

if (typeof document !== 'undefined' && document.currentScript) {
  const root = new URL('../../', document.currentScript.src);
  const temporaryErrors = new Set(['unavailable', 'deadline-exceeded']);

  async function readAcademics(getAcademics) {
    try {
      return await getAcademics(window.ToDentroUniversities);
    } catch (error) {
      if (!temporaryErrors.has(error.code)) throw error;
      await new Promise(resolve => setTimeout(resolve, 800));
      return getAcademics(window.ToDentroUniversities);
    }
  }

  window.ToDentroCoursesReady = (async () => {
    if (window.ToDentroUniversitiesReady && !await window.ToDentroUniversitiesReady) {
      window.ToDentroCoursesError = window.ToDentroUniversitiesError;
      return false;
    }
    try {
      const service = await import(new URL('services/academics.js', root).href);
      const records = await readAcademics(service.getAcademics);
      window.ToDentroData.applyAcademics(records);
      window.ToDentroCourseCatalog = window.ToDentroData.views.courseCatalog;
      window.ToDentroUniversities = window.ToDentroData.views.universities;
      return true;
    } catch (error) {
      window.ToDentroCoursesError = error;
      const notice = document.createElement('p');
      notice.setAttribute('role', 'alert');
      const reason = error.code === 'permission-denied'
        ? 'O Firebase bloqueou o acesso a cursos e notas.'
        : temporaryErrors.has(error.code)
          ? 'Não foi possível conectar ao Firebase para carregar cursos e notas.'
          : 'Não foi possível carregar cursos e notas do Firebase.';
      notice.textContent = `${reason} Exibindo os dados de demonstração. Recarregue para tentar novamente.`;
      document.querySelector('main')?.prepend(notice);
      return false;
    }
  })();
}
