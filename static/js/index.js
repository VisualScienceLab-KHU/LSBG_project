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
  const navItems = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const anchors = navItems.map(link => ({
    link,
    target: document.getElementById(link.hash.slice(1))
  })).filter(anchor => anchor.target);
  let ticking = false;
  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    // Use the same offset as native anchor navigation, including the mobile override.
    const anchorTop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const atBottom = scrollable > 0 && window.scrollY >= scrollable - 1;
    // The title area has no nav item, even if the URL still ends in #question.
    let selected = null;
    if (window.scrollY > 1) {
      for (const {link, target} of anchors) {
        if (!atBottom && target.getBoundingClientRect().top > anchorTop + 1) break;
        selected = link;
      }
    }
    for (const link of navItems) {
      if (link === selected) {
        if (link.getAttribute('aria-current') !== 'location') link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
    ticking = false;
  };
  const scheduleScrollUpdate = () => {if (!ticking) {ticking = true; requestAnimationFrame(updateScrollState);}};
  window.addEventListener('scroll', scheduleScrollUpdate, {passive: true});
  window.addEventListener('resize', scheduleScrollUpdate, {passive: true});
  window.addEventListener('load', scheduleScrollUpdate);
  window.addEventListener('pageshow', scheduleScrollUpdate);
  // Recalculate when disclosures or responsive content change the page height.
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', scheduleScrollUpdate));
  if ('ResizeObserver' in window) {
    const progressObserver = new ResizeObserver(scheduleScrollUpdate);
    progressObserver.observe(document.body);
  }
  updateScrollState();

  const revealAnchor = () => {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let expanded = false;
    for (let node = target; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS' && !node.open) {
        node.open = true;
        expanded = true;
      }
    }
    // Native fragment navigation already positions visible sections.
    if (expanded) requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
  };
  window.addEventListener('hashchange', revealAnchor);
  if (window.location.hash) window.addEventListener('load', revealAnchor, {once: true});

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
