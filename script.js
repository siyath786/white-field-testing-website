(() => {
  const SPEED = 55; // px per second — steady pace, not too fast or slow

  const startMarquee = () => {
    const rows = [...document.querySelectorAll(".cake-row")];
    if (!rows.length) return;

    rows.forEach((row, index) => {
      row.style.scrollSnapType = "none";

      // Rows 2 and 3 begin at the cakes (left edge) and travel toward the
      // nuts (right edge), looping cakes -> nuts continuously. Row 1 keeps
      // the opposite travel direction it already had.
      const rowTwo = index >= 1;
      const state = {
        dir: rowTwo ? 1 : -1,
        offset: rowTwo
          ? 0
          : Math.max(row.scrollWidth - row.clientWidth, 0),
        last: performance.now(),
        paused: false,
      };
      row.scrollLeft = state.offset;
      row._marqueeState = state; // expose state so touch handling below can reach it

      const step = (now) => {
        const dt = Math.min((now - state.last) / 1000, 0.05);
        state.last = now;
        const max = row.scrollWidth - row.clientWidth;
        if (max > 0 && !state.paused) {
          state.offset += state.dir * SPEED * dt;
          if (rowTwo) {
            // cakes -> nuts: once the nuts end is reached, wrap back to cakes.
            if (state.offset >= max) state.offset = 0;
          } else {
            // end -> start: wrap back to the far end.
            if (state.offset <= 0) state.offset = max;
          }
          row.scrollLeft = state.offset;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      const pause = () => {
        state.paused = true;
      };
      const resume = () => {
        state.paused = false;
        state.last = performance.now();
      };
      row.addEventListener("mouseenter", pause);
      row.addEventListener("mouseleave", resume);
    });

    // Mobile: touching a row pauses only that row; touching a different
    // row resumes any previously-paused row, mirroring desktop hover.
    rows.forEach((row) => {
      row.addEventListener(
        "touchstart",
        () => {
          rows.forEach((r) => {
            r._marqueeState.paused = r === row;
            if (r !== row) r._marqueeState.last = performance.now();
          });
        },
        { passive: true },
      );
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMarquee);
  } else {
    startMarquee();
  }
})();

(() => {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  const hasScrollTo = hasGSAP && typeof window.ScrollToPlugin !== "undefined";

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (hasScrollTo) gsap.registerPlugin(ScrollToPlugin);

  // Loader
  const loader = $("#pageLoader");
  const hideLoader = () => {
    if (!loader) return;
    if (hasGSAP && !reduced) {
      gsap
        .timeline()
        .to(".loader-ring", {
          rotation: 360,
          duration: 0.6,
          ease: "power2.inOut",
        })
        .to(loader, {
          autoAlpha: 0,
          duration: 0.65,
          ease: "power2.out",
          onComplete: () => loader.remove(),
        });
    } else {
      loader.remove();
    }
  };
  window.addEventListener("load", () => setTimeout(hideLoader, 450));

  // Mobile navigation
  const menuToggle = $(".menu-toggle");
  const nav = $(".nav");
  const navLinks = $$(".nav a");
  const setNavState = (open) => {
    if (!nav || !menuToggle) return;
    // iOS Safari fix: never let GSAP leave inline `visibility`/`opacity` on the
    // nav. Inline styles from a killed autoAlpha tween used to leave the menu
    // invisible / untappable on iPhone. State is now driven purely by the
    // .open class; GSAP only animates opacity + transform.
    if (hasGSAP) gsap.killTweensOf(nav);
    nav.style.removeProperty("visibility");
    nav.style.removeProperty("pointer-events");
    nav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("nav-open", open);

    if (hasGSAP && !reduced) {
      if (open) {
        gsap.fromTo(
          nav,
          { opacity: 0, y: -8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "power2.out",
            overwrite: true,
            clearProps: "opacity,transform",
          },
        );
      } else {
        gsap.set(nav, { clearProps: "opacity,transform" });
      }
    }
  };

  menuToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNavState(!nav?.classList.contains("open"));
  });

  // Close the menu when tapping outside it (iPhone-friendly)
  document.addEventListener("click", (e) => {
    if (!nav?.classList.contains("open")) return;
    if (nav.contains(e.target) || menuToggle?.contains(e.target)) return;
    setNavState(false);
  });

  // Smooth navigation — includes ScrollToPlugin when GSAP is available.
  function smoothTo(target) {
    if (!target) return;
    const header = $(".site-header");
    const y =
      target.getBoundingClientRect().top +
      window.scrollY -
      (header?.offsetHeight || 0) -
      8;
    if (hasScrollTo && !reduced) {
      gsap.to(window, {
        duration: 1.05,
        scrollTo: { y, autoKill: false },
        ease: "power3.inOut",
      });
    } else {
      window.scrollTo({
        top: Math.max(0, y),
        behavior: reduced ? "auto" : "smooth",
      });
    }
  }

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      let target = null;
      try {
        target = document.getElementById(href.slice(1)) || $(href);
      } catch (err) {
        target = null;
      }
      if (!target) return; // let the browser handle it natively
      e.preventDefault();
      setNavState(false);
      // Wait one frame so the closing menu doesn't change the layout mid-scroll
      requestAnimationFrame(() => smoothTo(target));
      if (history.replaceState) history.replaceState(null, "", href);
    });
  });

  // Active nav
  const sections = $$("main section[id]");
  const setActive = (id) =>
    navLinks.forEach((a) => {
      const active = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", active);
      a.setAttribute("aria-current", active ? "page" : "false");
    });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-35% 0px -55% 0px" },
  );
  sections.forEach((s) => observer.observe(s));

  // Scroll progress + back-to-top
  const progress = $("#scrollProgress");
  const backTop = $("#backTop");
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${pct}%`;
    if (backTop) backTop.classList.toggle("visible", window.scrollY > 650);
  };
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();
  backTop?.addEventListener("click", () => smoothTo($("#home")));

  // FAQ accordion
  $$(".faq-item").forEach((item) =>
    item.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      $$(".faq-item").forEach((other) => {
        other.classList.remove("open");
        other.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("open");
        item.setAttribute("aria-expanded", "true");
      }
    }),
  );

  // Reviews slider
  const reviews = $$(".review-card");
  const dotsWrap = $(".review-dots");
  let reviewIndex = 0;
  reviews.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = `review-dot${i === 0 ? " active" : ""}`;
    dot.setAttribute("aria-label", `Show review ${i + 1}`);
    dot.addEventListener("click", () => showReview(i));
    dotsWrap.appendChild(dot);
  });
  const dots = $$(".review-dot");

  function showReview(i) {
    reviewIndex = (i + reviews.length) % reviews.length;
    reviews.forEach((card, idx) => {
      card.classList.toggle("active", idx === reviewIndex);
      if (hasGSAP && !reduced) {
        gsap.to(card, {
          autoAlpha: idx === reviewIndex ? 1 : 0,
          y: idx === reviewIndex ? 0 : 15,
          duration: 0.35,
          overwrite: true,
        });
      }
    });
    dots.forEach((dot, idx) =>
      dot.classList.toggle("active", idx === reviewIndex),
    );
  }
  $(".prev")?.addEventListener("click", () => showReview(reviewIndex - 1));
  $(".next")?.addEventListener("click", () => showReview(reviewIndex + 1));

  // GSAP scroll reveal animations
  function initAnimations() {
    if (!hasGSAP || reduced) return;

    const revealGroups = [
      [".trust-item", { y: 28 }],
      [".story-visual", { x: -50 }],
      [".story-copy", { x: 50 }],
      [".process-card", { y: 35 }],
      [".gallery-item", { y: 35 }],
      [".faq-intro", { x: -35 }],
      [".faq-list", { x: 35 }],
      [".footer-title, .footer-item", { y: 25 }],
    ];

    revealGroups.forEach(([selector, from]) => {
      $$(selector).forEach((el) => {
        gsap.fromTo(
          el,
          { ...from, autoAlpha: 0 },
          {
            x: 0,
            y: 0,
            scale: 1,
            autoAlpha: 1,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });
    });

    $$(".section-heading").forEach((heading) => {
      gsap.fromTo(
        heading.children,
        { y: 22, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: heading, start: "top 86%", once: true },
        },
      );
    });

    // Hero opening animation — smooth text reveal + cake image entrance.
    // The mobile x-offset is intentionally smaller so the image never causes
    // a horizontal overflow while it animates into place.
    const isMobileHero = window.matchMedia("(max-width: 560px)").matches;
    const heroImageX = isMobileHero ? 32 : 80;

    gsap.set(".hero h1", { transformOrigin: "left center" });

    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .fromTo(
        ".site-header",
        { y: -20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55 },
      )
      .fromTo(
        ".hero .eyebrow",
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.38 },
        "-=.18",
      )
      .fromTo(
        ".hero h1",
        { y: 30, autoAlpha: 0, scale: 0.985 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.68, ease: "power4.out" },
        "-=.18",
      )
      .fromTo(
        ".hero-text",
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45 },
        "-=.30",
      )
      .fromTo(
        ".hero-actions",
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.42 },
        "-=.22",
      )
      .fromTo(
        ".hero-points",
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.42 },
        "-=.24",
      )
      .fromTo(
        ".hero-image-wrap",
        { x: heroImageX, scale: 0.94, autoAlpha: 0 },
        { x: 0, scale: 1, autoAlpha: 1, duration: 0.95, ease: "power4.out" },
        "-=.72",
      )
      .fromTo(
        ".hero-glow",
        { autoAlpha: 0, scale: 0.82 },
        { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" },
        "-=.75",
      )
      .fromTo(
        ".hero-orbit",
        { autoAlpha: 0, scale: 0.92 },
        { autoAlpha: 1, scale: 1, duration: 0.65, stagger: 0.08 },
        "-=.55",
      );

    // Our Special: two-row entrance with a gentle stagger.
    $$(".cake-row").forEach((row, rowIndex) => {
      gsap.fromTo(
        row.querySelectorAll(".product-card"),
        { y: 28, autoAlpha: 0, scale: 0.985 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.68,
          stagger: 0.075,
          ease: "power3.out",
          scrollTrigger: {
            trigger: row.closest(".cake-rows") || row,
            start: "top 92%",
            once: true,
          },
        },
      );
    });

    // Very subtle floating motion after the opening sequence.
    gsap.to(".hero-image-wrap", {
      y: -5,
      duration: 3.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(".hero-glow", {
      x: -22,
      y: 18,
      scale: 1.05,
      duration: 5.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    gsap.to(".hero-stamp", {
      y: 10,
      rotation: 14,
      duration: 3.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    gsap.to(".hero-card", {
      y: -9,
      duration: 3.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    // ---- Extra scroll-driven GSAP animations ----

    // Scroll progress bar at the top of the page.
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left center",
        scrollTrigger: {
          start: 0,
          end: () => document.body.scrollHeight - window.innerHeight,
          scrub: 0.3,
        },
      },
    );

    // Header condenses once the page is scrolled.
    ScrollTrigger.create({
      start: "top -80",
      onUpdate: (self) =>
        document
          .querySelector(".site-header")
          ?.classList.toggle("scrolled", self.scroll() > 80),
    });

    // Each cake row drifts in from an alternating side while scrolling.
    $$(".cake-row").forEach((row, i) => {
      gsap.fromTo(
        row,
        { x: i % 2 ? 60 : -60 },
        {
          x: 0,
          ease: "none",
          scrollTrigger: {
            trigger: row,
            start: "top 95%",
            end: "top 55%",
            scrub: 0.6,
          },
        },
      );
    });

    // Gentle parallax on the story and hero imagery.
    $$(".story-frame img, .about-visual img").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: img,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        },
      );
    });

    // Section headings get a soft scrub fade as they leave the viewport.
    $$("main section[id]").forEach((section) => {
      gsap.fromTo(
        section,
        { autoAlpha: 0.85 },
        {
          autoAlpha: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "top 60%",
            scrub: 0.5,
          },
        },
      );
    });

    $$(".gallery-item img").forEach((img) => {
      gsap.to(img, {
        yPercent: -5,
        ease: "none",
        scrollTrigger: {
          trigger: img.closest(".gallery-item"),
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
  }

  // Hover micro-interactions
  if (!reduced && hasGSAP) {
    $$(".btn,.category,.wa-enquire,.slider-btn,.back-top").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (!el.disabled)
          gsap.to(el, { y: -2, duration: 0.2, overwrite: true });
      });
      el.addEventListener("mouseleave", () =>
        gsap.to(el, { y: 0, duration: 0.22, overwrite: true }),
      );
    });
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
  initAnimations();
})();

/* ---- OUR SPECIAL category filter (second row only) ---- */
(() => {
  const init = () => {
    const chips = [...document.querySelectorAll(".row-filters .filter-chip")];
    // Target the row that lives in the same .cake-rows container as the
    // filter bar (the third row), not a hardcoded page-wide row index.
    const filterBar = document.querySelector(".row-filters");
    const secondRow =
      filterBar && filterBar.nextElementSibling?.matches(".cake-row")
        ? filterBar.nextElementSibling
        : null;
    if (!chips.length || !secondRow) return;
    const cards = [...secondRow.querySelectorAll(".product-card")];

    const apply = (filter) => {
      cards.forEach((card) => {
        const show = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !show);
      });
      const visible = secondRow.querySelectorAll(
        ".product-card:not(.is-hidden)",
      ).length;
      secondRow.classList.toggle("is-empty", visible === 0);
      secondRow.scrollLeft = 0;
      if (secondRow._marqueeState) {
        // Restart the row at the same end its marquee originally starts
        // from: the first row travels end -> start, every later row
        // travels cakes -> nuts.
        const allRows = [...document.querySelectorAll(".cake-rows .cake-row")];
        const rowTwo = allRows.indexOf(secondRow) >= 1;
        const max = Math.max(secondRow.scrollWidth - secondRow.clientWidth, 0);
        secondRow._marqueeState.dir = rowTwo ? 1 : -1;
        secondRow._marqueeState.offset = rowTwo ? 0 : max;
        secondRow.scrollLeft = secondRow._marqueeState.offset;
        secondRow._marqueeState.last = performance.now();
      }
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.toggle("is-active", c === chip));
        apply(chip.dataset.filter);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/* ---- Grid row category filter (fourth row only) ---- */
(() => {
  const init = () => {
    const chips = [...document.querySelectorAll(".row-filters-grid .filter-chip")];
    const grid = document.querySelector(".cake-grid");
    if (!chips.length || !grid) return;
    const cards = [...grid.querySelectorAll(".product-card")];

    const apply = (filter) => {
      cards.forEach((card) => {
        const show = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !show);
      });
      // Hiding cards changes the page height, so every scroll-driven
      // animation (section fades, parallax, progress bar) must be
      // recalculated — otherwise the sections below the grid keep their
      // stale positions and stay invisible.
      if (typeof window.ScrollTrigger !== "undefined") {
        window.ScrollTrigger.refresh();
      }
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.toggle("is-active", c === chip));
        apply(chip.dataset.filter);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ---- Scroll to top button ---- */
(() => {
  const init = () => {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;

    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      btn.classList.toggle("is-visible", scrolled > 300);
    };

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
