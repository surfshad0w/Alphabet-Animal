/* Numbers 1–50: a short, touch-first learning page for early learners. */
(function () {
  'use strict';

  const RANGE_SIZE = 10;
  const TOTAL = 50;
  const STORAGE_KEY = 'alphabet-animal-number-progress-v1';
  const COLORS = ['#e3f8ff', '#fff1d6', '#e9ddff', '#e0f7e9', '#ffe0df'];
  const units = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

  const app = document.getElementById('numbersApp');
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  const rangeButtons = [...document.querySelectorAll('[data-range-start]')];
  const playButtons = [...document.querySelectorAll('[data-play-mode]')];
  const progressFill = document.getElementById('numberProgressFill');
  const progressText = document.getElementById('numberProgressText');
  const soundButton = document.getElementById('soundButton');
  const resetButton = document.getElementById('resetProgress');
  const liveRegion = document.getElementById('liveRegion');

  const state = {
    mode: 'explore',
    playMode: 'count',
    rangeStart: 1,
    selected: 1,
    soundOn: true,
    explored: new Set(),
    traced: new Set(),
    countTarget: null,
    countRound: 0,
    countScore: 0,
    countAnswered: false,
    matchCards: [],
    matchFirst: null,
    matchLock: false,
    matchFound: 0,
    traceTarget: 1,
    traceDone: new Set(),
    traceCelebrated: false,
    traceDrawing: false,
    traceHasStroke: false
  };

  function numberWord(n) {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return one ? `${tens[ten]}-${units[one]}` : tens[ten];
  }

  function rangeEnd() { return state.rangeStart + RANGE_SIZE - 1; }
  function numbersInRange() {
    return Array.from({ length: RANGE_SIZE }, (_, i) => state.rangeStart + i);
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.explored = new Set(Array.isArray(saved.explored) ? saved.explored : []);
      state.traced = new Set(Array.isArray(saved.traced) ? saved.traced : []);
    } catch (e) { /* Continue without persistence when storage is blocked. */ }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        explored: [...state.explored],
        traced: [...state.traced]
      }));
    } catch (e) { /* Continue without persistence when storage is blocked. */ }
    updateProgress();
  }

  function markExplored(n) {
    state.explored.add(n);
    saveProgress();
  }

  function updateProgress() {
    const count = state.explored.size;
    progressFill.style.width = `${Math.round((count / TOTAL) * 100)}%`;
    progressText.textContent = `${count} of ${TOTAL} numbers explored`;
  }

  function speak(text) {
    liveRegion.textContent = text;
    if (!state.soundOn || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.pitch = 1.12;
    window.speechSynthesis.speak(utterance);
  }

  function quantityMarkup(n) {
    const groups = Math.floor(n / 10);
    const remainder = n % 10;
    let html = '';
    for (let i = 0; i < groups; i++) {
      html += '<span class="ten-group" aria-label="group of ten">';
      html += '<span class="dot"></span>'.repeat(10);
      html += '</span>';
    }
    if (remainder || !groups) {
      html += '<span class="ones-group" aria-label="ones">';
      html += '<span class="dot"></span>'.repeat(remainder || n);
      html += '</span>';
    }
    const caption = groups
      ? `${groups} group${groups === 1 ? '' : 's'} of ten${remainder ? ` and ${remainder} more` : ''}`
      : `${n} ${n === 1 ? 'one' : 'ones'}`;
    return `${html}<span class="quantity-caption">${caption}</span>`;
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === 'play') {
      state.countRound = 0;
      state.countScore = 0;
      state.countTarget = null;
      startCountRound();
    }
    if (mode === 'trace') {
      state.traceTarget = state.rangeStart;
      state.traceDone = new Set(numbersInRange().filter(n => state.traced.has(n)));
      state.traceCelebrated = false;
    }
    updateControls();
    render();
  }

  function setRange(start) {
    state.rangeStart = start;
    state.selected = start;
    state.countTarget = null;
    state.traceTarget = start;
    state.traceDone = new Set(numbersInRange().filter(n => state.traced.has(n)));
    state.traceCelebrated = false;
    if (state.mode === 'play') {
      state.countRound = 0;
      state.countScore = 0;
      startCountRound();
    }
    updateControls();
    render();
  }

  function updateControls() {
    modeButtons.forEach(button => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    rangeButtons.forEach(button => {
      const active = Number(button.dataset.rangeStart) === state.rangeStart;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    playButtons.forEach(button => {
      const active = button.dataset.playMode === state.playMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const playPicker = document.querySelector('.play-picker');
    if (playPicker) playPicker.hidden = state.mode !== 'play';
  }

  function render() {
    updateProgress();
    if (state.mode === 'explore') renderExplore();
    else if (state.mode === 'play') renderPlay();
    else renderTrace();
  }

  function renderExplore() {
    app.innerHTML = `
      <h2 class="section-heading">Choose a number</h2>
      <p class="instruction">Tap a number to hear it and see how many it means.</p>
      <div class="number-grid" aria-label="Numbers ${state.rangeStart} to ${rangeEnd()}">
        ${numbersInRange().map((n, i) => `
          <button class="number-card" style="--card-color:${COLORS[i % COLORS.length]}" data-number="${n}" aria-label="${n}, ${numberWord(n)}">
            <span class="digit">${n}</span>
            <span class="word">${numberWord(n)}</span>
            ${state.explored.has(n) ? '<span class="done">★ heard</span>' : ''}
          </button>
        `).join('')}
      </div>
    `;
    app.querySelectorAll('[data-number]').forEach(button => {
      button.addEventListener('click', () => openNumber(Number(button.dataset.number)));
    });
  }

  function openNumber(n) {
    state.selected = n;
    markExplored(n);
    app.innerHTML = `
      <section class="detail" aria-live="polite">
        <div class="detail-digit">${n}</div>
        <div class="detail-word">${numberWord(n)}</div>
        <p class="instruction">${n < 11 ? 'Let’s count the dots together!' : 'Look at the groups of ten and the extra ones.'}</p>
        <div class="quantity" aria-label="${n} shown as groups">${quantityMarkup(n)}</div>
        <div class="detail-actions">
          <button class="secondary-button" id="hearNumber">🔊 Hear ${n}</button>
          <button class="secondary-button" id="backToNumbers">⬅️ Back to numbers</button>
          <button class="secondary-button" id="nextNumber">Next ➡️</button>
        </div>
      </section>
    `;
    document.getElementById('hearNumber').addEventListener('click', () => speak(`${n}. ${numberWord(n)}.`));
    document.getElementById('backToNumbers').addEventListener('click', render);
    document.getElementById('nextNumber').addEventListener('click', () => openNumber(n >= rangeEnd() ? state.rangeStart : n + 1));
    speak(`${n}. ${numberWord(n)}.`);
  }

  function chooseDistractors(answer) {
    const pool = numbersInRange().filter(n => n !== answer);
    const result = [];
    while (result.length < 2 && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(index, 1)[0]);
    }
    return [answer, ...result].sort(() => Math.random() - .5);
  }

  function startCountRound() {
    state.countTarget = state.rangeStart === 1
      ? 1 + Math.floor(Math.random() * 10)
      : state.rangeStart + Math.floor(Math.random() * RANGE_SIZE);
    state.countRound += 1;
    state.countAnswered = false;
  }

  function renderPlay() {
    if (state.playMode === 'match') renderMatch();
    else renderCount();
  }

  function renderCount() {
    if (!state.countTarget || state.countRound > 5) {
      app.innerHTML = `
        <div class="trace-complete"><div class="celebrate">🌟</div><h2>Counting star!</h2>
          <p>You played five short rounds.</p><button class="secondary-button" id="playAgain">🔄 Play again</button></div>`;
      document.getElementById('playAgain').addEventListener('click', () => { state.countRound = 0; state.countScore = 0; startCountRound(); render(); });
      return;
    }
    const answer = state.countTarget;
    const large = answer > 10;
    app.innerHTML = `
      <div class="play-card">
        <h2 class="section-heading">${large ? 'Which number is this?' : 'How many are there?'}</h2>
        <p class="instruction">${large ? 'Look at the groups of ten and the extra ones.' : 'Count the dots, then tap the number.'}</p>
        <div class="quantity" aria-label="${answer} shown as groups">${quantityMarkup(answer)}</div>
        <div class="answer-grid" aria-label="Number choices">
          ${chooseDistractors(answer).map(n => `<button class="answer-button" data-answer="${n}">${n}</button>`).join('')}
        </div>
        <div class="feedback" id="countFeedback" aria-live="polite">Round ${Math.min(state.countRound, 5)} of 5</div>
      </div>
    `;
    app.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => answerCount(button, answer)));
    speak(large ? `Which number has ${answer} objects?` : `How many? There are ${answer}.`);
  }

  function answerCount(button, answer) {
    const feedback = document.getElementById('countFeedback');
    if (state.countAnswered) return;
    if (Number(button.dataset.answer) === answer) {
      state.countAnswered = true;
      state.countScore += 1;
      button.classList.add('correct');
      feedback.textContent = `Yes! ${answer} is ${numberWord(answer)}! ⭐`;
      markExplored(answer);
      speak(`Yes! ${answer}. Great counting!`);
      setTimeout(() => { state.countTarget = null; render(); }, 900);
    } else {
      button.classList.add('try-again');
      feedback.textContent = 'Almost! Let’s count together. Try again. 💛';
      speak(`Try again. Count the groups.`);
      setTimeout(() => button.classList.remove('try-again'), 350);
    }
  }

  function startMatch() {
    state.matchCards = [];
    state.matchFirst = null;
    state.matchLock = false;
    state.matchFound = 0;
    const values = numbersInRange().sort(() => Math.random() - .5).slice(0, 3);
    values.forEach(value => {
      state.matchCards.push({ value, kind: 'digit', text: String(value) });
      state.matchCards.push({ value, kind: 'quantity', text: quantityMarkup(value) });
    });
    state.matchCards.sort(() => Math.random() - .5);
  }

  function renderMatch() {
    if (!state.matchCards.length) startMatch();
    app.innerHTML = `
      <div class="play-card">
        <h2 class="section-heading">Match number friends</h2>
        <p class="instruction">Match a numeral to its amount. There are three pairs.</p>
        <div class="match-grid" aria-label="Number matching cards">
          ${state.matchCards.map((card, i) => `<button class="match-card" data-card-index="${i}" aria-label="Hidden card">🔢</button>`).join('')}
        </div>
        <div class="feedback" id="matchFeedback" aria-live="polite">Matches: ${state.matchFound} of 3</div>
      </div>
    `;
    app.querySelectorAll('[data-card-index]').forEach(button => button.addEventListener('click', () => flipMatch(button, Number(button.dataset.cardIndex))));
  }

  function flipMatch(button, index) {
    if (state.matchLock || button.classList.contains('revealed')) return;
    const card = state.matchCards[index];
    button.classList.add('revealed');
    button.innerHTML = card.kind === 'digit' ? `<span>${card.text}</span>` : card.text;
    speak(card.kind === 'digit' ? card.text : numberWord(card.value));
    if (state.matchFirst === null) { state.matchFirst = index; return; }
    const firstIndex = state.matchFirst;
    const first = state.matchCards[firstIndex];
    state.matchLock = true;
    const feedback = document.getElementById('matchFeedback');
    if (first.value === card.value && first.kind !== card.kind) {
      state.matchFound += 1;
      markExplored(card.value);
      feedback.textContent = `Yes! ${numberWord(card.value)} belongs with ${card.value}. ⭐`;
      speak(`A match! ${card.value}.`);
      setTimeout(() => {
        state.matchCards = state.matchCards.filter((_, cardIndex) => cardIndex !== firstIndex && cardIndex !== index);
        state.matchFirst = null;
        state.matchLock = false;
        if (state.matchFound === 3) showMatchComplete();
        else renderMatch();
      }, 650);
    } else {
      feedback.textContent = 'Not a pair yet. Try another friend. 💛';
      setTimeout(() => {
        const firstButton = app.querySelector(`[data-card-index="${firstIndex}"]`);
        if (firstButton) { firstButton.classList.remove('revealed'); firstButton.textContent = '🔢'; }
        button.classList.remove('revealed'); button.textContent = '🔢';
        state.matchFirst = null;
        state.matchLock = false;
      }, 850);
    }
  }

  function showMatchComplete() {
    app.innerHTML = `<div class="trace-complete"><div class="celebrate">🧩</div><h2>Great matching!</h2><p>You found all three pairs.</p><button class="secondary-button" id="matchAgain">🔄 Play again</button></div>`;
    document.getElementById('matchAgain').addEventListener('click', () => { startMatch(); renderMatch(); });
    speak('You found all three pairs!');
  }

  function renderTrace() {
    const values = numbersInRange();
    if (state.traceDone.size >= values.length) {
      app.innerHTML = `<div class="trace-complete"><div class="celebrate">✏️</div><h2>Range complete!</h2><p>You practiced every number from ${state.rangeStart} to ${rangeEnd()}.</p><button class="secondary-button" id="traceAgain">🔄 Trace again</button></div>`;
      document.getElementById('traceAgain').addEventListener('click', () => {
        state.traceDone.forEach(n => state.traced.delete(n));
        saveProgress();
        state.traceDone = new Set();
        state.traceTarget = state.rangeStart;
        state.traceCelebrated = false;
        renderTrace();
      });
      speak(`You practiced every number from ${state.rangeStart} to ${rangeEnd()}!`);
      return;
    }
    if (state.traceDone.has(state.traceTarget)) state.traceTarget = values.find(n => !state.traceDone.has(n));
    state.traceCelebrated = false;
    state.traceHasStroke = false;
    app.innerHTML = `
      <div class="trace-area">
        <h2 class="section-heading">Trace ${state.traceTarget}</h2>
        <p class="instruction">Draw over the big number. Wiggly lines are okay!</p>
        <div class="trace-board" id="traceBoard">
          <div class="trace-guide" aria-hidden="true">${state.traceTarget}</div>
          <canvas class="trace-canvas" id="traceCanvas" aria-label="Drawing area for ${state.traceTarget}"></canvas>
        </div>
        <div class="feedback" id="traceFeedback" aria-live="polite">Traced ${state.traceDone.size} of ${values.length}</div>
        <div class="trace-controls">
          <button class="secondary-button" id="clearTrace">🗑️ Clear</button>
          <button class="secondary-button" id="hearTrace">🔊 Hear number</button>
          <button class="secondary-button" id="nextTrace">Next ➡️</button>
        </div>
      </div>
    `;
    const canvas = document.getElementById('traceCanvas');
    resizeCanvas(canvas);
    canvas.addEventListener('pointerdown', startStroke);
    canvas.addEventListener('pointermove', moveStroke);
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);
    document.getElementById('clearTrace').addEventListener('click', () => { clearCanvas(canvas); state.traceCelebrated = false; state.traceHasStroke = false; document.getElementById('traceFeedback').textContent = 'Try tracing again! ✏️'; });
    document.getElementById('hearTrace').addEventListener('click', () => speak(`${state.traceTarget}. ${numberWord(state.traceTarget)}.`));
    document.getElementById('nextTrace').addEventListener('click', nextTrace);
    speak(`Trace the number ${state.traceTarget}.`);
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const context = canvas.getContext('2d');
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }

  function canvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startStroke(event) {
    const canvas = event.currentTarget;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    state.traceDrawing = true;
    state.traceHasStroke = true;
    const point = canvasPoint(event, canvas);
    const context = canvas.getContext('2d');
    context.strokeStyle = '#ff6b6b';
    context.lineWidth = 28;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + .1, point.y + .1);
    context.stroke();
  }

  function moveStroke(event) {
    if (!state.traceDrawing) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    const point = canvasPoint(event, canvas);
    const context = canvas.getContext('2d');
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function endStroke() {
    if (!state.traceDrawing) return;
    state.traceDrawing = false;
    if (state.traceHasStroke && !state.traceCelebrated) {
      state.traceCelebrated = true;
      state.traceDone.add(state.traceTarget);
      state.traced.add(state.traceTarget);
      markExplored(state.traceTarget);
      const feedback = document.getElementById('traceFeedback');
      if (feedback) feedback.textContent = `Great practice! ${state.traceTarget} is ${numberWord(state.traceTarget)}! ⭐`;
      speak(`Great practice! ${state.traceTarget}.`);
      setTimeout(() => {
        if (state.mode === 'trace') renderTrace();
      }, 1100);
    }
  }

  function clearCanvas(canvas) { canvas.getContext('2d').clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); }

  function nextTrace() {
    const values = numbersInRange();
    const next = values.find(n => !state.traceDone.has(n));
    if (next == null) { renderTrace(); return; }
    state.traceTarget = next;
    state.traceCelebrated = false;
    renderTrace();
  }

  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  rangeButtons.forEach(button => button.addEventListener('click', () => setRange(Number(button.dataset.rangeStart))));
  playButtons.forEach(button => button.addEventListener('click', () => {
    state.playMode = button.dataset.playMode;
    if (state.playMode === 'match') startMatch(); else { state.countRound = 0; state.countTarget = null; startCountRound(); }
    updateControls();
    render();
  }));
  soundButton.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    soundButton.setAttribute('aria-pressed', String(state.soundOn));
    soundButton.textContent = state.soundOn ? '🔊 Sound on' : '🔇 Sound off';
    if (state.soundOn) speak('Sound on');
  });
  resetButton.addEventListener('click', () => {
    if (!window.confirm('Reset number progress?')) return;
    state.explored.clear();
    state.traced.clear();
    state.traceDone.clear();
    saveProgress();
    render();
  });
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('traceCanvas');
    if (canvas && state.mode === 'trace') resizeCanvas(canvas);
  });

  readProgress();
  updateControls();
  render();
})();
