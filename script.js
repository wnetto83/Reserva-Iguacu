(() => {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.querySelector('.menu-toggle');
  const tocLinks = document.querySelectorAll('.toc a');
  const sections = document.querySelectorAll('.section[id]');
  const searchInput = document.getElementById('search');
  const body = document.body;

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const openMenu = () => {
    sidebar.classList.add('open');
    body.classList.add('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    sidebar.classList.remove('open');
    body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  };

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeMenu() : openMenu();
    });
  }

  // Fecha ao clicar em um link (mobile)
  tocLinks.forEach(a => {
    a.addEventListener('click', () => { if (isMobile()) closeMenu(); });
  });

  // Fecha ao clicar no backdrop (pseudo-elemento em body)
  document.addEventListener('click', (e) => {
    if (!isMobile() || !sidebar.classList.contains('open')) return;
    if (sidebar.contains(e.target) || menuToggle.contains(e.target)) return;
    closeMenu();
  });

  // ESC fecha o menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeMenu();
  });

  // Scrollspy
  const linkMap = new Map();
  tocLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    linkMap.set(id, a);
  });
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        linkMap.get(e.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));

  // Busca
  const debounce = (fn, ms = 180) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  const clearHits = (root) => {
    root.querySelectorAll('mark.search-hit').forEach(m => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
  };

  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlight = (node, re) => {
    if (node.nodeType === 3) {
      const text = node.nodeValue;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const mk = document.createElement('mark');
        mk.className = 'search-hit';
        mk.textContent = m[0];
        frag.appendChild(mk);
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !['SCRIPT','STYLE','MARK','INPUT','TEXTAREA'].includes(node.tagName)) {
      Array.from(node.childNodes).forEach(c => highlight(c, re));
    }
  };

  const runSearch = (q) => {
    const content = document.querySelector('.content');
    clearHits(content);
    const term = q.trim().toLowerCase();

    sections.forEach(s => s.classList.remove('hidden-by-search'));
    document.querySelectorAll('.section details').forEach(d => d.classList.remove('hidden-by-search'));

    if (!term) return;

    const re = new RegExp(escRe(term), 'gi');

    sections.forEach(section => {
      const text = section.innerText.toLowerCase();
      if (!text.includes(term)) {
        section.classList.add('hidden-by-search');
        return;
      }
      section.querySelectorAll('details').forEach(d => {
        const dText = d.innerText.toLowerCase();
        if (dText.includes(term)) d.open = true;
        else d.classList.add('hidden-by-search');
      });
      highlight(section, re);
    });
  };

  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => runSearch(e.target.value), 180));
  }
})();
