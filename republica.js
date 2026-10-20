/* Progressive enhancement: the full chapter and native audio work without JS. */
(function () {
  'use strict';
  const dialog = document.getElementById('governo-dialog');
  const originals = new Map(Array.from(document.querySelectorAll('.republica-fichas .governo-ficha'), el => [el.id, el]));
  let returnHash = '#republica';
  let opener = null;
  let closingFromRoute = false;
  if (dialog && typeof dialog.showModal === 'function') {
    const body = document.getElementById('governo-dialog-corpo');
    const close = dialog.querySelector('[data-fechar-governo]');
    function show(id) {
      const original = originals.get(id);
      if (!original) return;
      const copy = original.cloneNode(true);
      copy.removeAttribute('id');
      copy.removeAttribute('aria-labelledby');
      copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      body.replaceChildren(copy);
      document.getElementById('governo-dialog-titulo').textContent = original.querySelector('h3').textContent + ' · ficha histórica';
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      close.focus({ preventScroll: true });
    }
    function route() {
      const id = location.hash.slice(1);
      if (originals.has(id)) show(id);
      else if (dialog.open) {
        closingFromRoute = true;
        dialog.close();
      }
    }
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const hash = link.getAttribute('href');
      if (originals.has(hash.slice(1))) {
        event.preventDefault();
        if (!dialog.open) {
          returnHash = location.hash && !originals.has(location.hash.slice(1)) ? location.hash : '#republica';
          opener = link;
        }
        if (location.hash !== hash) history.pushState(null, '', hash);
        show(hash.slice(1));
      } else if (dialog.open) {
        closingFromRoute = true;
        dialog.close();
      }
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (!closingFromRoute && originals.has(location.hash.slice(1))) history.replaceState(null, '', returnHash);
      closingFromRoute = false;
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    });
    window.addEventListener('hashchange', route);
    window.addEventListener('popstate', route);
    document.querySelector('.republica-fichas').hidden = true;
    route();
  }

  const audios = Array.from(document.querySelectorAll('.disco-bloco audio'));
  function format(time) {
    const secs = Math.max(0, Math.floor(Number.isFinite(time) ? time : 0));
    return Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  }
  audios.forEach(audio => {
    const block = audio.closest('.disco-bloco');
    const disc = block.querySelector('.disco');
    const title = block.querySelector('h3').textContent;
    const clock = block.querySelector('[data-tempo]');
    const controls = block.querySelector('.audio-controles');
    const range = controls.querySelector('input');
    const back = controls.querySelector('[data-salto="-10"]');
    const forward = controls.querySelector('[data-salto="10"]');
    const error = block.querySelector('.audio-erro');
    const segments = Array.from(block.querySelectorAll('[data-inicio]'));
    function sync() {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      range.disabled = !duration;
      back.disabled = !duration;
      forward.disabled = !duration;
      if (duration) range.max = String(duration);
      range.value = String(audio.currentTime);
      range.setAttribute('aria-valuetext', format(audio.currentTime) + ' de ' + format(duration || 100));
      clock.textContent = format(audio.currentTime) + ' / ' + format(duration || 100);
      segments.forEach((segment, i) => {
        const active = audio.currentTime >= Number(segment.dataset.inicio) && (!segments[i + 1] || audio.currentTime < Number(segments[i + 1].dataset.inicio));
        segment.dataset.ativo = String(active);
      });
    }
    function seek(time) {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(audio.duration, Math.max(0, time));
      sync();
    }
    function fail() { error.hidden = false; error.textContent = 'Não foi possível reproduzir o áudio. Tente novamente ou leia a transcrição abaixo.'; }
    disc.setAttribute('aria-pressed', 'false');
    disc.addEventListener('click', () => {
      if (!audio.paused) { audio.pause(); return; }
      audios.forEach(other => { if (other !== audio) other.pause(); });
      error.hidden = true;
      if (audio.ended) seek(0);
      const promise = audio.play();
      if (promise) promise.catch(fail);
    });
    audio.addEventListener('play', () => {
      audios.forEach(other => { if (other !== audio) other.pause(); });
      disc.classList.add('tocando');
      disc.setAttribute('aria-pressed', 'true');
      disc.setAttribute('aria-label', 'Pausar: ' + title);
    });
    function paused() {
      disc.classList.remove('tocando');
      disc.setAttribute('aria-pressed', 'false');
      disc.setAttribute('aria-label', 'Tocar: ' + title);
    }
    audio.addEventListener('pause', paused);
    audio.addEventListener('ended', paused);
    audio.addEventListener('error', fail);
    ['timeupdate', 'loadedmetadata', 'durationchange', 'seeked'].forEach(type => audio.addEventListener(type, sync));
    range.addEventListener('input', () => seek(Number(range.value)));
    back.addEventListener('click', () => seek(audio.currentTime - 10));
    forward.addEventListener('click', () => seek(audio.currentTime + 10));
    block.querySelectorAll('.audio-marca').forEach(button => {
      button.addEventListener('click', () => {
        const position = Number(button.dataset.tempo);
        if (Number.isFinite(audio.duration)) seek(position);
        else { audio.addEventListener('loadedmetadata', () => seek(position), { once: true }); audio.load(); }
      });
      button.hidden = false;
    });
    audio.controls = false;
    controls.hidden = false;
    paused();
    sync();
  });
})();

