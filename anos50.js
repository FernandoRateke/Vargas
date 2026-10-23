(function () {
  'use strict';
  const photos = window.FOTOS_ANOS50 || [];
  const cards = Array.from(document.querySelectorAll('.photo-card'));
  let visible = photos.slice();
  let active = 0;
  let opener = null;
  const dialog = document.getElementById('photo-dialog');
  const full = document.getElementById('photo-full');
  function show(photo) {
    active = visible.findIndex(item => item.id === photo.id);
    if (active < 0) { visible = photos.slice(); active = photos.indexOf(photo); }
    full.src = photo.src;
    full.alt = photo.description;
    document.getElementById('photo-title').textContent = photo.title;
    document.getElementById('photo-date').textContent = photo.category + ' · ' + photo.date;
    document.getElementById('photo-description').textContent = photo.description;
    document.getElementById('photo-credit').textContent = photo.credit + '. ' + photo.license;
    document.getElementById('photo-source').href = photo.source;
    document.getElementById('photo-position').textContent = (active + 1) + ' / ' + visible.length;
    if (!dialog.open) dialog.showModal();
  }
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const photo = photos.find(item => item.id === button.dataset.photo);
      if (photo) show(photo);
    });
  });
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach(card => { card.hidden = category !== 'Todas' && card.dataset.category !== category; });
      visible = photos.filter(photo => category === 'Todas' || photo.category === category);
      document.querySelector('.gallery-count').textContent = visible.length + (visible.length === 1 ? ' fotografia' : ' fotografias');
      document.querySelector('.photo-grid').dispatchEvent(new Event('galleryfilter'));
    });
  });
  function move(direction) { show(visible[(active + direction + visible.length) % visible.length]); }
  document.getElementById('photo-prev').addEventListener('click', () => move(-1));
  document.getElementById('photo-next').addEventListener('click', () => move(1));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { if (opener) opener.focus({ preventScroll: true }); });
})();

/* Scroll-driven photographic gallery, matching the Vargas perspective. */
(function () {
  'use strict';
  const rail = document.querySelector('.photo-grid');
  if (!rail) return;
  const cards = Array.from(rail.children);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let path, stage, counter, frame = 0, target = 0, current = 0, step = 1, width = 0, height = 0, lastActive = -1;
  let shown = cards;
  function draw() {
    frame = 0;
    if (!path) return;
    current += (target - current) * .14;
    if (Math.abs(target - current) < .0008) current = target;
    const active = Math.round(current);
    shown.forEach((card, i) => {
      const d = i - current, away = Math.abs(d);
      const x = d * Math.min(width * .8, 680);
      const y = -d * height * (width < 760 ? .04 : .08);
      const z = -away * 240;
      card.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${clamp(-d * 26, -48, 48)}deg)`;
      card.style.opacity = String(away < 1.6 ? 1 : Math.max(0, 1 - (away - 1.6) * .75));
      card.style.visibility = away > 3.2 ? 'hidden' : 'visible';
      card.style.zIndex = String(100 - Math.round(away * 10));
      card.querySelectorAll('button,a').forEach(el => { el.tabIndex = i === active ? 0 : -1; });
    });
    if (active !== lastActive) {
      const title = shown[active]?.querySelector('h3')?.textContent || '';
      counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(shown.length).padStart(2, '0')} · ${title}`;
      lastActive = active;
    }
    if (current !== target) frame = requestAnimationFrame(draw);
  }
  function update() {
    if (!path) return;
    target = clamp(-path.getBoundingClientRect().top / step, 0, shown.length - 1);
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    if (!path) return;
    width = innerWidth; height = stage.offsetHeight; step = Math.max(1, height * .8);
    const imageHeight = Math.max(110, Math.min(height * .43, height - 340));
    stage.style.setProperty('--album-width', Math.min(width * .78, height * .68, 560) + 'px');
    stage.style.setProperty('--album-image-height', imageHeight + 'px');
    path.style.height = height + step * Math.max(0, shown.length - 1) + 'px';
    update();
  }
  function go(index, focus) {
    index = clamp(index, 0, shown.length - 1);
    window.scrollTo({ top: path.getBoundingClientRect().top + scrollY + index * step, behavior: 'instant' });
    current = target = index; lastActive = -1; draw();
    if (focus) shown[index].querySelector('button').focus({ preventScroll: true });
  }
  function setup() {
    if (reduced.matches) {
      if (!path) return;
      cancelAnimationFrame(frame); frame = 0;
      path.before(rail); path.remove(); path = stage = null;
      cards.forEach(card => { card.removeAttribute('style'); card.querySelectorAll('button,a').forEach(el => el.removeAttribute('tabindex')); });
      return;
    }
    if (path) return;
    path = document.createElement('div'); path.className = 'album-path';
    stage = document.createElement('div'); stage.className = 'album-stage';
    const controls = document.createElement('div'); controls.className = 'album-controls';
    const prev = document.createElement('button'); prev.textContent = '← Anterior'; prev.setAttribute('aria-label', 'Fotografia anterior na galeria');
    const next = document.createElement('button'); next.textContent = 'Próxima →'; next.setAttribute('aria-label', 'Próxima fotografia na galeria');
    counter = document.createElement('p'); counter.className = 'album-progress'; counter.setAttribute('role', 'status');
    controls.append(prev, counter, next);
    const hint = document.createElement('p'); hint.className = 'album-hint'; hint.textContent = 'Continue descendo para percorrer o álbum ↓';
    rail.before(path); path.append(stage); stage.append(hint, rail, controls);
    prev.addEventListener('click', () => go(Math.round(current) - 1));
    next.addEventListener('click', () => go(Math.round(current) + 1));
    lastActive = -1; measure();
  }
  rail.addEventListener('galleryfilter', () => {
    shown = cards.filter(card => !card.hidden);
    current = target = 0; lastActive = -1;
    cards.forEach(card => card.removeAttribute('style'));
    measure();
  });
  // Avoid browser focus scrolling an angled card away before its click.
  rail.addEventListener('mousedown', event => {
    const button = event.target.closest('button[data-photo]');
    if (!path || !button || event.button !== 0) return;
    event.preventDefault(); button.focus({ preventScroll: true }); button.click();
  });
  rail.addEventListener('keydown', event => {
    if (!path || event.altKey || event.ctrlKey || event.metaKey) return;
    const card = event.target.closest('.photo-card');
    if (!card) return;
    let index = shown.indexOf(card);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index++;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index--;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = shown.length - 1;
    else return;
    event.preventDefault(); go(index, true);
  });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure, { once: true });
  reduced.addEventListener('change', setup);
  setup();
})();

