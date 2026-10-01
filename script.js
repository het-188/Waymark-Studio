/* ═══════════════════════════════════════════════════════════
   WAYMARK STUDIO — JAVASCRIPT
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────
// UTILITY
// ──────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** SVG <use> icon helper */
function svgIcon(id, cls = '') {
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
}

/** Trap focus within a dialog */
function trapFocus(el) {
  const focusable = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', el)
    .filter(e => !e.disabled);
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }
  el.addEventListener('keydown', handler);
  requestAnimationFrame(() => first.focus());
  return () => el.removeEventListener('keydown', handler);
}

// ──────────────────────────────────────────
// PAGE PRELOADER & IMAGE CACHE
// ──────────────────────────────────────────

(function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  const criticalImages = [
    'images/cafe-collage.png',
    'images/qr-menu-collage.jpeg',
    'images/brand-collage.png',
  ];

  let loadedCount = 0;
  let dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    loader.classList.add('loaded');
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 450);
  }

  // Preload critical hero images
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = img.onerror = () => {
      loadedCount++;
      if (loadedCount >= criticalImages.length) {
        dismiss();
      }
    };
  });

  // Ensure dismiss when window completes loading
  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
  }

  // Safety fallback: maximum 1.5s so visitors are never delayed
  setTimeout(dismiss, 1500);
})();

// ──────────────────────────────────────────
// STICKY HEADER
// ──────────────────────────────────────────

(function initHeader() {
  const header = $('#site-header');
  if (!header) return;

  function update() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ──────────────────────────────────────────
// ACTIVE NAV
// ──────────────────────────────────────────

(function initActiveNav() {
  const sections  = $$('section[id]');
  const navLinks  = $$('.main-nav a');
  if (!sections.length || !navLinks.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
})();

// ──────────────────────────────────────────
// MOBILE MENU
// ──────────────────────────────────────────

(function initMobileMenu() {
  const btn   = $('.mobile-menu-btn');
  const menu  = $('#mobile-menu');
  const links = $$('.mobile-nav-link');
  if (!btn || !menu) return;

  let releaseFocus = null;
  let isOpen = false;

  function open() {
    isOpen = true;
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      menu.style.visibility = 'visible';
      menu.style.pointerEvents = 'auto';
    });
    releaseFocus = trapFocus(menu);
  }

  function close() {
    isOpen = false;
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menu.style.visibility = 'hidden';
    menu.style.pointerEvents = 'none';
    setTimeout(() => { if (!isOpen) menu.hidden = true; }, 500);
    if (releaseFocus) { releaseFocus(); releaseFocus = null; }
    btn.focus();
  }

  btn.addEventListener('click', () => isOpen ? close() : open());
  links.forEach(l => l.addEventListener('click', () => { if (isOpen) close(); }));

  const mobileCta = $('.mobile-cta-btn');
  if (mobileCta) mobileCta.addEventListener('click', () => { if (isOpen) close(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close();
  });
})();

// ──────────────────────────────────────────
// SCROLL REVEAL
// ──────────────────────────────────────────

(function initReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = $$('.reveal-up, .reveal-left, .reveal-right, .reveal-fade');

  if (prefersReduced) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
})();

// ──────────────────────────────────────────
// SMOOTH SCROLL
// ──────────────────────────────────────────

document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  const headerH = document.getElementById('site-header')?.offsetHeight || 72;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
  window.scrollTo({ top, behavior: 'smooth' });
});



// ──────────────────────────────────────────
// FAQ ACCORDION
// ──────────────────────────────────────────

(function initFAQ() {
  $$('.faq-question').forEach(btn => {
    const answer = document.getElementById(btn.getAttribute('aria-controls'));
    if (!answer) return;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      answer.hidden = expanded;
    });

    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });
})();

// ──────────────────────────────────────────
// PORTFOLIO / PROJECT MODAL
// ──────────────────────────────────────────

