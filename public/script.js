// ══════════════════════════════════════════════════════════════
//  FLASHCARD DATA — 5 categories × 8 cards = 40 total
// ══════════════════════════════════════════════════════════════

const cardsByCategory = {
  "Greetings": [
    { spanish: "Hola",          english: "Hello"          },
    { spanish: "Adiós",         english: "Goodbye"        },
    { spanish: "Gracias",       english: "Thank you"      },
    { spanish: "Por favor",     english: "Please"         },
    { spanish: "De nada",       english: "You're welcome" },
    { spanish: "Buenos días",   english: "Good morning"   },
    { spanish: "Buenas noches", english: "Good night"     },
    { spanish: "¿Cómo estás?",  english: "How are you?"   },
  ],
  "Animals": [
    { spanish: "Perro",   english: "Dog"    },
    { spanish: "Gato",    english: "Cat"    },
    { spanish: "Pájaro",  english: "Bird"   },
    { spanish: "Pez",     english: "Fish"   },
    { spanish: "Caballo", english: "Horse"  },
    { spanish: "Conejo",  english: "Rabbit" },
    { spanish: "Ratón",   english: "Mouse"  },
    { spanish: "León",    english: "Lion"   },
  ],
  "Colors": [
    { spanish: "Rojo",     english: "Red"    },
    { spanish: "Azul",     english: "Blue"   },
    { spanish: "Verde",    english: "Green"  },
    { spanish: "Amarillo", english: "Yellow" },
    { spanish: "Negro",    english: "Black"  },
    { spanish: "Blanco",   english: "White"  },
    { spanish: "Naranja",  english: "Orange" },
    { spanish: "Morado",   english: "Purple" },
  ],
  "Everyday Words": [
    { spanish: "Casa",    english: "House"          },
    { spanish: "Libro",   english: "Book"           },
    { spanish: "Amigo",   english: "Friend"         },
    { spanish: "Familia", english: "Family"         },
    { spanish: "Escuela", english: "School"         },
    { spanish: "Trabajo", english: "Work"           },
    { spanish: "Tiempo",  english: "Time / Weather" },
    { spanish: "Dinero",  english: "Money"          },
  ],
  "Food & Drink": [
    { spanish: "Agua",   english: "Water"  },
    { spanish: "Comida", english: "Food"   },
    { spanish: "Pan",    english: "Bread"  },
    { spanish: "Leche",  english: "Milk"   },
    { spanish: "Fruta",  english: "Fruit"  },
    { spanish: "Carne",  english: "Meat"   },
    { spanish: "Café",   english: "Coffee" },
    { spanish: "Arroz",  english: "Rice"   },
  ],
};

const allCards = Object.values(cardsByCategory).flat();


// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════

let currentDeck        = [];
let currentIndex       = 0;
let correct            = 0;
let incorrect          = 0;
let isFlipped          = false;
let isAnimating        = false;   // guard: prevents double-answer during animation
let shuffleEnabled     = false;
let activeCategoryName = '';

// Streak (resets on wrong answer)
let currentStreak = 0;
let bestStreak    = 0;            // best streak this session


// ══════════════════════════════════════════════════════════════
//  LOCAL STORAGE — Best Scores per Category
//  Format: { "Greetings": 87, "all": 100, ... }  (percentages)
// ══════════════════════════════════════════════════════════════

const LS_KEY = 'flashespanol_best';

function getBestScores() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}

// Returns true if this is a new personal best
function saveBestScore(category, pct) {
  const scores = getBestScores();
  if (!scores[category] || pct > scores[category]) {
    scores[category] = pct;
    localStorage.setItem(LS_KEY, JSON.stringify(scores));
    return true;
  }
  return false;
}

// Each category card has a <span class="cat-best" id="cat-best-X">
// IDs use dashes instead of spaces/& to be valid HTML
function bestBadgeId(cat) {
  if (cat === 'all')            return 'cat-best-all';
  if (cat === 'Everyday Words') return 'cat-best-Everyday-Words';
  if (cat === 'Food & Drink')   return 'cat-best-Food-Drink';
  return `cat-best-${cat}`;
}

// Populate all best-score badges on the category screen
function refreshBestBadges() {
  const scores = getBestScores();
  Object.keys(scores).forEach(cat => {
    const el = document.getElementById(bestBadgeId(cat));
    if (el) el.textContent = `Best ${scores[cat]}%`;
  });
}


