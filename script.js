:root {
  --bg-1: #070b16;
  --bg-2: #121b2d;
  --panel: rgba(10, 16, 28, 0.8);
  --panel-border: rgba(128, 216, 255, 0.32);
  --text: #eaf7ff;
  --muted: #afc8df;
  --cyan: #7fe8ff;
  --green: #74ffb4;
  --pink: #ff7ace;
  --purple: #8a7dff;
  --gold: #ffd76a;
  --danger: #ff5b78;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  min-height: 100%;
  height: 100%;
  font-family: Arial, Helvetica, sans-serif;
  background: radial-gradient(circle at top, rgba(72, 97, 168, 0.25), transparent 25%),
    linear-gradient(180deg, var(--bg-1), var(--bg-2));
  color: var(--text);
}

body {
  display: grid;
  place-items: center;
  padding: 24px;
}

.game-wrap {
  display: grid;
  grid-template-columns: 210px minmax(320px, 960px) 210px;
  gap: 18px;
  align-items: stretch;
}

.panel,
.arena-box {
  background: rgba(8, 12, 22, 0.78);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.panel {
  padding: 20px 18px;
}

.title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  margin-bottom: 20px;
  color: var(--cyan);
}

.stat {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--muted);
}

.stat strong {
  color: var(--text);
}

ul {
  padding-left: 18px;
  margin: 0;
  list-style: square;
  line-height: 1.8;
  color: var(--muted);
}

.controls {
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.92rem;
  color: var(--muted);
}

.controls p {
  margin: 8px 0;
}

.arena-box {
  position: relative;
  overflow: hidden;
}

#gameCanvas {
  display: block;
  width: 100%;
  height: auto;
  background: linear-gradient(180deg, #091220, #0e1a2d 40%, #111f39 100%);
}

.hud-message {
  position: absolute;
  left: 18px;
  bottom: 18px;
  background: rgba(8, 12, 22, 0.72);
  border: 1px solid rgba(127, 232, 255, 0.35);
  color: var(--text);
  font-size: 0.82rem;
  padding: 8px 12px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(6, 8, 15, 0.64);
  backdrop-filter: blur(3px);
  z-index: 10;
}

.overlay.hidden {
  display: none;
}

.overlay-card {
  width: min(560px, 90vw);
  background: linear-gradient(180deg, rgba(17, 25, 38, 0.96), rgba(11, 17, 29, 0.96));
  border: 1px solid rgba(127, 232, 255, 0.35);
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
}

.overlay-card.danger {
  border-color: rgba(255, 91, 120, 0.38);
}

.tag {
  margin: 0 0 8px;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cyan);
}

h1, h2 {
  margin: 0 0 14px;
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.overlay-card p {
  color: var(--muted);
  line-height: 1.6;
}

button {
  appearance: none;
  border: none;
  background: linear-gradient(135deg, var(--pink), var(--purple));
  color: white;
  padding: 14px 26px;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 12px;
  box-shadow: 0 10px 30px rgba(166, 104, 255, 0.45);
}

button:hover {
  transform: translateY(-1px);
}

@media (max-width: 980px) {
  .game-wrap {
    grid-template-columns: 1fr;
  }

  .panel {
    order: 2;
  }

  .arena-box {
    order: 1;
  }
}