const PROJECTS = {
  cafe: {
    title:       'Roast &amp; Co.',
    category:    'Café',
    services:    ['Website', 'QR Menu', 'Brand Identity'],
    bgClass:     'portfolio-img--cafe',
    description: 'A complete digital overhaul for a specialty coffee shop. We built a fast, mobile-first website with a fully digital QR menu system and an updated brand identity that works across signage, packaging and social media.',
    scope:       ['Website design & development', 'QR menu system', 'Logo refresh', 'Social media templates', 'Hosting & maintenance'],
  },
  restaurant: {
    title:       'Ember',
    category:    'Restaurant',
    services:    ['Brand Identity', 'Menu System', 'Social Media'],
    bgClass:     'portfolio-img--restaurant',
    description: 'A full brand identity and visual system for a new mid-scale restaurant. The project covered logo design, a complete color and typography system, printed and digital menus, and an ongoing social media creative package.',
    scope:       ['Brand identity system', 'Logo design', 'Printed menu design', 'QR digital menu', 'Social media templates'],
  },
  retail: {
    title:       'Elevate Threads',
    category:    'Retail',
    services:    ['Website', 'Brand Refresh', 'Packaging'],
    bgClass:     'portfolio-img--retail',
    description: 'A brand refresh and website for a contemporary apparel brand. We modernized the brand identity, designed a clean product-focused website, and developed packaging templates aligned with the updated visual system.',
    scope:       ['Brand refresh', 'Website design & development', 'Packaging design', 'Product photography direction'],
  },
  service: {
    title:       'Wellspring Clinic',
    category:    'Local Service',
    services:    ['Website', 'Lead Generation', 'Local SEO'],
    bgClass:     'portfolio-img--clinic',
    description: 'A professional website and local discoverability setup for a physiotherapy clinic. Designed to build trust, explain services clearly and convert visitors into appointment bookings.',
    scope:       ['Website design & development', 'Appointment booking form', 'Google Business Profile setup', 'Local SEO foundations'],
  },
};

(function initPortfolio() {
  const modal    = $('#project-modal');
  const content  = $('#modal-content');
  const backdrop = modal?.querySelector('.modal-backdrop');
  const closeBtn = modal?.querySelector('.modal-close');
  let releaseFocus = null;

  function openModal(key) {
    const p = PROJECTS[key];
    if (!p || !modal || !content) return;

    content.innerHTML = `
      <div class="modal-project-hero ${p.bgClass}"></div>
      <p class="modal-project-label">${p.category}</p>
      <h2 id="modal-title">${p.title}</h2>
      <p class="modal-desc">${p.description}</p>
      <div class="modal-tags">${p.services.map(s => `<span class="modal-tag">${s}</span>`).join('')}</div>
      <div class="modal-scope">
        <p class="modal-scope-label">Scope of Work</p>
        <ul>${p.scope.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <p class="modal-demo-note">Demo project — representative of the work we deliver.</p>
      <div style="margin-top:2rem;">
        <a href="#contact" class="btn btn-primary modal-cta">Start a similar project</a>
      </div>
    `;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    releaseFocus = trapFocus(modal);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (releaseFocus) { releaseFocus(); releaseFocus = null; }
  }

  $$('.portfolio-item').forEach(item => {
    item.querySelector('.portfolio-item-inner')?.addEventListener('click', () => {
      openModal(item.dataset.project);
    });
  });

  backdrop?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  modal?.addEventListener('click', e => {
    if (e.target.classList.contains('modal-cta')) closeModal();
  });
})();

// ──────────────────────────────────────────
// QR MENU DEMO
// ──────────────────────────────────────────

// SVG icons keyed by category
const CAT_ICONS = {
  coffee:   'icon-coffee',
  food:     'icon-food',
  cold:     'icon-cold',
  desserts: 'icon-dessert',
};