// ══════════════════════════════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════════════════════════════

const categoryScreen   = document.getElementById('category-screen');
const app              = document.getElementById('app');
const endScreen        = document.getElementById('end-screen');

const btnShuffleToggle = document.getElementById('btn-shuffle-toggle');
const catButtons       = document.querySelectorAll('.cat-card');

const cardScene        = document.getElementById('card-scene');
const flashcard        = document.getElementById('flashcard');
const spanishWord      = document.getElementById('spanish-word');
const englishWord      = document.getElementById('english-word');
const topCategory      = document.getElementById('top-category');
const topScore         = document.getElementById('top-score');
const streakDisplay    = document.getElementById('streak-display');
const progressFill     = document.getElementById('progress-fill');
const cardCounter      = document.getElementById('card-counter');
const answerButtons    = document.getElementById('answer-buttons');
const btnCorrect       = document.getElementById('btn-correct');
const btnWrong         = document.getElementById('btn-wrong');
const btnBack          = document.getElementById('btn-back');

const endEmoji         = document.getElementById('end-emoji');
const endMessage       = document.getElementById('end-message');
const endScoreText     = document.getElementById('end-score-text');
const endPctText       = document.getElementById('end-pct-text');
const endBestLabel     = document.getElementById('end-best-label');
const endStreakEl      = document.getElementById('end-streak');
const btnRestart       = document.getElementById('btn-restart');
const btnChangeCat     = document.getElementById('btn-change-cat');


// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Refresh the streak counter in the top bar
function updateStreakDisplay() {
  streakDisplay.textContent = `🔥 ${currentStreak}`;
  if (currentStreak >= 3) {
    // Remove & re-add to re-trigger the CSS pulse animation
    streakDisplay.classList.remove('hot');
    void streakDisplay.offsetWidth;
    streakDisplay.classList.add('hot');
  } else {
    streakDisplay.classList.remove('hot');
  }
}


// ══════════════════════════════════════════════════════════════
//  SCREEN NAVIGATION
// ══════════════════════════════════════════════════════════════

function showCategoryScreen() {
  refreshBestBadges();
  categoryScreen.classList.remove('hidden');
  app.classList.add('hidden');
  endScreen.classList.add('hidden');
}

function showApp() {
  categoryScreen.classList.add('hidden');
  app.classList.remove('hidden');
  endScreen.classList.add('hidden');
}

function showEndScreen() {
  const total      = currentDeck.length;
  const pct        = Math.round((correct / total) * 100);
  const isNewBest  = saveBestScore(activeCategoryName, pct);
  const prevBest   = getBestScores()[activeCategoryName]; // already updated

  // Choose emoji + message
  let emoji, message;
  if (pct === 100) {
    emoji = '🏆'; message = 'Perfect score! ¡Perfecto!';
  } else if (pct >= 80) {
    emoji = '🎉'; message = '¡Muy bien! You\'re on a roll!';
  } else if (pct >= 60) {
    emoji = '💪'; message = 'Solid effort — keep it up!';
  } else if (pct >= 40) {
    emoji = '📚'; message = 'Good start — practice makes perfect.';
  } else {
    emoji = '🌱'; message = 'Just getting started — don\'t give up!';
  }

  endEmoji.textContent     = emoji;
  endMessage.textContent   = message;
  endScoreText.textContent = `${correct} / ${total}`;
  endPctText.textContent   = `${pct}%`;

  // Best score comparison
  if (isNewBest && pct === 100) {
    endBestLabel.textContent = '🏅 New personal best — perfect score!';
    endBestLabel.className   = 'end-best-label new-best';
  } else if (isNewBest) {
    endBestLabel.textContent = `🏅 New personal best! (${pct}%)`;
    endBestLabel.className   = 'end-best-label new-best';
  } else if (prevBest) {
    endBestLabel.textContent = `Previous best: ${prevBest}%`;
    endBestLabel.className   = 'end-best-label prev-best';
  } else {
    endBestLabel.textContent = '';
    endBestLabel.className   = 'end-best-label';
  }

  // Best streak line (only show if it was notable)
  if (bestStreak >= 3) {
    endStreakEl.textContent = `🔥 Best streak: ${bestStreak} in a row`;
    endStreakEl.className   = 'end-streak hot';
  } else {
    endStreakEl.textContent = '';
    endStreakEl.className   = 'end-streak';
  }

  progressFill.style.width = '100%';
  endScreen.classList.remove('hidden');
}