/* Same perspective and paper movement as the first gallery, progressing left. */
(function () {
  'use strict';
  const rail = document.querySelector('.governos-linha');
  if (!rail) return;
  const cards = Array.from(rail.querySelectorAll('.governo-mini'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let path, stage, frame = 0, current = 0, target = 0, step = 1, width = 0, height = 0;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  function draw() {
    frame = 0;
    if (!path) return;
    current += (target - current) * .14;
    if (Math.abs(target - current) < .0008) current = target;
    const active = Math.round(current);
    cards.forEach((card, i) => {
      const distance = i - current, away = Math.abs(distance);
      const x = distance * Math.min(width * .8, 650);
      const y = -distance * height * (width < 760 ? .05 : .12);
      const z = -away * 240;
      const turn = clamp(-distance * 26, -48, 48);
      card.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${turn}deg)`;
      card.style.opacity = String(away < 1.6 ? 1 : Math.max(0, 1 - (away - 1.6) * .75));
      card.style.visibility = away > 3.2 ? 'hidden' : 'visible';
      card.style.zIndex = String(100 - Math.round(away * 10));
      card.style.setProperty('--retrato-nevoa', String(Math.min(.62, away * .36)));
      card.tabIndex = i === active ? 0 : -1;
    });
    if (current !== target) frame = requestAnimationFrame(draw);
  }
  function scroll() {
    if (!path) return;
    target = clamp(-path.getBoundingClientRect().top / step, 0, cards.length - 1);
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    if (!path) return;
    width = window.innerWidth;
    height = stage.offsetHeight;
    step = Math.max(1, height * .8);
    const pictureHeight = Math.max(80, Math.min(height * .48, height - 220));
    const pictureWidth = Math.min(width * .68, pictureHeight * .8, 460);
    stage.style.setProperty('--retrato-largura', pictureWidth + 28 + 'px');
    stage.style.setProperty('--retrato-altura', pictureHeight + 'px');
    path.style.height = height + step * (cards.length - 1) + 'px';
    scroll();
  }
  function setup() {
    if (reduced.matches) {
      if (!path) return;
      cancelAnimationFrame(frame); frame = 0;
      path.before(rail); path.remove(); path = stage = null;
      cards.forEach(card => { card.removeAttribute('style'); card.removeAttribute('tabindex'); });
      return;
    }
    if (path) return;
    path = document.createElement('div'); path.className = 'republica-percurso';
    stage = document.createElement('div'); stage.className = 'republica-palco';
    rail.before(path); path.append(stage); stage.append(rail);
    measure();
  }
  // Keep pointer focus from scrolling transformed cards away before click.
  rail.addEventListener('mousedown', event => {
    const card = event.target.closest('.governo-mini');
    if (!path || !card || event.button !== 0) return;
    event.preventDefault();
    card.focus({ preventScroll: true });
  });
  rail.addEventListener('keydown', event => {
    if (!path || event.altKey || event.ctrlKey || event.metaKey) return;
    const card = event.target.closest('.governo-mini');
    if (!card) return;
    let index = cards.indexOf(card);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index++;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index--;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = cards.length - 1;
    else return;
    event.preventDefault(); index = clamp(index, 0, cards.length - 1);
    window.scrollTo({ top: path.getBoundingClientRect().top + window.scrollY + index * step, behavior: 'instant' });
    current = target = index; draw(); cards[index].focus({ preventScroll: true });
  });
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure, { once: true });
  reduced.addEventListener('change', setup);
  setup();
})();
