/* ============================================================
   Yuri Roberto — motion
   ============================================================ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- inertial scroll ----------
     Lerps the real window scroll position, so anchors, focus and
     IntersectionObserver keep working normally. */
  if (!reduce && !coarse) {
    var target = window.scrollY;
    var current = window.scrollY;
    var running = false;

    function maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }

    function frame() {
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(frame);
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      target = Math.max(0, Math.min(maxScroll(), target + e.deltaY));
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: false });

    // keep in sync when scroll happens by other means
    window.addEventListener('scroll', function () {
      if (!running) { target = window.scrollY; current = window.scrollY; }
    }, { passive: true });

    window.addEventListener('resize', function () {
      target = Math.max(0, Math.min(maxScroll(), target));
    });
  }

  /* ---------- reveal on enter ---------- */
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (!items.length) return;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  function show(el) { el.classList.add('is-in'); }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  items.forEach(function (el) { io.observe(el); });

  /* Safety sweep: a fast scroll or a late layout shift can outrun the
     observer, which would leave a block stuck at opacity 0. Anything
     that has reached the viewport gets shown regardless. */
  var ticking = false;
  function sweep() {
    ticking = false;
    var limit = window.innerHeight * 0.94;
    items = items.filter(function (el) {
      if (el.classList.contains('is-in')) return false;
      if (el.getBoundingClientRect().top < limit) { show(el); io.unobserve(el); return false; }
      return true;
    });
    if (!items.length) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  onScroll();
})();
