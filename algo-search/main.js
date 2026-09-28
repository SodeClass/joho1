const WORD_LIST = [
  "あい", "あき", "あさ", "あし", "あせ",
  "いか", "いき", "いけ", "いし", "いす",
  "うし", "うた", "うち", "うま", "うみ",
  "えき", "えさ", "えだ", "えま", "えり",
  "おか", "おき", "おく", "おと", "おに",
  "かお", "かき", "かさ", "かた", "かに",
  "きく", "きし", "きた", "きぬ", "きみ",
  "くさ", "くし", "くち", "くつ", "くま",
  "けさ", "けし", "けら", "けん",
  "こい", "こえ", "こけ", "こし", "こま",
  "さか", "さき", "さく", "ささ", "さる",
  "しお", "しか", "しき", "しし", "した",
  "すえ", "すき", "すし", "すな", "すみ",
  "せき", "せつ", "せみ", "せわ", "せん",
  "そう", "そこ", "そと", "そら", "そん",
  "たけ", "たこ", "たて", "たに", "たね",
  "ちい", "ちえ", "ちか", "ちく", "ちゆ",
  "つい", "つか", "つき", "つた", "つの",
  "てき", "てこ", "てつ", "てら", "てん",
  "とい", "とき", "とく", "とこ", "とら",
  "なえ", "なか", "なつ", "なな", "なみ",
  "にく", "にし", "にす", "にせ", "にわ",
  "ぬか", "ぬし", "ぬの", "ぬま",
  "ねぎ", "ねこ", "ねた", "ねつ", "ねん",
  "のき", "のし", "のら", "のり",
  "はい", "はか", "はこ", "はし", "はな",
  "ひじ", "ひと", "ひな", "ひま", "ひも",
  "ふき", "ふく", "ふね", "ふゆ",
  "へい", "へそ", "へや", "へら",
  "ほか", "ほし", "ほね", "ほん",
  "まき", "まち", "まつ", "まめ",
  "みき", "みせ", "みつ", "みね",
  "むぎ", "むし", "むら", "むり",
  "めか", "めし", "めす", "めん",
  "もち", "もと", "もの", "もも",
  "やど", "やね", "やぶ", "やま",
  "ゆか", "ゆき", "ゆび", "ゆめ",
  "よい", "よく", "よこ", "よび", "よる",
  "らく", "らち", "らま", "らん",
  "りか", "りく", "りす", "りん",
  "るい", "るす", "るび", "るふ",
  "れい", "れじ", "れつ",
  "ろく", "ろじ", "ろば",
  "わか", "わく", "わし", "わた", "わに",
];

function toFullWidth(str) {
  return String(str).replace(/[0-9]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
  });
}

const CARD_COUNT = 30;

let currentMode = 'number';
let currentAlgo = null;
let isPlaying = false;

let dataset = [];
let targetValue = null;
let cardStates = [];
let stepCount = 0;
let isCompleted = false;

let linearIndex = 0;
let binaryLeft = 0;
let binaryRight = CARD_COUNT - 1;

const targetValueEl = document.getElementById('target-value');
const minimapCardsEl = document.getElementById('minimap-cards');
const minimapViewportBox = document.getElementById('minimap-viewport-box');
const mainCardsEl = document.getElementById('main-cards');
const mainViewContainer = document.getElementById('main-view-container');
const resultMessageEl = document.getElementById('result-message');

const controlsEl = document.getElementById('controls');
const gameInfoEl = document.getElementById('game-info');
const currentAlgoTitleEl = document.getElementById('current-algo-title');
const guideMessageEl = document.getElementById('guide-message');
const modeControlEl = document.getElementById('mode-control');
const startControlsEl = document.getElementById('start-controls');

const btnStartLinear = document.getElementById('btn-start-linear');
const btnStartBinary = document.getElementById('btn-start-binary');
const radioNumber = document.getElementById('mode-number');
const radioWord = document.getElementById('mode-word');

const btnRetrySame = document.getElementById('btn-retry-same');
const btnRetryDiff = document.getElementById('btn-retry-diff');
const retryControls = document.getElementById('retry-controls');

btnStartLinear.addEventListener('click', () => { startGame('linear'); });
btnStartBinary.addEventListener('click', () => { startGame('binary'); });
radioNumber.addEventListener('change', () => { setMode('number'); });
radioWord.addEventListener('change', () => { setMode('word'); });

