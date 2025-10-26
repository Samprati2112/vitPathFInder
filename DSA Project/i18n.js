// i18n.js
let translations = {};
let currentLang = localStorage.getItem("selectedLang") || "en";

function loadLanguage(lang) {
  fetch(`./locale/${lang}/translate.json`)
    .then(res => res.json())
    .then(data => {
      translations = data;
      currentLang = lang;
      applyTranslations();
    })
    .catch(err => console.error("Error loading language:", err));
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[key]) el.textContent = translations[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[key]) el.placeholder = translations[key];
  });
}

// Load on startup
window.addEventListener("DOMContentLoaded", () => {
  loadLanguage(currentLang);
});
