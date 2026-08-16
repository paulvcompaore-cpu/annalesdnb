const MATIERE_LABELS = {
  francais: 'Français',
  maths: 'Mathématiques',
  'hg-emc': 'Histoire-Géo EMC',
  sciences: 'Sciences',
};

const catalogue = {
  data: [],
  sourcesReference: {},
  filtres: {
    matieres: ['francais', 'maths', 'hg-emc', 'sciences'],
    annees: [],
    avecCorrige: null, // null = tous, true, false
    recherche: '',
  },
  tri: 'annee_desc',

  async init() {
    try {
      const res = await fetch('data/annales.json');
      const json = await res.json();
      this.data = json.annales || [];
      this.sourcesReference = json.sources_reference || {};
    } catch (err) {
      console.error('Impossible de charger data/annales.json', err);
      this.data = [];
    }

    this.renderAnneesFilter();
    this.bindEvents();
    this.applyUrlFilter();
    this.filtrerEtTrier();
  },

  applyUrlFilter() {
    const params = new URLSearchParams(window.location.search);
    const matiere = params.get('matiere');
    if (matiere && Object.keys(MATIERE_LABELS).includes(matiere)) {
      this.filtres.matieres = [matiere];
      document.querySelectorAll('input[name="matiere"]').forEach((el) => {
        el.checked = el.value === matiere;
      });
    }
  },

  renderAnneesFilter() {
    const annees = [...new Set(this.data.map((a) => a.annee))].sort((a, b) => b - a);
    this.filtres.annees = [...annees];
    const container = document.getElementById('filters-annees');
    if (!container) return;
    container.innerHTML = annees
      .map(
        (annee) => `
        <label class="filter-check">
          <input type="checkbox" name="annee" value="${annee}" checked> ${annee}
        </label>`
      )
      .join('');
  },

  bindEvents() {
    document.querySelectorAll('input[name="matiere"]').forEach((el) => {
      el.addEventListener('change', () => {
        this.filtres.matieres = [...document.querySelectorAll('input[name="matiere"]:checked')].map(
          (i) => i.value
        );
        this.filtrerEtTrier();
      });
    });

    document.getElementById('filters-annees')?.addEventListener('change', () => {
      this.filtres.annees = [...document.querySelectorAll('input[name="annee"]:checked')].map((i) =>
        Number(i.value)
      );
      this.filtrerEtTrier();
    });

    document.querySelectorAll('input[name="corrige"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const val = e.target.value;
        this.filtres.avecCorrige = val === 'tous' ? null : val === 'avec';
        this.filtrerEtTrier();
      });
    });

    document.getElementById('filter-tri')?.addEventListener('change', (e) => {
      this.tri = e.target.value;
      this.filtrerEtTrier();
    });

    let debounceTimer;
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const value = e.target.value;
      debounceTimer = setTimeout(() => {
        this.filtres.recherche = value.trim().toLowerCase();
        this.filtrerEtTrier();
      }, 300);
    });

    document.getElementById('filters-reset')?.addEventListener('click', () => this.resetFiltres());

    document.getElementById('filters-toggle')?.addEventListener('click', () => {
      const panel = document.getElementById('filters-panel');
      const btn = document.getElementById('filters-toggle');
      const isOpen = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    document.getElementById('banner-close')?.addEventListener('click', () => {
      document.getElementById('banner-reforme')?.remove();
    });
  },

  resetFiltres() {
    document.querySelectorAll('input[name="matiere"]').forEach((el) => (el.checked = true));
    document.querySelectorAll('input[name="annee"]').forEach((el) => (el.checked = true));
    const tousRadio = document.querySelector('input[name="corrige"][value="tous"]');
    if (tousRadio) tousRadio.checked = true;
    const triSelect = document.getElementById('filter-tri');
    if (triSelect) triSelect.value = 'annee_desc';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    this.filtres = {
      matieres: ['francais', 'maths', 'hg-emc', 'sciences'],
      annees: [...this.filtres.annees],
      avecCorrige: null,
      recherche: '',
    };
    this.tri = 'annee_desc';
    this.filtrerEtTrier();
  },

  recherche(annale, query) {
    if (!query) return true;
    const haystack = [annale.matiere, String(annale.annee), annale.session, annale.note || '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  },

  filtrerEtTrier() {
    let resultats = this.data.filter((a) => {
      if (!this.filtres.matieres.includes(a.matiere_code)) return false;
      if (this.filtres.annees.length && !this.filtres.annees.includes(a.annee)) return false;
      if (this.filtres.avecCorrige === true && !a.corriges_disponibles) return false;
      if (this.filtres.avecCorrige === false && a.corriges_disponibles) return false;
      if (!this.recherche(a, this.filtres.recherche)) return false;
      return true;
    });

    resultats = resultats.sort((a, b) => {
      if (this.tri === 'annee_asc') return a.annee - b.annee;
      if (this.tri === 'matiere') return a.matiere.localeCompare(b.matiere, 'fr') || b.annee - a.annee;
      return b.annee - a.annee; // annee_desc (défaut)
    });

    this.renderCards(resultats);
    this.updateCounter(resultats.length);
  },

  updateCounter(n) {
    const counter = document.getElementById('results-counter');
    if (counter) counter.textContent = `${n} épreuve${n !== 1 ? 's' : ''} affichée${n !== 1 ? 's' : ''} sur ${this.data.length}`;
  },

  renderLinks(urls, type, annaleId) {
    if (!urls || urls.length === 0) {
      return `<span class="card__no-link">${type === 'sujet' ? 'Sujet non disponible' : 'Pas de corrigé'}</span>`;
    }
    return `<span class="card__links">${urls
      .map((url, i) => {
        const sourceLabel = this.guessSourceLabel(url);
        return `<a class="card__link" href="${this.escapeAttr(url)}" target="_blank" rel="noopener">${sourceLabel || `Source ${i + 1}`}</a>`;
      })
      .join('')}</span>`;
  },

  guessSourceLabel(url) {
    for (const key of Object.keys(this.sourcesReference)) {
      const ref = this.sourcesReference[key];
      try {
        if (ref.url_base && url.includes(new URL(ref.url_base).hostname)) {
          return ref.nom;
        }
      } catch {
        /* url_base invalide, ignorer */
      }
    }
    return null;
  },

  escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  },

  renderCards(annales) {
    const grid = document.getElementById('cards-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid) return;

    if (annales.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    grid.innerHTML = annales
      .map((a) => {
        const badge = a.corriges_disponibles
          ? '<span class="card__badge card__badge--ok">Corrigé disponible ✅</span>'
          : '<span class="card__badge card__badge--no">Pas de corrigé ⛔</span>';

        return `
        <article class="card card--${a.matiere_code}" data-id="${a.id}">
          <div class="card__header">
            <span class="card__matiere">${a.matiere}</span>
            <span class="card__annee">${a.annee}</span>
          </div>
          <p class="card__session">Session : ${a.session}</p>
          ${badge}
          <div class="card__resource">
            <span class="card__resource-label">📄 Sujet</span>
            ${this.renderLinks(a.urls_sujets, 'sujet', a.id)}
          </div>
          <div class="card__resource">
            <span class="card__resource-label">✅ Corrigé</span>
            ${this.renderLinks(a.urls_corriges, 'corrige', a.id)}
          </div>
          ${a.note ? `<p class="card__note">${a.note}</p>` : ''}
          <div class="card__footer">
            <button type="button" class="card__report-btn" data-report-id="${a.id}">🚩 Signaler un lien cassé</button>
          </div>
        </article>`;
      })
      .join('');
  },
};

document.addEventListener('DOMContentLoaded', () => catalogue.init());

// Exposé pour signalement.js
window.__annalesCatalogue = catalogue;