/* Playback from the original collection, dated circa 1959. */
(function () {
  const toggle = document.getElementById('radio-toggle');
  const status = document.getElementById('radio-status');
  if (!toggle) return;
  let player = null, ready = false, started = false, apiPromise;
  toggle.hidden = false;
  document.querySelector('.radio-seek').hidden = false;
  function fail() {
    status.textContent = 'Abra o registro no canal do IPB para ouvir.';
    toggle.textContent = '▶ Tentar novamente';
    document.querySelector('.radio-set').classList.remove('radio-playing');
  }
  function loadApi() {
    if (window.YT?.Player) return Promise.resolve();
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const oldReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (oldReady) oldReady(); resolve(); };
      const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = reject; document.head.append(script);
    });
    return apiPromise;
  }
  toggle.addEventListener('click', async () => {
    if (ready) {
      if (player.getPlayerState() === 1) player.pauseVideo(); else player.playVideo();
      return;
    }
    if (started) return;
    started = true; status.textContent = 'Carregando gravação de c. 1959…';
    try {
      await loadApi();
      document.querySelector('.radio-placeholder')?.remove();
      player = new YT.Player('radio-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: 'pqI4At0XFNc',
        playerVars: { origin: location.origin, playsinline: 1, rel: 0 },
        events: {
          onReady: event => { ready = true; event.target.playVideo(); },
          onStateChange: event => {
            const playing = event.data === 1;
            document.querySelector('.radio-set').classList.toggle('radio-playing', playing);
            toggle.textContent = playing ? 'Ⅱ Pausar o rádio' : '▶ Ligar o rádio';
            status.textContent = playing ? 'Baden Powell · c. 1959' : event.data === 0 ? 'Gravação concluída' : 'Use ▶ no player para ouvir';
          },
          onError: fail
        }
      });
    } catch (error) { started = false; fail(); }
  });
  function seek(delta) {
    if (ready) player.seekTo(Math.max(0, Math.min(player.getDuration(), player.getCurrentTime() + delta)), true);
  }
  document.getElementById('radio-back').addEventListener('click', () => seek(-10));
  document.getElementById('radio-forward').addEventListener('click', () => seek(10));
})();
