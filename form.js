(() => {
  const WEBHOOK = 'https://n8n.camilakammers.com.br/webhook/sugestoes-reclamacoes-reserva-iguacu';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const progressBar = document.querySelector('.form-progress-bar');
  const TOTAL_STEPS = 5; // welcome + 4 perguntas (0..4)

  let current = 0;

  const data = { nome: '', tipo: '', telefone: '', mensagem: '' };

  const goTo = (idx) => {
    if (idx === current) return;
    const prev = slides[current];
    const next = slides[idx];
    prev.classList.add('leaving');
    prev.classList.remove('active');
    setTimeout(() => prev.classList.remove('leaving'), 350);

    next.classList.add('active');
    current = idx;
    updateProgress();
    focusSlide(next);
  };

  const focusSlide = (slide) => {
    const el = slide.querySelector('input:not([type=radio]), textarea, button.btn-primary, .choice input');
    setTimeout(() => el?.focus({ preventScroll: true }), 360);
  };

  const updateProgress = () => {
    const pct = current <= TOTAL_STEPS ? (current / TOTAL_STEPS) * 100 : 100;
    progressBar.style.width = pct + '%';
  };

  // Escolhas (radios)
  const choices = document.querySelectorAll('.choice');
  const choiceBtnOk = slides[2].querySelector('button[data-action="next"]');
  choices.forEach(ch => {
    ch.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return; // evita loop
      const input = ch.querySelector('input');
      input.checked = true;
      choices.forEach(c => c.classList.remove('selected'));
      ch.classList.add('selected');
      data.tipo = input.value;
      choiceBtnOk.disabled = false;
    });
  });

  // Atalhos A/B/C
  document.addEventListener('keydown', (e) => {
    if (current !== 2) return;
    const map = { a: 0, b: 1, c: 2, A: 0, B: 1, C: 2 };
    if (e.key in map) {
      choices[map[e.key]].click();
    }
  });

  // Validação e avanço
  const validateCurrent = () => {
    if (current === 1) {
      data.nome = document.getElementById('f-nome').value.trim();
      return true;
    }
    if (current === 2) {
      if (!data.tipo) {
        showError(slides[2], 'Por favor, selecione uma opção.');
        return false;
      }
      return true;
    }
    if (current === 3) {
      data.telefone = document.getElementById('f-tel').value.trim();
      return true;
    }
    if (current === 4) {
      const v = document.getElementById('f-msg').value.trim();
      if (!v) {
        showError(slides[4], 'Por favor, escreva sua mensagem.');
        return false;
      }
      data.mensagem = v;
      return true;
    }
    return true;
  };

  const showError = (slide, msg) => {
    const el = slide.querySelector('.error-msg');
    if (el) {
      el.textContent = msg;
      setTimeout(() => { el.textContent = ''; }, 3000);
    }
  };

  // Ações
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'next') {
      if (!validateCurrent()) return;
      goTo(current + 1);
    } else if (action === 'submit') {
      if (!validateCurrent()) return;
      submit();
    } else if (action === 'retry') {
      submit();
    }
  });

  // Enter avança
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    // Enter no textarea só com Shift
    if (e.target.tagName === 'TEXTAREA' && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const active = slides[current];
    const primary = active.querySelector('button[data-action]:not([disabled])');
    primary?.click();
  });

  // Envio via POST (JSON)
  const submit = async () => {
    goTo(5); // tela de carregando
    const payload = {
      nome: data.nome || null,
      tipo: data.tipo,
      telefone: data.telefone || null,
      mensagem: data.mensagem,
      origem: 'site-reserva-iguacu',
      enviado_em: new Date().toISOString(),
      user_agent: navigator.userAgent,
    };
    try {
      const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('status ' + res.status);
      goTo(6);
    } catch (err) {
      console.error('Falha no envio:', err);
      goTo(7);
    }
  };

  updateProgress();
})();
