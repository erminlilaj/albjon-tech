const translations = window.ALBJON_TRANSLATIONS || {};
const languageMeta = {
  en: { flag: 'EN', label: 'English' },
  fr: { flag: 'FR', label: 'Francais' },
  nl: { flag: 'NL', label: 'Vlaams' },
};

let activeLang = getStoredLang() || 'en';
let skillsVisible = false;

const grid = document.getElementById('hexGrid');
const sg = document.getElementById('skillsGrid');
const nav = document.querySelector('nav');
const menuToggle = document.querySelector('.menu-toggle');
const languageSwitch = document.getElementById('languageSwitch');
const languageTrigger = document.getElementById('languageTrigger');
const languageMenu = document.getElementById('languageMenu');
const languageFlag = document.querySelector('[data-lang-flag]');
const languageLabel = document.querySelector('[data-lang-label]');

const levels = ['on','on','on','mid','mid','off','off','mid','on','on','mid','off','on','on','on','mid','off','off','on','mid','on','on','on','mid'];

levels.forEach(level => {
  const cell = document.createElement('div');
  cell.className = `hex ${level}`;
  grid?.appendChild(cell);
});

function getStoredLang() {
  try {
    return localStorage.getItem('albjon_language');
  } catch {
    return null;
  }
}

function storeLang(lang) {
  try {
    localStorage.setItem('albjon_language', lang);
  } catch {
    // The language switch still works when storage is unavailable.
  }
}

function currentCopy() {
  return translations[activeLang] || translations.en || {};
}

function translate(key) {
  return currentCopy()[key] ?? translations.en?.[key] ?? '';
}

function renderSkills() {
  const skills = translate('skills');
  if (!sg) return;

  sg.innerHTML = '';
  if (!Array.isArray(skills)) return;

  skills.forEach(skill => {
    const chip = document.createElement('div');
    chip.className = skillsVisible ? 'skill-chip is-visible' : 'skill-chip';

    const name = document.createElement('div');
    name.className = 'skill-name';
    name.textContent = skill.name;

    const domain = document.createElement('div');
    domain.className = 'skill-domain';
    domain.textContent = skill.domain || translate('skillDomainSpecialist');

    chip.append(name, domain);
    sg.appendChild(chip);
  });
}

function setLanguage(lang) {
  activeLang = translations[lang] ? lang : 'en';
  const copy = currentCopy();
  const meta = languageMeta[activeLang] || languageMeta.en;

  document.documentElement.lang = copy.lang || activeLang;
  document.title = translate('pageTitle');
  languageSwitch?.setAttribute('aria-label', translate('switchLabel'));
  languageMenu?.setAttribute('aria-label', translate('switchLabel'));
  if (languageFlag) languageFlag.textContent = meta.flag;
  if (languageLabel) languageLabel.textContent = meta.label;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = translate(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = translate(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = translate(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', translate(el.dataset.i18nAria));
  });
  document.querySelectorAll('.lang-option').forEach(option => {
    option.setAttribute('aria-selected', option.dataset.lang === activeLang ? 'true' : 'false');
  });

  renderSkills();
  storeLang(activeLang);
}

function closeLanguageMenu() {
  languageSwitch?.classList.remove('is-open');
  languageTrigger?.setAttribute('aria-expanded', 'false');
}

function toggleLanguageMenu() {
  const isOpen = languageSwitch?.classList.toggle('is-open');
  languageTrigger?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

languageTrigger?.addEventListener('click', event => {
  event.stopPropagation();
  toggleLanguageMenu();
});

document.querySelectorAll('.lang-option').forEach(option => {
  option.addEventListener('click', () => {
    setLanguage(option.dataset.lang);
    closeLanguageMenu();
  });
});

document.addEventListener('click', event => {
  if (!languageSwitch?.contains(event.target)) closeLanguageMenu();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeLanguageMenu();
    nav?.classList.remove('nav-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
});

menuToggle?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('nav-open');
  menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    nav?.classList.remove('nav-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      skillsVisible = true;
      entry.target.querySelectorAll('.skill-chip').forEach((chip, index) => {
        chip.style.transitionDelay = `${index * 45}ms`;
        chip.classList.add('is-visible');
      });
    }
  });
}, { threshold: 0.2 });

const expertise = document.getElementById('expertise');
if (expertise) observer.observe(expertise);

function formspreeErrorMessage(data) {
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map(error => error.message || error.code)
      .filter(Boolean)
      .join(' ');
  }

  return data?.error || data?.message || translate('formError');
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formMsg = document.getElementById('formMsg');
  const submitButton = form.querySelector('[type="submit"]');
  const originalButtonText = submitButton.textContent;

  formMsg.style.display = 'none';
  submitButton.disabled = true;
  submitButton.textContent = translate('formSending');

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    const data = await response.json().catch(() => ({}));

    formMsg.style.display = 'block';

    if (response.ok) {
      formMsg.textContent = translate('formSuccess');
      formMsg.classList.remove('is-error');
      form.reset();
    } else {
      formMsg.textContent = formspreeErrorMessage(data);
      formMsg.classList.add('is-error');
    }
  } catch {
    formMsg.style.display = 'block';
    formMsg.textContent = translate('formError');
    formMsg.classList.add('is-error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

window.handleSubmit = handleSubmit;

function updateNavState() {
  nav?.classList.toggle('is-scrolled', window.scrollY > 60);
}

window.addEventListener('scroll', updateNavState);
setLanguage(activeLang);
updateNavState();