const MENU_ITEMS = [
  { id:  1, name: 'Flat White',       desc: 'Smooth espresso, silky milk',          price: 180, cat: 'coffee'   },
  { id:  2, name: 'Cortado',          desc: 'Equal espresso and steamed milk',       price: 160, cat: 'coffee'   },
  { id:  3, name: 'Pour Over',        desc: 'Single origin, hand-brewed',            price: 200, cat: 'coffee'   },
  { id:  4, name: 'Cold Brew',        desc: '18-hour slow brew, served chilled',     price: 190, cat: 'cold'     },
  { id:  5, name: 'Iced Latte',       desc: 'Espresso over cold milk and ice',       price: 170, cat: 'cold'     },
  { id:  6, name: 'Mango Cooler',     desc: 'Fresh mango, lime and sparkling water', price: 150, cat: 'cold'     },
  { id:  7, name: 'Avocado Toast',    desc: 'Sourdough, smashed avo, chilli flakes', price: 280, cat: 'food'     },
  { id:  8, name: 'Banana Bread',     desc: 'Warm slice, served with butter',        price: 160, cat: 'food'     },
  { id:  9, name: 'Eggs Benedict',    desc: 'Poached, hollandaise, ham',             price: 320, cat: 'food'     },
  { id: 10, name: 'Almond Croissant', desc: 'Flaky, filled with almond cream',       price: 180, cat: 'food'     },
  { id: 11, name: 'Lemon Tart',       desc: 'Sharp curd, buttery pastry shell',      price: 200, cat: 'desserts' },
  { id: 12, name: 'Chocolate Pot',    desc: 'Dark chocolate mousse, sea salt',       price: 220, cat: 'desserts' },
  { id: 13, name: 'Cookie Plate',     desc: 'Three freshly baked cookies',           price: 160, cat: 'desserts' },
];

