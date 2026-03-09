const canvas = document.getElementById('tank');
const ctx = canvas.getContext('2d');

const ui = {
  light: document.getElementById('light'),
  co2: document.getElementById('co2'),
  nutrient: document.getElementById('nutrient'),
  seedPlant: document.getElementById('seedPlant'),
  trim: document.getElementById('trim'),
  sellFloating: document.getElementById('sellFloating'),
  coins: document.getElementById('coins'),
  plantCount: document.getElementById('plantCount'),
  avgHealth: document.getElementById('avgHealth'),
  biomass: document.getElementById('biomass')
};

const world = {
  time: 0,
  coins: 20,
  selected: null,
  camera: { x: 0, y: 0, z: 1 },
  env: { light: 1, co2: 0.7, nutrient: 0.8 },
  plants: []
};

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

function makeDNA() {
  return {
    internode: rand(6, 14),
    branchProb: rand(0.07, 0.23),
    leafSize: rand(2, 5),
    growthRate: rand(0.4, 1.2),
    lightPref: rand(0.7, 1.3),
    co2Efficiency: rand(0.6, 1.4),
    trimResponse: rand(0.8, 1.5),
    hue: rand(90, 145)
  };
}

function makePlant(x = rand(140, 820), y = rand(360, 500), rooted = true) {
  const dna = makeDNA();
  return {
    id: crypto.randomUUID(),
    rooted,
    x,
    y,
    vx: rand(-0.2, 0.2),
    vy: rand(-0.2, 0.05),
    energy: rand(16, 24),
    health: rand(60, 90),
    age: 0,
    dna,
    nodes: [{ x: 0, y: 0, d: -Math.PI / 2, l: dna.internode }]
  };
}

for (let i = 0; i < 5; i++) world.plants.push(makePlant());

function addPlant() {
  if (world.coins < 4) return;
  world.coins -= 4;
  world.plants.push(makePlant());
}

function trimSelected() {
  const p = world.plants.find((it) => it.id === world.selected);
  if (!p) return;
  const cut = Math.max(1, (p.nodes.length * 0.35) | 0);
  p.nodes.splice(-cut);
  p.energy += 3 * p.dna.trimResponse;
  p.health = Math.min(100, p.health + 6);
  for (let i = 0; i < cut; i++) {
    world.plants.push(makePlant(p.x + rand(-20, 20), p.y + rand(-10, 5), false));
  }
}

function sellFloating() {
  let sold = 0;
  world.plants = world.plants.filter((p) => {
    if (!p.rooted) {
      sold += 1;
      return false;
    }
    return true;
  });
  world.coins += sold * 2;
}

function update(dt) {
  world.time += dt;
  world.env.light = Number(ui.light.value);
  world.env.co2 = Number(ui.co2.value);
  world.env.nutrient = Number(ui.nutrient.value);

  for (const p of world.plants) {
    p.age += dt;

    const lightFactor = 1 - Math.abs(world.env.light - p.dna.lightPref) * 0.45;
    const co2Factor = Math.min(1.5, world.env.co2 * p.dna.co2Efficiency);
    const nutrientFactor = Math.min(1.4, world.env.nutrient);

    const intake = Math.max(0, lightFactor) * co2Factor * nutrientFactor * p.dna.growthRate;
    p.energy += intake * dt * 2.2;
    p.energy -= dt * (0.9 + p.nodes.length * 0.02);

    if (p.energy > 3) {
      p.health = Math.min(100, p.health + dt * 4.5);
      if (Math.random() < dt * 0.9) {
        const parent = pick(p.nodes);
        const angleJitter = rand(-0.35, 0.35);
        const isBranch = Math.random() < p.dna.branchProb;
        p.nodes.push({
          x: parent.x + Math.cos(parent.d + angleJitter) * p.dna.internode,
          y: parent.y + Math.sin(parent.d + angleJitter) * p.dna.internode,
          d: parent.d + (isBranch ? rand(-0.6, 0.6) : angleJitter * 0.4),
          l: p.dna.internode
        });
        p.energy -= 1.3;
      }
    } else {
      p.health = Math.max(0, p.health - dt * 6);
      if (p.nodes.length > 2 && Math.random() < dt * 0.6) p.nodes.pop();
    }

    if (!p.rooted) {
      p.vy += 0.03;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > 500 && world.env.nutrient > 0.5) {
        p.rooted = true;
        p.vx = 0;
        p.vy = 0;
      }
      if (p.y < 60 || p.x < 40 || p.x > 920) p.health -= dt * 8;
    }
  }

  world.plants = world.plants.filter((p) => p.health > 0 && p.nodes.length > 0);
}

