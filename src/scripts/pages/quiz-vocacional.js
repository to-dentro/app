(async () => {
  'use strict';
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;

  const { questions, multiple, isComplete, draftKey, readAnswers } = window.ToDentroVocational;
  const key = draftKey();
  const restart = new URLSearchParams(location.search).get('reiniciar') === '1';
  const answers = restart ? [] : readAnswers() || [];
  if (restart) {
    try { sessionStorage.setItem(key, '[]'); } catch { /* Reinicia as respostas na tela. */ }
    history.replaceState(null, '', location.pathname);
  }

  const form = document.querySelector('#quiz-form');
  const options = form.querySelector('.quiz-options');
  const title = form.querySelector('.quiz-question h2');
  const legend = form.querySelector('legend');
  const description = form.querySelector('#question-description');
  const guidance = document.querySelector('.quiz-guidance p');
  const headerBack = document.querySelector('.quiz-header a');
  const submit = form.querySelector('button[type="submit"]');
  const error = document.querySelector('#quiz-error');
  const progress = document.querySelector('.quiz-progress');
  const nextUnanswered = questions.findIndex((_, index) => !isComplete(index, answers[index]));
  let current = nextUnanswered === -1 ? questions.length - 1 : nextUnanswered;

  function updateProgress() {
    const completed = questions.filter((_, index) => isComplete(index, answers[index])).length;
    progress.setAttribute('aria-valuenow', completed);
    progress.setAttribute('aria-valuetext', `Pergunta ${current + 1} de ${questions.length}. ${completed} respondidas.`);
    progress.firstElementChild.style.width = `${completed / questions.length * 100}%`;
  }

  function render() {
    const question = questions[current];
    const freeText = current === questions.length - 1;
    const allowMultiple = multiple(current);
    title.textContent = question.title;
    legend.textContent = question.title;
    headerBack.setAttribute('aria-label', current ? 'Pergunta anterior' : 'Retornar à apresentação do teste');
    guidance.textContent = `Pergunta ${current + 1} de ${questions.length}`;
    description.textContent = freeText
      ? 'Resposta opcional (até 200 caracteres). Não inclua dados pessoais.'
      : allowMultiple ? 'Selecione até três opções.' : 'Selecione uma opção para continuar.';
    submit.textContent = freeText ? 'Ver resultado' : 'Próxima pergunta';
    error.hidden = true;
    options.replaceChildren();

    if (freeText) {
      const input = document.createElement('textarea');
      input.maxLength = 200;
      input.rows = 3;
      input.className = 'quiz-option quiz-text';
      input.setAttribute('aria-label', question.title);
      input.setAttribute('aria-describedby', 'question-description');
      input.value = typeof answers[current] === 'string' ? answers[current] : '';
      options.append(input);
    } else {
      question.options.forEach((text, index) => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        const input = document.createElement('input');
        input.name = 'resposta';
        input.type = allowMultiple ? 'checkbox' : 'radio';
        input.value = index;
        input.checked = allowMultiple ? Array.isArray(answers[current]) && answers[current].includes(index) : answers[current] === index;
        const caption = document.createElement('span');
        caption.textContent = text;
        label.append(input, caption);
        options.append(label);
      });
    }
    updateProgress();
  }

  function saveAnswer() {
    const input = options.querySelector('textarea');
    const selected = [...options.querySelectorAll('input:checked')].map(choice => Number(choice.value));
    answers[current] = input ? input.value : multiple(current) ? selected : selected[0];
    updateProgress();
    try {
      sessionStorage.setItem(key, JSON.stringify(answers));
      return true;
    } catch {
      return false;
    }
  }

  function showQuestion() {
    render();
    title.focus();
    window.scrollTo(0, 0);
  }

  form.addEventListener('input', event => {
    error.hidden = true;
    options.querySelectorAll('[aria-invalid]').forEach(option => option.removeAttribute('aria-invalid'));
    if (multiple(current) && options.querySelectorAll('input:checked').length > 3) {
      event.target.checked = false;
      error.textContent = 'Selecione até três opções.';
      error.hidden = false;
      return;
    }
    saveAnswer();
  });

  document.querySelectorAll('.quiz-back, .quiz-header a').forEach(link => {
    link.addEventListener('click', event => {
      if (current === 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      current--;
      showQuestion();
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const saved = saveAnswer();
    if (!isComplete(current, answers[current])) {
      error.textContent = multiple(current) ? 'Selecione de uma a três opções para continuar.' : 'Selecione uma opção para continuar.';
      error.hidden = false;
      options.querySelectorAll('input').forEach(option => option.setAttribute('aria-invalid', 'true'));
      options.querySelector('input, textarea').focus();
      return;
    }

    if (current < questions.length - 1) {
      current++;
      showQuestion();
    } else if (saved) {
      location.assign('./resultado-vocacional.html');
    } else {
      error.textContent = 'Não foi possível abrir o resultado. Permita o armazenamento neste navegador e tente novamente.';
      error.hidden = false;
    }
  });

  render();
})();
