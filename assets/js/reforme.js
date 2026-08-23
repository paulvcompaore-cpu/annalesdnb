// AnnalesDNB — rendu de la page "Ce qui change en 2027" à partir de
// data/reforme2027.json. Chaque affirmation affichée porte sa source
// (nom + lien) telle que fournie dans le JSON — ce script ne fait
// qu'afficher, il n'invente jamais de contenu.

function renderSourceLinks(sources) {
  if (!sources || sources.length === 0) return '';
  return `<p class="reforme-sources">Source${sources.length > 1 ? 's' : ''} : ${sources
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>${s.date ? ` (${s.date})` : ''}`)
    .join(' · ')}</p>`;
}

function renderLiens(liens) {
  if (!liens || liens.length === 0) return '';
  return `<div class="reforme-liens">
    <strong>Épreuves / spécimens utiles :</strong>
    <ul>${liens
      .map((l) => {
        const externe = /^https?:\/\//.test(l.url);
        const attrs = externe ? ' target="_blank" rel="noopener"' : '';
        return `<li><a href="${l.url}"${attrs}>${l.label}</a>${l.note ? ` — ${l.note}` : ''}</li>`;
      })
      .join('')}</ul>
  </div>`;
}

function renderStatutBadge(statut) {
  const map = {
    confirme: { label: 'Changement 2027 confirmé', cls: 'reforme-badge--ok' },
    non_confirme: { label: 'Non confirmé', cls: 'reforme-badge--warn' },
    inchange: { label: 'Ne change pas en 2027', cls: 'reforme-badge--neutral' },
    anterieur_2027: { label: 'Déjà en vigueur depuis 2026', cls: 'reforme-badge--info' },
  };
  const s = map[statut] || map.non_confirme;
  return `<span class="reforme-badge ${s.cls}">${s.label}</span>`;
}

const reforme = {
  data: null,

  async init() {
    try {
      const res = await fetch('data/reforme2027.json');
      if (!res.ok) throw new Error('404');
      this.data = await res.json();
    } catch (err) {
      this.renderIndisponible();
      return;
    }
    this.renderChapeau();
    this.renderTable();
    this.renderMatieres();
    this.renderOralEtControleContinu();
    this.renderRecommandations();
    this.renderSourcesGenerales();
  },

  renderIndisponible() {
    const chapeau = document.getElementById('reforme-chapeau');
    if (chapeau) {
      chapeau.textContent = "Cette page est en cours de rédaction : nous vérifions chaque information auprès de sources officielles (Éduscol, Bulletin Officiel) avant publication, pour ne rien t'annoncer qui ne soit pas confirmé.";
    }
    document.getElementById('reforme-table-body').innerHTML = '<tr><td colspan="3">Contenu en cours de vérification.</td></tr>';
  },

  renderChapeau() {
    const chapeau = document.getElementById('reforme-chapeau');
    if (chapeau && this.data.chapeau) chapeau.textContent = this.data.chapeau;
    const methodo = document.getElementById('reforme-methodologie');
    if (methodo && this.data.methodologie) methodo.textContent = this.data.methodologie;
  },

  renderTable() {
    const body = document.getElementById('reforme-table-body');
    if (!body || !this.data.tableau) return;
    body.innerHTML = this.data.tableau
      .map(
        (row) => `
        <tr>
          <td><strong>${row.composante}</strong></td>
          <td>${row.avant}</td>
          <td>${row.apres_2027} ${renderStatutBadge(row.statut)}</td>
        </tr>`
      )
      .join('');
  },

  renderMatieres() {
    const container = document.getElementById('reforme-matieres');
    if (!container || !this.data.matieres) return;
    container.innerHTML = this.data.matieres
      .map(
        (m) => `
        <article class="reforme-matiere-card" style="border-left-color:${m.couleur || 'var(--color-marine)'}">
          <h3>${m.emoji || ''} ${m.nom} ${renderStatutBadge(m.statut)}</h3>
          <div class="reforme-matiere-grid">
            <div><strong>Avant 2027</strong><p>${m.avant}</p></div>
            <div><strong>Session 2027</strong><p>${m.apres_2027}</p></div>
          </div>
          ${renderLiens(m.epreuves_liens)}
          ${renderSourceLinks(m.sources)}
        </article>`
      )
      .join('');
  },

  renderOralEtControleContinu() {
    const oralEl = document.getElementById('reforme-oral');
    const ccEl = document.getElementById('reforme-controle-continu');
    if (oralEl && this.data.oral) {
      const o = this.data.oral;
      oralEl.innerHTML = `
        <article class="reforme-matiere-card">
          <h3>🎤 Épreuve orale ${renderStatutBadge(o.statut)}</h3>
          <div class="reforme-matiere-grid">
            <div><strong>Avant 2027</strong><p>${o.avant}</p></div>
            <div><strong>Session 2027</strong><p>${o.apres_2027}</p></div>
          </div>
          ${renderLiens(o.epreuves_liens)}
          ${renderSourceLinks(o.sources)}
        </article>`;
    }
    if (ccEl && this.data.controle_continu) {
      const c = this.data.controle_continu;
      ccEl.innerHTML = `
        <article class="reforme-matiere-card">
          <h3>📊 Contrôle continu ${renderStatutBadge(c.statut)}</h3>
          <div class="reforme-matiere-grid">
            <div><strong>Avant 2027</strong><p>${c.avant}</p></div>
            <div><strong>Session 2027</strong><p>${c.apres_2027}</p></div>
          </div>
          ${renderSourceLinks(c.sources)}
        </article>`;
    }
  },

  renderRecommandations() {
    const container = document.getElementById('reforme-recommandations');
    if (!container || !this.data.recommandations) return;
    container.innerHTML = `<ul class="reforme-recos">${this.data.recommandations.map((r) => `<li>${r}</li>`).join('')}</ul>`;
  },

  renderSourcesGenerales() {
    const list = document.getElementById('reforme-sources-generales');
    if (!list || !this.data.sources_generales) return;
    list.innerHTML = this.data.sources_generales
      .map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>${s.date ? ` — ${s.date}` : ''}</li>`)
      .join('');
  },
};

document.addEventListener('DOMContentLoaded', () => reforme.init());
