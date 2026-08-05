/* ==========================================================================
   Blog — progressive enhancement
   --------------------------------------------------------------------------
   Everything here is optional polish. The page reads fine with JS disabled.

     1. Videos autoplay when scrolled into view, pause when they leave.
     2. Click a video to play/pause it.
     3. A fullscreen button appears on hover.
     4. A "Loading…" veil shows until the video can actually play.
     5. Headings get an id + a hover-revealed "#" anchor link.
     6. <span data-year></span> is filled with the current year.
   ========================================================================== */

(function () {
  'use strict';

  /* --- 5. Heading anchors ------------------------------------------------- */

  const slug = (text) =>
    text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  document.querySelectorAll('.prose h2, .prose h3').forEach((h) => {
    if (!h.id) h.id = slug(h.textContent);
    const a = document.createElement('a');
    a.className = 'heading-anchor';
    a.href = '#' + h.id;
    a.textContent = '#';
    a.setAttribute('aria-hidden', 'true');
    a.tabIndex = -1;
    h.prepend(a);
  });

  /* --- 6. Current year ---------------------------------------------------- */

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* --- Video setup -------------------------------------------------------- */

  const cards = document.querySelectorAll('.video-card');
  if (!cards.length) return;

  const FS_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3' +
    'M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';

  cards.forEach((card) => {
    const video = card.querySelector('video');
    if (!video) return;

    // Attributes required for reliable inline autoplay on iOS/Safari.
    video.muted = true;
    video.loop = video.loop !== false;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // 4. Loading veil
    const veil = document.createElement('div');
    veil.className = 'video-loading';
    veil.textContent = 'Loading…';
    card.appendChild(veil);

    const clearVeil = () => veil.remove();
    if (video.readyState >= 3) clearVeil();
    video.addEventListener('canplay', clearVeil, { once: true });
    video.addEventListener('error', () => { veil.textContent = 'Video unavailable'; });

    // 3. Fullscreen button
    const fs = document.createElement('button');
    fs.className = 'video-fs';
    fs.type = 'button';
    fs.title = 'Fullscreen';
    fs.setAttribute('aria-label', 'Fullscreen');
    fs.innerHTML = FS_ICON;
    fs.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.fullscreenElement) document.exitFullscreen();
      else if (card.requestFullscreen) card.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iOS
    });
    card.appendChild(fs);

    // 2. Click to toggle
    video.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else { video.pause(); video.dataset.userPaused = '1'; }
      if (!video.paused) delete video.dataset.userPaused;
    });
  });

  /* --- 1. Play only what is on screen ------------------------------------- */

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (!video.dataset.userPaused) video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );
    cards.forEach((card) => {
      const v = card.querySelector('video');
      if (v) io.observe(v);
    });
  }
})();
