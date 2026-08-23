// AnnalesDNB — bascule mode sombre / mode clair, persistée en localStorage.
// Le choix par défaut (aucune préférence enregistrée) suit le thème du
// système (géré en CSS via prefers-color-scheme) ; le bouton force un choix
// explicite qui prend le dessus. Un script de boot (dans le <head> de
// chaque page) applique déjà data-theme avant le premier rendu pour éviter
// un flash de la mauvaise couleur.

const STORAGE_KEY = 'annalesdnb-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

function effectiveTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return media.matches ? 'dark' : 'light';
}

function updateToggleUI() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = effectiveTheme() === 'dark';
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
  const icon = btn.querySelector('.theme-toggle__icon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

function init() {
  updateToggleUI();
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
      updateToggleUI();
    });
  }
  media.addEventListener('change', () => {
    if (!localStorage.getItem(STORAGE_KEY)) updateToggleUI();
  });
}

document.addEventListener('DOMContentLoaded', init);
