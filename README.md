const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const hpEl = document.getElementById('hp');
const stageEl = document.getElementById('stage');
const sizeEl = document.getElementById('size');
const formEl = document.getElementById('cellForm');
const powerStatEl = document.getElementById('powerStat');
const speedStatEl = document.getElementById('speedStat');
const bestStatEl = document.getElementById('bestStat');
const hudMessageEl = document.getElementById('hudMessage');
const finalScoreEl = document.getElementById('finalScore');
const startOverlayEl = document.getElementById('startOverlay');
const mutationOverlayEl = document.getElementById('mutationOverlay');
const gameOverOverlayEl = document.getElementById('gameOverOverlay');
const mutationChoicesEl = document.getElementById('mutationChoices');

const world = { width: canvas.width, height: canvas.height };
const keys = {};
const palette = ['#72f7ba', '#7fe8ff', '#ff86d8', '#9f7dff', '#ffd76a', '#ff5f7b'];

const playerDefaults = {
  x: world.width / 2,
  y: world.height / 2,
  radius: 24,
  speed: 4.8,
  hp: 100,
  maxHp: 100,
  attackPower: 1,
  regen: 0.12,
  form: 'Spore',
  invuln: 0,
  growth: 1,
};

const player = { ...playerDefaults };

const state = {
  started: false,
  running: false,
  score: 0,
  stage: 1,
  lastTime: 0,
  spawnTimer: 0,
  shotCooldown: 0,
  bossActive: false,
  best: Number(localStorage.getItem('cell-best') || 0),
  mutationReady: false,
};

const enemies = [];
const projectiles = [];
const particles = [];

const mutationOptions = [
  {
    id: 'speed',
    title: 'Velocità Kappa',
    text: '+25% velocità e movimento più reattivo.',
    apply: () => {
      player.speed *= 1.25;
      hudMessageEl.textContent = 'Mutazione: Velocità Kappa attivata';
    },
  },
  {
    id: 'power',
    title: 'Nucleo di Luce',
    text: '+40% potenza del proiettile e attacchi più forti.',
    apply: () => {
      player.attackPower *= 1.4;
      hudMessageEl.textContent = 'Mutazione: Nucleo di Luce attivata';
    },
  },
  {
    id: 'shield',
    title: 'Scudo Biomorfico',
    text: '+20 HP massimi e rigenerazione aumentata.',
    apply: () => {
      player.maxHp += 20;
      player.hp = player.maxHp;
      player.regen += 0.08;
      hudMessageEl.textContent = 'Mutazione: Scudo Biomorfico attivato';
    },
  },
];

function resetGame() {
  Object.assign(player, playerDefaults);

  state.started = true;
  state.running = true;
  state.score = 0;
  state.stage = 1;
  state.lastTime = 0;
  state.spawnTimer = 0;
  state.shotCooldown = 0;
  state.bossActive = false;
  state.mutationReady = false;

  enemies.length = 0;
  projectiles.length = 0;
  particles.length = 0;

  for (let i = 0; i < 9; i++) {
    spawnEnemy('drone');
  }

  startOverlayEl.classList.add('hidden');
  gameOverOverlayEl.classList.add('hidden');
  mutationOverlayEl.classList.add('hidden');
  hudMessageEl.textContent = 'Missione iniziata: domina i mondi';
  updateHud();
}

function spawnEnemy(type = 'drone') {
  const stageBoost = state.stage * 0.08;
  let radius = 14;
  let speed = 1.2 + stageBoost;
  let color = palette[Math.floor(Math.random() * palette.length)];
  let name = randomName();

  if (type === 'hunter') {
    radius = 18 + Math.random() * 9;
    speed = 1.8 + stageBoost;
    color = '#ff7ace';
    name = 'Hunter ' + randomName();
  } else if (type === 'elite') {
    radius = 24 + Math.random() * 10;
    speed = 1.5 + stageBoost;
    color = '#ffd76a';
    name = 'Sentinel';
  } else if (type === 'boss') {
    radius = 42 + Math.random() * 10;
    speed = 1.2 + stageBoost;
    color = '#ff5b78';
    name = 'Boss ' + randomName();
  }

  const side = Math.floor(Math.random() * 4);
  let x = Math.random() * world.width;
  let y = Math.random() * world.height;

  if (side === 0) x = -30; y = Math.random() * world.height;
  if (side === 1) x = world.width + 30; y = Math.random() * world.height;
  if (side === 2) x = Math.random() * world.width; y = -30;
  if (side === 3) x = Math.random() * world.width; y = world.height + 30;

  enemies.push({
    x,
    y,
    radius,
    speed,
    color,
    name,
    type,
    attackTimer: 900 + Math.random() * 400,
  });
}

function randomName() {
  const names = ['Astra', 'Vela', 'Rhea', 'Mira', 'Luna', 'Selene', 'Kaia', 'Nova', 'Iris', 'Ari'];
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
    const mag = Math.hypot(dx, dy) || 1;
    player.x += (dx / mag) * player.speed;
    player.y += (dy / mag) * player.speed;
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
  let selected = null;
  let nearest = Infinity;

  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < nearest) {
      nearest = dist;
      selected = enemy;
    }
  }

  return selected;
}

