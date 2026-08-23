// AnnalesDNB — chatbot FAQ statique (100% client-side, aucun appel réseau
// hormis le chargement des fichiers JSON du site lui-même). Le bot ne
// génère jamais de texte librement : il ne fait que retrouver et afficher
// une réponse déjà écrite dans data/faq.json (+ data/reforme2027.json une
// fois disponible), avec sa source si elle existe. Aucune réponse inventée.

const STOPWORDS = new Set([
  'le','la','les','de','des','du','un','une','et','ou','que','qui','est',
  'ce','cette','ces','ça','pour','avec','sur','dans','a','au','aux','en',
  'il','elle','ils','elles','je','tu','on','nous','vous','se','sa','son',
  'ses','mon','ma','mes','ton','ta','tes','y','d','l','qu','n','s','c',
  'comment','quoi','quel','quelle','quels','quelles','est-ce','estce',
]);

function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  return normalize(str)
    .split(' ')
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

const chatbot = {
  entries: [],
  history: [],

  async init() {
    try {
      const [faqRes, reformeRes] = await Promise.all([
        fetch('data/faq.json').then((r) => r.json()).catch(() => ({ entrees: [] })),
        fetch('data/reforme2027.json').then((r) => (r.ok ? r.json() : { entrees: [] })).catch(() => ({ entrees: [] })),
      ]);
      this.entries = [...(faqRes.entrees || []), ...(reformeRes.entrees || [])];
    } catch (err) {
      console.error('Chatbot : impossible de charger la base de connaissances', err);
      this.entries = [];
    }

    this.entries.forEach((e) => {
      e.__tokens = new Set([
        ...tokenize(e.question || ''),
        ...tokenize((e.motscles || []).join(' ')),
      ]);
    });

    this.renderWidget();
    this.bindEvents();
  },

  renderWidget() {
    const wrap = document.createElement('div');
    wrap.id = 'chatbot-root';
    wrap.innerHTML = `
      <button type="button" id="chatbot-toggle" aria-expanded="false" aria-controls="chatbot-panel" title="Poser une question sur le DNB">
        <span aria-hidden="true">💬</span>
        <span class="visually-hidden">Ouvrir l'assistant AnnalesDNB</span>
      </button>
      <div id="chatbot-panel" role="dialog" aria-label="Assistant AnnalesDNB" hidden>
        <div class="chatbot__header">
          <span>🎓 Assistant AnnalesDNB</span>
          <button type="button" id="chatbot-close" aria-label="Fermer l'assistant">✕</button>
        </div>
        <div class="chatbot__intro">
          Pose une question sur le DNB, le programme 2027, ou l'utilisation du site.
          Je réponds uniquement à partir du contenu vérifié de ce site — si je ne
          sais pas, je te le dis et je t'oriente vers une source fiable.
        </div>
        <div class="chatbot__messages" id="chatbot-messages" aria-live="polite"></div>
        <form id="chatbot-form" class="chatbot__form">
          <label class="visually-hidden" for="chatbot-input">Ta question</label>
          <input type="text" id="chatbot-input" placeholder="Ex. : Qu'est-ce qui change en Maths en 2027 ?" autocomplete="off">
          <button type="submit" class="btn btn--primary">Envoyer</button>
        </form>
      </div>`;
    document.body.appendChild(wrap);
  },

  bindEvents() {
    const toggle = document.getElementById('chatbot-toggle');
    const panel = document.getElementById('chatbot-panel');
    const closeBtn = document.getElementById('chatbot-close');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');

    const open = () => {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      if (this.history.length === 0) {
        this.addMessage('bot', "Bonjour ! Je peux répondre à tes questions sur le DNB (programme, réforme 2027, épreuves) et sur l'utilisation du site. Que veux-tu savoir ?");
      }
      input.focus();
    };
    const close = () => {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => (panel.hidden ? open() : close()));
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) close();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (!question) return;
      this.addMessage('user', question);
      input.value = '';
      const answer = this.findAnswer(question);
      this.addMessage('bot', answer.text, answer.lien, answer.source);
    });
  },

  addMessage(role, text, lien, source) {
    this.history.push({ role, text });
    const container = document.getElementById('chatbot-messages');
    const bubble = document.createElement('div');
    bubble.className = `chatbot__bubble chatbot__bubble--${role}`;
    bubble.textContent = text;
    if (lien) {
      const a = document.createElement('a');
      a.href = lien;
      a.className = 'chatbot__bubble-link';
      a.textContent = 'Voir la page →';
      bubble.appendChild(document.createElement('br'));
      bubble.appendChild(a);
    }
    if (source) {
      const s = document.createElement('div');
      s.className = 'chatbot__bubble-source';
      s.textContent = `Source : ${source}`;
      bubble.appendChild(s);
    }
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  findAnswer(question) {
    const queryTokens = new Set(tokenize(question));
    if (queryTokens.size === 0) {
      return { text: "Je n'ai pas compris ta question — peux-tu la reformuler ?" };
    }

    let best = null;
    let bestScore = 0;
    for (const entry of this.entries) {
      let score = 0;
      for (const t of queryTokens) {
        if (entry.__tokens.has(t)) score += 1;
      }
      // bonus si la question tapée est incluse telle quelle dans la question de la fiche
      if (normalize(entry.question || '').includes(normalize(question)) && normalize(question).length > 3) {
        score += 2;
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    if (!best || bestScore === 0) {
      return {
        text: "Je n'ai pas trouvé de réponse fiable à cette question dans le contenu du site. Pour ne pas te donner une information inventée, je préfère t'orienter vers Éduscol, la source officielle du Ministère.",
        lien: 'https://eduscol.education.gouv.fr/5202/preparer-le-diplome-national-du-brevet-dnb-avec-les-sujets-des-annales',
      };
    }

    return { text: best.reponse, lien: best.lien, source: best.source };
  },
};

document.addEventListener('DOMContentLoaded', () => chatbot.init());
