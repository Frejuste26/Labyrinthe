class MazeGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.score = 0;
    this.timer = 0;
    this.isPlaying = false;
    this.interval = null;
    
    // Éléments DOM
    this.scoreElement = document.getElementById('score');
    this.timerElement = document.getElementById('timer');
    this.startBtn = document.getElementById('startBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.levelBtn = document.getElementById('levelBtn');
    
    // Configuration du labyrinthe
    this.boxSize = 15;
    this.canvas.width = 300;
    this.canvas.height = 300;
    this.gridSize = this.canvas.width / this.boxSize;
    this.maze = [];
    this.player = { x: 1, y: 1 };
    this.exit = { x: this.gridSize - 2, y: this.gridSize - 2 };
    this.level = 1;
    
    // Système de vies et power-ups
    this.lives = 3;
    this.powerUps = [];
    this.traps = [];
    this.hasSpeedBoost = false;
    this.invincible = false;
    
    // Sons
    this.sounds = {
      collect: new Audio('sounds/collect.mp3'),
      hurt: new Audio('sounds/hurt.mp3'),
      win: new Audio('sounds/win.mp3'),
      powerup: new Audio('sounds/powerup.mp3')
    };
    
    // Éléments DOM additionnels
    this.livesElement = document.getElementById('lives');
    this.updateLives();
    
    // Configuration initiale
    this.initializeControls();
    
    // Thème
    this.themeToggle = document.getElementById('themeToggle');
    this.initializeTheme();
    
    // Système de particules
    this.particles = [];
    
    // Trail system
    this.trail = [];
    this.maxTrailLength = 5;
    
    // Confetti system
    this.confetti = [];
    
    // Effets visuels additionnels
    this.ripples = [];
    this.dustParticles = [];
    this.isSlowMotion = false;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    
    // Effets de lumière et d'ombre
    this.lightRadius = 150;
    this.ambientLight = 0.3;
    this.lightFlicker = 0;
    
    // Effet de distorsion
    this.distortionAmount = 0;
    this.distortionAngle = 0;
    
    // Éclairs
    this.lightnings = [];
    
    // Créer les particules de poussière initiales
    this.createDustParticles();
    
    // Gestion des scores
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.lastScore = parseInt(localStorage.getItem('lastScore')) || 0;
    this.scores = JSON.parse(localStorage.getItem('scores')) || [];
    
    // Écrans
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.gameScreen = document.getElementById('game-screen');
    
    // Initialisation de l'écran d'accueil
    this.initializeWelcomeScreen();

    // Statistiques de jeu
    this.stats = this.loadStats();
    
    // Succès
    this.achievements = this.initializeAchievements();
    
    // Gestion des onglets
    this.initializeTabs();
    
    // Mise à jour initiale des statistiques
    this.updateStats();
    this.updateAchievements();
    this.updateScoresTable();
    this.updateLevelProgress();

    this.difficulties = {
      beginner: { size: 15, traps: 2, powerUps: 3, timeLimit: 120 },
      normal: { size: 20, traps: 3, powerUps: 3, timeLimit: 180 },
      intermediate: { size: 25, traps: 4, powerUps: 4, timeLimit: 240 },
      advanced: { size: 30, traps: 5, powerUps: 4, timeLimit: 300 },
      professional: { size: 35, traps: 6, powerUps: 5, timeLimit: 360 },
      master: { size: 40, traps: 7, powerUps: 5, timeLimit: 420 },
      expert: { size: 45, traps: 8, powerUps: 6, timeLimit: 480 },
      legend: { size: 50, traps: 9, powerUps: 6, timeLimit: 540 },
      god: { size: 55, traps: 10, powerUps: 7, timeLimit: 600 }
    };
  }

  initializeControls() {
    // Gestionnaire des boutons
    this.startBtn.addEventListener('click', () => this.startGame());
    this.resetBtn.addEventListener('click', () => this.resetGame());
    this.levelBtn.addEventListener('click', () => this.nextLevel());
    
    // Gestionnaire des touches
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    this.updateThemeIcon();

    this.themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      this.updateThemeIcon();
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
  }

  updateThemeIcon() {
    const icon = this.themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-theme')) {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }

  generateMaze() {
    // Initialiser le labyrinthe avec des murs
    this.maze = Array(this.gridSize).fill().map(() => 
      Array(this.gridSize).fill(1)
    );

    const stack = [{x: 1, y: 1}];
    this.maze[1][1] = 0;

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.maze[next.y][next.x] = 0;
        this.maze[(current.y + next.y) / 2][(current.x + next.x) / 2] = 0;
        stack.push(next);
      }
    }

    // Assurer que la sortie est accessible
    this.maze[this.exit.y][this.exit.x] = 0;
    this.maze[this.exit.y - 1][this.exit.x] = 0;
  }

  getUnvisitedNeighbors(cell) {
    const neighbors = [];
    const directions = [
      {x: -2, y: 0}, {x: 2, y: 0},
      {x: 0, y: -2}, {x: 0, y: 2}
    ];

    for (const dir of directions) {
      const newX = cell.x + dir.x;
      const newY = cell.y + dir.y;
      if (newX > 0 && newX < this.gridSize - 1 && 
          newY > 0 && newY < this.gridSize - 1 && 
          this.maze[newY][newX] === 1) {
        neighbors.push({x: newX, y: newY});
      }
    }
    return neighbors;
  }

  drawGame() {
    // Appliquer l'effet de tremblement
    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
      this.shakeIntensity *= this.shakeDecay;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner le labyrinthe
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        this.ctx.fillStyle = this.maze[y][x] === 1 ? '#2c3e50' : 'white';
        this.ctx.fillRect(x * this.boxSize, y * this.boxSize, this.boxSize, this.boxSize);
      }
    }

    // Dessiner la sortie
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(
      this.exit.x * this.boxSize, 
      this.exit.y * this.boxSize, 
      this.boxSize, this.boxSize
    );

    // Dessiner le joueur
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(
      (this.player.x + 0.5) * this.boxSize,
      (this.player.y + 0.5) * this.boxSize,
      this.boxSize / 2 - 2,
      0, Math.PI * 2
    );
    this.ctx.fill();

    // Dessiner les power-ups
    this.powerUps.forEach(powerUp => {
      this.ctx.fillStyle = powerUp.type === 'speed' ? '#f1c40f' : '#9b59b6';
      this.ctx.beginPath();
      this.ctx.arc(
        (powerUp.x + 0.5) * this.boxSize,
        (powerUp.y + 0.5) * this.boxSize,
        this.boxSize / 4,
        0, Math.PI * 2
      );
      this.ctx.fill();
    });

    // Dessiner les pièges
    this.traps.forEach(trap => {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.moveTo(trap.x * this.boxSize, trap.y * this.boxSize);
      this.ctx.lineTo((trap.x + 1) * this.boxSize, (trap.y + 1) * this.boxSize);
      this.ctx.moveTo((trap.x + 1) * this.boxSize, trap.y * this.boxSize);
      this.ctx.lineTo(trap.x * this.boxSize, (trap.y + 1) * this.boxSize);
      this.ctx.strokeStyle = '#c0392b';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    // Effet visuel pour les power-ups actifs
    if (this.hasSpeedBoost || this.invincible) {
      this.ctx.strokeStyle = this.invincible ? '#9b59b6' : '#f1c40f';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        this.player.x * this.boxSize - 2,
        this.player.y * this.boxSize - 2,
        this.boxSize + 4,
        this.boxSize + 4
      );
    }

    // Dessiner le trail
    this.drawTrail();
    
    // Dessiner les confettis
    this.drawConfetti();

    // Dessiner les ondulations
    this.drawRipples();
    
    // Dessiner les particules de poussière
    this.drawDustParticles();

    // Appliquer la distorsion
    if (this.distortionAmount > 0) {
      this.ctx.save();
      this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
      this.ctx.rotate(Math.sin(this.distortionAngle) * this.distortionAmount);
      this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);
      this.distortionAngle += 0.1;
      this.distortionAmount *= 0.95;
    }

    // Dessiner les ombres dynamiques
    this.drawShadows();
    
    // Dessiner la lumière ambiante
    this.drawAmbientLight();
    
    // Dessiner les éclairs
    this.drawLightnings();
    
    if (this.distortionAmount > 0) {
      this.ctx.restore();
    }

    // Réinitialiser la transformation
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawTrail() {
    this.ctx.save();
    this.trail.forEach((pos, index) => {
      const alpha = (this.trail.length - index) / this.trail.length * 0.3;
      this.ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(
        (pos.x + 0.5) * this.boxSize,
        (pos.y + 0.5) * this.boxSize,
        (this.boxSize / 2 - 2) * (index / this.trail.length),
        0, Math.PI * 2
      );
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawConfetti() {
    this.ctx.save();
    this.confetti = this.confetti.filter(conf => {
      conf.y += conf.speed;
      conf.x += Math.sin(conf.angle) * 2;
      conf.angle += 0.1;
      conf.rotation += conf.rotationSpeed;

      this.ctx.fillStyle = conf.color;
      this.ctx.translate(conf.x, conf.y);
      this.ctx.rotate(conf.rotation);
      this.ctx.fillRect(-conf.size/2, -conf.size/2, conf.size, conf.size);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);

      return conf.y < this.canvas.height;
    });
    this.ctx.restore();
  }

  createConfetti() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    for (let i = 0; i < 100; i++) {
      this.confetti.push({
        x: Math.random() * this.canvas.width,
        y: -20,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        rotation: 0,
        rotationSpeed: Math.random() * 0.2 - 0.1
      });
    }
  }

  startGame() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTimer();
      this.startBtn.textContent = 'Pause';
      this.generateLevel();
      this.player = { x: 1, y: 1 };
      this.drawGame();
      requestAnimationFrame(() => this.gameLoop());
      this.stats.gamesPlayed++;
      this.saveStats();
      this.updateStats();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    this.isPlaying = false;
    clearInterval(this.interval);
    this.startBtn.textContent = 'Reprendre';
  }

  resetGame() {
    this.score = 0;
    this.timer = 0;
    this.updateScore();
    this.updateTimer();
    this.pauseGame();
    this.startBtn.textContent = 'Démarrer';
    this.lives = 3;
    this.updateLives();
    this.hasSpeedBoost = false;
    this.invincible = false;
    this.level = 1;
    this.generateLevel();
  }

  nextLevel() {
    if (this.isPlaying) {
      this.score += 100;
      this.updateScore();
      // Générer nouveau niveau ici
    }
  }

  startTimer() {
    this.interval = setInterval(() => {
      this.timer++;
      this.updateTimer();
    }, 1000);
  }

  updateTimer() {
    const minutes = Math.floor(this.timer / 60);
    const seconds = this.timer % 60;
    this.timerElement.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  updateScore() {
    this.scoreElement.textContent = this.score;
  }

  handleKeyPress(e) {
    if (!this.isPlaying) return;

    const newPos = { 
      x: this.player.x, 
      y: this.player.y 
    };

    // Mouvement plus rapide avec le power-up de vitesse
    const moveDistance = this.hasSpeedBoost ? 2 : 1;

    switch(e.key) {
      case 'ArrowUp':
        newPos.y -= moveDistance;
        break;
      case 'ArrowDown':
        newPos.y += moveDistance;
        break;
      case 'ArrowLeft':
        newPos.x -= moveDistance;
        break;
      case 'ArrowRight':
        newPos.x += moveDistance;
        break;
      default:
        return;
    }

    e.preventDefault();

    if (this.maze[newPos.y][newPos.x] === 0) {
      // Créer une ondulation au point de départ
      const startX = (this.player.x + 0.5) * this.boxSize;
      const startY = (this.player.y + 0.5) * this.boxSize;
      this.createRipple(startX, startY);
      
      // Ajouter la position actuelle au trail
      this.trail.unshift({x: this.player.x, y: this.player.y});
      if (this.trail.length > this.maxTrailLength) {
        this.trail.pop();
      }
      
      this.player = newPos;
      
      // Vérifier les collisions avec les power-ups
      this.checkPowerUpCollisions();
      
      // Vérifier les collisions avec les pièges
      if (!this.invincible) {
        this.checkTrapCollisions();
      }
      
      // Vérifier la victoire
      if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
        this.levelComplete();
      }
    } else {
      // Effet de tremblement lors de la collision avec un mur
      this.shakeIntensity = 5;
      this.sounds.hurt.play();
    }

    // Vérifier la proximité de la sortie pour l'effet slow motion
    const distanceToExit = Math.hypot(
      this.player.x - this.exit.x,
      this.player.y - this.exit.y
    );

    if (distanceToExit < 3 && !this.isSlowMotion) {
      this.activateSlowMotion();
    }
  }

  gameLoop() {
    if (this.isPlaying) {
      // Ajuster la vitesse d'animation en slow motion
      const timeScale = this.isSlowMotion ? 0.5 : 1;
      
      this.drawGame();
      
      setTimeout(() => {
        requestAnimationFrame(() => this.gameLoop());
      }, 16 * timeScale); // ~60 FPS ajusté pour le slow motion
    }
  }

  levelComplete() {
    this.sounds.win.play();
    this.score += Math.max(1000 - this.timer * 10, 100);
    this.updateScore();
    this.level++;
    
    alert(`Niveau ${this.level - 1} complété ! Score: ${this.score}`);
    
    // Commencer le niveau suivant
    this.nextLevel();
    
    // Effet de transition
    this.canvas.classList.add('level-transition');
    setTimeout(() => this.canvas.classList.remove('level-transition'), 500);
    
    // Ajouter les confettis
    this.createConfetti();
    
    // Message de victoire amélioré
    const message = document.createElement('div');
    message.className = 'victory-message';
    message.innerHTML = `
      <h2>🎉 Niveau ${this.level - 1} Complété! 🎉</h2>
      <div class="victory-stats">
        <p>🌟 Score: ${this.score}</p>
        <p>⏱️ Temps: ${this.timerElement.textContent}</p>
        <p>💪 Bonus: +${Math.max(1000 - this.timer * 10, 100)}</p>
      </div>
    `;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 2000);
    
    // Mettre à jour les scores si c'est le dernier niveau
    if (this.level >= 5) {
      this.updateScores();
      setTimeout(() => {
        this.welcomeScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.resetGame();
        this.initializeWelcomeScreen();
      }, 2000);
    }

    this.stats.levelProgress[this.level - 1] = 100;
    this.stats.completedLevels[this.level - 1] = true;
    this.saveStats();
    this.updateStats();
    this.updateLevelProgress();
    this.checkAchievements();
  }

  generateLevel() {
    this.generateMaze();
    this.generatePowerUps();
    this.generateTraps();
  }

  generatePowerUps() {
    this.powerUps = [];
    const numPowerUps = Math.min(3 + this.level, 8);
    
    for (let i = 0; i < numPowerUps; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
        y = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
      } while (
        this.maze[y][x] === 1 || 
        (x === this.player.x && y === this.player.y) ||
        (x === this.exit.x && y === this.exit.y) ||
        this.powerUps.some(p => p.x === x && p.y === y)
      );
      
      this.powerUps.push({
        x, y,
        type: Math.random() < 0.7 ? 'speed' : 'invincible'
      });
    }
  }

  generateTraps() {
    this.traps = [];
    const numTraps = Math.min(this.level * 2, 12);
    
    for (let i = 0; i < numTraps; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
        y = Math.floor(Math.random() * (this.gridSize - 2)) + 1;
      } while (
        this.maze[y][x] === 1 || 
        (x === this.player.x && y === this.player.y) ||
        (x === this.exit.x && y === this.exit.y) ||
        this.powerUps.some(p => p.x === x && p.y === y) ||
        this.traps.some(t => t.x === x && t.y === y)
      );
      
      this.traps.push({ x, y });
    }
  }

  checkPowerUpCollisions() {
    const powerUpIndex = this.powerUps.findIndex(
      p => p.x === this.player.x && p.y === this.player.y
    );
    
    if (powerUpIndex !== -1) {
      const powerUp = this.powerUps[powerUpIndex];
      const rect = this.canvas.getBoundingClientRect();
      const x = rect.left + powerUp.x * this.boxSize;
      const y = rect.top + powerUp.y * this.boxSize;
      
      this.createParticles(x, y, powerUp.type === 'speed' ? '#f1c40f' : '#9b59b6');
      this.sounds.powerup.play();
      
      if (powerUp.type === 'speed') {
        this.activateSpeedBoost();
      } else {
        this.activateInvincibility();
      }
      
      this.powerUps.splice(powerUpIndex, 1);
      this.score += 50;
      this.updateScore();
      this.stats.powerupsCollected++;
      this.saveStats();
      this.updateStats();
    }
  }

  checkTrapCollisions() {
    const trapHit = this.traps.some(
      trap => trap.x === this.player.x && trap.y === this.player.y
    );
    
    if (trapHit) {
      this.sounds.hurt.play();
      this.lives--;
      this.updateLives();
      
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.player = { x: 1, y: 1 };
      }
      this.stats.trapsHit++;
      this.saveStats();
      this.updateStats();
    }
  }
  
  activateSpeedBoost() {
    this.hasSpeedBoost = true;
    setTimeout(() => {
      this.hasSpeedBoost = false;
    }, 5000);
    
    // Effet de distorsion
    this.distortionAmount = 0.05;
    
    // Éclair de power-up
    const x = (this.player.x + 0.5) * this.boxSize;
    const y = (this.player.y + 0.5) * this.boxSize;
    this.createLightning(x, y);
  }

  activateInvincibility() {
    this.invincible = true;
    setTimeout(() => {
      this.invincible = false;
    }, 3000);
    
    // Augmenter la lumière ambiante
    this.ambientLight = 0.6;
    setTimeout(() => {
      this.ambientLight = 0.3;
    }, 3000);
    
    // Éclairs multiples
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const x = (this.player.x + 0.5) * this.boxSize;
        const y = (this.player.y + 0.5) * this.boxSize;
        this.createLightning(x, y);
      }, i * 200);
    }
  }

  updateLives() {
    this.livesElement.textContent = '❤️'.repeat(this.lives);
  }

  gameOver() {
    this.updateScores();
    alert(`Game Over! Score final : ${this.score}`);
    
    // Retourner à l'écran d'accueil
    this.welcomeScreen.classList.remove('hidden');
    this.gameScreen.classList.add('hidden');
    
    this.resetGame();
    this.initializeWelcomeScreen();
  }

  createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = `${Math.random() * 6 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.background = color;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 100 + 50;
      const xVel = Math.cos(angle) * velocity;
      const yVel = Math.sin(angle) * velocity;
      
      particle.style.setProperty('--x', `${xVel}px`);
      particle.style.setProperty('--y', `${yVel}px`);
      particle.style.animation = 'particleAnimation 1s ease-out forwards';
      
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  }

  createDustParticles() {
    for (let i = 0; i < 50; i++) {
      this.dustParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.5 + 0.1
      });
    }
  }

  createRipple(x, y) {
    this.ripples.push({
      x, y,
      size: 0,
      opacity: 0.5,
      maxSize: this.boxSize * 2
    });
  }

  drawRipples() {
    this.ctx.save();
    this.ripples = this.ripples.filter(ripple => {
      ripple.size += 2;
      ripple.opacity -= 0.02;

      if (ripple.opacity > 0) {
        this.ctx.strokeStyle = `rgba(52, 152, 219, ${ripple.opacity})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.size, 0, Math.PI * 2);
        this.ctx.stroke();
        return true;
      }
      return false;
    });
    this.ctx.restore();
  }

  drawDustParticles() {
    this.ctx.save();
    this.dustParticles.forEach(particle => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Wrap around screen
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  activateSlowMotion() {
    this.isSlowMotion = true;
    
    // Ralentir les animations
    this.ctx.canvas.style.transition = 'all 0.3s ease';
    document.body.style.transition = 'all 0.3s ease';
    
    // Effet visuel
    this.ctx.canvas.style.filter = 'brightness(1.2) contrast(1.1)';
    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    
    // Retour à la normale après 3 secondes
    setTimeout(() => {
      this.isSlowMotion = false;
      this.ctx.canvas.style.filter = '';
      document.body.style.backgroundColor = '';
      this.ctx.canvas.style.transition = '';
      document.body.style.transition = '';
    }, 3000);
  }

  drawShadows() {
    const gradient = this.ctx.createRadialGradient(
      (this.player.x + 0.5) * this.boxSize,
      (this.player.y + 0.5) * this.boxSize,
      0,
      (this.player.x + 0.5) * this.boxSize,
      (this.player.y + 0.5) * this.boxSize,
      this.lightRadius
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawAmbientLight() {
    this.lightFlicker = Math.sin(Date.now() / 500) * 0.05;
    const ambientOpacity = Math.max(0, Math.min(1, this.ambientLight + this.lightFlicker));
    
    this.ctx.fillStyle = `rgba(0,0,0,${1 - ambientOpacity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  createLightning(x, y) {
    const segments = [];
    let currentX = x;
    let currentY = y;
    
    for (let i = 0; i < 5; i++) {
      const nextX = currentX + (Math.random() - 0.5) * 40;
      const nextY = currentY + Math.random() * 30;
      segments.push({
        x1: currentX,
        y1: currentY,
        x2: nextX,
        y2: nextY,
        alpha: 1
      });
      currentX = nextX;
      currentY = nextY;
    }
    
    this.lightnings.push({
      segments,
      life: 1
    });
  }

  drawLightnings() {
    this.lightnings = this.lightnings.filter(lightning => {
      lightning.life -= 0.1;
      
      if (lightning.life > 0) {
        this.ctx.save();
        lightning.segments.forEach(segment => {
          this.ctx.strokeStyle = `rgba(255,255,255,${lightning.life})`;
          this.ctx.lineWidth = 2;
          this.ctx.shadowColor = '#fff';
          this.ctx.shadowBlur = 20;
          this.ctx.beginPath();
          this.ctx.moveTo(segment.x1, segment.y1);
          this.ctx.lineTo(segment.x2, segment.y2);
          this.ctx.stroke();
        });
        this.ctx.restore();
        return true;
      }
      return false;
    });
  }

  initializeWelcomeScreen() {
    // Afficher les scores
    document.getElementById('highScore').textContent = this.highScore;
    document.getElementById('lastScore').textContent = this.lastScore;
    document.getElementById('averageScore').textContent = this.calculateAverageScore();

    // Gestion des boutons de niveau
    const levelButtons = document.querySelectorAll('.level-btn');
    levelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        levelButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.level = parseInt(btn.dataset.level);
      });
    });

    // Sélectionner le premier niveau par défaut
    levelButtons[0].click();

    // Gestion du bouton de démarrage
    document.getElementById('startGameBtn').addEventListener('click', () => {
      this.welcomeScreen.classList.add('hidden');
      this.gameScreen.classList.remove('hidden');
      this.startGame();
    });
  }

  calculateAverageScore() {
    if (this.scores.length === 0) return 0;
    const sum = this.scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.scores.length);
  }

  updateScores() {
    // Mettre à jour le meilleur score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }

    // Sauvegarder le dernier score
    this.lastScore = this.score;
    localStorage.setItem('lastScore', this.lastScore);

    // Ajouter le score à l'historique
    this.scores.push(this.score);
    if (this.scores.length > 10) this.scores.shift(); // Garder seulement les 10 derniers scores
    localStorage.setItem('scores', JSON.stringify(this.scores));
  }

  loadStats() {
    return JSON.parse(localStorage.getItem('gameStats')) || {
      gamesPlayed: 0,
      totalTime: 0,
      powerupsCollected: 0,
      trapsHit: 0,
      levelProgress: Array(5).fill(0), // Progression pour chaque niveau
      completedLevels: Array(5).fill(false)
    };
  }

  saveStats() {
    localStorage.setItem('gameStats', JSON.stringify(this.stats));
  }

  initializeAchievements() {
    return {
      speedRunner: { 
        name: "Speed Runner", 
        description: "Terminez un niveau en moins de 30 secondes",
        icon: "fa-bolt",
        unlocked: false 
      },
      powerCollector: { 
        name: "Power Collector", 
        description: "Collectez tous les power-ups d'un niveau",
        icon: "fa-star",
        unlocked: false 
      },
      survivor: { 
        name: "Survivor", 
        description: "Terminez un niveau sans perdre de vie",
        icon: "fa-heart",
        unlocked: false 
      },
      masterMind: { 
        name: "Master Mind", 
        description: "Terminez tous les niveaux",
        icon: "fa-crown",
        unlocked: false 
      },
      perfectionist: { 
        name: "Perfectionist", 
        description: "Obtenez un score parfait",
        icon: "fa-trophy",
        unlocked: false 
      }
    };
  }

  initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
      });
    });
  }

  updateStats() {
    document.getElementById('gamesPlayed').textContent = this.stats.gamesPlayed;
    document.getElementById('totalTime').textContent = this.formatTime(this.stats.totalTime);
    document.getElementById('powerupsCollected').textContent = this.stats.powerupsCollected;
    document.getElementById('trapsHit').textContent = this.stats.trapsHit;
  }

  updateAchievements() {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = '';

    Object.entries(this.achievements).forEach(([key, achievement]) => {
      const card = document.createElement('div');
      card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <i class="fas ${achievement.icon} achievement-icon"></i>
        <h3>${achievement.name}</h3>
        <p>${achievement.description}</p>
      `;
      grid.appendChild(card);
    });
  }

  updateScoresTable() {
    const tbody = document.getElementById('scoresTableBody');
    tbody.innerHTML = '';

    this.scores.sort((a, b) => b.score - a.score).slice(0, 10).forEach((score, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${score.score}</td>
        <td>${score.level}</td>
        <td>${this.formatTime(score.time)}</td>
        <td>${new Date(score.date).toLocaleDateString()}</td>
      `;
      tbody.appendChild(row);
    });
  }

  updateLevelProgress() {
    const progressContainer = document.getElementById('levelProgress');
    progressContainer.innerHTML = '';

    this.stats.levelProgress.forEach((progress, index) => {
      const levelBar = document.createElement('div');
      levelBar.className = 'level-bar';
      levelBar.innerHTML = `
        <div class="level-bar-fill" style="width: ${progress}%"></div>
      `;
      const label = document.createElement('p');
      label.textContent = `Niveau ${index + 1}: ${progress}%`;
      
      progressContainer.appendChild(label);
      progressContainer.appendChild(levelBar);
    });
  }

  checkAchievements() {
    if (this.timer <= 30 && !this.achievements.speedRunner.unlocked) {
      this.unlockAchievement('speedRunner');
    }

    if (this.powerUps.length === 0 && !this.achievements.powerCollector.unlocked) {
      this.unlockAchievement('powerCollector');
    }

    if (this.lives === 3 && !this.achievements.survivor.unlocked) {
      this.unlockAchievement('survivor');
    }

    if (this.stats.completedLevels.every(level => level) && !this.achievements.masterMind.unlocked) {
      this.unlockAchievement('masterMind');
    }

    if (this.score >= 1000 && !this.achievements.perfectionist.unlocked) {
      this.unlockAchievement('perfectionist');
    }
  }

  unlockAchievement(achievementId) {
    if (!this.achievements[achievementId].unlocked) {
      this.achievements[achievementId].unlocked = true;
      this.showAchievementNotification(this.achievements[achievementId]);
      localStorage.setItem('achievements', JSON.stringify(this.achievements));
      this.updateAchievements();
    }
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <i class="fas ${achievement.icon}"></i>
      <div>
        <h4>Succès débloqué !</h4>
        <p>${achievement.name}</p>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  initializeLevel(level) {
    const difficulty = document.querySelector(`.level-btn[data-level="${level}"]`).dataset.difficulty;
    const config = this.difficulties[difficulty];
    
    this.gridSize = config.size;
    this.boxSize = Math.min(this.canvas.width / this.gridSize, this.canvas.height / this.gridSize);
    this.maxTraps = config.traps;
    this.maxPowerUps = config.powerUps;
    this.timeLimit = config.timeLimit;
    
    this.generateMaze();
    this.generateTrapsAndPowerUps();
  }

  generateTrapsAndPowerUps() {
    // ... existing code with maxTraps and maxPowerUps from difficulty config ...
  }
}

// Déplacer la fonction showWelcomePopup en dehors de la classe MazeGame
function showWelcomePopup() {
  const popupHTML = `
    <div class="welcome-popup">
      <div class="popup-content">
        <h2>Bienvenue dans le Labyrinthe !</h2>
        
        <div class="rules-section">
          <h3>🎮 Comment jouer</h3>
          <ul>
            <li>Utilisez les <strong>flèches directionnelles</strong> pour vous déplacer</li>
            <li>Atteignez la <strong>sortie</strong> en évitant les pièges</li>
            <li>Collectez les <strong>power-ups</strong> pour obtenir des bonus</li>
          </ul>
        </div>

        <div class="features-section">
          <h3>✨ Fonctionnalités</h3>
          <div class="features-grid">
            <div class="feature-item">
              <i class="fas fa-star"></i>
              <span>Power-ups</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-skull"></i>
              <span>Pièges</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-ghost"></i>
              <span>Portails</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-key"></i>
              <span>Clés</span>
            </div>
          </div>
        </div>

        <div class="levels-section">
          <h3>🏆 Niveaux de difficulté</h3>
          <div class="difficulty-list">
            <span class="difficulty beginner">Débutant</span>
            <span class="difficulty normal">Normal</span>
            <span class="difficulty intermediate">Intermédiaire</span>
            <span class="difficulty advanced">Avancé</span>
            <span class="difficulty master">Maître</span>
            <span class="difficulty expert">Expert</span>
            <span class="difficulty legend">Légende</span>
            <span class="difficulty god">Dieu</span>
          </div>
        </div>

        <div class="tips-section">
          <h3>💡 Astuces</h3>
          <ul>
            <li>Collectez les power-ups pour augmenter votre score</li>
            <li>Évitez les pièges pour conserver vos vies</li>
            <li>Plus vous progressez rapidement, plus vous gagnez de points</li>
            <li>Débloquez des succès pour accéder à de nouveaux niveaux</li>
          </ul>
        </div>

        <button class="start-button">
          Commencer l'aventure
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', popupHTML);

  // Ajouter l'événement pour fermer la popup
  const popup = document.querySelector('.welcome-popup');
  const startButton = popup.querySelector('.start-button');
  
  startButton.addEventListener('click', () => {
    popup.classList.add('fade-out');
    setTimeout(() => {
      popup.remove();
      localStorage.setItem('welcomePopupSeen', 'true');
    }, 500);
  });
}

// Ajouter l'événement DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser le jeu
  const game = new MazeGame();
});