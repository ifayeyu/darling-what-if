/* posts.js — dynamic category page renderer
   Reads posts.json, filters by data-category, sorts newest-first,
   renders featured block + grid using the correct CSS classes per page style. */
(function () {
  'use strict';
  var container = document.getElementById('posts-output');
  if (!container) return;

  var cat   = container.getAttribute('data-category');
  var style = container.getAttribute('data-style') || 'featured';

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  function fmtDate(d) {
    var p = d.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  fetch('posts.json')
    .then(function (r) { return r.json(); })
    .then(function (all) {
      var posts = all
        .filter(function (p) { return p.category === cat; })
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

      if (!posts.length) return;

      var featured = posts[0];
      var rest     = posts.slice(1);
      var html     = '';

      /* ── FEATURED BLOCK ──────────────────────────────────────────── */
      if (style === 'solo') {
        /* beauty / companion */
        html += '<div class="solo-wrap">';
        html += '<p class="solo-label">Latest</p>';
        html += '<a href="' + featured.slug + '.html">';
        html += '<div class="solo-post">';
        html += '<div class="solo-post__img"><img src="' + esc(featured.image) + '" alt="' + esc(featured.title) + '" loading="lazy"></div>';
        html += '<div class="solo-post__body">';
        html += '<div class="solo-post__cat">' + esc(capFirst(featured.category)) + '</div>';
        html += '<h2 class="solo-post__title">' + esc(featured.title) + '</h2>';
        html += '<p class="solo-post__excerpt">' + esc(featured.excerpt) + '</p>';
        html += '<div class="solo-post__meta"><span>' + fmtDate(featured.date) + '</span><div class="meta-dot"></div><span>' + featured.readTime + ' min read</span></div>';
        html += '<span class="read-btn">Read post \u2192</span>';
        html += '</div></div></a></div>';
      } else {
        /* mind / nourish / living */
        html += '<div class="featured-wrap">';
        html += '<p class="featured-label">Latest</p>';
        html += '<a href="' + featured.slug + '.html">';
        html += '<div class="featured-post">';
        html += '<div class="featured-post__img"><img src="' + esc(featured.image) + '" alt="' + esc(featured.title) + '" loading="lazy"></div>';
        html += '<div class="featured-post__body">';
        html += '<div class="featured-post__cat">' + esc(capFirst(featured.category)) + '</div>';
        html += '<h2 class="featured-post__title">' + esc(featured.title) + '</h2>';
        html += '<p class="featured-post__excerpt">' + esc(featured.excerpt) + '</p>';
        html += '<div class="featured-post__meta"><span>' + fmtDate(featured.date) + '</span><div class="meta-dot"></div><span>' + featured.readTime + ' min read</span></div>';
        html += '<span class="read-btn">Read post \u2192</span>';
        html += '</div></div></a></div>';
      }

      /* ── REMAINING POSTS GRID ────────────────────────────────────── */
      if (rest.length) {
        if (style === 'solo') {
          /* beauty / companion — uses .post-card__cat */
          html += '<div class="posts-section">';
          html += '<p class="posts-section__label">More in ' + esc(capFirst(cat)) + '</p>';
          html += '<div class="posts-grid">';
          rest.forEach(function (p) {
            html += '<a href="' + p.slug + '.html" class="post-card">';
            html += '<div class="post-card__img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"></div>';
            html += '<div class="post-card__body">';
            html += '<div class="post-card__cat">' + esc(capFirst(p.category)) + '</div>';
            html += '<h3 class="post-card__title">' + esc(p.title) + '</h3>';
            html += '<p class="post-card__excerpt">' + esc(p.excerpt) + '</p>';
            html += '<div class="post-card__meta">' + fmtDate(p.date) + ' &nbsp;&middot;&nbsp; ' + p.readTime + ' min read</div>';
            html += '</div></a>';
          });
          html += '</div></div>';
        } else {
          /* mind / nourish / living — uses .post-card__category */
          html += '<div class="posts-wrap">';
          html += '<p class="posts-wrap__label">All posts in ' + esc(capFirst(cat)) + '</p>';
          html += '<div class="posts-grid">';
          rest.forEach(function (p) {
            html += '<article class="post-card">';
            html += '<a href="' + p.slug + '.html"><div class="post-card__img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"></div></a>';
            html += '<div class="post-card__body">';
            html += '<div class="post-card__category">' + esc(capFirst(p.category)) + '</div>';
            html += '<h3 class="post-card__title"><a href="' + p.slug + '.html">' + esc(p.title) + '</a></h3>';
            html += '<p class="post-card__excerpt">' + esc(p.excerpt) + '</p>';
            html += '<div class="post-card__meta">' + fmtDate(p.date) + ' &middot; ' + p.readTime + ' min read</div>';
            html += '</div></article>';
          });
          html += '</div></div>';
        }
      }

      container.innerHTML = html;
    })
    .catch(function (err) { console.error('[posts.js]', err); });
}());
