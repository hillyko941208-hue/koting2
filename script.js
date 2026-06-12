// script.js – Core logic for the 30‑Day College Survival Challenge
// ---------------------------------------------------------------
// This script powers the interactive game described by index.html and style_organized.css.
// It follows a modular pattern using an IIFE to avoid polluting the global scope.
// All DOM elements are queried once for performance and then manipulated via
// dedicated helper functions. The code is heavily commented for clarity.
// ---------------------------------------------------------------

(() => {
  // ------- Configuration & Utility Functions -------
  const DAYS_TOTAL = 30;
  const DAILY_COST = 300; // fixed monetary cost per day
  const DAILY_SATIETY_COST = 20; // satiety reduction per day

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const $(sel) => document.querySelector(sel);
  const $$$(sel) => document.querySelectorAll(sel);

  // Update CSS variables for dynamic gradients (optional aesthetic tweak)
  const setRootVar = (name, value) => document.documentElement.style.setProperty(name, value);

  // ------- Game State -------
  const state = {
    day: 1,
    name: "小明",
    gender: "male",
    avatar: 1,
    trait: "optimist",
    stats: {
      stamina: 100,
      money: 13000,
      satiety: 100,
      grades: 50,
      mood: 60,
    },
    buffs: [], // {id, label, effect}
    inventory: [], // purchased items
    equipped: {}, // clothing items keyed by type
    logs: [],
  };

  // ------- DOM Elements Cache -------
  const el = {
    // screens
    startScreen: $('#start-screen'),
    gameScreen: $('#game-screen'),
    // start inputs
    nameInput: $('#player-name'),
    genderBtns: $$('.gender-btn'),
    avatarBtns: $$('.avatar-option'),
    traitCards: $$('.trait-card'),
    startBtn: $('#start-game-btn'),
    // header info
    dayLabel: $('#current-day'),
    semesterText: $('#semester-text'),
    avatarContainer: $('#display-avatar-container'),
    nameDisplay: $('#display-name'),
    traitDisplay: $('#display-trait'),
    // stats UI
    statElems: {
      stamina: $('#val-stamina'),
      money: $('#val-money'),
      satiety: $('#val-satiety'),
      grades: $('#val-grades'),
      mood: $('#val-mood'),
    },
    statBars: {
      stamina: $('#fill-stamina'),
      money: $('#fill-money'),
      satiety: $('#fill-satiety'),
      grades: $('#fill-grades'),
      mood: $('#fill-mood'),
    },
    // action panel
    actionCards: $$('.action-card'),
    // shop UI
    shopTabs: $$('.shop-tab'),
    shopGrids: $$('.shop-grid'),
    // logs
    logList: $('#log-list'),
    clearLogsBtn: $('#clear-logs'),
    // modals
    quizModal: $('#quiz-modal'),
    quizQuestion: $('#quiz-question'),
    quizOptions: $('#quiz-options'),
    quizProgress: $('#quiz-progress'),
    quizNextBtn: $('#quiz-next-btn'),
    ktvModal: $('#ktv-modal'),
    eventModal: $('#event-modal'),
    // sound toggle
    soundBtn: $('#sound-toggle'),
  };

  // ------- Logging Helper -------
  const addLog = (msg, type = 'system') => {
    const li = document.createElement('div');
    li.className = `log-item ${type}`;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `Day ${state.day}`;
    const textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = msg;
    li.append(timeSpan, textSpan);
    el.logList.appendChild(li);
    el.logList.scrollTop = el.logList.scrollHeight;
    state.logs.push({day: state.day, msg, type});
  };

  // ------- UI Update Functions -------
  const updateStatsUI = () => {
    const {stamina, money, satiety, grades, mood} = state.stats;
    el.statElems.stamina.textContent = `${stamina}/100`;
    el.statElems.money.textContent = `$${money.toLocaleString()}`;
    el.statElems.satiety.textContent = `${satiety}/100`;
    el.statElems.grades.textContent = `${grades}/100`;
    el.statElems.mood.textContent = `${mood}/100`;

    // Fill bars proportionally (max 100)
    const setBar = (elem, val) => elem.style.width = `${Math.min(val, 100)}%`;
    setBar(el.statBars.stamina, stamina);
    setBar(el.statBars.money, Math.min(money / 20000 * 100, 100)); // arbitrary scale
    setBar(el.statBars.satiety, satiety);
    setBar(el.statBars.grades, grades);
    setBar(el.statBars.mood, mood);
  };

  const updateDayUI = () => {
    el.dayLabel.textContent = state.day;
    // Example semester milestone text – adjust per your design
    const remaining = DAYS_TOTAL - state.day;
    if (remaining <= 7) el.semesterText.textContent = `期末考倒數 ${remaining} 天`;
    else if (remaining <= 14) el.semesterText.textContent = `期中考倒數 ${remaining} 天`;
    else el.semesterText.textContent = `期中考倒數 14 天`;
  };

  const updateProfileUI = () => {
    el.nameDisplay.textContent = state.name;
    el.traitDisplay.textContent = {
      optimist: '樂天派',
      studious: '勤奮型',
      frugal: '省錢達人',
      healthy: '健康寶寶'
    }[state.trait];
    // Update avatar SVG – placeholder: load pre‑generated SVG files named avatar-1.svg etc.
    el.avatarContainer.innerHTML = `<img src="avatars/avatar-${state.avatar}.svg" alt="avatar" style="width:100%;height:100%;border-radius:50%;"/>`;
    // Apply badge class for styling
    el.traitDisplay.className = `badge ${state.trait}`;
  };

  // ------- Persistent Storage (optional) -------
  const saveGame = () => localStorage.setItem('collegeSurvival', JSON.stringify(state));
  const loadGame = () => {
    const saved = localStorage.getItem('collegeSurvival');
    if (saved) Object.assign(state, JSON.parse(saved));
  };

  // ------- Sound Management -------
  let soundEnabled = true;
  const toggleSound = () => {
    soundEnabled = !soundEnabled;
    el.soundBtn.querySelector('span').textContent = soundEnabled ? 'volume_up' : 'volume_off';
    // If you have audio elements, pause/play them here.
  };

  // ------- Start Screen Handlers -------
  const initStartScreen = () => {
    // Name input – keep existing value
    el.nameInput.value = state.name;
    // Gender selections
    el.genderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.genderBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.gender = btn.dataset.gender;
      });
      if (btn.dataset.gender === state.gender) btn.classList.add('active');
    });
    // Avatar selections
    el.avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.avatarBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.avatar = btn.dataset.avatar;
      });
      if (btn.dataset.avatar === String(state.avatar)) btn.classList.add('active');
    });
    // Trait cards
    el.traitCards.forEach(card => {
      card.addEventListener('click', () => {
        el.traitCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.trait = card.dataset.trait;
      });
      if (card.dataset.trait === state.trait) card.classList.add('active');
    });
    // Start button
    el.startBtn.addEventListener('click', () => {
      state.name = el.nameInput.value.trim() || '玩家';
      transitionToGame();
    });
  };

  const transitionToGame = () => {
    el.startScreen.classList.remove('active-screen');
    el.startScreen.classList.add('screen'); // hide
    el.gameScreen.classList.add('active-screen');
    updateProfileUI();
    updateStatsUI();
    updateDayUI();
    addLog('大學生活開始了！', 'system');
    saveGame();
  };

  // ------- Action Handlers -------
  const applyChanges = (changes) => {
    // `changes` is an array of objects: {type, amount, description}
    changes.forEach(ch => {
      switch (ch.type) {
        case 'stamina':
          state.stats.stamina = Math.min(100, Math.max(0, state.stats.stamina + ch.amount));
          break;
        case 'money':
          state.stats.money = Math.max(0, state.stats.money + ch.amount);
          break;
        case 'satiety':
          state.stats.satiety = Math.min(100, Math.max(0, state.stats.satiety + ch.amount));
          break;
        case 'grades':
          state.stats.grades = Math.min(100, Math.max(0, state.stats.grades + ch.amount));
          break;
        case 'mood':
          state.stats.mood = Math.min(100, Math.max(0, state.stats.mood + ch.amount));
          break;
        default:
          console.warn('未知變化類型', ch);
      }
      if (ch.description) addLog(ch.description, 'system');
    });
    updateStatsUI();
  };

  const actionDefinitions = {
    act_study: {
      title: '讀書學習',
      description: '回答 3 題跨領域學科題目，答對越多成績越高！',
      changes: [
        {type: 'stamina', amount: -10, description: '學習消耗體力 -10'},
        {type: 'grades', amount: rand(0, 15), description: '學習提升成績'},
        {type: 'mood', amount: -5, description: '學習稍微降低心情'},
        {type: 'satiety', amount: -10, description: '學習減少飽食度 -10'}
      ],
    },
    act_work: {
      title: '打工賺錢',
      description: '到便利商店當大夜班，賺取生活費',
      changes: [
        {type: 'stamina', amount: -20, description: '打工消耗體力 -20'},
        {type: 'money', amount: 1500, description: '打工收入 +$1,500'},
        {type: 'mood', amount: -10, description: '打工稍微降低心情 -10'},
        {type: 'satiety', amount: -15, description: '打工減少飽食度 -15'},
        {type: 'grades', amount: -3, description: '打工略微降低成績 -3'}
      ],
    },
    act_sleep: {
      title: '睡覺休息',
      description: '回宿舍睡到自然醒，徹底恢復體力',
      changes: [
        {type: 'stamina', amount: +30, description: '睡覺恢復體力 +30'},
        {type: 'mood', amount: +5, description: '睡覺提升心情 +5'},
        {type: 'satiety', amount: -5, description: '睡覺略減飽食度 -5'}
      ],
    },
    act_play: {
      title: '休閒娛樂',
      description: '跟同學去 KTV 唱歌，回答歌詞接龍，答對越多心情加越多！',
      changes: [
        {type: 'stamina', amount: -10, description: '娛樂消耗體力 -10'},
        {type: 'mood', amount: rand(-15, 30), description: '娛樂提升心情'},
        {type: 'satiety', amount: -10, description: '娛樂減少飽食度 -10'},
        {type: 'money', amount: -600, description: '娛樂花費 -$600'},
        {type: 'grades', amount: -5, description: '娛樂略微降低成績 -5'}
      ],
    },
    act_goshop: {
      title: '逛便利商店',
      description: '前往 7‑11 或全家，購買美味鮮食與零食放入購物籃！',
      changes: [
        {type: 'stamina', amount: -3, description: '逛店稍微消耗體力 -3'},
        {type: 'mood', amount: +5, description: '逛店提升心情 +5'},
        {type: 'satiety', amount: 0, description: '可儲存各類鮮食'}
      ],
    },
    act_goteashop: {
      title: '買手搖飲料',
      description: '前往台式手搖飲料街，購買各品牌知名茶飲放入購物籃！',
      changes: [
        {type: 'stamina', amount: -3, description: '喝飲料稍微消耗體力 -3'},
        {type: 'mood', amount: +15, description: '喝飲料大幅提升心情 +15'},
        {type: 'satiety', amount: 0, description: '飲料可儲存於購物籃'}
      ],
    },
  };

  const handleAction = (id) => {
    const def = actionDefinitions[id];
    if (!def) return;
    // Apply daily fixed cost first (money & satiety)
    const baseCost = [{type: 'money', amount: -DAILY_COST, description: '每日固定開銷 -$300'},
                      {type: 'satiety', amount: -DAILY_SATIETY_COST, description: '每日飽食度 -20'}];
    applyChanges(baseCost);
    // Then action‑specific changes
    applyChanges(def.changes);
    // End‑of‑day progression
    if (state.day < DAYS_TOTAL) {
      state.day++;
      updateDayUI();
    } else {
      // Game finished – show ending screen (implementation placeholder)
      addLog('30 天挑戰結束！', 'system');
    }
    saveGame();
  };

  const initActionPanel = () => {
    el.actionCards.forEach(card => {
      const id = card.id; // e.g., act-study, act-work
      card.addEventListener('click', () => handleAction(id.replace(/-/g, '_')));
    });
  };

  // ------- Shop System (simplified) -------
  const shopData = {
    items: [
      {id: 'coffee', name: '提神咖啡', price: 300, effect: {stamina: +3}, type: 'items', owned: false},
      {id: 'textbook', name: '微積分聖經', price: 1200, effect: {grades: +4}, type: 'items', owned: false},
      // ... add other items similarly ...
    ],
    food: [
      {id: 'food_riceball', name: '超商三角御飯糰', price: 45, effect: {satiety: +20}, type: 'food'},
      {id: 'food_bento', name: '台鐵排骨便當', price: 100, effect: {satiety: +50, stamina: +5}, type: 'food'},
      // ...
    ],
    clothes: [
      {id: 'cloth_uniform', name: '校園經典制服', price: 0, effect: {}, type: 'clothes', owned: true, equipped: true},
      {id: 'cloth_hoodie', name: '舒適純棉衛衣', price: 800, effect: {stamina: +5}, type: 'clothes', owned: false},
      // ...
    ],
  };

  const renderShop = (category) => {
    const grid = $(`#shop-grid-${category}`);
    if (!grid) return;
    grid.innerHTML = '';
    shopData[category].forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (item.owned) card.classList.add('owned');
      if (item.equipped) card.classList.add('equipped');
      card.dataset.itemId = item.id;
      card.innerHTML = `
        <div class="shop-item-info">
          <span class="material-icons-round shop-item-icon ${item.type === 'clothes' ? 'text-blue' : ''}">${item.type === 'clothes' ? 'checkroom' : item.type === 'food' ? 'restaurant' : 'local_cafe'}</span>
          <div>
            <h4>${item.name}</h4>
            <p class="shop-item-desc ${item.type === 'clothes' ? 'font-accent' : ''}">${item.description || ''}</p>
          </div>
        </div>
        <div class="shop-item-buy">
          <span class="shop-price">$${item.price}</span>
          <button class="btn btn-sm ${item.owned ? 'btn-secondary' : 'btn-primary'} buy-btn" data-item-id="${item.id}">${item.owned ? '已擁有' : '購買'}</button>
        </div>`;
      grid.appendChild(card);
    });
  };

  const initShop = () => {
    // Initial render for default tab (items)
    renderShop('items');
    // Tab switching
    el.shopTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        el.shopTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        $$('.shop-grid').forEach(g => g.classList.remove('active'));
        $(`#shop-grid-${target}`).classList.add('active');
        renderShop(target);
      });
    });
    // Delegated buy button handling
    document.body.addEventListener('click', (e) => {
      if (!e.target.matches('.buy-btn')) return;
      const id = e.target.dataset.itemId;
      const category = e.target.closest('.shop-grid').id.split('-')[2]; // items, food, clothes
      const item = shopData[category].find(i => i.id === id);
      if (!item) return;
      if (state.stats.money < item.price) {
        addLog('金錢不足，無法購買！', 'danger');
        return;
      }
      state.stats.money -= item.price;
      item.owned = true;
      if (category === 'clothes') {
        // Auto‑equip newly bought clothing
        state.equipped[category] = id;
        // Update UI classes
        $$('.shop-card').forEach(c => c.classList.remove('equipped'));
        e.target.closest('.shop-card').classList.add('equipped');
      }
      addLog(`購買 ${item.name} - $${item.price}`, 'success');
      // Re‑render the current category to reflect ownership state
      renderShop(category);
      updateStatsUI();
      saveGame();
    });
  };

  // ------- Log Panel -------
  const initLogPanel = () => {
    el.clearLogsBtn.addEventListener('click', () => {
      el.logList.innerHTML = '';
      state.logs = [];
    });
  };

  // ------- Modal Helpers (Quiz / KTV / Event) -------
  const openModal = (modal) => modal.classList.add('active');
  const closeModal = (modal) => modal.classList.remove('active');

  // Placeholder quiz implementation (randomized simple math)
  const startQuiz = () => {
    const num1 = rand(1, 20);
    const num2 = rand(1, 20);
    const answer = num1 + num2;
    el.quizQuestion.textContent = `${num1} + ${num2} = ?`;
    el.quizOptions.innerHTML = '';
    const options = [answer];
    while (options.length < 3) {
      const fake = rand(answer - 10, answer + 10);
      if (!options.includes(fake)) options.push(fake);
    }
    // Shuffle
    options.sort(() => Math.random() - 0.5);
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerHTML = `<span class="quiz-option-indicator"></span>${opt}`;
      btn.addEventListener('click', () => {
        const correct = opt === answer;
        btn.classList.add(correct ? 'correct' : 'incorrect');
        // disable others
        $$('.quiz-option-btn').forEach(b => b.classList.add('faded'));
        el.quizNextBtn.style.display = 'block';
        // Apply reward/punish
        applyChanges([{type: 'grades', amount: correct ? 5 : -3, description: correct ? '測驗答對 +5 成績' : '測驗答錯 -3 成績'}]);
      });
      el.quizOptions.appendChild(btn);
    });
    openModal(el.quizModal);
  };

  el.quizNextBtn.addEventListener('click', () => {
    closeModal(el.quizModal);
    el.quizNextBtn.style.display = 'none';
  });

  // ------- Sound Button -------
  el.soundBtn.addEventListener('click', toggleSound);

  // ------- Initialization -------
  const init = () => {
    loadGame();
    initStartScreen();
    initActionPanel();
    initShop();
    initLogPanel();
    // If a saved game exists, skip start screen automatically
    if (state.day > 1) {
      transitionToGame();
    }
  };

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// End of script.js