btnRetrySame.addEventListener('click', () => {
  isPlaying = false; // 初期状態に戻す
  currentAlgo = null;
  stepCount = 0;
  isCompleted = false;
  
  controlsEl.classList.remove('hidden');
  gameInfoEl.classList.add('hidden');
  
  resultMessageEl.textContent = '';
  retryControls.classList.add('hidden');

  cardStates = Array(CARD_COUNT).fill(null).map(() => ({ flipped: false, grayedOut: false }));
  linearIndex = 0;
  binaryLeft = 0;
  binaryRight = CARD_COUNT - 1;

  renderCards();
  updateSearchVisuals();
});

btnRetryDiff.addEventListener('click', () => {
  previewGame();
});

// ドラッグスクロールの実装
let isDown = false;
let startX;
let scrollLeft;
let isDragging = false;

mainViewContainer.addEventListener('mousedown', (e) => {
  isDown = true;
  isDragging = false;
  startX = e.pageX - mainViewContainer.offsetLeft;
  scrollLeft = mainViewContainer.scrollLeft;
});
mainViewContainer.addEventListener('mouseleave', () => {
  isDown = false;
});
mainViewContainer.addEventListener('mouseup', () => {
  isDown = false;
});
mainViewContainer.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - mainViewContainer.offsetLeft;
  const walk = (x - startX);
  if (Math.abs(walk) > 3) {
    isDragging = true;
  }
  mainViewContainer.scrollLeft = scrollLeft - walk;
});

mainViewContainer.addEventListener('scroll', updateMinimapViewport);
window.addEventListener('resize', updateMinimapViewport);

function setMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;
  
  if (!isPlaying) {
    previewGame();
  }
}

function generateDataset() {
  dataset = [];
  // 0: 均等, 1: 前半(小さい方)に偏る, 2: 後半(大きい方)に偏る, 3: 両極端に偏る
  const distributionType = Math.floor(Math.random() * 4);
  
  while(dataset.length < CARD_COUNT) {
    let r = Math.random();
    
    if (distributionType === 1) {
      r = Math.pow(r, 2); // 前半に偏る
    } else if (distributionType === 2) {
      r = 1 - Math.pow(r, 2); // 後半に偏る
    } else if (distributionType === 3) {
      r = r < 0.5 ? Math.pow(r * 2, 2) / 2 : 1 - Math.pow((1 - r) * 2, 2) / 2; // 両極端
    }

    if (currentMode === 'number') {
      const num = Math.floor(r * 90) + 10;
      if (!dataset.includes(num)) {
        dataset.push(num);
      }
    } else {
      const word = WORD_LIST[Math.floor(r * WORD_LIST.length)];
      if (!dataset.includes(word)) {
        dataset.push(word);
      }
    }
  }

  if (currentMode === 'number') {
    dataset.sort((a, b) => a - b);
  } else {
    dataset.sort((a, b) => a.localeCompare(b, 'ja'));
  }
}

function previewGame() {
  generateDataset();
  targetValue = dataset[Math.floor(Math.random() * CARD_COUNT)];
  targetValueEl.textContent = toFullWidth(targetValue);

  isPlaying = false;
  currentAlgo = null;
  stepCount = 0;
  isCompleted = false;

  controlsEl.classList.remove('hidden');
  gameInfoEl.classList.add('hidden');

  resultMessageEl.textContent = '';
  retryControls.classList.add('hidden');

  cardStates = Array(CARD_COUNT).fill(null).map(() => ({ flipped: false, grayedOut: false }));
  renderCards();
  updateSearchVisuals();
  
  requestAnimationFrame(() => {
    updateMinimapViewport();
  });
}

function startGame(algo) {
  currentAlgo = algo;
  isPlaying = true;

  controlsEl.classList.add('hidden');
  gameInfoEl.classList.remove('hidden');

  if (algo === 'linear') {
    currentAlgoTitleEl.textContent = '線形探索';
    guideMessageEl.textContent = '左端から順番に探してください。（※整列済みです。）';
  } else {
    currentAlgoTitleEl.textContent = '二分探索';
    guideMessageEl.textContent = '真ん中のカードを開いて範囲を絞り込んでください。（※整列済みです。）';
  }

  stepCount = 0;
  isCompleted = false;
  resultMessageEl.textContent = '';
  retryControls.classList.add('hidden');

  cardStates = Array(CARD_COUNT).fill(null).map(() => ({ flipped: false, grayedOut: false }));
  linearIndex = 0;
  binaryLeft = 0;
  binaryRight = CARD_COUNT - 1;

  updateSearchVisuals();
}

