(() => {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.querySelector('.menu-toggle');
  const tocLinks = document.querySelectorAll('.toc a');
  const sections = document.querySelectorAll('.section[id]');
  const searchInput = document.getElementById('search');

  // Mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Close menu on nav click (mobile)
  tocLinks.forEach(a => {
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 900px)').matches) {
        sidebar.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
      }
    });
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
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));

  // Search
  const debounce = (fn, ms = 150) => {
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

  const highlight = (node, re) => {
    if (node.nodeType === 3) {
      const text = node.nodeValue;
      if (!re.test(text)) return;
      const frag = document.createDocumentFragment();
      let last = 0;
      text.replace(re, (m, ...args) => {
        const offset = args[args.length - 2];
        if (offset > last) frag.appendChild(document.createTextNode(text.slice(last, offset)));
        const mark = document.createElement('mark');
        mark.className = 'search-hit';
        mark.textContent = m;
        frag.appendChild(mark);
        last = offset + m.length;
      });
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !['SCRIPT','STYLE','MARK'].includes(node.tagName)) {
      Array.from(node.childNodes).forEach(c => highlight(c, re));
    }
  };

  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const runSearch = (q) => {
    const content = document.querySelector('.content');
    clearHits(content);
    const term = q.trim().toLowerCase();

    sections.forEach(s => s.classList.remove('hidden-by-search'));
    // also reset details inside
    document.querySelectorAll('.section details').forEach(d => d.classList.remove('hidden-by-search'));

    if (!term) return;

    const re = new RegExp(escRe(term), 'gi');

    sections.forEach(section => {
      const text = section.innerText.toLowerCase();
      if (!text.includes(term)) {
        section.classList.add('hidden-by-search');
        return;
      }
      // Open all details to reveal matches
      section.querySelectorAll('details').forEach(d => {
        const dText = d.innerText.toLowerCase();
        if (dText.includes(term)) {
          d.open = true;
        } else {
          d.classList.add('hidden-by-search');
        }
      });
      highlight(section, re);
    });
  };

  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => runSearch(e.target.value), 200));
  }
})();
