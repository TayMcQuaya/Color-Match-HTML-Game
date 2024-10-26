const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
const colorHex = {
  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  yellow: '#ffd700',
  purple: '#800080'
};

let score = 0;
let timeLeft = 30;
let gameInterval;
let highScore = 0;
let streak = 0;
let bestStreak = 0;
let scoreMultiplier = 1;
let difficulty = 'normal';
let isRotating = false;
let gameActive = false;

const achievements = [
  { 
    id: 'first_point', 
    name: 'First Steps', 
    description: 'Score your first point',
    condition: (score) => score >= 1, 
    unlocked: false 
  },
  { 
    id: 'score_20', 
    name: 'Score Master', 
    description: 'Reach 20 points in a single game',
    condition: (score) => score >= 20, 
    unlocked: false 
  },
  { 
    id: 'streak_5', 
    name: 'Combo King', 
    description: 'Get a 5x streak',
    condition: (_, streak) => streak >= 5, 
    unlocked: false 
  },
  { 
    id: 'speed_demon', 
    name: 'Speed Demon', 
    description: 'Score 10 points with 20+ seconds remaining',
    condition: (score, _, timeLeft) => score >= 10 && timeLeft >= 20, 
    unlocked: false 
  },
  { 
    id: 'powerup_collector', 
    name: 'Power Player', 
    description: 'Collect both types of power-ups in one game',
    condition: () => false, // Custom check in collectPowerUp
    unlocked: false 
  }
];

let collectedPowerups = {
  time: false,
  multiplier: false
};

function startGame() {
  document.getElementById('welcomeScreen').style.display = 'none';
  gameActive = true;
  resetGame();
}

