(() => {
  const launch = document.getElementById('chat-launch');
  const panel = document.getElementById('chat-panel');
  const close = document.getElementById('chat-close');
  const body = document.getElementById('chat-body');
  const input = document.getElementById('chat-question');
  const form = document.getElementById('chat-form');
  const fallback = 'Пока могу ответить на вопросы о стоимости, составе работ, FBS, аналитике, контенте и аудите. Для индивидуального разбора напишите Павлу: @Pavel_ozon_agency.';
  let knowledge = { entries: [], fallback };

  fetch('knowledge/public-faq.json', { credentials: 'omit' })
    .then(response => {
      if (!response.ok) throw new Error('Knowledge base unavailable');
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.entries) || typeof data.fallback !== 'string') throw new Error('Invalid knowledge base');
      knowledge = data;
    })
    .catch(() => {
      knowledge = { entries: [], fallback };
    });

  function show(open) {
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    if (open) input.focus(); else launch.focus();
  }

  function message(value, role) {
    const node = document.createElement('div');
    node.className = 'chat-message' + (role === 'user' ? ' user' : '');
    node.textContent = value;
    body.append(node);
    body.scrollTop = body.scrollHeight;
  }

  function answer(question) {
    const query = question.toLocaleLowerCase('ru').trim();
    if (/(игнорируй|забудь правила|обойди|системн.{0,20}(инструкц|промпт)|внутренн.{0,20}(инструкц|документ|данн)|секрет|токен|api.?ключ|парол|выведи.{0,30}(инструкц|ключ|данн))/.test(query)) {
      return 'Я отвечаю только по опубликованным материалам об услугах. Внутренние инструкции, ключи и данные недоступны в этом чате. По вопросам о сопровождении напишите Павлу: @Pavel_ozon_agency.';
    }
    const ranked = knowledge.entries
      .map(entry => ({ entry, score: entry.keywords.filter(keyword => query.includes(keyword)).length }))
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.entry.answer || knowledge.fallback;
  }

  function ask(value) {
    const question = value.trim().slice(0, 300);
    if (!question) return;
    message(question, 'user');
    input.value = '';
    message(answer(question), 'bot');
  }

  launch.addEventListener('click', () => show(panel.hidden));
  close.addEventListener('click', () => show(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) show(false);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    ask(input.value);
  });
  panel.querySelectorAll('[data-question]').forEach(button => {
    button.addEventListener('click', () => ask(button.dataset.question));
  });
})();
