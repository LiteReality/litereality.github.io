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
     7. Click a figure to open it full screen; arrows walk the set, click the
        image again to zoom it to 1:1, Esc closes.
     8. The BibTeX block gets a copy button.
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

  /* --- 8. Copy the BibTeX ------------------------------------------------- */

  document.querySelectorAll('.cite-block').forEach((block) => {
    const pre = block.querySelector('pre');
    if (!pre || !navigator.clipboard) return;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'copy';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.textContent.trim()).then(
        () => {
          btn.textContent = 'copied';
          setTimeout(() => { btn.textContent = 'copy'; }, 1600);
        },
        () => { btn.textContent = 'press ⌘C'; }
      );
    });
    block.appendChild(btn);
  });

  /* --- 7. Image lightbox --------------------------------------------------
     Every figure image opens full screen. Images already wrapped in a link
     (the App Store card) keep their link and are left alone.
     ------------------------------------------------------------------------ */

  const figures = Array.prototype.filter.call(
    document.querySelectorAll('.image-card img'),
    (img) => !img.closest('a')
  );

  if (figures.length) {
    // Caption shown under the enlarged image: the figure's own caption if it
    // has one, otherwise the alt text, which is written as a description.
    const captionFor = (img) => {
      const fig = img.closest('figure');
      const cap = fig && fig.querySelector('figcaption');
      const text = cap ? cap.textContent : '';
      return text.replace(/\s+/g, ' ').trim() || img.alt || '';
    };

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<button class="lb-btn lb-close" type="button" aria-label="Close (Esc)">✕</button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous image">‹</button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next image">›</button>' +
      '<div class="lb-viewport"><img alt=""></div>' +
      '<div class="lb-bar"><div class="lb-caption"></div><div class="lb-count"></div></div>';
    document.body.appendChild(box);

    const viewport = box.querySelector('.lb-viewport');
    const full     = box.querySelector('.lb-viewport img');
    const caption  = box.querySelector('.lb-caption');
    const counter  = box.querySelector('.lb-count');
    const closeBtn = box.querySelector('.lb-close');
    const prevBtn  = box.querySelector('.lb-prev');
    const nextBtn  = box.querySelector('.lb-next');

    let index = 0;
    let opener = null;

    // Fit the image to the screen, but never blow a small one up past 2x.
    // Zoom is then only offered when 1:1 would actually show more pixels.
    const measure = () => {
      viewport.classList.remove('is-zoomed');
      const w = full.naturalWidth, h = full.naturalHeight;
      if (!w || !h) return;
      const cs = getComputedStyle(viewport);
      const availW = viewport.clientWidth -
        parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const availH = viewport.clientHeight -
        parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const scale = Math.min(availW / w, availH / h, 2);
      full.style.width = Math.round(w * scale) + 'px';
      full.style.height = Math.round(h * scale) + 'px';
      viewport.classList.toggle('can-zoom', scale < 1);
    };

    const toggleZoom = () => {
      if (!viewport.classList.contains('can-zoom')) return;
      if (viewport.classList.contains('is-zoomed')) { measure(); return; }
      full.style.width = full.naturalWidth + 'px';
      full.style.height = full.naturalHeight + 'px';
      viewport.classList.add('is-zoomed');
    };

    const show = (i) => {
      index = (i + figures.length) % figures.length;
      const img = figures[index];
      // One listener at a time, and measure straight away when the bitmap is
      // already decoded — `complete` alone can be true with no pixels yet.
      full.removeEventListener('load', measure);
      full.src = img.currentSrc || img.src;
      full.alt = img.alt || '';
      caption.textContent = captionFor(img);
      counter.textContent = figures.length > 1
        ? (index + 1) + ' / ' + figures.length : '';
      full.addEventListener('load', measure);
      if (full.complete && full.naturalWidth) measure();
    };

    const open = (i, from) => {
      opener = from || null;
      show(i);
      box.hidden = false;
      document.documentElement.classList.add('lb-open');
      closeBtn.focus({ preventScroll: true });
    };

    const close = () => {
      box.hidden = true;
      document.documentElement.classList.remove('lb-open');
      viewport.classList.remove('is-zoomed');
      full.removeAttribute('src');
      if (opener) opener.focus();
      opener = null;
    };

    const single = figures.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;

    figures.forEach((img, i) => {
      img.classList.add('zoomable');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Open image full screen');
      img.addEventListener('click', () => open(i, img));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, img); }
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));

    // Click the backdrop to close; click the image to toggle 1:1 zoom.
    box.addEventListener('click', (e) => {
      if (e.target === box || e.target === viewport) close();
    });
    full.addEventListener('click', toggleZoom);

    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight' && !single) show(index + 1);
      else if (e.key === 'ArrowLeft' && !single) show(index - 1);
    });

    window.addEventListener('resize', () => { if (!box.hidden) measure(); });
  }

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
