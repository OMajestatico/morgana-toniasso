(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  if (window.lucide) lucide.createIcons();
  $('#year').textContent = new Date().getFullYear();

  const topbar = $('#topbar');
  const backToTop = $('#backToTop');
  const onScroll = () => {
    const y = window.scrollY;
    topbar.classList.toggle('scrolled', y > 30);
    backToTop.classList.toggle('visible', y > 650);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Menu móvel: congela exatamente o ponto atual e restaura sem animação/salto.
  const menu = $('#mobileMenu');
  const menuToggle = $('#menuToggle');
  const menuClose = $('#menuClose');
  let frozenScrollY = 0;

  function openMenu() {
    frozenScrollY = window.scrollY;
    document.body.style.top = `-${frozenScrollY}px`;
    document.body.classList.add('menu-open');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu({ navigate = false } = {}) {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';

    if (!navigate) {
      const oldBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, frozenScrollY);
      requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = oldBehavior; });
    }
  }

  menuToggle.addEventListener('click', openMenu);
  menuClose.addEventListener('click', () => closeMenu());
  menu.addEventListener('click', (e) => {
    if (e.target === menu) closeMenu();
  });
  $$('#mobileMenu nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      const oldBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, frozenScrollY);
      requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = oldBehavior;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Entrada suave das seções.
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -30px' });
  $$('.reveal').forEach(el => {
    if (el.dataset.delay) el.style.setProperty('--delay', `${el.dataset.delay}ms`);
    io.observe(el);
  });

  // Leve efeito 3D apenas onde há mouse de precisão. No celular ele fica quieto e civilizado.
  const tiltCard = $('#tiltCard');
  if (tiltCard && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    tiltCard.addEventListener('mousemove', e => {
      const r = tiltCard.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      tiltCard.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 7}deg) translateY(-3px)`;
    });
    tiltCard.addEventListener('mouseleave', () => { tiltCard.style.transform = ''; });
  }

  // Carrosséis nativos: gesto acompanha o dedo, snap de um item, sem bloquear o scroll vertical.
  const carousels = {};
  $$('[data-carousel]').forEach(carousel => {
    const name = carousel.dataset.carousel;
    const track = $('.carousel-track', carousel);
    const slides = [...track.children];
    const dotsWrap = document.querySelector(`[data-dots="${name}"]`);
    if (!track || !slides.length || !dotsWrap) return;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir para item ${i + 1}`);
      dot.addEventListener('click', () => scrollToIndex(i));
      dotsWrap.appendChild(dot);
      return dot;
    });

    let index = 0;
    const slideStep = () => {
      if (slides.length < 2) return slides[0].getBoundingClientRect().width;
      return slides[1].offsetLeft - slides[0].offsetLeft;
    };
    const setIndex = i => {
      index = Math.max(0, Math.min(slides.length - 1, i));
      dots.forEach((dot, n) => dot.classList.toggle('active', n === index));
    };
    const scrollToIndex = i => {
      setIndex(i);
      track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };

    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const step = slideStep() || 1;
        setIndex(Math.round(track.scrollLeft / step));
        ticking = false;
      });
    }, { passive: true });

    carousels[name] = { next: () => scrollToIndex(index + 1), prev: () => scrollToIndex(index - 1) };
  });

  $$('[data-carousel-next]').forEach(btn => btn.addEventListener('click', () => carousels[btn.dataset.carouselNext]?.next()));
  $$('[data-carousel-prev]').forEach(btn => btn.addEventListener('click', () => carousels[btn.dataset.carouselPrev]?.prev()));

  // Impede arraste fantasma de imagens e links em mobile, sem interferir no gesto do carrossel.
  $$('img').forEach(img => img.addEventListener('dragstart', e => e.preventDefault()));
})();
