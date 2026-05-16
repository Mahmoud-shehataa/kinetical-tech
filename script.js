const body = document.body;
const html = document.documentElement;
const langButton = document.querySelector('.lang-toggle');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#navLinks');
const contactForm = document.querySelector('.contact-form');

// Focus trap helpers for mobile menu
let lastFocusedElement = null;
let focusHandler = null;
let focusTrapActive = false;
const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container) {
  lastFocusedElement = document.activeElement;
  const focusables = Array.from(container.querySelectorAll(focusableSelectors));
  if (focusables.length) focusables[0].focus();
  focusTrapActive = true;
  focusHandler = (e) => {
    if (!focusTrapActive || e.key !== 'Tab') return;
    const f = focusables;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', focusHandler);
}

function releaseTrap() {
  focusTrapActive = false;
  if (focusHandler) document.removeEventListener('keydown', focusHandler);
  if (lastFocusedElement) lastFocusedElement.focus();
}

// Language switching with smooth content handling
function applyLanguage(lang) {
  const isAr = lang === 'ar';
  
  // Set HTML/Body standard attributes
  body.classList.toggle('lang-ar', isAr);
  body.dir = isAr ? 'rtl' : 'ltr';
  body.lang = isAr ? 'ar' : 'en';
  html.dir = body.dir;
  html.lang = body.lang;
  
  // Update toggle button accessible label
  langButton.textContent = isAr ? 'EN' : 'عربي';
  langButton.setAttribute('aria-label', isAr ? 'Switch to English' : 'التبديل للعربية');
  
  // Replace localized text strings
  document.querySelectorAll('[data-i18n-en]').forEach((node) => {
    node.textContent = isAr ? node.dataset.i18nAr : node.dataset.i18nEn;
  });

  // Show/hide elements that use `data-lang="en"/"ar"` to avoid duplicated bilingual text
  document.querySelectorAll('[data-lang]').forEach((node) => {
    const nodeLang = node.getAttribute('data-lang');
    const show = nodeLang === (isAr ? 'ar' : 'en');
    node.hidden = !show;
    node.setAttribute('aria-hidden', String(!show));
  });
  
  // Persist user preference securely
  localStorage.setItem('kinetical-lang', lang);
}

// Toggle listener
langButton.addEventListener('click', () => {
  applyLanguage(body.classList.contains('lang-ar') ? 'en' : 'ar');
});

// Scrolled header state listener
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Mobile menu toggle
menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? (body.classList.contains('lang-ar') ? 'إغلاق القائمة' : 'Close menu') : (body.classList.contains('lang-ar') ? 'فتح القائمة' : 'Open menu'));

  // Prevent background scroll while menu is open and mark rest of page inert for assistive tech
  document.body.style.overflow = open ? 'hidden' : '';
  document.querySelectorAll('main, .footer, .site-header:not(.nav)').forEach(el => {
    if (el) el.setAttribute('aria-hidden', String(open));
  });

  if (open) {
    // focus first focusable item inside the menu and trap focus
    const focusable = navLinks.querySelectorAll(focusableSelectors);
    if (focusable.length) focusable[0].focus();
    trapFocus(navLinks);
  } else {
    releaseTrap();
    menuButton.focus();
  }
});

// Close mobile menu on link navigation
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', body.classList.contains('lang-ar') ? 'فتح القائمة' : 'Open menu');
  });
});

// Close menu on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', body.classList.contains('lang-ar') ? 'فتح القائمة' : 'Open menu');
    menuButton.focus();
  }
});

// Premium Reveal Animation via Intersection Observer
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.12
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      // Unobserve once revealed to maintain final state
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all reveal sections safely
document.querySelectorAll('.reveal').forEach((el) => {
  observer.observe(el);
});

