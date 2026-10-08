:root {
  --bg-1: #060b16;
  --bg-2: #101b2f;
  --panel: rgba(11, 16, 27, 0.82);
  --panel-border: rgba(122, 214, 255, 0.32);
  --text: #e9f7ff;
  --muted: #b7cfdf;
  --cyan: #7fe8ff;
  --purple: #9f7dff;
  --pink: #ff7bce;
  --green: #7afbb9;
  --gold: #ffd96a;
  --danger: #ff617d;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  width: 100%;
  min-height: 100%;
  height: 100%;
  font-family: Arial, Helvetica, sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at top, rgba(93, 110, 188, 0.28), transparent 25%),
    linear-gradient(180deg, var(--bg-1), var(--bg-2));
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
  background: rgba(10, 15, 24, 0.8);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.panel {
  padding: 20px 18px;
}

.title {
  font-size: 1.1rem;
  letter-spacing: 0.18em;
  font-weight: 700;
  margin-bottom: 18px;
  color: var(--cyan);
}

.stat-row,
.mini-stat {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: var(--muted);
}

.stat-row strong,
.mini-stat strong {
  color: var(--text);
}

ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.8;
}

.system-box {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.controls {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
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
  background: linear-gradient(180deg, #091120, #0f1a31 40%, #12213d 100%);
}

.hud-message {
  position: absolute;
  left: 18px;
  bottom: 18px;
  background: rgba(8, 12, 24, 0.7);
  border: 1px solid rgba(127, 232, 255, 0.34);
  border-radius: 999px;
  padding: 8px 12px;
  color: var(--text);
  font-size: 0.8rem;
  backdrop-filter: blur(5px);
}

.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(6, 10, 18, 0.7);
  backdrop-filter: blur(4px);
  z-index: 20;
}

.overlay.hidden {
  display: none;
}

.overlay-card {
  width: min(560px, 90vw);
  background: linear-gradient(180deg, rgba(17, 23, 36, 0.98), rgba(11, 16, 28, 0.96));
  border: 1px solid rgba(127, 232, 255, 0.35);
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
  padding: 30px 26px;
  text-align: center;
}

.overlay-card.danger {
  border-color: rgba(255, 97, 125, 0.38);
}

.tag {
  margin: 0 0 10px;
  color: var(--cyan);
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  text-transform: uppercase;
}

h1, h2 {
  margin: 0 0 14px;
}

h1 {
  font-size: clamp(2rem, 5vw, 3.3rem);
}

h2 {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
}

.overlay-card p {
  color: var(--muted);
  line-height: 1.6;
}

button {
  appearance: none;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--pink), var(--purple));
  color: white;
  padding: 14px 26px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(166, 104, 255, 0.45);
}

button:hover {
  transform: translateY(-1px);
}

.mutation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.mutation-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(127, 232, 255, 0.2);
  border-radius: 16px;
  padding: 18px 12px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.mutation-card:hover {
  transform: translateY(-2px);
  border-color: rgba(127, 232, 255, 0.45);
}

.mutation-card h3 {
  margin: 0 0 10px;
  font-size: 1rem;
  color: var(--text);
}

.mutation-card p {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
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

  .mutation-grid {
    grid-template-columns: 1fr;
  }
}
