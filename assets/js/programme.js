const programme = {
  matieres: [],

  async init() {
    try {
      const res = await fetch('data/programme2027.json');
      const json = await res.json();
      this.matieres = json.matieres || [];
    } catch (err) {
      console.error('Impossible de charger data/programme2027.json', err);
      this.matieres = [];
    }

    this.renderTabs();
    this.renderPanels();
    this.bindTabs();
    this.applyUrlFilter();
  },

  renderTabs() {
    const tabsEl = document.getElementById('tabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = this.matieres
      .map(
        (m, i) => `
        <button type="button" class="tabs__btn" role="tab"
          id="tab-${m.id}" aria-controls="panel-${m.id}"
          aria-selected="${i === 0}" style="--tab-color:${m.couleur}">
          ${m.emoji} ${m.nom}
        </button>`
      )
      .join('');
  },

  renderPanels() {
    const panelsEl = document.getElementById('tab-panels');
    if (!panelsEl) return;
    panelsEl.innerHTML = this.matieres
      .map((m, i) => {
        const structure = m.structure_epreuve
          ? `
          <div class="structure-epreuve">
            <table>
              <thead><tr><th>Partie</th><th>Points</th><th>Description</th></tr></thead>
              <tbody>
                ${m.structure_epreuve
                  .map(
                    (p) =>
                      `<tr><td>${p.partie}</td><td>${p.points}${p.duree ? ` (${p.duree})` : ''}</td><td>${p.description}</td></tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
          : '';

        const warning = m.note_programme
          ? `<div class="matiere-warning">${m.note_programme}</div>`
          : '';

        const accordion = (m.chapitres || [])
          .map(
            (ch, ci) => `
            <div class="accordion__item">
              <button type="button" class="accordion__header" aria-expanded="false" aria-controls="acc-${m.id}-${ci}">
                ${ch.titre}
              </button>
              <div class="accordion__panel" id="acc-${m.id}-${ci}" hidden>
                <ul>
                  ${ch.notions.map((n) => `<li>${n}</li>`).join('')}
                </ul>
              </div>
            </div>`
          )
          .join('');

        return `
        <section class="tab-panel" role="tabpanel" id="panel-${m.id}" aria-labelledby="tab-${m.id}" data-matiere="${m.id}" ${i === 0 ? '' : 'hidden'}>
          <div class="matiere-meta">
            <span class="matiere-meta__item"><strong>Durée</strong>${m.duree_epreuve || '—'}</span>
            <span class="matiere-meta__item"><strong>Coefficient</strong>${m.coefficient ?? '—'}</span>
            <span class="matiere-meta__item"><strong>Notation</strong>${m.note_sur || '—'}</span>
          </div>
          ${warning}
          ${structure}
          <div class="accordion">${accordion}</div>
          <div class="programme-actions">
            <a class="btn btn--primary" href="index.html?matiere=${m.id}">Voir les annales de cette matière →</a>
            <button type="button" class="btn btn--secondary" id="print-btn-${m.id}">🖨️ Imprimer cette page</button>
          </div>
        </section>`;
      })
      .join('');

    panelsEl.querySelectorAll('[id^="print-btn-"]').forEach((btn) => {
      btn.addEventListener('click', () => window.print());
    });

    panelsEl.querySelectorAll('.accordion__header').forEach((btn) => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.hidden = expanded;
      });
    });
  },

  bindTabs() {
    const tabs = [...document.querySelectorAll('.tabs__btn')];
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => this.selectTab(tab.id.replace('tab-', '')));
    });
  },

  selectTab(matiereId) {
    document.querySelectorAll('.tabs__btn').forEach((t) => {
      t.setAttribute('aria-selected', String(t.id === `tab-${matiereId}`));
    });
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.hidden = p.dataset.matiere !== matiereId;
    });
  },

  applyUrlFilter() {
    const params = new URLSearchParams(window.location.search);
    const matiere = params.get('matiere');
    if (matiere && this.matieres.some((m) => m.id === matiere)) {
      this.selectTab(matiere);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => programme.init());