(function initQRDemo() {
  const menuList          = $('#qr-menu-list');
  const searchInput       = $('#qr-search');
  const catBtns           = $$('.qr-cat');
  const orderBar          = $('#qr-order-bar');
  const orderCount        = $('#qr-order-count');
  const orderTotal        = $('#qr-order-total');
  const viewOrderBtn      = $('#qr-view-order');
  const orderModal        = $('#order-modal');
  const closeOrderBtn     = $('#close-order-modal');
  const resetOrderBtn     = $('#reset-order-btn');
  const orderItemsList    = $('#order-items-list');
  const orderModalTotal   = $('#order-modal-total');
  const productModal      = $('#product-modal');
  const closeProductBtn   = $('#close-product-modal');
  const productModalContent = $('#product-modal-content');

  if (!menuList) return;

  let currentCat  = 'all';
  let searchQuery = '';
  const order     = {};

  // ── Render ──
  function renderMenu() {
    const items = MENU_ITEMS.filter(item => {
      const matchCat    = currentCat === 'all' || item.cat === currentCat;
      const matchSearch = item.name.toLowerCase().includes(searchQuery) ||
                          item.desc.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    menuList.innerHTML = '';

    if (!items.length) {
      menuList.innerHTML = '<p class="qr-no-results">No items found.</p>';
      return;
    }

    items.forEach(item => {
      const iconId = CAT_ICONS[item.cat] || 'icon-food';
      const el = document.createElement('div');
      el.className = 'qr-menu-item';
      el.setAttribute('role', 'listitem');
      el.innerHTML = `
        <div class="qr-item-icon" aria-hidden="true">
          ${svgIcon(iconId)}
        </div>
        <div class="qr-item-info">
          <div class="qr-item-name">${item.name}</div>
          <div class="qr-item-desc">${item.desc}</div>
        </div>
        <div class="qr-item-price">&#8377;${item.price}</div>
        <button class="qr-add-btn" data-id="${item.id}" aria-label="Add ${item.name} to order">
          ${svgIcon('icon-plus')}
        </button>
      `;
      el.addEventListener('click', e => {
        if (e.target.closest('.qr-add-btn')) return;
        openProductModal(item);
      });
      el.querySelector('.qr-add-btn').addEventListener('click', e => {
        e.stopPropagation();
        addToOrder(item.id);
      });
      menuList.appendChild(el);
    });
  }

  // ── Category filter ──
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.cat;
      catBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      renderMenu();
    });
  });

  // ── Search ──
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderMenu();
  });

  // ── Order management ──
  function addToOrder(id) {
    order[id] = (order[id] || 0) + 1;
    updateOrderBar();
  }

  function getTotal() {
    return Object.entries(order).reduce((sum, [id, qty]) => {
      const item = MENU_ITEMS.find(i => i.id === +id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }

  function getCount() {
    return Object.values(order).reduce((s, q) => s + q, 0);
  }

  function updateOrderBar() {
    const count = getCount();
    if (!orderBar) return;
    orderBar.hidden = count === 0;
    if (count > 0) {
      if (orderCount) orderCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
      if (orderTotal) orderTotal.textContent  = `\u20B9${getTotal()}`;
    }
  }

  // ── Order modal ──
  function renderOrderModal() {
    if (!orderItemsList || !orderModalTotal) return;
    const entries = Object.entries(order).filter(([, q]) => q > 0);
    orderItemsList.innerHTML = entries.map(([id, qty]) => {
      const item = MENU_ITEMS.find(i => i.id === +id);
      if (!item) return '';
      return `<div class="order-line-item">
        <span>${item.name} <span class="order-item-qty">×${qty}</span></span>
        <span>\u20B9${item.price * qty}</span>
      </div>`;
    }).join('');
    orderModalTotal.textContent = `\u20B9${getTotal()}`;
  }

  viewOrderBtn?.addEventListener('click', () => {
    renderOrderModal();
    if (orderModal) orderModal.hidden = false;
  });

  closeOrderBtn?.addEventListener('click', () => { if (orderModal) orderModal.hidden = true; });
  orderModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => { orderModal.hidden = true; });

  resetOrderBtn?.addEventListener('click', () => {
    Object.keys(order).forEach(k => delete order[k]);
    updateOrderBar();
    if (orderModal) orderModal.hidden = true;
  });

  // ── Product modal ──
  function openProductModal(item) {
    if (!productModal || !productModalContent) return;
    const iconId = CAT_ICONS[item.cat] || 'icon-food';
    productModalContent.innerHTML = `
      <div class="product-icon-large">${svgIcon(iconId)}</div>
      <h3 class="product-modal-name" id="product-modal-title">${item.name}</h3>
      <p class="product-modal-desc">${item.desc}</p>
      <p class="product-modal-price">\u20B9${item.price}</p>
      <button class="product-modal-add" data-id="${item.id}">Add to Order</button>
    `;
    productModal.hidden = false;
    productModalContent.querySelector('.product-modal-add').addEventListener('click', () => {
      addToOrder(item.id);
      productModal.hidden = true;
    });
  }

  closeProductBtn?.addEventListener('click', () => { if (productModal) productModal.hidden = true; });
  productModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => { productModal.hidden = true; });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (orderModal   && !orderModal.hidden)   orderModal.hidden   = true;
      if (productModal && !productModal.hidden) productModal.hidden = true;
    }
  });

  renderMenu();
})();

// ──────────────────────────────────────────
// CONTACT FORM — WHATSAPP INTEGRATION
// ──────────────────────────────────────────

