/* Progressive enhancement only: the complete paper content and tables are in index.html.
   No network calls, analytics, dependencies, or client-side content fetching. */
'use strict';
(() => {
  document.documentElement.classList.add('has-js');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav-links');
  if (toggle && nav) {
    toggle.hidden = false;
    const closeMenu = () => {nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false');};
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {if (event.key === 'Escape') closeMenu();});
  }

  const progress = document.getElementById('reading-progress');
  let ticking = false;
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    ticking = false;
  };
  const scheduleProgress = () => {if (!ticking) {requestAnimationFrame(updateProgress); ticking = true;}};
  window.addEventListener('scroll', scheduleProgress, {passive: true});
  window.addEventListener('resize', scheduleProgress, {passive: true});
  window.addEventListener('load', scheduleProgress);
  updateProgress();

  const navItems = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const sections = navItems.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) navItems.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin: '-15% 0px -65% 0px', threshold: 0});
    sections.forEach(section => observer.observe(section));
  }

  const dialog = document.getElementById('figure-dialog');
  const modalImage = document.getElementById('dialog-image');
  const modalCaption = document.getElementById('dialog-caption');
  const original = document.getElementById('dialog-original');
  let previousFocus = null;
  if (dialog && typeof dialog.showModal === 'function' && modalImage && modalCaption && original) {
    document.querySelectorAll('[data-lightbox]').forEach(link => {
      link.addEventListener('click', event => {
        // Preserve normal new-tab and download behavior for modified clicks.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        previousFocus = link;
        modalImage.src = link.href;
        modalImage.alt = link.querySelector('img')?.alt || 'Enlarged paper figure';
        modalCaption.textContent = link.dataset.caption || modalImage.alt;
        original.href = link.href;
        dialog.showModal();
        document.body.classList.add('dialog-open');
      });
    });
    document.getElementById('close-dialog')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      previousFocus?.focus({preventScroll: true});
    });
  }

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const code = document.getElementById(button.dataset.copy);
      const feedback = document.getElementById('copy-feedback');
      if (!code) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(code.textContent.trim());
        button.textContent = 'Copied ✓';
        if (feedback) feedback.textContent = 'Citation copied to the clipboard.';
        window.setTimeout(() => {button.textContent = 'Copy citation';}, 2500);
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        if (feedback) feedback.textContent = 'Citation selected. Press Ctrl+C (or Command+C) to copy.';
      }
    });
  });
})();
