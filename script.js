const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const hpEl = document.getElementById('hp');
const statusEl = document.getElementById('status');
const cellNameEl = document.getElementById('cell-name');

const world = {
  width: canvas.width,
  height: canvas.height,
};

const keys = {};
const dimColors = ['#7fe8ff', '#ff6ad5', '#8b7dff', '#7cffbd', '#ffda6a'];

let gameState = {
  running: true,
  score: 0,
  lastTime: 0,
  spawnTimer: 0,
  heroTimer: 0,
  wave: 1,
  gameOver: false,
};

const player = {
  x: world.width / 2,
  y: world.height / 2,
  radius: 26,
  speed: 5,
  hp: 100,
  maxHp: 100,
  growth: 1,
  invuln: 0,
  form: 'MORPH 1',
};

const projectiles = [];
const enemies = [];
const particles = [];

function resetGame() {
  gameState = {
    running: true,
    score: 0,
    lastTime: 0,
    spawnTimer: 0,
    heroTimer: 0,
    wave: 1,
    gameOver: false,
  };

  player.x = world.width / 2;
  player.y = world.height / 2;
  player.radius = 26;
  player.speed = 5;
  player.hp = 100;
  player.maxHp = 100;
  player.growth = 1;
  player.invuln = 0;
  player.form = 'MORPH 1';
  scoreEl.textContent = '0';
  hpEl.textContent = '100';
  statusEl.textContent = 'Caccia multiverso';
  cellNameEl.textContent = player.form;

  projectiles.length = 0;
  enemies.length = 0;
  particles.length = 0;

  spawnEnemyWave(10);
}

function spawnEnemyWave(count) {
  for (let i = 0; i < count; i++) {
    const radius = 12 + Math.random() * 20;
    const side = Math.floor(Math.random() * 4);
    let x = Math.random() * world.width;
    let y = Math.random() * world.height;

    if (side === 0) {
      x = -30;
      y = Math.random() * world.height;
    } else if (side === 1) {
      x = world.width + 30;
      y = Math.random() * world.height;
    } else if (side === 2) {
      x = Math.random() * world.width;
      y = -30;
    } else {
      x = Math.random() * world.width;
      y = world.height + 30;
    }

    enemies.push({
      x,
      y,
      radius,
      speed: 1 + Math.random() * 1.6 + gameState.wave * 0.15,
      color: dimColors[Math.floor(Math.random() * dimColors.length)],
      name: randomName(),
    });
  }
}

function randomName() {
  const names = [
    'Astra', 'Nia', 'Rhea', 'Selene', 'Vera', 'Mira', 'Luna', 'Nova', 'Elya', 'Ari',
    'Kaia', 'Rin', 'Sora', 'Iris', 'Ayra', 'Talia', 'Cleo', 'Zora', 'Sera', 'Nova'
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function handleInput() {
  const dx = (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0);
  const dy = (keys['ArrowDown'] || keys['s'] ? 1 : 0) - (keys['ArrowUp'] || keys['w'] ? 1 : 0);

  const len = Math.hypot(dx, dy) || 1;
  player.x += (dx / len) * player.speed;
  player.y += (dy / len) * player.speed;

  player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
}

function fireProjectile() {
  if (gameState.running) {
    const nearest = findNearestEnemy();
    if (!nearest) return;

    const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    projectiles.push({
      x: player.x,
      y: player.y,
      radius: 6,
      speed: 7,
      vx: Math.cos(angle) * 7,
      vy: Math.sin(angle) * 7,
      color: '#84f9ff',
    });
  }
}

function findNearestEnemy() {
  let target = null;
  let minDist = Infinity;
  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < minDist) {
      minDist = dist;
      target = enemy;
    }
  }
  return target;
}

function update(dt) {
  if (!gameState.running) return;

  gameState.spawnTimer += dt;
  gameState.heroTimer += dt;

  if (gameState.spawnTimer > 900) {
    spawnEnemyWave(3 + gameState.wave);
    gameState.spawnTimer = 0;
    gameState.wave += 1;
  }

  if (gameState.heroTimer > 2500) {
    spawnEliteEnemy();
    gameState.heroTimer = 0;
  }

  handleInput();
  updateProjectiles(dt);
  updateEnemies(dt);
  handleCollisions();
  updateParticles(dt);

  if (player.hp <= 0) {
    endGame();
  }

  updateHud();
}