function drawTankBackground() {
  ctx.fillStyle = '#0a2137';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 3) {
    const alpha = 0.02 + (y / canvas.height) * 0.06;
    ctx.fillStyle = `rgba(120,190,230,${alpha})`;
    ctx.fillRect(0, y, canvas.width, 2);
  }

  ctx.fillStyle = '#3c2e22';
  ctx.fillRect(0, 500, canvas.width, 40);
}

function drawPlant(p) {
  const stress = 1 - p.health / 100;
  const hue = p.dna.hue - stress * 55;

  ctx.save();
  ctx.translate((p.x + world.camera.x) * world.camera.z, (p.y + world.camera.y) * world.camera.z);
  ctx.scale(world.camera.z, world.camera.z);

  ctx.strokeStyle = `hsl(${hue} 55% ${45 - stress * 15}%)`;
  ctx.lineWidth = 2;
  ctx.beginPath();

  let prev = { x: 0, y: 0 };
  for (const n of p.nodes) {
    const sway = Math.sin(world.time * 2 + n.x * 0.06) * 1.4;
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(n.x + sway, n.y);
    prev = { x: n.x + sway, y: n.y };

    ctx.fillStyle = `hsla(${hue + 6} 70% ${53 - stress * 12}% / 0.85)`;
    ctx.fillRect(prev.x - p.dna.leafSize / 2, prev.y - p.dna.leafSize / 2, p.dna.leafSize, p.dna.leafSize);
  }
  ctx.stroke();

  if (p.id === world.selected) {
    ctx.strokeStyle = '#f4e27a';
    ctx.strokeRect(-8, -14, 16, 16);
  }
  ctx.restore();
}

function render() {
  drawTankBackground();
  for (const p of world.plants) drawPlant(p);

  ui.coins.textContent = String(world.coins);
  ui.plantCount.textContent = String(world.plants.length);
  const avg = world.plants.length ? world.plants.reduce((s, p) => s + p.health, 0) / world.plants.length : 0;
  const biomass = world.plants.reduce((s, p) => s + p.nodes.length, 0);
  ui.avgHealth.textContent = avg.toFixed(1);
  ui.biomass.textContent = String(biomass);
}

let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener('mousedown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  let found = null;
  let best = Infinity;
  for (const p of world.plants) {
    const dx = x / world.camera.z - (p.x + world.camera.x);
    const dy = y / world.camera.z - (p.y + world.camera.y);
    const d = Math.hypot(dx, dy);
    if (d < 20 && d < best) {
      best = d;
      found = p.id;
    }
  }
  world.selected = found;
});
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = (e.clientX - lastX) / world.camera.z;
  const dy = (e.clientY - lastY) / world.camera.z;
  world.camera.x += dx;
  world.camera.y += dy;
  lastX = e.clientX;
  lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  world.camera.z = Math.max(0.6, Math.min(2.5, world.camera.z + (e.deltaY < 0 ? 0.08 : -0.08)));
});

ui.seedPlant.addEventListener('click', addPlant);
ui.trim.addEventListener('click', trimSelected);
ui.sellFloating.addEventListener('click', sellFloating);

let prev = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