// ══════════════════════════════════════════════════════════════
//  SESSION CONTROL
// ══════════════════════════════════════════════════════════════

function startSession(categoryName) {
  activeCategoryName = categoryName;

  const baseDeck = categoryName === 'all' ? allCards : cardsByCategory[categoryName];
  currentDeck    = shuffleEnabled ? shuffleArray(baseDeck) : [...baseDeck];

  currentIndex  = 0;
  correct       = 0;
  incorrect     = 0;
  currentStreak = 0;
  bestStreak    = 0;

  topCategory.textContent = categoryName === 'all' ? '⭐ All Cards' : categoryName;
  updateStreakDisplay();

  showApp();
  loadCard();
}

function restartSession() {
  endScreen.classList.add('hidden');
  startSession(activeCategoryName);
}


// ══════════════════════════════════════════════════════════════
//  CARD LOGIC
// ══════════════════════════════════════════════════════════════

function loadCard() {
  const card = currentDeck[currentIndex];
  spanishWord.textContent = card.spanish;
  englishWord.textContent = card.english;

  flashcard.classList.remove('flipped');
  isFlipped = false;
  answerButtons.classList.remove('visible');

  cardCounter.textContent  = `${currentIndex + 1} / ${currentDeck.length}`;
  topScore.textContent     = `✅ ${correct} ❌ ${incorrect}`;
  progressFill.style.width = `${(currentIndex / currentDeck.length) * 100}%`;
}

function flipCard() {
  if (isFlipped || isAnimating) return;
  flashcard.classList.add('flipped');
  isFlipped = true;
  answerButtons.classList.add('visible');
}

function handleAnswer(wasCorrect) {
  if (!isFlipped || isAnimating) return;
  isAnimating = true;

  // Update score + streak
  if (wasCorrect) {
    correct++;
    currentStreak++;
    if (currentStreak > bestStreak) bestStreak = currentStreak;
  } else {
    incorrect++;
    currentStreak = 0;
  }

  updateStreakDisplay();
  topScore.textContent = `✅ ${correct} ❌ ${incorrect}`;

  // Hide answer buttons so they can't be double-clicked
  answerButtons.classList.remove('visible');

  // 1) Card slides out (right = correct, left = wrong)
  const exitClass = wasCorrect ? 'exit-correct' : 'exit-wrong';
  cardScene.classList.add(exitClass);

  setTimeout(() => {
    cardScene.classList.remove(exitClass);
    currentIndex++;

    if (currentIndex >= currentDeck.length) {
      isAnimating = false;
      showEndScreen();
    } else {
      loadCard();
      // 2) Next card slides in
      cardScene.classList.add('enter');
      setTimeout(() => {
        cardScene.classList.remove('enter');
        isAnimating = false;
      }, 280);
    }
  }, 280);
}


// ══════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
//  Space / Enter  → flip
//  ArrowRight     → Got it (correct)
//  ArrowLeft      → Missed it (wrong)
// ══════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  if (app.classList.contains('hidden')) return; // only active on game screen

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!isFlipped) flipCard();
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (isFlipped) handleAnswer(true);
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (isFlipped) handleAnswer(false);
  }
});


// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════

btnShuffleToggle.addEventListener('click', () => {
  shuffleEnabled = !shuffleEnabled;
  btnShuffleToggle.classList.toggle('active', shuffleEnabled);
  btnShuffleToggle.querySelector('strong').textContent = shuffleEnabled ? 'ON' : 'OFF';
});

catButtons.forEach(btn => {
  btn.addEventListener('click', () => startSession(btn.dataset.category));
});

flashcard.addEventListener('click',   flipCard);
btnCorrect.addEventListener('click',  () => handleAnswer(true));
btnWrong.addEventListener('click',    () => handleAnswer(false));
btnBack.addEventListener('click',     showCategoryScreen);
btnRestart.addEventListener('click',  restartSession);
btnChangeCat.addEventListener('click', showCategoryScreen);


// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════

showCategoryScreen();
