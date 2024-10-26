// Initialize Telegram WebApp
const telegram = window.Telegram.WebApp;
telegram.ready();

// Game variables
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

// Set theme based on Telegram's theme
if (telegram.colorScheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// Configure Telegram main button
telegram.MainButton.setText('Start Game').show();
telegram.MainButton.onClick(() => {
  if (!gameActive) {
    startGame();
  }
});

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
    condition: () => false,
    unlocked: false 
  }
];

let collectedPowerups = {
  time: false,
  multiplier: false
};

function startGame() {
  gameActive = true;
  telegram.MainButton.hide();
  resetGame();
}

function toggleHelp() {
  const modal = document.getElementById('helpModal');
  const isShowing = modal.style.display === 'flex';
  modal.style.display = isShowing ? 'none' : 'flex';
  
  // Show back button when help is open
  if (!isShowing) {
    telegram.BackButton.show();
  } else {
    telegram.BackButton.hide();
  }
}

function toggleAchievements() {
  const modal = document.getElementById('achievementsModal');
  const isShowing = modal.style.display === 'flex';
  updateAchievementsList();
  modal.style.display = isShowing ? 'none' : 'flex';
  
  // Show back button when achievements are open
  if (!isShowing) {
    telegram.BackButton.show();
  } else {
    telegram.BackButton.hide();
  }
}

// Handle back button
telegram.BackButton.onClick(() => {
  if (document.getElementById('helpModal').style.display === 'flex') {
    toggleHelp();
    return;
  }
  if (document.getElementById('achievementsModal').style.display === 'flex') {
    toggleAchievements();
    return;
  }
  // Ask before closing the game
  if (gameActive) {
    if (confirm('Are you sure you want to quit the game?')) {
      telegram.close();
    }
  } else {
    telegram.close();
  }
});

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
    telegram.HapticFeedback.impactOccurred('light');
    
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
    let newAchievementUnlocked = false;
    
    achievements.forEach(achievement => {
      if (!achievement.unlocked && achievement.condition(score, streak, timeLeft)) {
        achievement.unlocked = true;
        newAchievementUnlocked = true;
        telegram.HapticFeedback.notificationOccurred('success');
        showAchievementPopup(`Achievement Unlocked: ${achievement.name}`);
      }
    });
  
    if (newAchievementUnlocked) {
      saveGameData(); // Save when new achievements are unlocked
    }
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

// Add these functions at the start of your script.js:

const STORAGE_KEYS = {
    HIGH_SCORE: 'colorMatch_highScore',
    ACHIEVEMENTS: 'colorMatch_achievements',
    BEST_STREAK: 'colorMatch_bestStreak'
  };
  
  function loadGameData() {
    // Load high score
    const savedHighScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    if (savedHighScore) {
      highScore = parseInt(savedHighScore);
      document.getElementById('highScore').textContent = highScore;
    }
  
    // Load best streak
    const savedBestStreak = localStorage.getItem(STORAGE_KEYS.BEST_STREAK);
    if (savedBestStreak) {
      bestStreak = parseInt(savedBestStreak);
    }
  
    // Load achievements
    const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (savedAchievements) {
      const unlockedAchievements = JSON.parse(savedAchievements);
      achievements.forEach(achievement => {
        if (unlockedAchievements.includes(achievement.id)) {
          achievement.unlocked = true;
        }
      });
    }
  }
  
  function saveGameData() {
    // Save high score
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, highScore.toString());
    
    // Save best streak
    localStorage.setItem(STORAGE_KEYS.BEST_STREAK, bestStreak.toString());
    
    // Save achievements
    const unlockedAchievements = achievements
      .filter(a => a.unlocked)
      .map(a => a.id);
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlockedAchievements));
  }
  
  // Update the checkAnswer function to save after new high score:
  function checkAnswer(selectedColor) {
    if (!gameActive) return;
    const correctColor = document.getElementById('colorText').dataset.correct;
    if (selectedColor === correctColor) {
      telegram.HapticFeedback.impactOccurred('light');
      score += (1 * scoreMultiplier);
      streak += 1;
      if (streak > bestStreak) {
        bestStreak = streak;
        saveGameData(); // Save when best streak is broken
      }
      document.getElementById('score').textContent = score;
      document.getElementById('streak').textContent = streak;
      if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        saveGameData(); // Save when high score is broken
      }
    } else {
    telegram.HapticFeedback.notificationOccurred('error');
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
    if (timeLeft <= 0) {
        timeLeft = 0;
        document.getElementById('timeLeft').textContent = timeLeft;
        clearInterval(gameInterval);
        gameInterval = null;
        showGameOver();
        return;
    }
    document.getElementById('timeLeft').textContent = timeLeft;
}

function showGameOver() {
    gameActive = false;
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    timeLeft = 0; // Ensure timer shows 0 not negative
    document.getElementById('timeLeft').textContent = timeLeft;
    
    const gameOver = document.getElementById('gameOver');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScore;
    document.getElementById('bestStreak').textContent = bestStreak;
    
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
    
    // Setup MainButton for restart
    telegram.MainButton.setText('Play Again').show();
    telegram.MainButton.offClick(); // Remove previous click handlers
    telegram.MainButton.onClick(resetAndStartGame);

    // Send score to bot if needed
    telegram.sendData(JSON.stringify({
        score: score,
        highScore: highScore,
        bestStreak: bestStreak,
        achievements: achievements.filter(a => a.unlocked).map(a => a.id)
    }));
    saveGameData();
}

function resetGame() {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    
    score = 0;
    streak = 0;
    scoreMultiplier = 1;
    collectedPowerups = { time: false, multiplier: false };
    
    // Reset UI elements
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
    document.getElementById('timeLeft').textContent = timeLeft;
    document.getElementById('multiplier').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.querySelector('.color-text').style.transform = 'none';
    
    // Remove any existing power-ups
    const powerUp = document.querySelector('.power-up');
    if (powerUp) powerUp.remove();
    
    createButtons();
    updateGame();
  
    if (gameActive) {
        gameInterval = setInterval(updateTimer, 1000);
      }
}

function resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.BEST_STREAK);
    highScore = 0;
    bestStreak = 0;
    achievements.forEach(a => a.unlocked = false);
    document.getElementById('highScore').textContent = '0';
  }


function resetAndStartGame() {
    // Clear any existing interval
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // Reset game state
    gameActive = true;
    
    // Reset timer based on difficulty
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
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Hide MainButton
    telegram.MainButton.hide();
    
    // Reset the game
    resetGame();
}

function toggleStats() {
    const modal = document.getElementById('statsModal');
    if (modal.style.display === 'flex') {
      modal.style.display = 'none';
    } else {
      document.getElementById('allTimeHighScore').textContent = highScore;
      document.getElementById('allTimeBestStreak').textContent = bestStreak;
      document.getElementById('achievementsCount').textContent = 
        `${achievements.filter(a => a.unlocked).length}/${achievements.length}`;
      modal.style.display = 'flex';
    }
  }


// Initialize game
loadGameData();
createButtons();