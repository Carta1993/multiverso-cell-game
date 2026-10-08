const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const hpEl = document.getElementById('hp');
const stageEl = document.getElementById('stage');
const sizeEl = document.getElementById('size');
const formEl = document.getElementById('cellForm');
const hudMessageEl = document.getElementById('hudMessage');
const startOverlayEl = document.getElementById('startOverlay');
const gameOverOverlayEl = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');

const world = { width: canvas.width, height: canvas.height };
const keys = {};
const palette = ['#72f7ba', '#7fe8ff', '#ff86d8', '#8d7dff', '#ffd76a', '#ff5f7b'];

const player = {
  x: world.width / 2,
  y: world.height / 2,
  radius: 24,
  speed: 4.8,
  hp: 100,
  maxHp: 100,
  invuln: 0,
  growth: 1,
  form: 'Spore',
};

const state = {
  started: false,
  running: false,
  score: 0,
  stage: 1,
  lastTime: 0,
  spawnTimer: 0,
  bossTimer: 0,
  shootCooldown: 0,
  bossActive: false,
  best: Number(localStorage.getItem('cell-best') || 0),
};

const enemies = [];
const projectiles = [];
const particles = [];

function resetGame() {
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.radius = 24;
  player.speed = 4.8;
  player.hp = 100;
  player.maxHp = 100;
  player.invuln = 0;
  player.growth = 1;
  player.form = 'Spore';

  state.started = true;
  state.running = true;
  state.score = 0;
  state.stage = 1;
  state.lastTime = 0;
  state.spawnTimer = 0;
  state.bossTimer = 0;
  state.shootCooldown = 0;
  state.bossActive = false;

  enemies.length = 0;
  projectiles.length = 0;
  particles.length = 0;

  for (let i = 0; i < 8; i++) {
    spawnEnemy();
  }

  updateHud();
  hudMessageEl.textContent = 'Missione iniziata: domina i mondi';
  gameOverOverlayEl.classList.add('hidden');
  startOverlayEl.classList.add('hidden');
}

function spawnEnemy(type = 'drone') {
  let radius = 16;
  let speed = 1.2;
  let color = palette[Math.floor(Math.random() * palette.length)];
  let name = 'Astra';

  if (type === 'hunter') {
    radius = 20 + Math.random() * 8;
    speed = 1.7 + state.stage * 0.06;
    color = '#ff7ace';
    name = randomName();
  } else if (type === 'elite') {
    radius = 25 + Math.random() * 10;
    speed = 1.5 + state.stage * 0.08;
    color = '#ffd76a';
    name = 'Sovereign';
  } else if (type === 'boss') {
    radius = 40 + Math.random() * 12;
    speed = 1.1 + state.stage * 0.04;
    color = '#ff5b78';
    name = 'Boss: ' + randomName();
  } else {
    radius = 12 + Math.random() * 12;
    speed = 1.3 + state.stage * 0.05;
    color = palette[Math.floor(Math.random() * palette.length)];
    name = randomName();
  }

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
    speed,
    color,
    name,
    type,
    shootCooldown: 0,
    baseSize: radius,
  });
}

function randomName() {
  const names = ['Astra', 'Vela', 'Sera', 'Nia', 'Rhea', 'Mira', 'Luna', 'Selene', 'Kaia', 'Iris', 'Nova', 'Ari'];
  return names[Math.floor(Math.random() * names.length)];
}

function handleInput() {
  let dx = 0;
  let dy = 0;

  if (keys['ArrowLeft'] || keys['a']) dx -= 1;
  if (keys['ArrowRight'] || keys['d']) dx += 1;
  if (keys['ArrowUp'] || keys['w']) dy -= 1;
  if (keys['ArrowDown'] || keys['s']) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy) || 1;
    player.x += (dx / len) * player.speed;
    player.y += (dy / len) * player.speed;
  }

  player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
}

function shoot() {
  if (!state.running) return;

  const target = findNearestEnemy();
  if (!target) return;

  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  projectiles.push({
    x: player.x,
    y: player.y,
    radius: 6,
    speed: 9,
    vx: Math.cos(angle) * 9,
    vy: Math.sin(angle) * 9,
    color: '#7fe8ff',
    from: 'player',
  });
}

function findNearestEnemy() {
  let result = null;
  let minDist = Infinity;

  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < minDist) {
      minDist = dist;
      result = enemy;
    }
  }

  return result;
}

