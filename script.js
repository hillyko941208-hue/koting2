(() => {
  const DAYS_TOTAL = 30;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  const state = {
    day: 1, name: '小明', gender: 'male', avatar: '1', trait: 'optimist',
    stats: { stamina: 100, money: 10000, satiety: 100, grades: 50, mood: 70 },
    owned: ['cloth_uniform'], equipped: 'cloth_uniform', basket: []
  };

  const traitName = { optimist: '樂天派', studious: '勤奮型', frugal: '省錢達人', healthy: '健康寶寶' };
  const statInfo = {
    stamina: ['體力', 'bolt', 'blue'], money: ['金錢', 'payments', 'green'], satiety: ['飽食度', 'restaurant', 'brown'],
    grades: ['成績', 'school', 'orange'], mood: ['心情', 'favorite', 'pink']
  };

  const actionList = [
    { id:'act-study', icon:'menu_book', title:'讀書學習', desc:'回答小測驗，答對會額外加成績。', changes:{ stamina:-10, satiety:-10, mood:-5, grades:10 }, quiz:true },
    { id:'act-work', icon:'storefront', title:'打工賺錢', desc:'到便利商店打工，賺取生活費。', changes:{ stamina:-20, satiety:-15, mood:-10, money:1500, grades:-3 } },
    { id:'act-sleep', icon:'bedtime', title:'睡覺休息', desc:'回宿舍好好睡一覺。', changes:{ stamina:30, mood:5, satiety:-5 } },
    { id:'act-play', icon:'sports_esports', title:'休閒娛樂', desc:'跟朋友出去玩，提升心情。', changes:{ stamina:-10, satiety:-10, money:-600, mood:25, grades:-5 } },
    { id:'act-goshop', icon:'local_mall', title:'逛便利商店', desc:'到商店買食物，放入購物籃。', shopTab:'food', changes:{ stamina:-3, mood:5 } },
    { id:'act-goteashop', icon:'local_cafe', title:'買手搖飲料', desc:'買飲料，放入購物籃。', shopTab:'food', changes:{ stamina:-3, mood:10 } }
  ];

  const shop = {
    items: [
      {id:'coffee', name:'提神咖啡', price:300, desc:'購買後體力 +3', effect:{stamina:3}},
      {id:'textbook', name:'微積分聖經', price:1200, desc:'購買後成績 +4', effect:{grades:4}},
      {id:'counseling', name:'心理諮商服務', price:800, desc:'購買後心情 +40', effect:{mood:40}}
    ],
    food: [
      {id:'food_riceball', name:'超商三角御飯糰', price:45, desc:'食用後飽食度 +20', effect:{satiety:20}},
      {id:'food_bento', name:'台鐵排骨便當', price:100, desc:'食用後飽食度 +50、體力 +5', effect:{satiety:50, stamina:5}},
      {id:'drink_milk', name:'珍珠奶茶', price:65, desc:'食用後心情 +15、飽食度 +10', effect:{mood:15, satiety:10}},
      {id:'drink_tea', name:'無糖綠茶', price:35, desc:'食用後心情 +8', effect:{mood:8}}
    ],
    clothes: [
      {id:'cloth_uniform', name:'校園經典制服', price:0, desc:'普通制服，無額外效果', effect:{}},
      {id:'cloth_hoodie', name:'舒適純棉衛衣', price:800, desc:'購買後體力 +5', effect:{stamina:5}},
      {id:'cloth_apron', name:'幸運打工圍裙', price:2000, desc:'購買後金錢 +300', effect:{money:300}},
      {id:'cloth_jacket', name:'潮牌防風夾克', price:4500, desc:'購買後心情 +10', effect:{mood:10}}
    ]
  };

  function avatarSVG(type = '1', gender = 'male') {
    const hair = gender === 'female' ? ['#f472b6','#a855f7','#fb923c'][Number(type)-1] : ['#2563eb','#22c55e','#fbbf24'][Number(type)-1];
    const face = gender === 'female' ? '#ffd6d6' : '#ffd6a5';
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="56" fill="#1e3a8a"/><circle cx="60" cy="58" r="38" fill="${hair}"/><circle cx="60" cy="65" r="30" fill="${face}"/><path d="M28 56 Q60 15 92 56 Q75 35 60 42 Q45 35 28 56" fill="${hair}"/><circle cx="49" cy="66" r="4" fill="#111827"/><circle cx="71" cy="66" r="4" fill="#111827"/><path d="M50 80 Q60 88 70 80" fill="none" stroke="#7f1d1d" stroke-width="3" stroke-linecap="round"/><path d="M38 98 L48 84 H72 L82 98" fill="#1f2937"/><path d="M56 86 H64 V106 H56Z" fill="#ef4444"/></svg>`;
  }

  function resetStatsByTrait() {
    state.stats = { stamina:100, money:10000, satiety:100, grades:50, mood:70 };
    if (state.trait === 'optimist') state.stats.mood += 20;
    if (state.trait === 'studious') state.stats.grades += 15;
    if (state.trait === 'frugal') state.stats.money += 2000;
    if (state.trait === 'healthy') state.stats.stamina = 100;
  }

  function applyEffects(effects) {
    Object.entries(effects).forEach(([key, val]) => {
      if (key === 'money') state.stats.money = Math.max(0, state.stats.money + val);
      else state.stats[key] = clamp(state.stats[key] + val);
    });
    updateUI();
  }

  function addLog(text) {
    $('#log-list').insertAdjacentHTML('beforeend', `<div class="log-item"><span class="log-time">Day ${state.day}</span>${text}</div>`);
    $('#log-list').scrollTop = $('#log-list').scrollHeight;
  }

  function nextDay() {
    if (state.day >= DAYS_TOTAL) return showEnding();
    state.day += 1;
    updateUI();
  }

  function updateUI() {
    $('#current-day').textContent = state.day;
    const remain = DAYS_TOTAL - state.day;
    $('#semester-text').textContent = remain <= 7 ? `期末考倒數 ${remain} 天` : '期中考倒數 14 天';
    $('#display-name').textContent = state.name;
    $('#display-trait').textContent = traitName[state.trait];
    $('#display-trait').className = `badge ${state.trait}`;
    $('#display-avatar-container').innerHTML = avatarSVG(state.avatar, state.gender);
    $('#stats-box').innerHTML = Object.entries(statInfo).map(([key, [name, icon, color]]) => {
      const value = state.stats[key];
      const shown = key === 'money' ? '$' + value.toLocaleString() : value + '/100';
      const width = key === 'money' ? Math.min(value / 15000 * 100, 100) : value;
      return `<div class="stat-item"><div class="stat-header"><span><span class="material-icons-round">${icon}</span> ${name}</span><b>${shown}</b></div><div class="stat-bar"><div class="stat-fill ${color}" style="width:${width}%"></div></div></div>`;
    }).join('');
    $('#calendar-grid').innerHTML = Array.from({length:30}, (_,i) => `<div class="calendar-day ${i+1 < state.day ? 'past' : i+1 === state.day ? 'current' : ''}">${i+1}</div>`).join('');
    $('#buffs-container').innerHTML = state.owned.map(id => `<div class="buff-badge">🎒 ${findItem(id)?.name || id}${id === state.equipped ? '（穿著中）' : ''}</div>`).join('');
    $('#basket-container').innerHTML = state.basket.length ? state.basket.map((item, i) => `<div class="basket-item" data-eat="${i}">🍱 ${item.name}：${item.desc}</div>`).join('') : '<div class="no-buffs">購物籃空空如也，快去買點東西吧！</div>';
  }

  function findItem(id) { return Object.values(shop).flat().find(item => item.id === id); }

  function renderActions() {
    $('#action-grid').innerHTML = actionList.map(a => {
      const changeText = Object.entries(a.changes).map(([k,v]) => `<span class="change">${statInfo[k]?.[0] || k} ${v > 0 ? '+' : ''}${v}</span>`).join('');
      return `<button class="action-card" data-action="${a.id}"><span class="material-icons-round action-icon">${a.icon}</span><div><h4>${a.title}</h4><p>${a.desc}</p>${changeText}</div></button>`;
    }).join('');
  }

  function renderShop(category = 'items') {
    $('#shop-grid').dataset.category = category;
    $('#shop-grid').innerHTML = shop[category].map(item => {
      const owned = state.owned.includes(item.id);
      return `<div class="shop-card"><h4>${item.name}</h4><p>${item.desc}</p><div class="shop-buy"><span class="price">${item.price ? '$' + item.price : '免費'}</span><button class="btn btn-secondary buy-btn" data-id="${item.id}" data-cat="${category}">${owned ? '已擁有' : '購買'}</button></div></div>`;
    }).join('');
  }

  function handleAction(action) {
    if (action.quiz) return openQuiz(action);
    const dailyCost = { money:-300, satiety:-20 };
    applyEffects({...dailyCost, ...action.changes});
    if (action.shopTab) {
      switchShopTab(action.shopTab);
      addLog(`完成行動：${action.title}，請在下方商店購買物品。`);
      nextDay();
      return;
    }
    addLog(`完成行動：${action.title}，數值已更新。`);
    nextDay();
  }

  function openQuiz(action) {
    const a = rand(2, 10), b = rand(2, 10), ans = a + b;
    $('#quiz-question').textContent = `${a} + ${b} = ?`;
    const options = [ans, ans + rand(1, 4), ans - rand(1, 4)].sort(() => Math.random() - 0.5);
    $('#quiz-options').innerHTML = options.map(n => `<button class="btn btn-secondary quiz-answer" data-ok="${n === ans}">${n}</button>`).join('');
    $('#quiz-modal').classList.add('active');
    $$('.quiz-answer').forEach(btn => btn.addEventListener('click', () => {
      const dailyCost = { money:-300, satiety:-20 };
      const bonus = btn.dataset.ok === 'true' ? 5 : -3;
      applyEffects({...dailyCost, ...action.changes, grades: action.changes.grades + bonus});
      addLog(btn.dataset.ok === 'true' ? '測驗答對，成績額外 +5。' : '測驗答錯，成績 -3。');
      $('#quiz-modal').classList.remove('active');
      nextDay();
    }));
  }

  function buyItem(item, category) {
    if (category !== 'food' && state.owned.includes(item.id)) return;
    if (state.stats.money < item.price) return addLog('金錢不足，無法購買！');
    state.stats.money -= item.price;
    if (category === 'food') state.basket.push(item);
    else { state.owned.push(item.id); applyEffects(item.effect); }
    addLog(`購買：${item.name}，金錢已扣除。`);
    renderShop(category);
    updateUI();
  }

  function eatItem(index) {
    const item = state.basket.splice(index, 1)[0];
    if (!item) return;
    applyEffects(item.effect);
    addLog(`食用：${item.name}，數值已補充。`);
  }

  function switchShopTab(tab) {
    $$('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderShop(tab);
  }

  function showEnding() {
    $('#game-screen').classList.remove('active-screen');
    $('#ending-screen').classList.add('active-screen');
    $('#ending-name').textContent = state.stats.grades >= 80 ? '學霸型大學生' : '努力生存型大學生';
    $('#ending-description').textContent = `30天結束！成績 ${state.stats.grades}、金錢 $${state.stats.money.toLocaleString()}、心情 ${state.stats.mood}。`;
  }

  function init() {
    for (let i = 1; i <= 3; i++) $('#avatar-preview-' + i).innerHTML = avatarSVG(String(i), state.gender);
    $$('.gender-btn').forEach(btn => btn.addEventListener('click', () => {
      $$('.gender-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active'); state.gender = btn.dataset.gender;
      for (let i = 1; i <= 3; i++) $('#avatar-preview-' + i).innerHTML = avatarSVG(String(i), state.gender);
    }));
    $$('.avatar-option').forEach(btn => btn.addEventListener('click', () => {
      $$('.avatar-option').forEach(x => x.classList.remove('active'));
      btn.classList.add('active'); state.avatar = btn.dataset.avatar;
    }));
    $$('.trait-card').forEach(card => card.addEventListener('click', () => {
      $$('.trait-card').forEach(x => x.classList.remove('active'));
      card.classList.add('active'); state.trait = card.dataset.trait;
    }));
    $('#start-game-btn').addEventListener('click', () => {
      state.name = $('#player-name').value.trim() || '玩家';
      resetStatsByTrait();
      $('#start-screen').classList.remove('active-screen');
      $('#game-screen').classList.add('active-screen');
      updateUI(); addLog('大學生活開始了！');
    });
    document.addEventListener('click', e => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) handleAction(actionList.find(a => a.id === actionBtn.dataset.action));
      const buyBtn = e.target.closest('.buy-btn');
      if (buyBtn) buyItem(findItem(buyBtn.dataset.id), buyBtn.dataset.cat);
      const eatBtn = e.target.closest('[data-eat]');
      if (eatBtn) eatItem(Number(eatBtn.dataset.eat));
    });
    $$('.shop-tab').forEach(tab => tab.addEventListener('click', () => switchShopTab(tab.dataset.tab)));
    $('#clear-logs').addEventListener('click', () => $('#log-list').innerHTML = '');
    $('#restart-game-btn').addEventListener('click', () => location.reload());
    $('#sound-toggle').addEventListener('click', () => {
      const span = $('#sound-toggle span'); span.textContent = span.textContent === 'volume_up' ? 'volume_off' : 'volume_up';
    });
    renderActions(); renderShop('items'); updateUI();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
