const toggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('.site-nav');

if (toggle && navigation) {
  const serviceMenu = navigation.querySelector('[data-service-menu]');
  const serviceToggle = serviceMenu?.querySelector('summary');
  const serviceGroup = serviceMenu?.closest('.nav-group');

  const closeServiceMenu = () => {
    if (serviceMenu) serviceMenu.open = false;
  };

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    closeServiceMenu();
  };

  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    } else {
      toggle.setAttribute('aria-expanded', 'true');
    }
  });

  navigation.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    if (toggle.getAttribute('aria-expanded') === 'true') {
      toggle.focus();
    } else if (serviceMenu?.open && serviceMenu.contains(event.target)) {
      serviceToggle.focus();
    }
    closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (serviceMenu?.open && !serviceGroup.contains(event.target)) closeServiceMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (serviceMenu?.open && serviceGroup.contains(document.activeElement)) {
      closeServiceMenu();
      serviceToggle.focus();
    } else if (toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    } else {
      closeServiceMenu();
    }
  });

  window.matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);
  toggle.hidden = false;
}

const contactForm = document.querySelector('[data-contact-form]');

if (contactForm) {
  if (contactForm.action.startsWith('mailto:')) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const fields = new FormData(contactForm);
      const name = fields.get('name').trim();
      const email = fields.get('email').trim();
      const message = fields.get('message').trim();
      const subject = encodeURIComponent('Anfrage zur Ergotherapie');
      const body = encodeURIComponent(
        [`Name: ${name}`, `E-Mail: ${email}`, '', message]
          .join('\n')
          .replace(/\r\n?|\n/g, '\r\n')
      );
      window.location.href = `${contactForm.action}?subject=${subject}&body=${body}`;
    });
  } else {
    contactForm.querySelector('[data-contact-note]').hidden = true;
    contactForm.querySelector('[data-contact-submit]').textContent = 'Anfrage senden';
  }

  contactForm.hidden = false;
}