(function initContactForm() {
  const form       = $('#contact-form');
  const submitBtn  = $('#submit-btn');
  const btnText    = submitBtn?.querySelector('.btn-text');
  const successBox = $('#form-success');
  if (!form) return;

  let submitted = false;

  // WhatsApp number (country code + number, no spaces or +)
  const WA_NUMBER = '918421804188';

  // ── Validators ──
  function validateField(field) {
    const id    = field.id;
    const val   = field.value.trim();
    const errId = 'error-' + id.replace('field-', '');
    const errorEl = document.getElementById(errId);
    let msg = '';

    if (field.required && !val) {
      msg = 'This field is required.';
    } else if (id === 'field-email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      msg = 'Please enter a valid email address.';
    } else if (id === 'field-message' && val && val.length < 10) {
      msg = 'Please add a bit more detail (at least 10 characters).';
    }

    if (errorEl) errorEl.textContent = msg;
    field.classList.toggle('error', !!msg);
    return !msg;
  }

  $$('input[required], textarea[required]', form).forEach(f => {
    f.addEventListener('blur', () => validateField(f));
    f.addEventListener('input', () => { if (f.classList.contains('error')) validateField(f); });
  });

  // ── Build WhatsApp message ──
  function buildWAMessage(data) {
    const services = data.services.length ? data.services.join(', ') : 'Not specified';
    return [
      '*New Enquiry — Waymark Studio*',
      '',
      `*Name:* ${data.name}`,
      `*Business:* ${data.business_name}`,
      `*Email:* ${data.email}`,
      data.phone ? `*Phone:* ${data.phone}` : '',
      data.business_type ? `*Business Type:* ${data.business_type}` : '',
      `*Services Needed:* ${services}`,
      data.budget   ? `*Budget:* ${data.budget}`    : '',
      data.timeline ? `*Timeline:* ${data.timeline}` : '',
      '',
      `*Message:*`,
      data.message,
    ].filter(line => line !== undefined).join('\n');
  }

  // ── Submit ──
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (submitted) return;

    // Validate required fields
    const required = $$('input[required], textarea[required]', form);
    let allValid = true;
    required.forEach(f => { if (!validateField(f)) allValid = false; });
    if (!allValid) {
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    submitted = true;
    if (submitBtn) submitBtn.disabled = true;
    if (btnText)   btnText.textContent = 'Sending Enquiry…';

    const data = {
      name:          $('#field-name')?.value.trim()          || '',
      business_name: $('#field-business')?.value.trim()      || '',
      email:         $('#field-email')?.value.trim()         || '',
      phone:         $('#field-phone')?.value.trim()         || '',
      business_type: $('#field-business-type')?.value        || '',
      budget:        $('#field-budget')?.value               || '',
      timeline:      $('#field-timeline')?.value             || '',
      services:      $$('input[name="services"]:checked', form).map(c => c.value),
      message:       $('#field-message')?.value.trim()       || '',
    };

    const message    = buildWAMessage(data);
    const waURL      = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

    // Submit to Netlify Forms in background
    try {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      }).catch(() => {});
    } catch (_) {}

    // Show success, then smoothly route to communication channel
    form.hidden = true;
    if (successBox) successBox.hidden = false;

    setTimeout(() => {
      window.open(waURL, '_blank', 'noopener,noreferrer');
    }, 600);
  });
})();

// ──────────────────────────────────────────
// PNG LOGO LOADER & FALLBACK HANDLER
// ──────────────────────────────────────────

(function initLogoLoader() {
  function handleLogo(img) {
    const icon = img.closest('.logo')?.querySelector('.fallback-logo-icon');
    if (img.naturalWidth > 0) {
      img.style.display = 'block';
      if (icon) icon.style.display = 'none';
    } else {
      img.style.display = 'none';
      if (icon) icon.style.display = 'inline-flex';
    }
  }

  $$('.site-logo-img').forEach(img => {
    if (img.complete) {
      handleLogo(img);
    } else {
      img.addEventListener('load', () => handleLogo(img));
      img.addEventListener('error', () => handleLogo(img));
    }
  });
})();

// ──────────────────────────────────────────
// DIAGRAM REVEAL
// ──────────────────────────────────────────

(function initDiagram() {
  const steps = $$('.diagram-step');
  if (!steps.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  steps.forEach((step, i) => {
    Object.assign(step.style, {
      opacity: '0',
      transform: 'translateY(10px)',
      transition: `opacity 0.45s ease, transform 0.45s ease`,
      transitionDelay: `${i * 90}ms`,
    });
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        steps.forEach(step => {
          step.style.opacity   = '1';
          step.style.transform = 'translateY(0)';
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.25 });

  const track = $('.diagram-track');
  if (track) obs.observe(track);
})();

// ──────────────────────────────────────────
// SYNC HEADER HEIGHT
// ──────────────────────────────────────────

(function syncHeaderHeight() {
  const header = $('#site-header');
  if (!header) return;
  const update = () => {
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  };
  update();
  window.addEventListener('resize', update, { passive: true });
  new ResizeObserver(update).observe(header);
})();
