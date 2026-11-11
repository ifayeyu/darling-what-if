/* pin-images.js — round Pinterest "Save" icon in the bottom-right corner of every photo in a post.
   Loaded on post pages. Skips the hero (it has its own button), linked/affiliate images,
   author photo, related-post cards, footer icons and anything under 200px wide. */
(function () {
  var body = document.querySelector('article.post-content, article.post-body, main.post-body, div.post-body');
  if (!body) return;
  var canon = document.querySelector('link[rel="canonical"]');
  var pageUrl = (canon ? canon.href : location.href).replace('://www.', '://');
  var descMeta = document.querySelector('meta[name="description"]');
  var pageDesc = descMeta ? descMeta.content : document.title;
  var LOGO = '/images/500px-Pinterest.svg.webp';
  var SKIP = '.post-card, .rp-card, .author-bio, .footer, .internal-links, .letters-signoff, .inline-nl, .hero-pin, a';

  if (!document.getElementById('pin-img-css')) {
    var s = document.createElement('style');
    s.id = 'pin-img-css';
    s.textContent =
      '.pin-img-wrap{position:relative;display:block;width:fit-content;max-width:100%}' +
      '.pin-img-wrap--center{margin-left:auto;margin-right:auto}' +
      '.pin-img-btn{position:absolute;right:14px;bottom:14px;z-index:3;width:38px;height:38px;display:flex;' +
      'align-items:center;justify-content:center;background:rgba(255,255,255,.94);border:1px solid #e4dfd6;' +
      'border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,.12);transition:transform .15s,border-color .15s}' +
      '.pin-img-btn:hover{transform:scale(1.06);border-color:#E60023}' +
      '.pin-img-btn img{width:20px;height:20px;display:block;margin:0!important;border:0!important;box-shadow:none!important}';
    document.head.appendChild(s);
  }

  function add(img) {
    if (img.dataset.pinDone || img.closest(SKIP)) return;
    var w = img.naturalWidth || img.width;
    if (w < 200 || img.getBoundingClientRect().width < 200) return;
    img.dataset.pinDone = '1';
    var host = img.parentElement;
    if (host !== body && host.children.length === 1 && host.tagName !== 'P') {
      /* image sits alone in its own frame (figure, post-img__frame…): put the button in the frame */
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    } else {
      /* bare image, or an image with a caption beside it: wrap just the image */
      var cs = getComputedStyle(img);
      host = document.createElement('span');
      host.className = 'pin-img-wrap';
      if (cs.display === 'block' && cs.marginLeft === cs.marginRight && parseFloat(cs.marginLeft) > 0) host.className += ' pin-img-wrap--center';
      if (img.style.width === '100%' || cs.width === getComputedStyle(img.parentElement).width) host.style.width = '100%';
      img.parentNode.insertBefore(host, img);
      host.appendChild(img);
    }
    var a = document.createElement('a');
    a.className = 'pin-img-btn';
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Save this image to Pinterest');
    a.href = 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(pageUrl) +
      '&media=' + encodeURIComponent(img.currentSrc || img.src) +
      '&description=' + encodeURIComponent(img.alt || pageDesc);
    a.innerHTML = '<img src="' + LOGO + '" alt="" aria-hidden="true">';
    a.addEventListener('click', function () {
      if (window.gtag) gtag('event', 'pin_click', { location: 'image', post: location.pathname });
    });
    host.appendChild(a);
  }

  function scan() {
    body.querySelectorAll('img').forEach(function (img) {
      if (img.complete && img.naturalWidth) add(img);
      else img.addEventListener('load', function () { add(img); }, { once: true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