function triggerMutationChoice() {
  state.running = false;
  state.mutationReady = true;
  mutationChoicesEl.innerHTML = '';

  mutationOptions.forEach((option) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mutation-card';
    card.innerHTML = `
      <h3>${option.title}</h3>
      <p>${option.text}</p>
    `;
    card.addEventListener('click', () => {
      option.apply();
      state.mutationReady = false;
      state.running = true;
      mutationOverlayEl.classList.add('hidden');
    });
    mutationChoicesEl.appendChild(card);
  });

  mutationOverlayEl.classList.remove('hidden');
}

function update(dt) {
  if (!state.running) return;

  handleInput();
  player.hp = Math.min(player.maxHp, player.hp + player.regen * dt * 0.06);

  state.spawnTimer += dt;
  state.shotCooldown -= dt;

  if (state.shotCooldown <= 0) {
    shoot();
    state.shotCooldown = 240;
  }

  if (state.spawnTimer > 1050 && !state.bossActive) {
    const roll = Math.random();
    if (roll < 0.6) spawnEnemy('drone');
    else if (roll < 0.88) spawnEnemy('hunter');
    else spawnEnemy('elite');
    state.spawnTimer = 0;
  }

  if (!state.bossActive && state.score >= 240 + (state.stage - 1) * 140) {
    state.stage += 1;
    state.bossActive = true;
    spawnEnemy('boss');
    hudMessageEl.textContent = 'Boss del multiverso comparso';
    triggerMutationChoice();
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

    if (enemy.type === 'boss') {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        for (let n = 0; n < 7; n++) {
          const angle = (Math.PI * 2 / 7) * n + Math.random() * 0.5;
          projectiles.push({
            x: enemy.x,
            y: enemy.y,
            radius: 7,
            speed: 5.2,
            vx: Math.cos(angle) * 5.2,
            vy: Math.sin(angle) * 5.2,
            color: '#ff5b78',
            from: 'enemy',
          });
        }
        enemy.attackTimer = 1150;
      }
    } else {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0 && dist < 260) {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        projectiles.push({
          x: enemy.x,
          y: enemy.y,
          radius: 6,
          speed: 4.5,
          vx: Math.cos(angle) * 4.5,
          vy: Math.sin(angle) * 4.5,
          color: '#ff7ace',
          from: 'enemy',
        });
        enemy.attackTimer = 1100 + Math.random() * 700;
      }
    }

    const collisionDist = player.radius + enemy.radius + 4;
    if (dist < collisionDist) {
      if (player.radius > enemy.radius + 8) {
        absorbEnemy(enemy);
        enemies.splice(i, 1);
      } else {
        const damage = enemy.type === 'boss' ? 18 : enemy.type === 'elite' ? 12 : 8;
        player.hp -= damage;
        createBurst(enemy.x, enemy.y, enemy.color, 18);
      }
    }
  }
}

function absorbEnemy(enemy) {
  const reward = enemy.type === 'boss' ? 170 : enemy.type === 'elite' ? 80 : enemy.type === 'hunter' ? 45 : 24;
  state.score += reward;

  player.radius = Math.min(96, player.radius + (enemy.type === 'boss' ? 8.5 : 2.4));
  player.growth = player.radius / 24;
  player.speed = Math.min(10, 4.8 + player.growth * 1.3);
  player.hp = Math.min(player.maxHp, player.hp + (enemy.type === 'boss' ? 20 : 8));

  if (player.radius < 30) player.form = 'Spore';
  else if (player.radius < 42) player.form = 'Crawler';
  else if (player.radius < 58) player.form = 'Apex';
  else if (player.radius < 76) player.form = 'OverCell';
  else player.form = 'God Cell';

  if (enemy.type === 'boss') {
    state.bossActive = false;
    hudMessageEl.textContent = 'Boss sconfitto: dominio del multiverso raggiunto';
  } else {
    hudMessageEl.textContent = 'Assorbimento completato';
  }

  createBurst(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 35 : 18);
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
          enemy.radius -= 2.2 * player.attackPower;

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
      life: 16 + Math.random() * 20,
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
  powerStatEl.textContent = player.attackPower.toFixed(1);
  speedStatEl.textContent = player.speed.toFixed(1);
  bestStatEl.textContent = String(state.best);

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

  for (let i = 0; i < 36; i++) {
    const x = (i * 97) % world.width;
    const y = (i * 63) % world.height;
    ctx.fillStyle = 'rgba(160, 200, 255, 0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  for (let i = 0; i < 18; i++) {
    const y = (i / 18) * world.height;
    ctx.strokeStyle = 'rgba(127, 232, 255, 0.06)';
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
    ctx.globalAlpha = Math.max(0, p.life / 35);
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawAura() {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(116, 255, 180, 0.55)';
  ctx.lineWidth = 2;
  ctx.arc(player.x, player.y, player.radius + 12, 0, Math.PI * 2);
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

document.getElementById('startBtn').addEventListener('click', resetGame);
document.getElementById('retryBtn').addEventListener('click', resetGame);

updateHud();
requestAnimationFrame(gameLoop);

