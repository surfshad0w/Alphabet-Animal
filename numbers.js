(function () {
  'use strict';

  const TOTAL_NUMBERS = 50;
  const STORAGE_KEY = 'alphabet-animal-number-progress-v2';
  const COLORS = [
    '#ffd6d6', '#d6e8ff', '#fff3d6', '#d6ffd6', '#e8d6ff',
    '#d6fff0', '#ffe8d6', '#d6f0ff', '#ffd6f0', '#d6ffe8'
  ];
  const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

  const numbersHome = document.getElementById('numbersHome');
  const numberGrid = document.getElementById('numberGrid');
  const numberDetail = document.getElementById('numberDetail');
  const detailNumber = document.getElementById('detailNumber');
  const detailWord = document.getElementById('detailWord');
  const quantityGroups = document.getElementById('quantityGroups');
  const quantityCaption = document.getElementById('quantityCaption');
  const detailBack = document.getElementById('detailBack');
  const detailPrevious = document.getElementById('detailPrevious');
  const detailNext = document.getElementById('detailNext');
  const hearNumber = document.getElementById('hearNumber');
  const soundButton = document.getElementById('soundButton');
  const resetProgress = document.getElementById('resetProgress');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const completionOverlay = document.getElementById('completionOverlay');
  const closeCompletion = document.getElementById('closeCompletion');
  const liveRegion = document.getElementById('liveRegion');

  let currentNumber = 1;
  let soundEnabled = true;
  let completionShown = false;
  let visitedNumbers = loadProgress();

  function numberWord(number) {
    if (number < 10) return UNITS[number];
    if (number < 20) return TEENS[number - 10];
    const tensDigit = Math.floor(number / 10);
    const onesDigit = number % 10;
    return onesDigit ? `${TENS[tensDigit]}-${UNITS[onesDigit]}` : TENS[tensDigit];
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return new Set(Array.isArray(saved) ? saved.filter(n => n >= 1 && n <= TOTAL_NUMBERS) : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...visitedNumbers]));
    } catch (error) { /* The page still works when browser storage is unavailable. */ }
  }

  function speak(text) {
    liveRegion.textContent = text;
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.12;
    window.speechSynthesis.speak(utterance);
  }

  function buildGrid() {
    numberGrid.innerHTML = '';
    for (let number = 1; number <= TOTAL_NUMBERS; number++) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'number-tile';
      tile.style.setProperty('--tile-color', COLORS[(number - 1) % COLORS.length]);
      tile.style.animationDelay = `${Math.min((number - 1) * 0.012, 0.45)}s`;
      tile.setAttribute('aria-label', `${number}, ${numberWord(number)}`);
      if (visitedNumbers.has(number)) tile.classList.add('visited');
      tile.innerHTML = `
        <span class="tile-dots" aria-hidden="true">•••</span>
        <span class="tile-number">${number}</span>
        <span class="tile-word">${numberWord(number)}</span>
      `;
      tile.addEventListener('click', () => openNumber(number));
      numberGrid.appendChild(tile);
    }
  }

  function buildQuantity(number) {
    quantityGroups.innerHTML = '';
    const frameCount = Math.ceil(number / 10);
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      const frame = document.createElement('div');
      frame.className = 'ten-frame';
      frame.setAttribute('aria-label', frameIndex < Math.floor(number / 10) ? 'ten dots' : 'ones');
      const filledDots = Math.min(10, Math.max(0, number - frameIndex * 10));
      for (let dotIndex = 0; dotIndex < 10; dotIndex++) {
        const dot = document.createElement('span');
        dot.className = `quantity-dot${dotIndex >= filledDots ? ' empty' : ''}`;
        frame.appendChild(dot);
      }
      quantityGroups.appendChild(frame);
    }

    const tensCount = Math.floor(number / 10);
    const onesCount = number % 10;
    if (number < 10) {
      quantityCaption.textContent = `${number} ${number === 1 ? 'dot' : 'dots'}`;
    } else if (onesCount === 0) {
      quantityCaption.textContent = `${tensCount} ${tensCount === 1 ? 'group' : 'groups'} of ten`;
    } else {
      quantityCaption.textContent = `${tensCount} ${tensCount === 1 ? 'ten' : 'tens'} and ${onesCount} ${onesCount === 1 ? 'one' : 'ones'}`;
    }
  }

  function openNumber(number) {
    currentNumber = number;
    const isNew = !visitedNumbers.has(number);
    visitedNumbers.add(number);
    saveProgress();
    updateProgress();

    detailNumber.textContent = number;
    detailWord.textContent = numberWord(number);
    numberDetail.style.setProperty('--detail-color', COLORS[(number - 1) % COLORS.length]);
    detailPrevious.disabled = number === 1;
    detailNext.disabled = number === TOTAL_NUMBERS;
    buildQuantity(number);

    numbersHome.classList.add('hidden');
    numberDetail.classList.remove('hidden');
    numberDetail.scrollTop = 0;
    speak(`${number}. ${numberWord(number)}.`);

    if (isNew && visitedNumbers.size === TOTAL_NUMBERS && !completionShown) {
      completionShown = true;
      setTimeout(() => completionOverlay.classList.remove('hidden'), 700);
    }
  }

  function closeDetail() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    numberDetail.classList.add('hidden');
    numbersHome.classList.remove('hidden');
    buildGrid();
    window.scrollTo(0, 0);
  }

  function updateProgress() {
    const explored = visitedNumbers.size;
    progressText.textContent = `⭐ ${explored} / ${TOTAL_NUMBERS} Numbers Explored`;
    progressFill.style.width = `${Math.round((explored / TOTAL_NUMBERS) * 100)}%`;
  }

  function createBubbles() {
    const container = document.getElementById('bubbles');
    for (let index = 0; index < 14; index++) {
      const bubble = document.createElement('span');
      const size = 18 + Math.random() * 42;
      bubble.className = 'bubble';
      bubble.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;background:${COLORS[index % COLORS.length]};animation-duration:${12 + Math.random() * 14}s;animation-delay:${Math.random() * 9}s`;
      container.appendChild(bubble);
    }
  }

  detailBack.addEventListener('click', closeDetail);
  detailPrevious.addEventListener('click', () => {
    if (currentNumber > 1) openNumber(currentNumber - 1);
  });
  detailNext.addEventListener('click', () => {
    if (currentNumber < TOTAL_NUMBERS) openNumber(currentNumber + 1);
  });
  hearNumber.addEventListener('click', () => speak(`${currentNumber}. ${numberWord(currentNumber)}.`));

  soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.textContent = soundEnabled ? '🔊 Sound' : '🔇 Sound';
    if (soundEnabled) speak('Sound on');
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  resetProgress.addEventListener('click', () => {
    if (!window.confirm('Reset explored numbers?')) return;
    visitedNumbers = new Set();
    completionShown = false;
    saveProgress();
    updateProgress();
    buildGrid();
  });

  closeCompletion.addEventListener('click', () => completionOverlay.classList.add('hidden'));

  document.addEventListener('keydown', event => {
    if (numberDetail.classList.contains('hidden')) return;
    if (event.key === 'ArrowLeft' && currentNumber > 1) openNumber(currentNumber - 1);
    if (event.key === 'ArrowRight' && currentNumber < TOTAL_NUMBERS) openNumber(currentNumber + 1);
    if (event.key === 'Escape') closeDetail();
  });

  buildGrid();
  updateProgress();
  createBubbles();
})();