// Interactive Form Submit Demonstration Handler
if (contactForm) {
  // Validate on blur (not keystroke); show error only after user finishes input
  contactForm.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      input.classList.add('touched');
      input.setAttribute('aria-invalid', String(!input.checkValidity()));
    });
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!contactForm.checkValidity()) {
        e.stopPropagation();
        contactForm.classList.add('was-validated');

        // Remove previous error region
        const prevErr = contactForm.querySelector('.form-errors');
        if (prevErr) prevErr.remove();

        const errWrap = document.createElement('div');
        errWrap.className = 'form-errors';
        errWrap.setAttribute('role', 'alert');
        errWrap.setAttribute('aria-live', 'assertive');

        const invalids = Array.from(contactForm.querySelectorAll('input, textarea')).filter(i => !i.checkValidity());
        invalids.forEach(i => {
          i.setAttribute('aria-invalid', 'true');
          const msg = document.createElement('div');
          msg.className = 'field-error';
          msg.textContent = i.validationMessage || (body.classList.contains('lang-ar') ? 'الرجاء ملء الحقل بشكل صحيح' : 'Please fill out this field correctly.');
          errWrap.appendChild(msg);
        });

        contactForm.prepend(errWrap);
        if (invalids.length) invalids[0].focus();
        return;
    }
    const isAr = body.classList.contains('lang-ar');
    const btn = contactForm.querySelector('button[type="submit"]');
    
    if (btn.disabled) return;
    
    // Target inner text span if present to preserve SVG icon during live updates
    const textTarget = btn.querySelector('.btn-text') || btn;
    const iconTarget = btn.querySelector('.btn-icon use');
    const originalText = textTarget.textContent;
    const originalIcon = iconTarget ? iconTarget.getAttribute('href') : '';
    
    // 1. Enter disabled loading state during async processing
    btn.disabled = true;
    textTarget.textContent = isAr ? 'جاري الإرسال...' : 'Sending...';
    if(iconTarget) iconTarget.setAttribute('href', '#icon-spinner');
    btn.style.cursor = 'wait';
    btn.style.opacity = '0.8';
    
    // Simulated async network delay before success confirmation
    setTimeout(() => {
      // 2. Success visual confirmation feedback
      textTarget.textContent = isAr ? '✓ تم الإرسال بنجاح' : '✓ Sent Successfully';
      if(iconTarget) iconTarget.setAttribute('href', ''); // hide icon on success or keep it hidden
      btn.style.background = 'var(--aqua)';
      btn.style.color = 'var(--black)';
      btn.style.cursor = 'default';
      btn.style.opacity = '1';
      
      setTimeout(() => {
        // Accessible inline success message (avoid blocking alert())
        const prevSuccess = contactForm.querySelector('.form-success');
        if (prevSuccess) prevSuccess.remove();
        const success = document.createElement('div');
        success.className = 'form-success';
        success.setAttribute('role', 'status');
        success.setAttribute('aria-live', 'polite');
        success.textContent = isAr ? 'شكراً لك! تم استلام طلبك وسنتواصل معك قريباً.' : 'Thank you! Your consultation request has been received. Our team will contact you shortly.';
        contactForm.prepend(success);

        // Clear form state after short delay and restore button
        setTimeout(() => {
          contactForm.reset();
          contactForm.classList.remove('was-validated');
          contactForm.querySelectorAll('.touched').forEach(input => input.classList.remove('touched'));
          contactForm.querySelectorAll('[aria-invalid="true"]').forEach(i => i.setAttribute('aria-invalid', 'false'));
          // Restore standard interaction states
          btn.disabled = false;
          textTarget.textContent = originalText;
          if(iconTarget) iconTarget.setAttribute('href', originalIcon);
          btn.style.background = '';
          btn.style.color = '';
          btn.style.cursor = '';
          // Remove success message after a little while
          setTimeout(() => success.remove(), 3500);
        }, 700);
      }, 800);
    }, 800);
  });
}

// Initialization on DOM ready
applyLanguage(localStorage.getItem('kinetical-lang') || 'en');
