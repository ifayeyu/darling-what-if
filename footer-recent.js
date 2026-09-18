/* footer-recent.js
   Renders the footer "Recent" column from posts.json at page load, so a new
   post appears automatically and no page's footer HTML ever needs rebuilding.
   Include on any page with:  <ul id="footer-recent"></ul>  +  this script.

   Labels: curated names below read nicely; any post NOT listed falls back to a
   clean label auto-derived from its title — so new posts need no action here. */
(function () {
  var N = 5;

  var LABELS = {
    "post-husband-material": "What \"Husband Material\" Means",
    "post-green-flags-character": "Green Flags in a Man",
    "post-digital-detox": "The Realistic Digital Detox",
    "post-hypervigilance": "Hypervigilance, Explained",
    "post-magnesium": "The Forgotten Mineral",
    "post-fawn-response": "The Fawn Response",
    "post-emotional-unavailability": "Why Unavailability Feels Familiar",
    "post-seed-cycling": "Seed Cycling for Hormones",
    "post-self-love": "What Self-Love Really Means",
    "post-food-glow-guide": "The Whole-Food Glow Guide",
    "post-gut-brain-connection": "The Gut-Brain Connection",
    "post-slow-living-fast-world": "The Art of Slow Living",
    "post-dark-circles-tired-eyes": "Dark Circles, Explained",
    "post-night-wind-down-routine": "The Night Wind-Down Routine",
    "post-growing-up-keeps-you-young": "Growing Up Keeps You Young",
    "post-choosing-someone-every-day": "Choosing Someone Every Day",
    "post-relationship-mirroring": "The Mirroring Effect",
    "post-attachment-style-daily-choice": "Attachment Style & Daily Choice",
    "post-clean-beauty-meaning": "What Clean Beauty Actually Means",
    "post-gratitude-inflammation": "Gratitude Is Actually Medicine",
    "post-mushroom-coffee": "Mushroom Coffee",
    "post-chronic-stress-inflammation": "Chronic Stress & Inflammation",
    "post-looking-younger": "The Science of Looking Younger",
    "post-skincare-layering-order": "Layering Skincare, In Order",
    "post-survived-yourself": "You Survived Yourself",
    "post-hair-growth-retention": "Hair Growth Retention",
    "post-writing-by-hand": "Writing by Hand",
    "post-wabi-sabi-home": "Nothing Needs to Be Perfect",
    "post-enmeshment-parents": "When Love Feels Heavy",
    "post-self-compassion-vs-self-esteem": "Self-Compassion",
    "post-evening-sleep-routine": "Protecting Your Sleep",
    "post-eldest-daughter-syndrome": "Eldest Daughter Syndrome",
    "post-childhood-emotional-neglect": "Emotional Neglect",
    "post-vitamin-d-hormone": "Vitamin D Is a Hormone",
    "post-easy-to-love": "Easy to Love",
    "post-breakfast-for-dinner": "Breakfast for Dinner"
  };

  function shortLabel(p) {
    if (LABELS[p.slug]) return LABELS[p.slug];
    var lab = (p.title || p.slug).split(/:|—|\?/)[0].trim();
    if (lab.length > 30) lab = lab.slice(0, 28).replace(/\s+\S*$/, "") + "…";
    return lab;
  }

  var el = document.getElementById("footer-recent");
  if (!el) return;

  fetch("/posts.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (posts) {
      if (!Array.isArray(posts)) return;
      posts = posts.slice().sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
      el.innerHTML = "";
      posts.slice(0, N).forEach(function (p) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = p.slug + ".html";
        a.textContent = shortLabel(p);
        li.appendChild(a);
        el.appendChild(li);
      });
    })
    .catch(function () { /* leave column empty on failure */ });
})();
