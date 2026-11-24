(() => {
  'use strict';
  const projectUrl = new URL('../../../', document.currentScript.src);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const logos = {
    usp: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Webysther_20160310_-_Logo_USP.svg',
    unifesp: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_Unifesp_quadrado.png',
    unicamp: 'https://images.seeklogo.com/logo-png/14/2/unicamp-logo-png_seeklogo-144966.png',
    faap: 'https://ief.com.br/wp-content/uploads/2022/09/estudar-na-faap.png',
    espm: 'https://www.espm.br/wp-content/uploads/2020/05/logo-espm.png',
    fiap: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Fiap-logo-novo.jpg',
    ufabc: 'https://s1.static.brasilescola.uol.com.br/be/vestibular/-59b2967595a55.jpg',
    insper: 'https://cdn.worldvectorlogo.com/logos/insper.svg',
    'puc-sp': 'https://www.pucsp.br/sites/default/files/download/iniciacao-cientifica/brasao-pucsp-assinatura-alternativa-RGB.png',
    unesp: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Logo_Unesp.svg',
    ufscar: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Ufscar-logo.png',
    mackenzie: 'https://upload.wikimedia.org/wikipedia/commons/7/71/UPM.2_horizontal_vermelho.png',
    univesp: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpFtZjEqTRuL1C2EFwBRtOjfiTTiyfxKX1yTyr4w5g9qiNzcsbFkb_7ufN&s=10',
  };
  const actionColors = ['blue', 'green', 'yellow'];
  const featuredColors = { usp: 'blue', unifesp: 'green', unicamp: 'yellow' };

  class UniversityCard extends HTMLElement {
    static get observedAttributes() { return ['university-id']; }
    async connectedCallback() {
      if (this.firstElementChild) return;
      await window.ToDentroUniversitiesReady;
      await window.ToDentroCoursesReady;
      if (this.isConnected && !this.firstElementChild) this.render();
    }
    async attributeChangedCallback() {
      if (!this.isConnected) return;
      await window.ToDentroUniversitiesReady;
      await window.ToDentroCoursesReady;
      if (this.isConnected) this.render();
    }

    render() {
      const index = window.ToDentroUniversities.findIndex(item => item.id === this.getAttribute('university-id'));
      const university = window.ToDentroUniversities[index];
      this.replaceChildren();
      if (!university) { this.hidden = true; return; }
      this.hidden = false;
      Object.assign(this.dataset, {
        name: university.name,
        search: `${university.acronym} ${university.name} ${university.city} ${university.courses.join(' ')}`,
        university: `${university.name} ${university.acronym} ${university.city} ${university.public ? 'Pública' : 'Particular'} ${university.mode} ${university.free ? 'Gratuita' : 'Com mensalidade'}`,
        city: university.city, state: university.state, public: String(university.public), free: String(university.free),
        mode: university.mode, courses: university.courses.map(normalize).join(','), period: university.periods.join(','),
        admission: (university.admissionMethods || []).join(','),
      });

      const link = document.createElement('a');
      link.className = 'university-card';
      const destination = new URL('src/pages/universidade.html', projectUrl);
      destination.searchParams.set('id', university.id);
      destination.searchParams.set('from', location.pathname + location.search);
      link.href = destination.href;
      link.setAttribute('aria-label', `Explorar ${university.acronym} · ${university.name}`);

      const info = document.createElement('div'); info.className = 'university-info';
      const logo = document.createElement('span'); logo.className = 'university-logo';
      logo.textContent = university.acronym; logo.setAttribute('aria-hidden', 'true');
      if (logos[university.id]) {
        const image = document.createElement('img');
        image.alt = '';
        image.loading = 'lazy';
        image.addEventListener('load', () => logo.replaceChildren(image), { once: true });
        logo.classList.add('university-logo-with-image');
        if (university.id !== 'unicamp') logo.classList.add('university-logo-wide');
        image.addEventListener('error', () => {
          image.remove();
          logo.classList.remove('university-logo-with-image', 'university-logo-wide');
        }, { once: true });
        image.src = logos[university.id];
        logo.append(image);
      }
      const text = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = university.name;
      const campusCities = new Set((window.ToDentroCampuses || [])
        .filter(campus => campus.universityId === university.id && campus.city)
        .map(campus => campus.city));
      const city = university.city || (campusCities.size === 1 ? [...campusCities][0] : '');
      const locationText = document.createElement('p'); locationText.textContent = [city, university.public ? 'Pública' : 'Privada'].filter(Boolean).join(' • ');
      text.append(title, locationText); info.append(logo, text);
      const action = document.createElement('span');
      const color = featuredColors[university.id] || actionColors[index % actionColors.length];
      action.className = `university-card-action university-card-action-${color}`;
      action.textContent = `Explorar ${university.acronym}`;
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      action.append(arrow);
      link.append(info, action);
      this.append(link);
    }
  }
  if (!customElements.get('td-university-card')) customElements.define('td-university-card', UniversityCard);
})();
