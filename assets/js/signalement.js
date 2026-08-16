const SIGNALEMENT_EMAIL = 'paulv.compaore@gmail.com';

function openSignalementModal(annale) {
  const modal = document.getElementById('signalement-modal');
  const linksEl = document.getElementById('signalement-links');
  if (!modal || !linksEl) return;

  const urls = [...(annale.urls_sujets || []), ...(annale.urls_corriges || [])];

  if (urls.length === 0) {
    linksEl.innerHTML = '<li>Aucun lien enregistré pour cette épreuve — signale directement par email.</li>';
  } else {
    linksEl.innerHTML = urls
      .map((url) => {
        const subject = encodeURIComponent(`Lien cassé : ${annale.id}`);
        const body = encodeURIComponent(
          `Bonjour,\n\nLe lien suivant semble cassé sur AnnalesDNB :\n${url}\n\nÉpreuve concernée : ${annale.matiere} ${annale.annee} (${annale.session}).\n\nMerci !`
        );
        return `<li><a href="mailto:${SIGNALEMENT_EMAIL}?subject=${subject}&body=${body}">${url}</a></li>`;
      })
      .join('');
  }

  modal.hidden = false;
  modal.dataset.openerId = annale.id;
}

function closeSignalementModal() {
  const modal = document.getElementById('signalement-modal');
  if (modal) modal.hidden = true;
}

document.addEventListener('click', (e) => {
  const reportBtn = e.target.closest('[data-report-id]');
  if (reportBtn) {
    const id = reportBtn.getAttribute('data-report-id');
    const catalogue = window.__annalesCatalogue;
    const annale = catalogue?.data.find((a) => a.id === id);
    if (annale) openSignalementModal(annale);
    return;
  }

  if (e.target.closest('[data-close-modal]')) {
    closeSignalementModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSignalementModal();
});
