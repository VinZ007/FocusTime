const gameBoard = document.getElementById('gameBoard');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');

const emojis = ['🍕', '🍔', '🍟', '🌭', '🍕', '🍔', '🍟', '🌭'];
let shuffledEmojis = [];
let flipped = [];
let matched = [];
let moves = 0;

function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function initGame() {
    shuffledEmojis = shuffle(emojis);
    gameBoard.innerHTML = '';
    flipped = [];
    matched = [];
    moves = 0;
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = '0';

    shuffledEmojis.forEach((emoji, index) => {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        card.textContent = '?';
        
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function flipCard(e) {
    const card = e.target;
    const index = card.dataset.index;

    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(index)) {
        flipped.push(index);
        card.classList.add('flipped');
        card.textContent = card.dataset.emoji;

        if (flipped.length === 2) {
            moves++;
            movesDisplay.textContent = moves;
            checkMatch();
        }
    }
}

function checkMatch() {
    const [first, second] = flipped;
    const firstCard = document.querySelector(`[data-index="${first}"]`);
    const secondCard = document.querySelector(`[data-index="${second}"]`);

    const isMatch = shuffledEmojis[first] === shuffledEmojis[second];

    setTimeout(() => {
        if (isMatch) {
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            matched.push(first, second);
            matchesDisplay.textContent = matched.length / 2;

            if (matched.length === shuffledEmojis.length) {
                setTimeout(() => {
                    alert(`🎉 You Won! Moves: ${moves}`);
                    initGame();
                }, 500);
            }
        } else {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            firstCard.textContent = '?';
            secondCard.textContent = '?';
        }
        flipped = [];
    }, 800);
}

initGame();
