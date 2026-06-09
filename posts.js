/* posts.js — dynamic category page renderer with pagination
   Reads posts.json, filters by data-category, sorts newest-first,
   renders featured block + paginated grid using the correct CSS classes per page style.
   Pagination: PAGE_SIZE cards per page, URL hash #page=N, first/last always visible. */
(function () {
  'use strict';

  var PAGE_SIZE = 10;

  /* ── Inject pagination CSS (once) ───────────────────────────────────── */
  if (!document.getElementById('posts-pag-css')) {
    var s = document.createElement('style');
    s.id = 'posts-pag-css';
    s.textContent =
      '.pagination{display:flex;align-items:center;justify-content:center;' +
      'gap:4px;padding:40px 0 24px;flex-wrap:wrap}' +
      '.pag-btn{min-width:36px;height:36px;padding:0 10px;border:1px solid #d4cfc8;' +
      'background:transparent;color:#3d3530;font-family:"DM Sans",sans-serif;' +
      'font-size:.875rem;cursor:pointer;border-radius:4px;' +
      'transition:border-color .15s,color .15s,background .15s}' +
      '.pag-btn:hover:not(:disabled){border-color:#9B8968;color:#9B8968}' +
      '.pag-btn.pag-active{background:#9B8968;border-color:#9B8968;color:#fff;font-weight:600;cursor:default}' +
      '.pag-btn:disabled{opacity:.35;cursor:default}' +
      '.pag-ellipsis{color:#9B8968;padding:0 6px;line-height:36px;' +
      'font-size:.875rem;font-family:"DM Sans",sans-serif;user-select:none}';
    document.head.appendChild(s);
  }

  var container = document.getElementById('posts-output');
  if (!container) return;

  /* Reserve height immediately so the footer never shifts when posts load */
  container.style.minHeight = '900px';

  var cat   = container.getAttribute('data-category');
  var style = container.getAttribute('data-style') || 'featured';

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  function fmtDate(d) {
    var p = d.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var LABELS = { 'gut-health': 'Gut Health', 'travel': 'Travel' };
  function labelFor(c) { return LABELS[c] || capFirst(c); }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getPage() {
    var m = window.location.hash.match(/[#&]?page=(\d+)/);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
  }

  /* Returns an array of page numbers and 'ellipsis' markers to render */
  function pageSequence(current, total) {
    if (total <= 7) {
      var seq = [];
      for (var i = 1; i <= total; i++) seq.push(i);
      return seq;
    }
    var out  = [1];
    var lo   = Math.max(2, current - 1);
    var hi   = Math.min(total - 1, current + 1);
    if (lo > 2)          out.push('…');
    for (var j = lo; j <= hi; j++) out.push(j);
    if (hi < total - 1)  out.push('…');
    out.push(total);
    return out;
  }

  function buildPagination(current, total) {
    if (total <= 1) return '';
    var h = '<nav class="pagination" aria-label="Posts navigation">';

    /* Prev */
    h += '<button class="pag-btn" data-page="' + (current - 1) + '"' +
         (current === 1 ? ' disabled' : '') + ' aria-label="Previous page">←</button>';

    /* Page numbers */
    pageSequence(current, total).forEach(function (n) {
      if (n === '…') {
        h += '<span class="pag-ellipsis">…</span>';
      } else {
        h += '<button class="pag-btn' + (n === current ? ' pag-active' : '') + '"' +
             ' data-page="' + n + '"' +
             (n === current ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }
    });

    /* Next */
    h += '<button class="pag-btn" data-page="' + (current + 1) + '"' +
         (current === total ? ' disabled' : '') + ' aria-label="Next page">→</button>';

    h += '</nav>';
    return h;
  }

  function render(allPosts) {
    var posts = allPosts
      .filter(function (p) { return p.category === cat; })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    if (!posts.length) {
      container.style.minHeight = '';
      return;
    }

    var featured   = posts[0];
    var rest       = posts.slice(1);
    var totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
    var page       = Math.min(getPage(), totalPages);
    var start      = (page - 1) * PAGE_SIZE;
    var pageItems  = rest.slice(start, start + PAGE_SIZE);
    var html       = '';

    /* ── FEATURED BLOCK (page 1 only) ──────────────────────────────── */
    if (page === 1) {
      if (style === 'solo') {
        /* beauty / companion */
        html += '<div class="solo-wrap">';
        html += '<p class="solo-label">Latest</p>';
        html += '<a href="' + featured.slug + '.html">';
        html += '<div class="solo-post">';
        html += '<div class="solo-post__img"><img src="' + esc(featured.image) + '" alt="' + esc(featured.title) + '" loading="lazy"></div>';
        html += '<div class="solo-post__body">';
        html += '<div class="solo-post__cat">' + esc(labelFor(featured.category)) + '</div>';
        html += '<h2 class="solo-post__title">' + esc(featured.title) + '</h2>';
        html += '<p class="solo-post__excerpt">' + esc(featured.excerpt) + '</p>';
        html += '<div class="solo-post__meta"><span>' + fmtDate(featured.date) + '</span><div class="meta-dot"></div><span>' + featured.readTime + ' min read</span></div>';
        html += '<span class="read-btn">Read post →</span>';
        html += '</div></div></a></div>';
      } else {
        /* mind / nourish / living */
        html += '<div class="featured-wrap">';
        html += '<p class="featured-label">Latest</p>';
        html += '<a href="' + featured.slug + '.html">';
        html += '<div class="featured-post">';
        html += '<div class="featured-post__img"><img src="' + esc(featured.image) + '" alt="' + esc(featured.title) + '" loading="lazy"></div>';
        html += '<div class="featured-post__body">';
        html += '<div class="featured-post__cat">' + esc(labelFor(featured.category)) + '</div>';
        html += '<h2 class="featured-post__title">' + esc(featured.title) + '</h2>';
        html += '<p class="featured-post__excerpt">' + esc(featured.excerpt) + '</p>';
        html += '<div class="featured-post__meta"><span>' + fmtDate(featured.date) + '</span><div class="meta-dot"></div><span>' + featured.readTime + ' min read</span></div>';
        html += '<span class="read-btn">Read post →</span>';
        html += '</div></div></a></div>';
      }
    }

    /* ── PAGINATED POSTS GRID ───────────────────────────────────────── */
    if (pageItems.length) {
      if (style === 'solo') {
        html += '<div class="posts-section">';
        html += '<p class="posts-section__label">More in ' + esc(labelFor(cat)) + '</p>';
        html += '<div class="posts-grid">';
        pageItems.forEach(function (p) {
          html += '<a href="' + p.slug + '.html" class="post-card">';
          html += '<div class="post-card__img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"></div>';
          html += '<div class="post-card__body">';
          html += '<div class="post-card__cat">' + esc(labelFor(p.category)) + '</div>';
          html += '<h3 class="post-card__title">' + esc(p.title) + '</h3>';
          html += '<p class="post-card__excerpt">' + esc(p.excerpt) + '</p>';
          html += '<div class="post-card__meta">' + fmtDate(p.date) + ' &nbsp;&middot;&nbsp; ' + p.readTime + ' min read</div>';
          html += '</div></a>';
        });
        html += '</div></div>';
      } else {
        html += '<div class="posts-wrap">';
        html += '<p class="posts-wrap__label">All posts in ' + esc(labelFor(cat)) + '</p>';
        html += '<div class="posts-grid">';
        pageItems.forEach(function (p) {
          html += '<article class="post-card">';
          html += '<a href="' + p.slug + '.html"><div class="post-card__img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"></div></a>';
          html += '<div class="post-card__body">';
          html += '<div class="post-card__category">' + esc(labelFor(p.category)) + '</div>';
          html += '<h3 class="post-card__title"><a href="' + p.slug + '.html">' + esc(p.title) + '</a></h3>';
          html += '<p class="post-card__excerpt">' + esc(p.excerpt) + '</p>';
          html += '<div class="post-card__meta">' + fmtDate(p.date) + ' &middot; ' + p.readTime + ' min read</div>';
          html += '</div></article>';
        });
        html += '</div></div>';
      }
    }

    /* ── PAGINATION CONTROLS ────────────────────────────────────────── */
    html += buildPagination(page, totalPages);

    container.innerHTML = html;
    container.style.minHeight = '';

    /* Wire page button clicks */
    container.querySelectorAll('.pag-btn:not(:disabled):not(.pag-active)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = parseInt(btn.getAttribute('data-page'), 10);
        if (isNaN(n) || n < 1 || n > totalPages) return;
        history.replaceState(null, '', window.location.pathname + (n > 1 ? '#page=' + n : ''));
        var top = container.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        render(allPosts);
      });
    });
  }

  fetch('posts.json')
    .then(function (r) { return r.json(); })
    .then(function (all) { render(all); })
    .catch(function (err) {
      container.style.minHeight = '';
      console.error('[posts.js]', err);
    });
}());