function spawnEliteEnemy() {
  const radius = 26 + Math.random() * 16;
  const side = Math.floor(Math.random() * 4);
  let x = Math.random() * world.width;
  let y = Math.random() * world.height;
  if (side === 0) x = -30;
  if (side === 1) x = world.width + 30;
  if (side === 2) y = -30;
  if (side === 3) y = world.height + 30;

  enemies.push({
    x,
    y,
    radius,
    speed: 1.5 + Math.random() * 1.4 + gameState.wave * 0.12,
    color: '#ff5d73',
    name: 'Boss ' + randomName(),
    elite: true,
  });
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;

    if (p.x < -20 || p.x > world.width + 20 || p.y < -20 || p.y > world.height + 20) {
      projectiles.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / dist) * enemy.speed * dt * 0.06;
    enemy.y += (dy / dist) * enemy.speed * dt * 0.06;

    if (dist < player.radius + enemy.radius + 4) {
      if (player.radius > enemy.radius + 6) {
        absorbEnemy(enemy);
        enemies.splice(i, 1);
      } else {
        player.hp -= enemy.elite ? 18 : 10;
        player.invuln = 0.6;
        createBurst(enemy.x, enemy.y, enemy.color, 18);
        if (player.hp < 0) player.hp = 0;
      }
    }
  }
}

function absorbEnemy(enemy) {
  const gain = enemy.elite ? 60 : 25;
  gameState.score += Math.round(gain + enemy.radius * 2);
  player.radius = Math.min(90, player.radius + 1.5 + (enemy.elite ? 2.4 : 1.0));
  player.growth = player.radius / 26;
  player.speed = Math.min(10, 5 + player.growth * 1.5);
  player.hp = Math.min(player.maxHp, player.hp + (enemy.elite ? 14 : 8));
  createBurst(enemy.x, enemy.y, enemy.color, enemy.elite ? 30 : 18);

  if (player.radius > 44 && player.radius <= 52) {
    player.form = 'MORPH 2';
  } else if (player.radius > 52 && player.radius <= 68) {
    player.form = 'MORPH 3';
  } else if (player.radius > 68) {
    player.form = 'GOD CELL';
  }

  if (gameState.score > 500 && player.radius > 60) {
    statusEl.textContent = 'Multiverso dominato';
  } else {
    statusEl.textContent = 'Cell assorbe dimensioni';
  }
}

function handleCollisions() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    let hit = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= enemy.radius + p.radius) {
        projectiles.splice(i, 1);
        createBurst(enemy.x, enemy.y, enemy.color, 14);
        enemy.radius -= 3;
        if (enemy.radius <= 8) {
          enemies.splice(j, 1);
          gameState.score += 12;
          player.hp = Math.min(player.maxHp, player.hp + 4);
        }
        hit = true;
        break;
      }
    }

    if (hit) continue;
  }
}

function createBurst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 24 + Math.random() * 18,
      color,
      radius: 2 + Math.random() * 3,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.life -= dt * 0.06;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateHud() {
  scoreEl.textContent = String(gameState.score);
  hpEl.textContent = String(Math.max(0, Math.round(player.hp)));
  cellNameEl.textContent = player.form;
}

function endGame() {
  gameState.running = false;
  gameState.gameOver = true;
  statusEl.textContent = 'Cell è stato fermato';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', world.width / 2, world.height / 2 - 20);
  ctx.font = '24px Arial';
  ctx.fillText('Premi R per riprovare', world.width / 2, world.height / 2 + 30);
}

function render() {
  ctx.clearRect(0, 0, world.width, world.height);

  drawBackground();
  drawPlayer();
  drawEnemies();
  drawProjectiles();
  drawParticles();

  if (!gameState.gameOver && gameState.running) {
    drawAura();
  }
}

function drawBackground() {
  ctx.fillStyle = '#0a0f1f';
  ctx.fillRect(0, 0, world.width, world.height);

  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % world.width;
    const y = (i * 61) % world.height;
    ctx.fillStyle = 'rgba(168, 196, 255, 0.08)';
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.beginPath();
  ctx.fillStyle = '#72f7b8';
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#0b1220';
  ctx.arc(0, 0, player.radius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#b0fff0';
  ctx.arc(player.radius * 0.2, -player.radius * 0.1, player.radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.beginPath();
    ctx.fillStyle = enemy.color;
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.arc(0, 0, enemy.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f9ff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name.slice(0, 4), 0, 4);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / 45);
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawAura() {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(123, 255, 219, 0.5)';
  ctx.lineWidth = 2;
  ctx.arc(player.x, player.y, player.radius + 12, 0, Math.PI * 2);
  ctx.stroke();
}

function gameLoop(timestamp) {
  if (!gameState.lastTime) gameState.lastTime = timestamp;
  const dt = timestamp - gameState.lastTime;
  gameState.lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[event.key] = true;
  keys[key] = true;

  if (key === 'r') {
    resetGame();
  }

  if (key === ' ') {
    event.preventDefault();
    fireProjectile();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
  keys[event.key.toLowerCase()] = false;
});

resetGame();
requestAnimationFrame(gameLoop);

setInterval(() => {
  if (gameState.running) fireProjectile();
}, 350);
