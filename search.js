/* search.js — sitewide search overlay for darlingwhatif.com
   Wires every .nav__search button (desktop + mobile share the same nav bar
   button, since .nav__links collapses at 900px but .nav__right/.nav__search
   does not). Builds a full-screen/dropdown overlay, fetches posts.json once,
   and does live client-side matching across title, excerpt and category.
   Self-contained: injects its own <style>, no external CSS/HTML needed. */
(function () {
  'use strict';

  var LABELS = { 'gut-health': 'Gut Health', 'travel': 'Travel' };
  function labelFor(c) {
    if (LABELS[c]) return LABELS[c];
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Wrap matched query words in <mark> for the visible snippet */
  function highlight(text, words) {
    var out = esc(text);
    words.forEach(function (w) {
      if (!w) return;
      var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  /* Build a short excerpt snippet centered on the first match, or the start */
  function snippet(text, words) {
    var lower = text.toLowerCase();
    var idx = -1;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      var pos = lower.indexOf(w);
      if (pos !== -1 && (idx === -1 || pos < idx)) idx = pos;
    }
    var MAX = 140;
    if (idx === -1) {
      return text.length > MAX ? text.slice(0, MAX).trim() + '…' : text;
    }
    var start = Math.max(0, idx - 50);
    var end = Math.min(text.length, start + MAX);
    var out = text.slice(start, end).trim();
    if (start > 0) out = '…' + out;
    if (end < text.length) out += '…';
    return out;
  }

  function score(post, words) {
    var title = post.title.toLowerCase();
    var excerpt = (post.excerpt || '').toLowerCase();
    var cat = labelFor(post.category).toLowerCase();
    var total = 0;

    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      var hit = false;

      if (title === w) { total += 100; hit = true; }
      else if (title.indexOf(w) === 0) { total += 60; hit = true; }
      else if (title.indexOf(w) !== -1) { total += 40; hit = true; }

      if (cat.indexOf(w) !== -1) { total += 25; hit = true; }

      if (excerpt.indexOf(w) !== -1) { total += 15; hit = true; }

      if (!hit) return -1; /* every word must match somewhere — AND search */
    }
    return total;
  }

  function injectStyles() {
    if (document.getElementById('site-search-css')) return;
    var s = document.createElement('style');
    s.id = 'site-search-css';
    s.textContent =
      '.ss-overlay{position:fixed;inset:0;background:rgba(29,27,25,0.55);z-index:9999;' +
        'display:none;align-items:flex-start;justify-content:center;padding:10vh 20px 20px;' +
        'backdrop-filter:blur(2px);}' +
      '.ss-overlay.open{display:flex;}' +
      '.ss-panel{background:var(--white,#fff);width:100%;max-width:640px;border-radius:10px;' +
        'box-shadow:0 20px 60px rgba(0,0,0,0.25);overflow:hidden;max-height:80vh;display:flex;flex-direction:column;' +
        'font-family:var(--sans,"DM Sans",sans-serif);}' +
      '.ss-field{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid var(--border,#EAE5DF);}' +
      '.ss-field svg{flex:none;color:var(--text-muted,#6B6462);}' +
      '.ss-input{flex:1;border:none;outline:none;font-size:1.05rem;font-family:var(--sans,"DM Sans",sans-serif);' +
        'color:var(--text,#1D1B19);background:transparent;}' +
      '.ss-input::placeholder{color:var(--text-muted,#6B6462);}' +
      '.ss-close{flex:none;background:none;border:none;cursor:pointer;color:var(--text-muted,#6B6462);' +
        'padding:4px;display:flex;align-items:center;border-radius:6px;}' +
      '.ss-close:hover{color:var(--text,#1D1B19);background:var(--gold-faint,#F2EDE5);}' +
      '.ss-results{overflow-y:auto;padding:8px;}' +
      '.ss-hint,.ss-empty{padding:32px 20px;text-align:center;color:var(--text-muted,#6B6462);font-size:0.9rem;}' +
      '.ss-result{display:flex;gap:14px;align-items:flex-start;padding:12px;border-radius:8px;text-decoration:none;' +
        'color:var(--text,#1D1B19);}' +
      '.ss-result:hover,.ss-result.ss-active{background:var(--gold-faint,#F2EDE5);}' +
      '.ss-result__img{flex:none;width:64px;height:64px;border-radius:6px;overflow:hidden;background:var(--gold-faint,#F2EDE5);}' +
      '.ss-result__img img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.ss-result__body{min-width:0;}' +
      '.ss-result__cat{font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold,#9B8968);' +
        'font-weight:600;margin-bottom:3px;}' +
      '.ss-result__title{font-family:var(--serif,"Playfair Display",serif);font-size:1rem;line-height:1.3;' +
        'margin:0 0 4px;color:var(--text,#1D1B19);}' +
      '.ss-result__excerpt{font-size:0.82rem;line-height:1.4;color:var(--text-muted,#6B6462);' +
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
      '.ss-result mark{background:var(--gold-light,#C4B49A);color:var(--text,#1D1B19);border-radius:2px;padding:0 1px;}' +
      '.ss-count{padding:10px 20px 0;font-size:0.72rem;letter-spacing:0.05em;text-transform:uppercase;' +
        'color:var(--text-muted,#6B6462);}' +
      '@media (max-width:680px){' +
        '.ss-overlay{padding:0;align-items:stretch;}' +
        '.ss-panel{max-width:none;width:100%;height:100%;max-height:none;border-radius:0;}' +
      '}';
    document.head.appendChild(s);
  }

  function buildOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'ss-overlay';
    overlay.id = 'site-search-overlay';
    overlay.innerHTML =
      '<div class="ss-panel" role="dialog" aria-modal="true" aria-label="Search">' +
        '<div class="ss-field">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
          '<input class="ss-input" type="text" placeholder="Search posts…" aria-label="Search posts" autocomplete="off">' +
          '<button class="ss-close" aria-label="Close search">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="ss-count" id="ss-count" hidden></div>' +
        '<div class="ss-results" id="ss-results">' +
          '<div class="ss-hint">Search by title, topic or category — try &ldquo;sleep&rdquo;, &ldquo;skincare&rdquo; or &ldquo;beauty&rdquo;.</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function init() {
    var triggers = document.querySelectorAll('.nav__search');
    if (!triggers.length) return;

    injectStyles();
    var overlay = buildOverlay();
    var panel = overlay.querySelector('.ss-panel');
    var input = overlay.querySelector('.ss-input');
    var closeBtn = overlay.querySelector('.ss-close');
    var resultsEl = overlay.querySelector('#ss-results');
    var countEl = overlay.querySelector('#ss-count');

    var allPosts = null;
    var fetchStarted = false;
    var activeIndex = -1;
    var currentItems = [];
    var lastFocused = null;
    var debounceTimer = null;

    function loadPosts() {
      if (fetchStarted) return;
      fetchStarted = true;
      fetch('posts.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          allPosts = data;
          if (input.value.trim()) runSearch(input.value);
        })
        .catch(function (err) {
          resultsEl.innerHTML = '<div class="ss-empty">Search is temporarily unavailable. Please try again shortly.</div>';
          console.error('[search.js]', err);
        });
    }

    function open() {
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      loadPosts();
      setTimeout(function () { input.focus(); }, 10);
    }

    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function renderHint(msg) {
      countEl.hidden = true;
      resultsEl.innerHTML = '<div class="ss-hint">' + msg + '</div>';
      currentItems = [];
      activeIndex = -1;
    }

    function renderResults(items, words) {
      currentItems = items;
      activeIndex = -1;
      if (!items.length) {
        countEl.hidden = true;
        resultsEl.innerHTML = '<div class="ss-empty">No posts found. Try a different word.</div>';
        return;
      }
      countEl.hidden = false;
      countEl.textContent = items.length + (items.length === 1 ? ' result' : ' results');
      var html = '';
      items.forEach(function (p, i) {
        html += '<a class="ss-result" href="' + p.slug + '.html" data-index="' + i + '">' +
          '<div class="ss-result__img"><img src="' + esc(p.image) + '" alt="" loading="lazy"></div>' +
          '<div class="ss-result__body">' +
            '<div class="ss-result__cat">' + esc(labelFor(p.category)) + '</div>' +
            '<h3 class="ss-result__title">' + highlight(p.title, words) + '</h3>' +
            '<p class="ss-result__excerpt">' + highlight(snippet(p.excerpt || '', words), words) + '</p>' +
          '</div>' +
        '</a>';
      });
      resultsEl.innerHTML = html;
    }

    function setActive(i) {
      var els = resultsEl.querySelectorAll('.ss-result');
      if (!els.length) return;
      if (i < 0) i = els.length - 1;
      if (i >= els.length) i = 0;
      els.forEach(function (el) { el.classList.remove('ss-active'); });
      els[i].classList.add('ss-active');
      if (els[i].scrollIntoView) els[i].scrollIntoView({ block: 'nearest' });
      activeIndex = i;
    }

    function runSearch(query) {
      var q = query.trim();
      if (!q) {
        renderHint('Search by title, topic or category — try &ldquo;sleep&rdquo;, &ldquo;skincare&rdquo; or &ldquo;beauty&rdquo;.');
        return;
      }
      if (!allPosts) {
        renderHint('Loading…');
        return;
      }
      var words = q.toLowerCase().split(/\s+/).filter(Boolean);
      var scored = [];
      for (var i = 0; i < allPosts.length; i++) {
        var s = score(allPosts[i], words);
        if (s > 0) scored.push({ post: allPosts[i], s: s });
      }
      scored.sort(function (a, b) {
        if (b.s !== a.s) return b.s - a.s;
        return new Date(b.post.date) - new Date(a.post.date);
      });
      renderResults(scored.slice(0, 12).map(function (x) { return x.post; }), words);
    }

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var val = input.value;
      debounceTimer = setTimeout(function () { runSearch(val); }, 140);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var els = resultsEl.querySelectorAll('.ss-result');
        if (activeIndex >= 0 && els[activeIndex]) { window.location.href = els[activeIndex].getAttribute('href'); }
        else if (els.length) { window.location.href = els[0].getAttribute('href'); }
      } else if (e.key === 'Escape') {
        close();
      } else if (e.key === 'Tab') {
        /* simple focus trap: only input + close button + results are focusable inside panel */
        var focusables = panel.querySelectorAll('a, button, input');
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
      /* Global "/" shortcut to open search, unless typing in a field */
      if (e.key === '/' && !overlay.classList.contains('open')) {
        var tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') { e.preventDefault(); open(); }
      }
    });

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