function toggleHelp() {
  const modal = document.getElementById('helpModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function toggleAchievements() {
  const modal = document.getElementById('achievementsModal');
  updateAchievementsList();
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function updateAchievementsList() {
  const list = document.getElementById('achievementsList');
  list.innerHTML = '';
  
  achievements.forEach(achievement => {
    const div = document.createElement('div');
    div.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
    div.innerHTML = `
      <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

function spawnPowerUp() {
  if (!gameActive) return;
  if (Math.random() < 0.1 && !document.querySelector('.power-up')) {
    const powerUp = document.createElement('div');
    powerUp.className = 'power-up';
    const type = Math.random() < 0.5 ? 'time' : 'multiplier';
    powerUp.innerHTML = type === 'time' ? '⏰' : '2️⃣';
    powerUp.style.left = Math.random() * 80 + 10 + '%';
    powerUp.style.top = Math.random() * 80 + 10 + '%';
    powerUp.onclick = () => collectPowerUp(type);
    document.querySelector('.game-container').appendChild(powerUp);
    setTimeout(() => powerUp?.remove(), 3000);
  }
}

function collectPowerUp(type) {
  const powerUp = document.querySelector('.power-up');
  if (powerUp) {
    collectedPowerups[type] = true;
    
    if (type === 'time') {
      timeLeft += 5;
      document.getElementById('timeLeft').textContent = timeLeft;
      showAchievementPopup('Time Boost! +5 seconds');
    } else {
      scoreMultiplier = 2;
      document.getElementById('multiplier').style.display = 'block';
      setTimeout(() => {
        scoreMultiplier = 1;
        document.getElementById('multiplier').style.display = 'none';
      }, 5000);
      showAchievementPopup('2x Points! (5 seconds)');
    }
    
    if (collectedPowerups.time && collectedPowerups.multiplier) {
      const achievement = achievements.find(a => a.id === 'powerup_collector');
      if (!achievement.unlocked) {
        achievement.unlocked = true;
        showAchievementPopup(`Achievement Unlocked: ${achievement.name}`);
      }
    }
    
    powerUp.remove();
  }
}

function setDifficulty(level) {
  difficulty = level;
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="setDifficulty('${level}')"]`).classList.add('active');
  
  switch(level) {
    case 'easy':
      timeLeft = 40;
      isRotating = false;
      break;
    case 'normal':
      timeLeft = 30;
      isRotating = false;
      break;
    case 'hard':
      timeLeft = 25;
      isRotating = true;
      break;
  }
  
  if (gameActive) resetGame();
}

function showAchievementPopup(text) {
  const popup = document.getElementById('achievementPopup');
  document.getElementById('achievementText').textContent = text;
  popup.style.display = 'block';
  setTimeout(() => {
    popup.style.display = 'none';
  }, 2000);
}

function checkAchievements() {
  achievements.forEach(achievement => {
    if (!achievement.unlocked && achievement.condition(score, streak, timeLeft)) {
      achievement.unlocked = true;
      showAchievementPopup(`Achievement Unlocked: ${achievement.name}`);
    }
  });
}

function createConfetti() {
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = -10 + 'px';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(confetti);

    const animation = confetti.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${Math.random() * 100 - 50}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: Math.random() * 2000 + 1000,
      easing: 'cubic-bezier(.37,0,.63,1)'
    });

    animation.onfinish = () => confetti.remove();
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
}

function createButtons() {
  const buttonsDiv = document.getElementById('buttons');
  buttonsDiv.innerHTML = '';
  colors.forEach(color => {
    const button = document.createElement('button');
    button.className = 'color-btn';
    button.style.backgroundColor = colorHex[color];
    button.style.color = 'white';
    button.textContent = color;
    button.onclick = () => checkAnswer(color);
    buttonsDiv.appendChild(button);
  });
}

function updateGame() {
  if (!gameActive) return;
  const colorText = document.getElementById('colorText');
  const textColor = colors[Math.floor(Math.random() * colors.length)];
  const displayedText = colors[Math.floor(Math.random() * colors.length)];
  
  colorText.style.color = colorHex[textColor];
  colorText.textContent = displayedText;
  colorText.dataset.correct = textColor;

  if (isRotating) {
    colorText.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
  }

  spawnPowerUp();
}

function checkAnswer(selectedColor) {
  if (!gameActive) return;
  const correctColor = document.getElementById('colorText').dataset.correct;
  if (selectedColor === correctColor) {
    score += (1 * scoreMultiplier);
    streak += 1;
    if (streak > bestStreak) {
      bestStreak = streak;
    }
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
    if (score > highScore) {
      highScore = score;
      document.getElementById('highScore').textContent = highScore;
    }
  } else {
    score = Math.max(0, score - 1);
    streak = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
  }
  
  checkAchievements();
  updateGame();
}

function updateTimer() {
  if (!gameActive) return;
  timeLeft -= 1;
  document.getElementById('timeLeft').textContent = timeLeft;
  
  if (timeLeft <= 0) {
    clearInterval(gameInterval);
    showGameOver();
  }
}

function showGameOver() {
  gameActive = false;
  const gameOver = document.getElementById('gameOver');
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalHighScore').textContent = highScore;
  document.getElementById('bestStreak').textContent = bestStreak;
  
  // Update achievements list with better styling
  const achievementsDiv = document.getElementById('gameOverAchievements');
  achievementsDiv.innerHTML = '<h3>Achievements Unlocked This Game</h3>';
  
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  if (unlockedAchievements.length > 0) {
    unlockedAchievements.forEach(achievement => {
      const div = document.createElement('div');
      div.className = 'achievement-item';
      div.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-info">
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-desc">${achievement.description}</div>
        </div>
      `;
      achievementsDiv.appendChild(div);
    });
  } else {
    achievementsDiv.innerHTML += '<p>No achievements unlocked yet. Keep trying!</p>';
  }
  
  gameOver.style.display = 'flex';
  createConfetti();
}

function resetAndStartGame() {
  gameActive = true;
  switch(difficulty) {
    case 'easy':
      timeLeft = 40;
      break;
    case 'normal':
      timeLeft = 30;
      break;
    case 'hard':
      timeLeft = 25;
      break;
  }
  resetGame();
}

function resetGame() {
  score = 0;
  streak = 0;
  scoreMultiplier = 1;
  collectedPowerups = { time: false, multiplier: false };
  
  document.getElementById('score').textContent = score;
  document.getElementById('streak').textContent = streak;
  document.getElementById('timeLeft').textContent = timeLeft;
  document.getElementById('multiplier').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.querySelector('.color-text').style.transform = 'none';
  
  const powerUp = document.querySelector('.power-up');
  if (powerUp) powerUp.remove();
  
  createButtons();
  updateGame();
  
  if (gameInterval) clearInterval(gameInterval);
  if (gameActive) gameInterval = setInterval(updateTimer, 1000);
}

// Initialize game
createButtons();