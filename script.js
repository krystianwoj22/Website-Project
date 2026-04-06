// ══════════════════════════════════════════════════════════════
//  FLASHCARD DATA — 5 categories × 8 cards = 40 total
// ══════════════════════════════════════════════════════════════

const cardsByCategory = {

  "Greetings": [
    { spanish: "Hola",          english: "Hello"           },
    { spanish: "Adiós",         english: "Goodbye"         },
    { spanish: "Gracias",       english: "Thank you"       },
    { spanish: "Por favor",     english: "Please"          },
    { spanish: "De nada",       english: "You're welcome"  },
    { spanish: "Buenos días",   english: "Good morning"    },
    { spanish: "Buenas noches", english: "Good night"      },
    { spanish: "¿Cómo estás?",  english: "How are you?"    },
  ],

  "Animals": [
    { spanish: "Perro",    english: "Dog"     },
    { spanish: "Gato",     english: "Cat"     },
    { spanish: "Pájaro",   english: "Bird"    },
    { spanish: "Pez",      english: "Fish"    },
    { spanish: "Caballo",  english: "Horse"   },
    { spanish: "Conejo",   english: "Rabbit"  },
    { spanish: "Ratón",    english: "Mouse"   },
    { spanish: "León",     english: "Lion"    },
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
    { spanish: "Casa",     english: "House"         },
    { spanish: "Libro",    english: "Book"          },
    { spanish: "Amigo",    english: "Friend"        },
    { spanish: "Familia",  english: "Family"        },
    { spanish: "Escuela",  english: "School"        },
    { spanish: "Trabajo",  english: "Work"          },
    { spanish: "Tiempo",   english: "Time / Weather"},
    { spanish: "Dinero",   english: "Money"         },
  ],

  "Food & Drink": [
    { spanish: "Agua",    english: "Water"  },
    { spanish: "Comida",  english: "Food"   },
    { spanish: "Pan",     english: "Bread"  },
    { spanish: "Leche",   english: "Milk"   },
    { spanish: "Fruta",   english: "Fruit"  },
    { spanish: "Carne",   english: "Meat"   },
    { spanish: "Café",    english: "Coffee" },
    { spanish: "Arroz",   english: "Rice"   },
  ],

};

// Build an "All Cards" array from every category
const allCards = Object.values(cardsByCategory).flat();


// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════

let currentDeck       = [];   // the active array of cards being played
let currentIndex      = 0;    // index into currentDeck
let correct           = 0;
let incorrect         = 0;
let isFlipped         = false;
let shuffleEnabled    = false;
let activeCategoryName = '';  // used for the "Try Again" button


// ══════════════════════════════════════════════════════════════
//  DOM REFERENCES
// ══════════════════════════════════════════════════════════════

// Screens
const categoryScreen = document.getElementById('category-screen');
const app            = document.getElementById('app');
const endScreen      = document.getElementById('end-screen');

// Category screen
const btnShuffleToggle = document.getElementById('btn-shuffle-toggle');
const catButtons       = document.querySelectorAll('.cat-card');

// Game screen
const flashcard     = document.getElementById('flashcard');
const spanishWord   = document.getElementById('spanish-word');
const englishWord   = document.getElementById('english-word');
const topCategory   = document.getElementById('top-category');
const topScore      = document.getElementById('top-score');
const progressFill  = document.getElementById('progress-fill');
const cardCounter   = document.getElementById('card-counter');
const answerButtons = document.getElementById('answer-buttons');
const btnCorrect    = document.getElementById('btn-correct');
const btnWrong      = document.getElementById('btn-wrong');
const btnBack       = document.getElementById('btn-back');

// End screen
const endEmoji      = document.getElementById('end-emoji');
const endMessage    = document.getElementById('end-message');
const endScoreText  = document.getElementById('end-score-text');
const endPctText    = document.getElementById('end-pct-text');
const btnRestart    = document.getElementById('btn-restart');
const btnChangeCat  = document.getElementById('btn-change-cat');


