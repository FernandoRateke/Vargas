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

(function () {
  const audio = document.getElementById('radio-audio');
  const toggle = document.getElementById('radio-toggle');
  const status = document.getElementById('radio-status');
  if (!audio || !toggle) return;
  toggle.hidden = false;
  document.querySelector('.radio-seek').hidden = false;
  toggle.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    status.textContent = 'Carregando o programa…';
    try { await audio.play(); }
    catch (error) { status.textContent = 'Use o link da Rádio Senado para ouvir.'; }
  });
  audio.addEventListener('play', () => {
    toggle.textContent = 'Ⅱ Pausar o rádio';
    status.textContent = 'Rádio Senado · Em reprodução';
    document.querySelector('.radio-set').classList.add('radio-playing');
  });
  function paused() {
    toggle.textContent = '▶ Ligar o rádio';
    status.textContent = audio.ended ? 'Programa concluído' : 'Reprodução pausada';
    document.querySelector('.radio-set').classList.remove('radio-playing');
  }
  audio.addEventListener('pause', paused);
  audio.addEventListener('ended', paused);
  audio.addEventListener('error', () => { status.textContent = 'Áudio indisponível. Abra a Rádio Senado.'; });
  function seek(delta) {
    if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + delta));
  }
  document.getElementById('radio-back').addEventListener('click', () => seek(-10));
  document.getElementById('radio-forward').addEventListener('click', () => seek(10));
})();
