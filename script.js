const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const progressBar = document.createElement('div');
const progressContainer = document.createElement('div');

progressContainer.classList.add('progress-container');
progressBar.classList.add('progress-bar');
progressContainer.appendChild(progressBar);
document.body.appendChild(progressContainer);

const basketWidth = 80; // Smaller basket
const basketHeight = 20;
const objectSize = 30;
const initialFallSpeed = 5; // Starting speed
const maxFallSpeed = 20; // Maximum speed cap
const basketCapacity = 3;
const bombProbability = 0.3; // Probability for bombs (30%)
let basketX = canvas.width / 2 - basketWidth / 2;
let basketY = canvas.height - basketHeight - 10;
let score = 0;
let fallingObjects = [];
let isGameOver = false;
let gameInterval;
let progress = 0; // Progress towards next score increment
let objectFallSpeed = initialFallSpeed; // Initialize speed
let bombRows = new Set(); // Track rows with bombs to ensure only one per row

function startGame() {
    menu.style.display = 'none';
    document.getElementById('gameCanvasContainer').style.display = 'block';
    document.addEventListener('keydown', moveBasket);
    document.addEventListener('mousemove', moveBasketWithMouse);
    fallingObjects = [];
    bombRows = new Set(); // Reset bomb rows
    score = 0;
    progress = 0;
    isGameOver = false;
    objectFallSpeed = initialFallSpeed; // Reset speed on restart
    finalScoreElement.textContent = `Score: ${score}`;
    progressBar.style.width = '0%';
    gameOverScreen.style.display = 'none';
    gameInterval = setInterval(updateGame, 100);
}

function restartGame() {
    window.location.reload();
}

function showMenu() {
    clearInterval(gameInterval);
    document.getElementById('gameCanvasContainer').style.display = 'none';
    menu.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    document.removeEventListener('keydown', moveBasket);
    document.removeEventListener('mousemove', moveBasketWithMouse);
}

function showHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    if (highScores.length === 0) {
        alert('No high scores yet.');
    } else {
        alert('High Scores:\n' + highScores.map((score, index) => `#${index + 1}: ${score}`).join('\n'));
    }
}

function saveHighScore(score) {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScores.push(score);
    highScores = highScores.sort((a, b) => b - a).slice(0, 5); // Keep top 5 scores
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function moveBasket(e) {
    if (isGameOver) return;
    const key = e.key || e.code;
    if (key === 'ArrowLeft' || key === 'KeyA') {
        basketX -= 20;
        if (basketX < 0) basketX = 0;
    } else if (key === 'ArrowRight' || key === 'KeyD') {
        basketX += 20;
        if (basketX > canvas.width - basketWidth) basketX = canvas.width - basketWidth;
    }
}

function moveBasketWithMouse(e) {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    basketX = e.clientX - rect.left - basketWidth / 2;
    if (basketX < 0) basketX = 0;
    if (basketX > canvas.width - basketWidth) basketX = canvas.width - basketWidth;
}

function createFallingObject() {
    let row;
    let isBomb;
    do {
        row = Math.floor(Math.random() * (canvas.height / objectSize));
        isBomb = Math.random() < bombProbability;
    } while ((bombRows.has(row) || (row === Math.floor(basketY / objectSize))) && isBomb);

    if (isBomb) {
        bombRows.add(row); // Mark row as having a bomb
        return {
            x: Math.floor(Math.random() * (canvas.width / objectSize)) * objectSize,
            y: row * objectSize,
            type: 'bomb'
        };
    } else {
        return {
            x: Math.floor(Math.random() * (canvas.width / objectSize)) * objectSize,
            y: row * objectSize,
            type: 'fruit'
        };
    }
}

function drawBasket() {
    ctx.fillStyle = '#4a90e2'; // Basket color
    ctx.fillRect(basketX, basketY, basketWidth, basketHeight);
    ctx.strokeStyle = '#004a7c'; // Darker border color
    ctx.strokeRect(basketX, basketY, basketWidth, basketHeight);
}

function drawFallingObjects() {
    fallingObjects.forEach(obj => {
        ctx.fillStyle = obj.type === 'fruit' ? '#4caf50' : '#f44336'; // Green for fruits, red for bombs
        ctx.fillRect(obj.x, obj.y, objectSize, objectSize);
    });
}

function updateFallingObjects() {
    fallingObjects.forEach(obj => {
        obj.y += objectFallSpeed;
        if (obj.y > canvas.height) {
            obj.y = 0;
            obj.x = Math.floor(Math.random() * (canvas.width / objectSize)) * objectSize;
            obj.type = Math.random() < bombProbability ? 'bomb' : 'fruit';
            bombRows = new Set(); // Reset bomb rows
        }
        if (obj.y + objectSize > basketY && obj.x + objectSize > basketX && obj.x < basketX + basketWidth) {
            if (obj.type === 'bomb') {
                endGame();
            } else {
                progress++;
                if (progress >= basketCapacity) {
                    score += 1;
                    progress = 0; // Reset progress
                    progressBar.style.width = '0%'; // Reset progress bar
                } else {
                    progressBar.style.width = `${(progress / basketCapacity) * 100}%`;
                }
                obj.y = 0;
                obj.x = Math.floor(Math.random() * (canvas.width / objectSize)) * objectSize;
                obj.type = Math.random() < bombProbability ? 'bomb' : 'fruit';
                bombRows = new Set(); // Reset bomb rows
            }
        }
    });
}

function increaseDifficulty() {
    if (objectFallSpeed < maxFallSpeed) {
        objectFallSpeed += 0.2; // Increase speed at a faster rate
    }
}

function endGame() {
    isGameOver = true;
    saveHighScore(score); // Save score when game ends
    gameOverScreen.style.display = 'flex';
    finalScoreElement.textContent = `Score: ${score}`;
    document.removeEventListener('keydown', moveBasket);
    document.removeEventListener('mousemove', moveBasketWithMouse);
}

function updateGame() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fallingObjects.length < 10) {
        fallingObjects.push(createFallingObject());
    }
    updateFallingObjects();
    drawBasket();
    drawFallingObjects();
    increaseDifficulty(); // Increase speed as game progresses
}
