// AnnalesDNB — page "Recommandations pour Nathan". Réutilise le champ
// `recommandations` de data/reforme2027.json (même source de vérité que
// la page "Ce qui change en 2027", pour éviter de dupliquer le contenu).

async function init() {
  const container = document.getElementById('reforme-recommandations');
  if (!container) return;
  try {
    const res = await fetch('data/reforme2027.json');
    if (!res.ok) throw new Error('404');
    const data = await res.json();
    if (!data.recommandations || data.recommandations.length === 0) throw new Error('vide');
    container.innerHTML = `<ul class="reforme-recos">${data.recommandations.map((r) => `<li>${r}</li>`).join('')}</ul>`;
  } catch (err) {
    container.innerHTML = '<p>Contenu en cours de préparation.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);
