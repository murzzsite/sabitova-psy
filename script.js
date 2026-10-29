(() => {
  // ===== CONFIG =====
  const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/AJZ3SKZ29B';

  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sticky header
  const header = document.getElementById('header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  // ===== DUO: two circles, the gap between them =====
  const setGap = (svg, d) => {
    const cx = 170 + d;
    svg.querySelectorAll('.duo__b, .duo__lens').forEach(c => {
      c.setAttribute('cx', cx);
      c.style.cx = cx + 'px';
    });
  };
  document.querySelectorAll('[data-duo]').forEach(svg => {
    const d = Number(svg.dataset.gap);
    if (reduce || !svg.classList.contains('duo--test')) {
      // the hero pair slides together once on load
      if (!reduce && !svg.classList.contains('duo--test')) {
        setGap(svg, 300);
        requestAnimationFrame(() => requestAnimationFrame(() => setGap(svg, d)));
      } else setGap(svg, d);
    } else setGap(svg, d);
  });

  // ===== FORM SUBMIT → CLOUDFLARE WORKER → TELEGRAM =====
  const form = document.getElementById('leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;

    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });

    if (payload._gotcha) return;

    if (!payload.name || (!payload.phone && !payload.contact)) {
      alert('Заполните имя и контактные данные');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });

  // Smooth scroll with header offset
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ===== REVEAL: parts of each section enter one after another =====
  const groups = [
    '.hero h1, .hero .lead, .hero__actions, .hero__art',
    '.asks h2, .asks__list li',
    '.method .pic, .method__body > *, .found > div',
    '.lens__text > *, .lens__fig > *',
    '.test__main > *, .test__paths > div',
    '.prices__head > *, .tracks > div, .plist li, .plist__note, .diag',
    '.formats__title, .fmt, .group article',
    '.process h2, .steps li',
    '.faq h2, .faq__item',
    '.contact__text > *, .form'
  ];
  const show = el => {
    if (!reduce && el.animate) {
      el.style.willChange = 'transform, opacity';
      const a = el.animate(
        [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }],
        { duration: 720, delay: parseInt(el.dataset.d || '0', 10), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }
      );
      a.onfinish = () => { el.style.willChange = ''; };
    }
    el.classList.add('is-visible');
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  groups.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.dataset.d = Math.min(i, 5) * 70;
      io.observe(el);
    });
  });

  // slow drift of the dance picture while scrolling
  const drift = null;
  if (drift && !reduce) {
    const tick = () => {
      const r = drift.parentElement.getBoundingClientRect();
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
      drift.style.transform = 'scale(1.12) translateY(' + (p * -28).toFixed(1) + 'px)';
    };
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }
})();
