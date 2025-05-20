const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const gameBoard = document.getElementById('gameBoard');
const difficultySelect = document.getElementById('difficulty');
const toggleTheme = document.getElementById('toggleTheme');
const clickCountEl = document.getElementById('clickCount');
const matchesEl = document.getElementById('matches');
const totalPairsEl = document.getElementById('totalPairs');
const timeLeftEl = document.getElementById('timeLeft');
const gameOver = document.getElementById('gameOver');
const finalScore = document.getElementById('finalScore');
const tryAgain = document.getElementById('tryAgain');
const powerUp = document.getElementById('powerUp');

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let totalPairs = 0;
let clicks = 0;
let timer;
let timeRemaining = 0;
let allPokemonCards = [];

async function preloadByDifficulty() {
 startBtn.disabled = true;
  resetGameState();

  let gameCards = await GetCards();

  LoadGameBoard(gameCards, false);

  setGridLayout(totalPairs);
  
 startBtn.disabled = false;

}

window.onload = async () => {
  preloadByDifficulty();

};

difficultySelect.onchange = () => {
  allPokemonCards = [];
  preloadByDifficulty(); 
};

async function startGame() {
  startBtn.disabled = true;
  resetGameState();

  let gameCards = await GetCards();
  LoadGameBoard(gameCards, true);

  setGridLayout(totalPairs);

  startTimer();
  startBtn.disabled = false;
}

async function GetCards() {
  const difficulty = difficultySelect.value;

  totalPairs = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;
  totalPairsEl.textContent = totalPairs;

  timeRemaining = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120;
  timeLeftEl.textContent = timeRemaining;

  // Always refetch cards for new difficulty
  const unique = await getUniquePokemon(totalPairs);
  allPokemonCards = [...unique, ...unique]; // Create matching pairs

  return shuffle([...allPokemonCards]);
}


function LoadGameBoard(gameCards, areClickable) {
  gameBoard.innerHTML = '';
  for (let poke of gameCards) {
    const card = createCard(poke, areClickable); // false = non-interactive
    gameBoard.appendChild(card);
  }
}


toggleTheme.onclick = () => {
  document.body.classList.toggle('dark-theme');
  document.body.classList.toggle('light-theme');
};

startBtn.onclick = async () => {
  await startGame();
};

resetBtn.onclick = () => {
  clearTimeout(timer);
  startGame();
};

tryAgain.onclick = () => {
  clearTimeout(timer);
  gameOver.style.display = 'none';
  startGame();
};

function setGridLayout() {
    let min;
let maxWidth;

switch (difficultySelect.value) {
  case 'easy':
    maxWidth = '1000px';
    min = '150pt';
    break;
  case 'medium':
    maxWidth = '1490px';
    min = '150pt';
    break;
  case 'hard':
    maxWidth = '1000px';
    min = '100pt';
    break;
  default:
    maxWidth = '400px';
    min = 3;
}

  gameBoard.style.display = 'grid';
  gameBoard.style.maxWidth = maxWidth;
  gameBoard.style.gridTemplateColumns = `repeat(auto-fit, minmax(${min}, 1fr))`;
  gameBoard.style.gap = '16px';
}


function resetGameState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  matchedPairs = 0;
  clicks = 0;
  clearInterval(timer);
  clickCountEl.textContent = '0';
  matchesEl.textContent = '0';
}

function createCard(pokemon, isInteractive = true) {
  const template = document.getElementById('card-template');
  const cardClone = template.content.cloneNode(true);
  const card = cardClone.querySelector('.card');

  card.dataset.name = pokemon.name;

  const frontImg = card.querySelector('.card-front img');
  frontImg.src = pokemon.image;
  frontImg.alt = pokemon.name;

  if (isInteractive) {
    card.addEventListener('click', () => handleCardClick(card));
  } else {
    card.style.pointerEvents = 'none'; // prevent hover/click
    card.style.opacity = '0.6'; // optional: look disabled
  }

  return card;
}

powerUp.onclick = () => {previewAllCards()}

async function previewAllCards(duration = 1000) {
  lockBoard = true;

  const allCards = document.querySelectorAll('.card');

  allCards.forEach(card => {
    card.classList.add('flipped');
    card.style.pointerEvents = 'none'; // disable clicks
  });

  await new Promise(resolve => setTimeout(resolve, duration));

  allCards.forEach(card => {
    card.classList.remove('flipped');
    card.style.pointerEvents = 'auto'; // re-enable clicks
  });

  lockBoard = false;
}


function handleCardClick(card) {
  if (lockBoard || card.classList.contains('matched') || card === firstCard) return;

  card.classList.add('flipped');
  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  clicks++;
  clickCountEl.textContent = clicks;

  if (firstCard.dataset.name === secondCard.dataset.name) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    matchedPairs++;
    matchesEl.textContent = matchedPairs;
    if (matchedPairs === totalPairs) {
      clearInterval(timer);
      alert('🎉 You Win!');
    }
    resetFlip();
  } else {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetFlip();
    }, 1000);
  }
}

function resetFlip() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function startTimer() {
  let initTime = timeRemaining;
  timer = setInterval(() => {
    timeRemaining--;
    timeLeftEl.textContent = timeRemaining;
    if (timeRemaining/initTime*100 === 20) {
      powerUp.style.display = 'inline-block';
    }
    if (timeRemaining === 0) {
      clearInterval(timer);
      gameOver.style.display = 'flex';
      finalScore.textContent = matchedPairs/totalPairs * 100 + "%"
      lockBoard = true;
    }
  }, 1000);
}

async function getUniquePokemon(pairCount) {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
  const data = await res.json();
  const all = data.results;

  const selected = [];
  while (selected.length < pairCount) {
    const random = all[Math.floor(Math.random() * all.length)];
    if (!selected.some(p => p.name === random.name)) {
      const details = await fetch(random.url).then(r => r.json());
      const img = details.sprites.other['official-artwork'].front_default;
      if (img) selected.push({ name: random.name, image: img });
    }
  }

  return selected;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