// ══════════════════════════════════════════════════════════════
//  HELPER — Fisher-Yates Shuffle
//  Returns a new shuffled copy of the array (does not mutate original)
// ══════════════════════════════════════════════════════════════

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


// ══════════════════════════════════════════════════════════════
//  SCREEN NAVIGATION
// ══════════════════════════════════════════════════════════════

function showCategoryScreen() {
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
  endScreen.classList.remove('hidden');

  const total = currentDeck.length;
  const pct   = Math.round((correct / total) * 100);

  // Pick emoji + message based on percentage
  let emoji, message;
  if (pct === 100) {
    emoji = '🏆'; message = 'Perfect score! ¡Perfecto!';
  } else if (pct >= 80) {
    emoji = '🎉'; message = '¡Muy bien! You\'re on a roll!';
  } else if (pct >= 60) {
    emoji = '💪'; message = 'Solid effort — keep it up!';
  } else if (pct >= 40) {
    emoji = '📚'; message = 'Good start — practise makes perfect.';
  } else {
    emoji = '🌱'; message = 'Just getting started — don\'t give up!';
  }

  endEmoji.textContent    = emoji;
  endMessage.textContent  = message;
  endScoreText.textContent = `${correct} / ${total}`;
  endPctText.textContent   = `${pct}%`;

  // Fill progress bar to 100%
  progressFill.style.width = '100%';
}


// ══════════════════════════════════════════════════════════════
//  SESSION CONTROL
// ══════════════════════════════════════════════════════════════

// Start a fresh session with a given category name
function startSession(categoryName) {
  activeCategoryName = categoryName;

  // Pick the correct deck
  const baseDeck = categoryName === 'all'
    ? allCards
    : cardsByCategory[categoryName];

  // Apply shuffle if enabled
  currentDeck = shuffleEnabled ? shuffleArray(baseDeck) : [...baseDeck];

  // Reset state
  currentIndex = 0;
  correct      = 0;
  incorrect    = 0;

  // Update UI label
  topCategory.textContent = categoryName === 'all' ? '⭐ All Cards' : categoryName;

  showApp();
  loadCard();
}

// Restart the same category (called by "Try Again" button)
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

  // Reset flip
  flashcard.classList.remove('flipped');
  isFlipped = false;

  // Hide answer buttons
  answerButtons.classList.remove('visible');

  // Update counter (e.g. "3 / 8")
  cardCounter.textContent = `${currentIndex + 1} / ${currentDeck.length}`;

  // Update live score
  topScore.innerHTML = `✅ ${correct} &nbsp; ❌ ${incorrect}`;

  // Update progress bar
  const pct = (currentIndex / currentDeck.length) * 100;
  progressFill.style.width = `${pct}%`;
}

function flipCard() {
  if (isFlipped) return;  // can't flip back
  flashcard.classList.add('flipped');
  isFlipped = true;
  answerButtons.classList.add('visible');
}

function handleAnswer(wasCorrect) {
  if (wasCorrect) { correct++; } else { incorrect++; }
  currentIndex++;

  if (currentIndex >= currentDeck.length) {
    showEndScreen();
  } else {
    loadCard();
  }
}


// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════

// Shuffle toggle
btnShuffleToggle.addEventListener('click', () => {
  shuffleEnabled = !shuffleEnabled;
  btnShuffleToggle.classList.toggle('active', shuffleEnabled);
  const strong = btnShuffleToggle.querySelector('strong');
  strong.textContent = shuffleEnabled ? 'ON' : 'OFF';
});

// Category selection
catButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.dataset.category;
    startSession(category);
  });
});

// Card flip
flashcard.addEventListener('click', flipCard);

// Answer buttons
btnCorrect.addEventListener('click', () => handleAnswer(true));
btnWrong.addEventListener('click',   () => handleAnswer(false));

// Back button (go to category screen)
btnBack.addEventListener('click', showCategoryScreen);

// End screen actions
btnRestart.addEventListener('click',   restartSession);
btnChangeCat.addEventListener('click', showCategoryScreen);


// ══════════════════════════════════════════════════════════════
//  INIT — show category screen on load
// ══════════════════════════════════════════════════════════════

showCategoryScreen();