function renderCards() {
  minimapCardsEl.innerHTML = '';
  mainCardsEl.innerHTML = '';

  dataset.forEach((val, i) => {
    const mCard = document.createElement('div');
    mCard.className = 'mini-card';
    mCard.id = `mini-card-${i}`;
    minimapCardsEl.appendChild(mCard);

    const wrap = document.createElement('div');
    wrap.className = 'card-wrapper';
    wrap.id = `card-wrapper-${i}`;

    wrap.addEventListener('click', () => {
      if (!isDragging) {
        handleCardClick(i);
      }
    });

    const card = document.createElement('div');
    card.className = 'card';

    const front = document.createElement('div');
    front.className = 'card-face card-front';

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    back.textContent = toFullWidth(val);

    card.appendChild(front);
    card.appendChild(back);
    wrap.appendChild(card);
    mainCardsEl.appendChild(wrap);
  });
}

function getExpectedIndex() {
  if (currentAlgo === 'linear') {
    return linearIndex;
  } else if (currentAlgo === 'binary') {
    if (binaryLeft > binaryRight) return -1;
    return Math.floor((binaryLeft + binaryRight) / 2);
  }
  return -1;
}

function handleCardClick(index) {
  if (isCompleted || cardStates[index].flipped || cardStates[index].grayedOut) return;
  
  if (!isPlaying) {
    // 自由に探索できるモード
    stepCount++;
    cardStates[index].flipped = true;
    updateCardVisuals();
    
    if (dataset[index] === targetValue) {
      isCompleted = true;
      resultMessageEl.textContent = `完了しました。手数は${stepCount}回でした`;
      retryControls.classList.remove('hidden');
    }
    return;
  }
  
  const expectedIndex = getExpectedIndex();
  
  if (index === expectedIndex) {
    stepCount++;
    cardStates[index].flipped = true;
    updateCardVisuals();
    
    if (dataset[index] === targetValue) {
      isCompleted = true;
      resultMessageEl.textContent = `完了しました。手数は${stepCount}回でした`;
      retryControls.classList.remove('hidden');
    } else {
      if (currentAlgo === 'linear') {
        cardStates[index].grayedOut = true;
        linearIndex++;
      } else {
        if (dataset[index] < targetValue) {
          for (let i = binaryLeft; i <= index; i++) cardStates[i].grayedOut = true;
          binaryLeft = index + 1;
        } else {
          for (let i = index; i <= binaryRight; i++) cardStates[i].grayedOut = true;
          binaryRight = index - 1;
        }
      }
      setTimeout(updateSearchVisuals, 600);
    }
  } else {
    const wrap = document.getElementById(`card-wrapper-${index}`);
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
  }
}

function updateCardVisuals() {
  dataset.forEach((val, i) => {
    const wrap = document.getElementById(`card-wrapper-${i}`);
    const card = wrap.querySelector('.card');
    const mini = document.getElementById(`mini-card-${i}`);
    
    if (cardStates[i].flipped) {
      card.classList.add('flipped');
      mini.classList.add('revealed');
    } else {
      card.classList.remove('flipped');
      mini.classList.remove('revealed');
    }
    
    if (cardStates[i].grayedOut) {
      wrap.classList.add('grayed-out');
      mini.classList.add('grayed-out');
    } else {
      wrap.classList.remove('grayed-out');
      mini.classList.remove('grayed-out');
    }
  });
}

function updateSearchVisuals() {
  updateCardVisuals();
  
  dataset.forEach((_, i) => {
    const wrap = document.getElementById(`card-wrapper-${i}`);
    wrap.classList.remove('highlight');
    const mini = document.getElementById(`mini-card-${i}`);
    mini.classList.remove('highlight');
  });
  
  if (isPlaying && !isCompleted && currentAlgo === 'binary') {
    const expected = getExpectedIndex();
    if (expected !== -1) {
      const wrap = document.getElementById(`card-wrapper-${expected}`);
      wrap.classList.add('highlight');
      const mini = document.getElementById(`mini-card-${expected}`);
      mini.classList.add('highlight');
    }
  }
}

function updateMinimapViewport() {
  const scrollLeft = mainViewContainer.scrollLeft;
  const scrollWidth = mainViewContainer.scrollWidth;
  const clientWidth = mainViewContainer.clientWidth;
  
  const minimapWidth = minimapCardsEl.clientWidth;
  
  if (scrollWidth <= clientWidth) {
    minimapViewportBox.style.width = '100%';
    minimapViewportBox.style.transform = `translateX(0)`;
    return;
  }
  
  const boxWidthRatio = clientWidth / scrollWidth;
  const scrollRatio = scrollLeft / (scrollWidth - clientWidth);
  
  const boxWidth = minimapWidth * boxWidthRatio;
  const maxTranslate = minimapWidth - boxWidth;
  const translateX = maxTranslate * scrollRatio;
  
  minimapViewportBox.style.width = `${boxWidth}px`;
  minimapViewportBox.style.transform = `translateX(${translateX}px)`;
}

// 起動時はプレビュー状態からスタート
previewGame();