function update(dt) {
  if (!state.running) return;

  handleInput();
  state.spawnTimer += dt;
  state.bossTimer += dt;
  state.shootCooldown -= dt;

  if (state.shootCooldown <= 0) {
    shoot();
    state.shootCooldown = 220;
  }

  if (state.spawnTimer > 1200 - state.stage * 30 && !state.bossActive) {
    const roll = Math.random();
    if (roll < 0.7) {
      spawnEnemy('drone');
    } else if (roll < 0.9) {
      spawnEnemy('hunter');
    } else {
      spawnEnemy('elite');
    }
    state.spawnTimer = 0;
  }

  if (!state.bossActive && state.score >= 260 + (state.stage - 1) * 100) {
    state.stage += 1;
    state.bossActive = true;
    spawnEnemy('boss');
    hudMessageEl.textContent = 'Boss del multiverso comparso';
  }

  updateProjectiles(dt);
  updateEnemies(dt);
  updateParticles(dt);
  checkCollisions();

  if (player.hp <= 0) {
    endGame();
  }

  updateHud();
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;

    if (p.x < -30 || p.x > world.width + 30 || p.y < -30 || p.y > world.height + 30) {
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

    if (enemy.type !== 'boss') {
      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0 && dist < 260) {
        spawnEnemyProjectile(enemy, dt);
        enemy.shootCooldown = 1400 + Math.random() * 700;
      }
    }

    if (enemy.type === 'boss' && dist < 280) {
      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        for (let n = 0; n < 6; n++) {
          const angle = (Math.PI * 2 / 6) * n + Math.random() * 0.35;
          projectiles.push({
            x: enemy.x,
            y: enemy.y,
            radius: 7,
            speed: 5.5,
            vx: Math.cos(angle) * 5.5,
            vy: Math.sin(angle) * 5.5,
            color: '#ff5b78',
            from: 'enemy',
          });
        }
        enemy.shootCooldown = 900;
      }
    }

    const minDistance = player.radius + enemy.radius + 4;
    if (dist < minDistance) {
      if (player.radius > enemy.radius + 6) {
        absorbEnemy(enemy);
        enemies.splice(i, 1);
      } else {
        player.hp -= enemy.type === 'boss' ? 18 : enemy.type === 'elite' ? 14 : 8;
        player.invuln = 0.7;
        createBurst(enemy.x, enemy.y, enemy.color, 18);
      }
    }
  }
}

function spawnEnemyProjectile(enemy) {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  projectiles.push({
    x: enemy.x,
    y: enemy.y,
    radius: 6,
    speed: 5,
    vx: Math.cos(angle) * 5,
    vy: Math.sin(angle) * 5,
    color: '#ff7ace',
    from: 'enemy',
  });
}

function absorbEnemy(enemy) {
  const reward = enemy.type === 'boss' ? 150 : enemy.type === 'elite' ? 70 : enemy.type === 'hunter' ? 45 : 25;
  state.score += reward;

  player.radius = Math.min(96, player.radius + (enemy.type === 'boss' ? 8 : 2.3));
  player.growth = player.radius / 24;
  player.speed = Math.min(8.5, 4.8 + player.growth * 1.2);
  player.hp = Math.min(player.maxHp, player.hp + (enemy.type === 'boss' ? 24 : 10));

  if (player.radius < 34) {
    player.form = 'Spore';
  } else if (player.radius < 48) {
    player.form = 'Crawler';
  } else if (player.radius < 68) {
    player.form = 'Apex';
  } else if (player.radius < 84) {
    player.form = 'OverCell';
  } else {
    player.form = 'God Cell';
  }

  if (enemy.type === 'boss') {
    state.bossActive = false;
    hudMessageEl.textContent = 'Boss eliminato: dimensione del multiverso spezzata';
  } else {
    hudMessageEl.textContent = 'Assorbimento riuscito';
  }

  createBurst(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 36 : 20);
}

function checkCollisions() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    if (p.from === 'player') {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);

        if (dist <= enemy.radius + p.radius) {
          projectiles.splice(i, 1);
          createBurst(enemy.x, enemy.y, enemy.color, 12);
          enemy.radius -= 2.4;

          if (enemy.radius <= 8) {
            enemies.splice(j, 1);
            state.score += 12;
            player.hp = Math.min(player.maxHp, player.hp + 2);
          }
          break;
        }
      }
    } else {
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist <= player.radius + p.radius + 5) {
        projectiles.splice(i, 1);
        player.hp -= 7;
        createBurst(p.x, p.y, '#ff5b78', 10);
      }
    }
  }
}

function createBurst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 25,
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
  scoreEl.textContent = String(state.score);
  hpEl.textContent = String(Math.max(0, Math.round(player.hp)));
  stageEl.textContent = String(state.stage);
  sizeEl.textContent = (player.radius / 24).toFixed(1) + 'x';
  formEl.textContent = player.form;

  if (state.best < state.score) {
    state.best = state.score;
    localStorage.setItem('cell-best', String(state.best));
  }
}

function endGame() {
  state.running = false;
  finalScoreEl.textContent = 'Punteggio: ' + state.score;
  gameOverOverlayEl.classList.remove('hidden');
  hudMessageEl.textContent = 'Missione fallita';
}

function render() {
  ctx.clearRect(0, 0, world.width, world.height);
  drawBackground();
  drawPlayer();
  drawEnemies();
  drawProjectiles();
  drawParticles();
  drawAura();
}

function drawBackground() {
  ctx.fillStyle = '#091220';
  ctx.fillRect(0, 0, world.width, world.height);

  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % world.width;
    const y = (i * 73) % world.height;
    ctx.fillStyle = 'rgba(160, 200, 255, 0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = 'rgba(127, 232, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const y = (i / 12) * world.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.beginPath();
  ctx.fillStyle = '#74ffb4';
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#0d1220';
  ctx.arc(0, 0, player.radius * 0.38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d8fff2';
  ctx.beginPath();
  ctx.arc(player.radius * 0.18, -player.radius * 0.14, player.radius * 0.18, 0, Math.PI * 2);
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
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.arc(0, 0, enemy.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eaf7ff';
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
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawAura() {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(116, 255, 180, 0.5)';
  ctx.lineWidth = 2;
  ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
  ctx.stroke();
}

function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const dt = timestamp - state.lastTime;
  state.lastTime = timestamp;

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

  if (key === ' ' || key === 'space') {
    event.preventDefault();
    shoot();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
  keys[event.key.toLowerCase()] = false;
});

startOverlayEl.querySelector('#startBtn').addEventListener('click', resetGame);
gameOverOverlayEl.querySelector('#retryBtn').addEventListener('click', resetGame);

updateHud();
requestAnimationFrame(gameLoop);
