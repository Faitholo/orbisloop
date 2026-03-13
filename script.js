/* ===================================================
   OrbisLoop — Minimal JavaScript
   Handles: nav, scroll animations, counters, form
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ----- Mobile Navigation Toggle -----
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close mobile nav when a link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // ----- Navbar scroll effect -----
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (nav) {
      if (currentScroll > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // ----- Scroll Fade-Up Animations (Intersection Observer) -----
  const fadeElements = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(el => fadeObserver.observe(el));
  } else {
    // Fallback: show all elements immediately
    fadeElements.forEach(el => el.classList.add('visible'));
  }

  // ----- Animated Counter (Social Proof: 0 → 100) -----
  const counterEl = document.querySelector('.counter');

  if (counterEl && 'IntersectionObserver' in window) {
    let counterStarted = false;

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counterStarted) {
          counterStarted = true;
          animateCounter(counterEl, 0, 100, 2000);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterObserver.observe(counterEl);
  }

  // ----- Animated Stat Counters (Problem Section) -----
  const statCounters = document.querySelectorAll('.counter-stat');

  if (statCounters.length && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const decimals = parseInt(el.dataset.decimals) || 0;
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';

          animateStatCounter(el, 0, target, 2000, decimals, prefix, suffix);
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statCounters.forEach(el => statObserver.observe(el));
  }

  // ----- Counter Animation Functions -----
  function animateCounter(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * eased);

      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = end;
      }
    }

    requestAnimationFrame(update);
  }

  function animateStatCounter(element, start, end, duration, decimals, prefix, suffix) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      element.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = prefix + end.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // ----- Generic Buttondown form handler (no redirect) -----
  function handleButtondownForm(formEl, successEl) {
    if (!formEl) return;

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = formEl.querySelector('button[type="submit"]');
      const originalHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Submitting&hellip;</span>';
      }

      const formData = new FormData(formEl);

      fetch(formEl.action, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      })
      .then(() => {
        formEl.style.display = 'none';
        if (successEl) successEl.style.display = 'block';
      })
      .catch(() => {
        // no-cors won't give us a readable response, treat as success
        formEl.style.display = 'none';
        if (successEl) successEl.style.display = 'block';
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
      });
    });
  }

  // ----- Waitlist Form -----
  handleButtondownForm(
    document.getElementById('waitlist-form'),
    document.getElementById('form-success')
  );

  // ----- Pilot Form Toggle + Handling -----
  const pilotToggleBtn = document.getElementById('pilot-toggle-btn');
  const pilotFormWrapper = document.getElementById('pilot-form-wrapper');

  if (pilotToggleBtn && pilotFormWrapper) {
    pilotToggleBtn.addEventListener('click', () => {
      const isVisible = pilotFormWrapper.style.display !== 'none';
      pilotFormWrapper.style.display = isVisible ? 'none' : 'block';
      pilotToggleBtn.style.display = isVisible ? '' : 'none';
    });
  }

  handleButtondownForm(
    document.getElementById('pilot-form'),
    document.getElementById('pilot-form-success')
  );

  // ----- Smooth Scroll for anchor links (fallback for older browsers) -----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 0;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

});
