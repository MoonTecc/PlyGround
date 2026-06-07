const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Events, Body, Vector } = Matter;
// --- Setup ---
const engine = Engine.create();
const world = engine.world;
const canvas = document.getElementById("world");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60;

const render = Render.create({
  canvas,
  engine,
  options: {
    width: canvas.width,
    height: canvas.height,
    background: "#090d14", // Deeper sci-fi laboratory canvas tone
    wireframes: false,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// --- Boundaries ---
const ground = Bodies.rectangle(canvas.width/2, canvas.height, canvas.width, 60, { isStatic: true, label: "Ground", render: { fillStyle: "#0f172a" } });
const leftWall = Bodies.rectangle(0, canvas.height/2, 60, canvas.height, { isStatic: true, label: "Wall", render: { fillStyle: "#0f172a" } });
const rightWall = Bodies.rectangle(canvas.width, canvas.height/2, 60, canvas.height, { isStatic: true, label: "Wall", render: { fillStyle: "#0f172a" } });
World.add(world, [ground, leftWall, rightWall]);

// --- Track spawned bodies ---
let spawnedBodies = [];
const portals = [];
const cannons = [];
const gravityWells = [];
let portalPairId = 0;

// --- Spawn Functions (labels added) ---
function spawnBall(x, y) {
  const ball = Bodies.circle(x, y, 30, { restitution: 0.9, friction: 0.01, render: { fillStyle: "#00ccff" }, label: "Ball" });
  World.add(world, ball);
  spawnedBodies.push(ball);
}
function spawnBox(x, y) {
  const box = Bodies.rectangle(x, y, 60, 60, {
    restitution: 0.9,
    friction: 0.02,
    render: {
      sprite: {
        texture: "Box.png",
        xScale: 0.15,
        yScale: 0.15
      }
    },
    label: "Box"
  });
  World.add(world, box);
  spawnedBodies.push(box);
}
function spawnTriangle(x, y) {
  const tri = Bodies.polygon(x, y, 3, 50, { restitution: 0.9, render: { fillStyle: "#ff6699" }, label: "Triangle" });
  World.add(world, tri);
  spawnedBodies.push(tri);
}
function spawnRod(x, y) {
  const rod = Bodies.rectangle(x, y, 300, 35, { restitution: 0.9, friction: 0.02, density: 0.004, render: { fillStyle: "#88ff88" }, label: "Rod" });
  World.add(world, rod);
  spawnedBodies.push(rod);
}
function spawnStar(x, y) {
  const star = Bodies.polygon(x, y, 5, 40, { restitution: 0.8, render: { fillStyle: "#ff33cc" }, label: "Star" });
  World.add(world, star);
  spawnedBodies.push(star);
}
function spawnHex(x, y) {
  const hex = Bodies.polygon(x, y, 6, 50, { restitution: 0.8, render: { fillStyle: "#33ffcc" }, label: "Hex" });
  World.add(world, hex);
  spawnedBodies.push(hex);
}
function spawnPlank(x, y) {
  const plank = Bodies.rectangle(x, y, 400, 20, { restitution: 0.6, render: { fillStyle: "#ffaa33" }, label: "Plank" });
  World.add(world, plank);
  spawnedBodies.push(plank);
}
function spawnMiniBall(x, y) {
  const small = Bodies.circle(x, y, 15, { restitution: 1.0, friction: 0, render: { fillStyle: "#ffffff" }, label: "MiniBall" });
  World.add(world, small);
  spawnedBodies.push(small);
}

// --- 💎 Quartz ---
function spawnQuartz(x, y) {
  const quartz = Bodies.polygon(x, y, 6, 40, {
    restitution: 0.4,
    friction: 0.7,
    density: 0.004,
    render: {
      sprite: {
        texture: "quartz.png", 
        xScale: 0.15,
        yScale: 0.15
      }
    },
    label: "Quartz",
  });
  World.add(world, quartz);
  spawnedBodies.push(quartz);
}

// --- 💡 Lamp ---
function spawnLamp(x, y) {
  const lamp = Bodies.rectangle(x, y, 60, 100, {
    restitution: 0.3,
    friction: 0.6,
    density: 0.003,
    render: {
      sprite: {
        texture: "lamp.png", 
        xScale: 0.2,
        yScale: 0.2
      }
    },
    label: "Lamp",
  });
  World.add(world, lamp);
  spawnedBodies.push(lamp);

  setInterval(() => {
    if (!spawnedBodies.includes(lamp)) return;
    const topX = lamp.position.x;
    const topY = lamp.position.y - 50;
    createFireCluster(topX, topY, 0.6);
  }, 500);
}

function spawnPortalPair(x, y) {
  const size = 42;
  let secondX = x + 260;
  if (secondX > canvas.width - 60) secondX = x - 260;
  if (secondX < 60) secondX = x + 260;

  const portalOpts = {
    isSensor: false,
    frictionAir: 0.02,
    friction: 0.02,
    restitution: 0.8,
    density: 0.0001,
    label: "Portal",
    render: {
      lineWidth: 4
    }
  };

  const bluePortal = Bodies.circle(x, y, size, {
    ...portalOpts,
    label: "PortalBlue",
    render: {
      ...portalOpts.render,
      fillStyle: "rgba(0,188,255,0.2)", // Sleeker translucency
      strokeStyle: "#00bcff"
    }
  });

  const orangePortal = Bodies.circle(secondX, y, size, {
    ...portalOpts,
    label: "PortalOrange",
    render: {
      ...portalOpts.render,
      fillStyle: "rgba(255,119,0,0.2)", // Sleeker translucency
      strokeStyle: "#ff7700"
    }
  });

  portalPairId += 1;
  bluePortal.pairId = portalPairId;
  orangePortal.pairId = portalPairId;
  bluePortal.pair = orangePortal;
  orangePortal.pair = bluePortal;

  World.add(world, [bluePortal, orangePortal]);
  spawnedBodies.push(bluePortal, orangePortal);
  portals.push(bluePortal, orangePortal);
}

function spawnCannon(x, y) {
  const cannon = Bodies.rectangle(x, y, 120, 40, {
    restitution: 0.6,
    friction: 0.5,
    frictionAir: 0.01,
    density: 0.001,
    render: {
      fillStyle: "rgba(0,0,0,0)",
      strokeStyle: "rgba(0,0,0,0)",
      lineWidth: 0
    },
    label: "Cannon"
  });

  cannon.isCannon = true;
  cannon.isLoading = false;
  cannon.loadingTarget = null;
  cannon.loadTimer = null;

  World.add(world, cannon);
  spawnedBodies.push(cannon);
  cannons.push(cannon);
}

function createBodyOfType(type, x, y) {
  switch (type.toLowerCase()) {
    case "box":
      return Bodies.rectangle(x, y, 60, 60, {
        restitution: 0.9,
        friction: 0.02,
        render: {
          sprite: {
            texture: "Box.png",
            xScale: 0.15,
            yScale: 0.15
          }
        },
        label: "Box"
      });
    case "ball":
      return Bodies.circle(x, y, 30, { restitution: 0.9, friction: 0.01, render: { fillStyle: "#00ccff" }, label: "Ball" });
    case "triangle":
      return Bodies.polygon(x, y, 3, 50, { restitution: 0.9, render: { fillStyle: "#ff6699" }, label: "Triangle" });
    case "rod":
      return Bodies.rectangle(x, y, 300, 35, { restitution: 0.9, friction: 0.02, density: 0.004, render: { fillStyle: "#88ff88" }, label: "Rod" });
    case "star":
      return Bodies.polygon(x, y, 5, 40, { restitution: 0.8, render: { fillStyle: "#ff33cc" }, label: "Star" });
    case "hex":
      return Bodies.polygon(x, y, 6, 50, { restitution: 0.8, render: { fillStyle: "#33ffcc" }, label: "Hex" });
    case "plank":
      return Bodies.rectangle(x, y, 400, 20, { restitution: 0.6, render: { fillStyle: "#ffaa33" }, label: "Plank" });
    case "miniball":
      return Bodies.circle(x, y, 15, { restitution: 1.0, friction: 0, render: { fillStyle: "#ffffff" }, label: "MiniBall" });
    case "torch":
      return Bodies.rectangle(x, y, 20, 120, {
        restitution: 0.3,
        friction: 0.6,
        density: 0.002,
        render: {
          sprite: {
            texture: "torch.png",
            xScale: 0.25,
            yScale: 0.25
          }
        },
        label: "Torch"
      });
    case "lamp":
      return Bodies.rectangle(x, y, 60, 100, {
        restitution: 0.3,
        friction: 0.6,
        density: 0.003,
        render: {
          sprite: {
            texture: "lamp.png",
            xScale: 0.2,
            yScale: 0.2
          }
        },
        label: "Lamp"
      });
    case "cannon":
      return Bodies.rectangle(x, y, 120, 40, {
        restitution: 0.6,
        friction: 0.5,
        frictionAir: 0.01,
        density: 0.001,
        render: {
          fillStyle: "rgba(0,0,0,0)",
          strokeStyle: "rgba(0,0,0,0)",
          lineWidth: 0
        },
        label: "Cannon",
        isCannon: true
      });
    case "encoder":
      return Bodies.rectangle(x, y, 80, 80, {
        restitution: 0.4,
        friction: 0.5,
        frictionAir: 0.02,
        density: 0.002,
        render: {
          fillStyle: "rgba(0,0,0,0)",
          strokeStyle: "rgba(0,0,0,0)",
          lineWidth: 0
        },
        label: "Encoder",
        isEncoder: true,
        code: ""
      });
    case "gravitywell":
      return Bodies.circle(x, y, 40, {
        restitution: 0.5,
        frictionAir: 0.06,
        friction: 0.3,
        density: 0.008,
        render: {
          fillStyle: "rgba(90, 0, 180, 0.0)",
          strokeStyle: "rgba(0,0,0,0)",
          lineWidth: 0
        },
        label: "GravityWell",
        isGravityWell: true
      });
    default:
      return null;
  }
}

function spawnEncoder(x, y) {
  const encoder = createBodyOfType("encoder", x, y);
  if (!encoder) return;
  encoder.isEncoder = true;
  encoder.code = "";
  World.add(world, encoder);
  spawnedBodies.push(encoder);
}

function spawnGravityWell(x, y) {
  const gravityWell = createBodyOfType("gravitywell", x, y);
  if (!gravityWell) return;
  gravityWell.pullStrength = 0.00032;
  gravityWell.gravityRadius = 280;
  gravityWell._pulsePhase = Math.random() * Math.PI * 2;
  World.add(world, gravityWell);
  spawnedBodies.push(gravityWell);
  gravityWells.push(gravityWell);
}

function teleportBody(body, fromPortal) {
  if (!fromPortal || !fromPortal.pair || body.isStatic || !body.position) return;
  if (body.label === "PortalBlue" || body.label === "PortalOrange") return;
  if (body._lastTeleportedPortal === fromPortal.pairId) return;

  const toPortal = fromPortal.pair;
  const angle = Math.atan2(body.position.y - fromPortal.position.y, body.position.x - fromPortal.position.x);
  const exitDistance = toPortal.circleRadius + 30;
  const destination = {
    x: toPortal.position.x + Math.cos(angle) * exitDistance,
    y: toPortal.position.y + Math.sin(angle) * exitDistance
  };

  Body.setPosition(body, destination);
  Body.setVelocity(body, body.velocity);
  body._lastTeleportedPortal = fromPortal.pairId;
  setTimeout(() => {
    if (body) body._lastTeleportedPortal = null;
  }, 120);
}

function startCannonLoad(cannon, target) {
  if (cannon.isLoading || cannon.label !== "Cannon" || !target || target.isStatic) return;

  cannon.isLoading = true;
  cannon.loadingTarget = target;

  cannon.loadTimer = setTimeout(() => {
    if (!spawnedBodies.includes(cannon) || !spawnedBodies.includes(target)) {
      cannon.isLoading = false;
      cannon.loadingTarget = null;
      return;
    }
    shootCannon(cannon, target);
  }, 2000);
}

function shootCannon(cannon, target) {
  if (!spawnedBodies.includes(cannon) || !spawnedBodies.includes(target)) {
    cannon.isLoading = false;
    cannon.loadingTarget = null;
    return;
  }

  const dx = mouse.position.x - cannon.position.x;
  const dy = mouse.position.y - cannon.position.y;
  const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
  const force = {
    x: (dx / dist) * 0.1,
    y: (dy / dist) * 0.1
  };

  Body.applyForce(target, target.position, force);
  cannon.isLoading = false;
  cannon.loadingTarget = null;
}

// --- Mouse Control ---
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
World.add(world, mouseConstraint);
render.mouse = mouse;

const encoderTextInput = document.getElementById('encoder-console-input');
const isTypingMode = () => {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
};

let dragStart = null;
let dragBody = null;
Events.on(mouseConstraint, "startdrag", e => { dragBody = e.body; dragStart = { ...mouse.position }; });
Events.on(mouseConstraint, "enddrag", e => {
  if (dragBody) {
    const dragEnd = { ...mouse.position };
    const dir = Vector.sub(dragEnd, dragStart);
    const distance = Vector.magnitude(dir);
    if (distance > 10) {
      const normalized = Vector.normalise(dir);
      const power = Math.min(distance * 0.0004, 0.02);
      const force = Vector.mult(normalized, power);
      Body.applyForce(dragBody, dragBody.position, force);
    }
  }
  dragBody = null;
  dragStart = null;
});

// --- Spawn Hotkeys ---
document.addEventListener("keydown", e => {
  if (isTypingMode()) return;
  const k = e.key.toLowerCase();
  if (k === "1") spawnBall(mouse.position.x, mouse.position.y);
  if (k === "2") spawnBox(mouse.position.x, mouse.position.y);
  if (k === "3") spawnTriangle(mouse.position.x, mouse.position.y);
  if (k === "4") spawnRod(mouse.position.x, mouse.position.y);
  if (k === "5") spawnStar(mouse.position.x, mouse.position.y);
  if (k === "6") spawnHex(mouse.position.x, mouse.position.y);
  if (k === "7") spawnPlank(mouse.position.x, mouse.position.y);
  if (k === "8") spawnMiniBall(mouse.position.x, mouse.position.y);
});

// --- Delete Menu ---
const delLastBtn = document.getElementById("delLast");
const delAllBtn = document.getElementById("delAll");
const delModeBtn = document.getElementById("delMode");
let deleteMode = false;
delLastBtn.onclick = () => { const last = spawnedBodies.pop(); if (last) World.remove(world, last); };
delAllBtn.onclick = () => window.location.reload();
delModeBtn.onclick = () => { deleteMode = !deleteMode; delModeBtn.textContent = `Delete Mode: ${deleteMode ? "ON" : "OFF"}`; };
Events.on(mouseConstraint, "mousedown", e => {
  if (deleteMode && e.body && !e.body.isStatic) {
    World.remove(world, e.body);
    spawnedBodies = spawnedBodies.filter(b => b !== e.body);
  }
});

// --- 🔥 FIRE SYSTEM (with soft glow) ---
const fires = [];
const burningBodies = new Set();

function createFireCluster(x, y, sizeFactor = 1) {
  for (let i = 0; i < 8; i++) {
    fires.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      size: (Math.random() * 10 + 15) * sizeFactor,
      life: 1,
      rise: 1.8 + Math.random() * 1.8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
    });
  }
}

(function animateFire() {
  requestAnimationFrame(animateFire);
  const ctx = render.context;
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = fires.length - 1; i >= 0; i--) {
    const f = fires[i];
    f.y -= f.rise;
    f.rotation += f.rotSpeed;
    f.life -= 0.014;
    const alpha = Math.max(f.life, 0);

    const grad = ctx.createLinearGradient(f.x, f.y + f.size, f.x, f.y - f.size);
    grad.addColorStop(0, "rgba(255,50,0,0.9)"); // Tailored neon plasma profile
    grad.addColorStop(1, "rgba(255,150,0,0.05)");
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grad;
    ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (f.life <= 0) fires.splice(i, 1);
  }

  ctx.restore();
})();

let mouseX = 0, mouseY = 0;

window.addEventListener("mousemove", (e) => {
  const rect = render.canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

window.addEventListener("keydown", (e) => {
  if (isTypingMode()) return;
  if (e.key.toLowerCase() === 's') {
    createFireCluster(mouseX, mouseY, 1);
  }
});

function igniteNearbyBodies() {
  for (const body of spawnedBodies) {
    if (body.isStatic || !body.position) continue;
    if (burningBodies.has(body)) continue;
    if (!body.burnable && body.label !== "Box" && body.label !== "Plank") continue;

    for (const fire of fires) {
      const dx = fire.x - body.position.x;
      const dy = fire.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 60) igniteBody(body);
    }
  }
}
setInterval(igniteNearbyBodies, 100);

canvas.addEventListener("dblclick", (e) => {
  const mousePos = { x: e.clientX, y: e.clientY };
  const found = Matter.Query.point(spawnedBodies, mousePos);
  if (found.length > 0) {
    selectedBody = found[0];
    showProperties(selectedBody);
  }
});

function showProperties(body) {
  document.getElementById("no-selection").style.display = "none";
  document.getElementById("prop-panel").style.display = "block";
  document.getElementById("prop-label").value = body.label || "";
  document.getElementById("prop-density").value = body.density || 0;
  document.getElementById("prop-friction").value = body.friction || 0;
  document.getElementById("prop-burn").checked = !!body.burnable;
}

document.getElementById("apply-props").addEventListener("click", () => {
  if (!selectedBody) return;
  selectedBody.label = document.getElementById("prop-label").value;
  selectedBody.friction = parseFloat(document.getElementById("prop-friction").value) || selectedBody.friction;
  selectedBody.burnable = document.getElementById("prop-burn").checked;
  Matter.Body.setDensity(selectedBody, parseFloat(document.getElementById("prop-density").value) || selectedBody.density);
});

function igniteBody(body) {
  if (burningBodies.has(body)) return;
  burningBodies.add(body);

  const burnInterval = setInterval(() => {
    if (!spawnedBodies.includes(body)) {
      clearInterval(burnInterval);
      burningBodies.delete(body);
      return;
    }
    createFireCluster(body.position.x, body.position.y - 30, 0.8);
  }, 200);

  setTimeout(() => {
    clearInterval(burnInterval);
    burningBodies.delete(body);
    turnToAsh(body);
  }, 10000);
}

function turnToAsh(body) {
  if (!spawnedBodies.includes(body)) return;

  const width = body.bounds.max.x - body.bounds.min.x;
  const height = body.bounds.max.y - body.bounds.min.y;

  const ash = Bodies.rectangle(
    body.position.x,
    body.position.y,
    width,
    height,
    {
      restitution: 0.2,
      friction: 0.8,
      density: 0.0005,
      label: "Ash",
      render: {
        sprite: {
          texture: "Ash.png",  
          xScale: width / 512,         
          yScale: height / 512
        }
      }
    }
  );

  World.remove(world, body);
  World.add(world, ash);
  spawnedBodies = spawnedBodies.filter(b => b !== body);
  spawnedBodies.push(ash);
}

Events.on(engine, "collisionStart", e => {
  for (const pair of e.pairs) {
    const { bodyA, bodyB, collision } = pair;

    const checkPortal = (portalBody, otherBody) => {
      if (portalBody.label !== "PortalBlue" && portalBody.label !== "PortalOrange") return;
      if (otherBody.isStatic) return;
      if (otherBody.label === "PortalBlue" || otherBody.label === "PortalOrange") return;
      teleportBody(otherBody, portalBody);
    };

    const checkCannon = (cannonBody, otherBody) => {
      if (cannonBody.label !== "Cannon") return;
      if (otherBody.isStatic) return;
      if (otherBody.label === "Cannon") return;
      startCannonLoad(cannonBody, otherBody);
    };

    checkPortal(bodyA, bodyB);
    checkPortal(bodyB, bodyA);
    checkCannon(bodyA, bodyB);
    checkCannon(bodyB, bodyA);

    [bodyA, bodyB].forEach(b => {
      if (b.label === "Ash" && collision.depth > 5) crumbleAsh(b);
    });
  }
});

Events.on(engine, "afterUpdate", () => {
  for (const well of gravityWells) {
    if (!spawnedBodies.includes(well)) continue;
    const radius = well.gravityRadius || 200;
    for (const body of spawnedBodies) {
      if (body === well || body.isStatic || body.isGravityWell || body.isEncoder) continue;
      if (!body.position) continue;
      const dx = well.position.x - body.position.x;
      const dy = well.position.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 10) {
        const strength = well.pullStrength * (1 - dist / radius);
        Body.applyForce(body, body.position, { x: dx / dist * strength, y: dy / dist * strength });
      }
    }
  }
});

function crumbleAsh(ash) {
  if (!spawnedBodies.includes(ash)) return;
  const x = ash.position.x, y = ash.position.y;
  World.remove(world, ash);
  spawnedBodies = spawnedBodies.filter(b => b !== ash);

  for (let i = 0; i < 8; i++) {
    const size = 8 + Math.random() * 4;
    const frag = Bodies.rectangle(
      x + (Math.random() - 0.5) * 40,
      y + (Math.random() - 0.5) * 20,
      size,
      size,
      {
        restitution: 0.6,
        friction: 0.9,
        density: 0.0003,
        render: {
          fillStyle: "#334155",
          opacity: 1, 
        },
        label: "AshFragment",
      }
    );

    const forceMagnitude = 0.0005 + Math.random() * 0.0001;
    const angle = Math.random() * Math.PI * 2; 
    Body.applyForce(frag, frag.position, {
      x: Math.cos(angle) * forceMagnitude,
      y: Math.sin(angle) * forceMagnitude,
    });

    World.add(world, frag);
    spawnedBodies.push(frag);

    const fadeDuration = 10000; 
    const fadeStep = 100; 
    let elapsed = 0;

    const fadeInterval = setInterval(() => {
      elapsed += fadeStep;
      const alpha = Math.max(1 - elapsed / fadeDuration, 0);
      frag.render.opacity = alpha;

      if (alpha <= 0) {
        clearInterval(fadeInterval);
        World.remove(world, frag);
        spawnedBodies = spawnedBodies.filter(b => b !== frag);
      }
    }, fadeStep);
  }
}

// --- 🔦 TORCH SYSTEM ---
const torches = [];

function spawnTorch(x, y) {
  const torch = Bodies.rectangle(x, y, 20, 120, {
    restitution: 0.3,
    friction: 0.6,
    density: 0.002,
    render: {
      fillStyle: "rgba(0,0,0,0)",
      strokeStyle: "rgba(0,0,0,0)",
      lineWidth: 0,
    },
    label: "Torch",
  });

  World.add(world, torch);
  spawnedBodies.push(torch);
  torches.push(torch);

  const fireInterval = setInterval(() => {
    if (!spawnedBodies.includes(torch)) {
      clearInterval(fireInterval);
      return;
    }

    const topOffset = Vector.rotate({ x: 0, y: -60 }, torch.angle);
    const topX = torch.position.x + topOffset.x;
    const topY = torch.position.y + topOffset.y;

    createFireCluster(topX, topY, 1.2);
  }, 250);
}

document.addEventListener("keydown", e => {
  if (isTypingMode()) return;
  if (e.key.toLowerCase() === "t") {
    createFireCluster(mouse.position.x, mouse.position.y, 1.4);
  }
});

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (key === "p") {
    if (!isTypingMode()) spawnPortalPair(mouse.position.x, mouse.position.y);
  }
  if (key === "g") {
    if (!isTypingMode()) spawnCannon(mouse.position.x, mouse.position.y);
  }
  if (key === "m") {
    if (selectedEncoder) {
      // Check if the encoder has a .summonai(){} command
      if (selectedEncoder.code && /\.summonai\s*\(\s*\)\s*\{/.test(selectedEncoder.code)) {
        fireSummonAI(selectedEncoder);
      } else {
        fireEncoderBeam(selectedEncoder);
      }
    }
  }
});

document.addEventListener("keydown", e => {
  if (dragBody === null) return; 
  
  const rotationAmount = 0.1; 
  
  if (e.key === "ArrowLeft") {
    Body.rotate(dragBody, -rotationAmount); 
  }
  if (e.key === "ArrowRight") {
    Body.rotate(dragBody, rotationAmount); 
  }
});

// --- TNT ARRAY ---
let spawnedTNTs = [];

function spawnTNT(x, y) {
  try {
    const tnt = Bodies.rectangle(x, y, 45, 45, {
      label: "TNT",
      restitution: 0.4,
      friction: 0.6,
      render: {
        fillStyle: "#991b1b",
        strokeStyle: "#f87171",
        lineWidth: 2
      }
    });
    tnt.isTNT = true;
    World.add(world, tnt);
    spawnedBodies.push(tnt);
    spawnedTNTs.push(tnt);
  } catch(err) {
    console.warn("TNT spawn error:", err);
  }
}

document.addEventListener("keydown", e => {
  if (isTypingMode()) return;
  if (e.key.toLowerCase() === "x") {
    spawnTNT(mouse.position.x, mouse.position.y);
  }
});

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "e") {
    if (spawnedTNTs.length === 0) return;

    const nearestTNT = spawnedTNTs[spawnedTNTs.length - 1];

    createFireCluster(nearestTNT.position.x, nearestTNT.position.y, 1.4);

    const ctx = render.context;
    ctx.font = "bold 18px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#ff4444";
    ctx.fillText("💥 FUSE LIT! GET BACK!", nearestTNT.position.x - 60, nearestTNT.position.y - 60);

    setTimeout(() => explodeTNT(nearestTNT), 2500);
  }
});

function explodeTNT(tnt) {
  const x = tnt.position.x;
  const y = tnt.position.y;
  const radius = 300;

  World.remove(world, tnt);
  spawnedBodies = spawnedBodies.filter(b => b !== tnt);
  spawnedTNTs   = spawnedTNTs.filter(b => b !== tnt);

  for (let i = 0; i < 40; i++) createFireCluster(x, y, 2.2);

  let shakeFrames = 18, shakeMag = 10;
  const origTransform = render.canvas.style.transform;
  (function shake() {
    if (shakeFrames-- <= 0) { render.canvas.style.transform = origTransform; return; }
    const sx = (Math.random() - 0.5) * shakeMag;
    const sy = (Math.random() - 0.5) * shakeMag;
    shakeMag *= 0.88;
    render.canvas.style.transform = `translate(${sx}px,${sy}px)`;
    requestAnimationFrame(shake);
  })();

  const flashDiv = document.createElement('div');
  Object.assign(flashDiv.style, {
    position: 'fixed', inset: '0', zIndex: '9999', pointerEvents: 'none',
    background: 'radial-gradient(circle at ' + (x/canvas.width*100) + '% ' + ((y+60)/window.innerHeight*100) + '%, rgba(0,212,255,0.4) 0%, rgba(155,89,182,0.2) 45%, transparent 75%)',
    transition: 'opacity 0.55s ease-out', opacity: '1'
  });
  document.body.appendChild(flashDiv);
  requestAnimationFrame(() => requestAnimationFrame(() => { flashDiv.style.opacity = '0'; }));
  setTimeout(() => flashDiv.remove(), 700);

  const ctx = render.context;
  const waves = [
    { r: 0, maxR: radius * 1.05, speed: 22, lw: 10, color: [0, 188, 255],  alpha: 0.95 }, // Cyan/purple energy wave profiles
    { r: 0, maxR: radius * 0.78, speed: 17, lw: 7,  color: [155, 89, 182],  alpha: 0.75 },
    { r: 0, maxR: radius * 0.55, speed: 13, lw: 5,  color: [255, 255, 255], alpha: 0.60 },
  ];

  function animateExplosion() {
    let allDone = true;
    ctx.save();
    for (const w of waves) {
      if (w.r >= w.maxR) continue;
      allDone = false;
      w.r += w.speed;
      const progress = w.r / w.maxR;
      const alpha = w.alpha * (1 - progress * progress);

      ctx.beginPath();
      ctx.arc(x, y, w.r, 0, Math.PI * 2);
      ctx.lineWidth = w.lw * (1 - progress * 0.5) + 2;
      ctx.strokeStyle = `rgba(${w.color[0]},${w.color[1]},${w.color[2]},${alpha})`;
      ctx.shadowColor  = `rgba(${w.color[0]},${w.color[1]},${w.color[2]},${alpha * 0.6})`;
      ctx.shadowBlur   = 18;
      ctx.stroke();
      ctx.shadowBlur   = 0;
    }

    if (waves[0].r < waves[0].maxR * 0.4) {
      for (let i = 0; i < 5; i++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkR = waves[0].r * (0.5 + Math.random() * 0.5);
        const sx2 = x + Math.cos(sparkAngle) * sparkR;
        const sy2 = y + Math.sin(sparkAngle) * sparkR;
        const sparkAlpha = 0.8 - waves[0].r / waves[0].maxR;
        ctx.beginPath();
        ctx.arc(sx2, sy2, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,188,255,${sparkAlpha})`;
        ctx.fill();
      }
    }

    const smokeProgress = Math.max(0, (waves[0].r / waves[0].maxR - 0.3) / 0.7);
    if (smokeProgress > 0 && smokeProgress < 1) {
      const smokeGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.6 * smokeProgress);
      smokeGrad.addColorStop(0,   `rgba(15,23,42,${0.28 * (1 - smokeProgress)})`);
      smokeGrad.addColorStop(0.6, `rgba(30,41,59,${0.14 * (1 - smokeProgress)})`);
      smokeGrad.addColorStop(1,   `rgba(0,0,0,0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6 * smokeProgress, 0, Math.PI * 2);
      ctx.fillStyle = smokeGrad;
      ctx.fill();
    }

    ctx.restore();
    if (!allDone) requestAnimationFrame(animateExplosion);
  }
  animateExplosion();

  for (const body of spawnedBodies) {
    if (body === tnt) continue;
    const dx = body.position.x - x;
    const dy = body.position.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
      const forceMag = Math.max(0, 0.6 * (1 - dist / radius));
      const angle = Math.atan2(dy, dx);
      Body.applyForce(body, body.position, {
        x: Math.cos(angle) * forceMag,
        y: Math.sin(angle) * forceMag - 0.025
      });
    }
  }

  for (const body of spawnedBodies) {
    const dx = body.position.x - x;
    const dy = body.position.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 220 && (body.label === "Box" || body.label === "Plank")) {
      igniteBody(body);
    }
  }
}

// --- 🪢 Rope Physics ---
const { Constraint, Query } = Matter;
let ropeMode = false;
let ropeStart = null;
let ropes = [];
let highlightBody = null;

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (key === "q") {
    ropeMode = !ropeMode;
    ropeStart = null;
    highlightBody = null;
  }

  if (key === "r") {
    if (ropes.length > 0) {
      const mousePos = mouse.position;
      let nearestRope = null;
      let nearestDist = Infinity;

      for (const rope of ropes) {
        for (const seg of rope.segments) {
          const dx = seg.position.x - mousePos.x;
          const dy = seg.position.y - mousePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestRope = rope;
          }
        }
      }

      if (nearestRope && nearestDist < 100) removeRope(nearestRope);
      else removeRope(ropes[ropes.length - 1]);
    }
  }
});

function removeRope(rope) {
  for (const seg of rope.segments) World.remove(world, seg);
  for (const c of rope.constraints) World.remove(world, c);
  ropes = ropes.filter(r => r !== rope);
}

Events.on(mouseConstraint, "mousedown", () => {
  if (!ropeMode) return;
  const mousePos = mouse.position;
  const found = Query.point(spawnedBodies, mousePos);
  if (found.length > 0) {
    const body = found[0];
    if (!ropeStart) {
      ropeStart = body;
    } else if (body !== ropeStart) {
      createRealRope(ropeStart, body);
      ropeStart = null;
    }
  }
});

Events.on(mouseConstraint, "startdrag", () => {
  if (ropeMode) {
    setTimeout(() => { mouseConstraint.body = null; }, 0);
  }
});

Events.on(render, "beforeRender", () => {
  if (!ropeMode) {
    highlightBody = null;
    return;
  }
  const found = Query.point(spawnedBodies, mouse.position);
  highlightBody = found.length > 0 ? found[0] : null;
});

function createRealRope(bodyA, bodyB, segments = 15) {
  const ropeSegments = [];
  const constraints = [];

  const start = bodyA.position;
  const end = bodyB.position;
  const dx = (end.x - start.x) / (segments + 1);
  const dy = (end.y - start.y) / (segments + 1);
  const segmentLength = Math.sqrt(dx * dx + dy * dy);

  for (let i = 0; i < segments; i++) {
    const link = Bodies.circle(start.x + dx * (i + 1), start.y + dy * (i + 1), 3, {
      friction: 0.8,
      restitution: 0,
      mass: 0.1,
      density: 0.005,
      collisionFilter: { group: -1 },
      render: { fillStyle: "#00bcff" } // Neon tether node style
    });
    ropeSegments.push(link);
    World.add(world, link);
  }

  const makeConstraint = (A, B) => Constraint.create({
    bodyA: A,
    bodyB: B,
    length: segmentLength,
    stiffness: 1,      
    damping: 0.2,      
    render: { visible: false }
  });

  constraints.push(makeConstraint(bodyA, ropeSegments[0]));

  for (let i = 0; i < ropeSegments.length - 1; i++) {
    constraints.push(makeConstraint(ropeSegments[i], ropeSegments[i + 1]));
  }

  constraints.push(makeConstraint(ropeSegments[ropeSegments.length - 1], bodyB));

  for (const c of constraints) World.add(world, c);

  ropes.push({ bodyA, bodyB, segments: ropeSegments, constraints });
}

Events.on(engine, "afterUpdate", () => {
  for (let i = ropes.length - 1; i >= 0; i--) {
    const rope = ropes[i];
    if (!world.bodies.includes(rope.bodyA) || !world.bodies.includes(rope.bodyB)) {
      removeRope(rope);
    }
  }
});

Events.on(render, "afterRender", () => {
  const ctx = render.context;
  const now = performance.now() / 1000;
  ctx.save();

  for (const rope of ropes) {
    const pts = [rope.bodyA.position, ...rope.segments.map(s => s.position), rope.bodyB.position];
    if (pts.length < 2) continue;

    // --- Outer glow pass ---
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = 'rgba(0,188,255,0.18)';
    ctx.lineWidth = 9;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // --- Core animated rope ---
    const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length-1].x, pts[pts.length-1].y);
    const t = (Math.sin(now * 2) + 1) / 2; // 0..1 oscillating
    grad.addColorStop(0,   `rgba(0,${150 + (t * 80)|0},255,0.95)`);
    grad.addColorStop(0.4, `rgba(120,60,255,0.85)`);
    grad.addColorStop(0.7, `rgba(200,80,255,0.85)`);
    grad.addColorStop(1,   `rgba(255,${100 + ((1-t)*100)|0},50,0.9)`);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0,188,255,0.6)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- Energy pulses travelling along rope ---
    const totalPts = pts.length;
    for (let pulse = 0; pulse < 2; pulse++) {
      const pFrac = ((now * 0.5 + pulse * 0.5) % 1);
      const pIdx = pFrac * (totalPts - 1);
      const pLow = Math.floor(pIdx);
      const pHigh = Math.min(pLow + 1, totalPts - 1);
      const pT = pIdx - pLow;
      const px = pts[pLow].x + (pts[pHigh].x - pts[pLow].x) * pT;
      const py = pts[pLow].y + (pts[pHigh].y - pts[pLow].y) * pT;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = pulse === 0 ? 'rgba(0,230,255,0.95)' : 'rgba(200,100,255,0.95)';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // --- Anchor indicators at endpoints ---
    for (const ep of [pts[0], pts[pts.length - 1]]) {
      const aAlpha = 0.4 + Math.sin(now * 3) * 0.2;
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,188,255,${aAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,220,255,${0.7 + aAlpha * 0.3})`;
      ctx.fill();
    }
  }

  // Rope mode highlight
  if (highlightBody) {
    const b = highlightBody.bounds;
    const hAlpha = 0.5 + Math.sin(now * 6) * 0.3;
    ctx.strokeStyle = ropeStart ? `rgba(255,120,0,${hAlpha})` : `rgba(0,188,255,${hAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.strokeRect(b.min.x - 3, b.min.y - 3, b.max.x - b.min.x + 6, b.max.y - b.min.y + 6);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
});

// --- 🔩 SCREW SYSTEM ---
let screwMode = false;
let screws = []; 

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (key === "z") {
    screwMode = !screwMode;

    if (screwMode && mouseConstraint.body && !mouseConstraint.body.isStatic) {
      const target = mouseConstraint.body;
      const pos = { x: mouse.position.x, y: mouse.position.y };

      const screw = Bodies.circle(pos.x, pos.y, 15, {
        isStatic: true,
        render: {
          sprite: {
            texture: "Screw.png", 
            xScale: 0.1,
            yScale: 0.1,
          }
        },
        label: "Screw"
      });
      World.add(world, screw);

      Body.setStatic(target, true);

      screws.push({ screw, target });
      screwMode = false; 
    }
  }

  if (key === "c") {
    const mousePos = mouse.position;
    for (let i = screws.length - 1; i >= 0; i--) {
      const { screw, target } = screws[i];
      const dx = mousePos.x - screw.position.x;
      const dy = mousePos.y - screw.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40) {
        World.remove(world, screw);
        Body.setStatic(target, false);
        screws.splice(i, 1);

        const ctx = render.context;
        ctx.save();
        ctx.strokeStyle = "#00bcff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
});

Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.save();
  for (const { screw } of screws) {
    ctx.beginPath();
    ctx.arc(screw.position.x, screw.position.y, 16, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,188,255,0.4)";
    ctx.stroke();
  }
  ctx.restore();
});

/* =========================
   FULL UI + OBJECT + CONSOLE SYSTEM
========================= */

const uiMenuBtn = document.getElementById('uiMenuBtn');
const sidebar = document.getElementById('sidebar');
const uiHint = document.getElementById('uiHint');

uiMenuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebar.setAttribute('aria-hidden', !sidebar.classList.contains('open'));
  uiHint.classList.toggle('visible', sidebar.classList.contains('open'));
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
  });
});

document.querySelectorAll('.object-item').forEach(item => {
  item.addEventListener('dragstart', ev => {
    ev.dataTransfer.setData('text/plain', item.dataset.type);
    try {
      const crt = item.cloneNode(true);
      crt.style.position = "absolute";
      crt.style.top = "-1000px";
      crt.style.left = "-1000px";
      document.body.appendChild(crt);
      ev.dataTransfer.setDragImage(crt, 10, 10);
      setTimeout(() => crt.remove(), 0);
    } catch(e){}
  });
});

canvas.addEventListener('dragover', ev => ev.preventDefault());
canvas.addEventListener('drop', ev => {
  ev.preventDefault();
  const type = ev.dataTransfer.getData('text/plain');
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  spawnFromType(type, x, y);
});

const encoderRunBtn = document.getElementById('encoder-console-run');
if (encoderRunBtn) {
  encoderRunBtn.addEventListener('click', saveEncoderCommand);
}

const autofillButtons = document.querySelectorAll('.autofill-btn');
autofillButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById('encoder-console-input');
    if (!input) return;
    input.value = btn.textContent;
    input.focus();
  });
});

/* =========================
   SPAWN OBJECTS
========================= */
function spawnFromType(type, x, y) {
  switch(type){
    case 'box': spawnBox(x,y); break;
    case 'ball': spawnBall(x,y); break;
    case 'triangle': spawnTriangle(x,y); break;
    case 'rod': spawnRod(x,y); break;
    case 'star': spawnStar(x,y); break;
    case 'hex': spawnHex(x,y); break;
    case 'plank': spawnPlank(x,y); break;
    case 'miniball': spawnMiniBall(x,y); break;
    case 'tnt': spawnTNT(x, y); break;
    case 'torch': spawnTorch(x,y); break;
    case 'lamp': spawnLamp(x,y); break;
    case 'portal': spawnPortalPair(x,y); break;
    case 'cannon': spawnCannon(x,y); break;
    case 'encoder': spawnEncoder(x,y); break;
    case 'gravitywell': spawnGravityWell(x,y); break;
    default: spawnBall(x,y);
  }
}

/* =========================
   OBJECT SELECTION & PROPERTIES
========================= */
let selectedBody=null, previousSelected=null, selectedEncoder=null;
let encoderBeam = null;

function clearSelectionStyle(body){
  if(!body || !body.render) return;
  delete body.render.strokeStyle;
  delete body.render.lineWidth;
}

render.canvas.addEventListener('dblclick', ev => {
  const rect = render.canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  const found = Query.point(spawnedBodies,{x,y})||[];
  if(found.length>0){
    if(previousSelected && previousSelected!==found[0]) clearSelectionStyle(previousSelected);
    selectedBody=found[0]; previousSelected=selectedBody;
    if(!selectedBody.render) selectedBody.render={};
    selectedBody.render.strokeStyle='#00bcff'; selectedBody.render.lineWidth=4; // Matching portal blue anchor
    if (selectedBody.isEncoder) {
      showConsole(selectedBody);
    } else {
      showProperties(selectedBody);
    }
  } else {
    if(previousSelected) clearSelectionStyle(previousSelected);
    previousSelected=null; selectedBody=null;
    selectedEncoder=null;
    hideProperties();
    hideConsole();
  }
});

function showProperties(body){
  selectedEncoder = null;
  hideConsole();
  document.querySelector('[data-tab="properties"]').click();
  document.getElementById('no-selection').style.display='none';
  document.getElementById('prop-panel').style.display='block';
  document.getElementById('prop-label').value=body.label||'';
  document.getElementById('prop-density').value=(typeof body.density==='number')?body.density.toFixed(3):(body.mass?body.mass.toFixed(3):'0.001');
  document.getElementById('prop-friction').value=(typeof body.friction==='number')?body.friction.toFixed(3):'0.1';
  document.getElementById('prop-burn').checked=!!body.isBurnable;
  sidebar.classList.add('open'); sidebar.setAttribute('aria-hidden','false'); uiHint.classList.add('visible');
}

function hideProperties(){
  document.getElementById('no-selection').style.display='block';
  document.getElementById('prop-panel').style.display='none';
}

function showConsole(body) {
  selectedEncoder = body;
  selectedBody = body;
  document.querySelector('[data-tab="console"]').click();
  document.getElementById('encoder-console-input').value = body.code || '';
  document.getElementById('console-feedback').textContent = 'Press M to execute compiler beam payload at an object.';
  sidebar.classList.add('open'); sidebar.setAttribute('aria-hidden','false'); uiHint.classList.add('visible');
}

function hideConsole() {
  document.getElementById('encoder-console-input').value = '';
  document.getElementById('console-feedback').textContent = '';
}

function saveEncoderCommand() {
  if (!selectedEncoder) return;
  const commandText = document.getElementById('encoder-console-input').value.trim();
  selectedEncoder.code = commandText;
  document.getElementById('console-feedback').textContent = commandText ? 'Command string cached successfully.' : 'Encoder instructions cleared.';
}

function parseEncoderCommand(command) {
  const trimmed = command.trim();
  const match = trimmed.match(/^\s*\.([a-zA-Z]+)\s*\(\s*([^)]*)\s*\)\s*$/);
  if (!match) return null;
  const name = match[1].toLowerCase();
  const argsString = match[2].trim();
  const args = argsString.length === 0 ? [] : argsString.split(',').map(arg => {
    const clean = arg.trim();
    if (/^[-+]?\d*\.?\d+$/.test(clean)) return parseFloat(clean);
    if (/^(true|false)$/i.test(clean)) return clean.toLowerCase() === 'true';
    return clean.replace(/^['"]|['"]$/g, '');
  });
  return { name, args };
}

function getPropertyValue(target, key) {
  const name = String(key).trim().toLowerCase();
  switch (name) {
    case 'burnable':
      return !!target.isBurnable;
    case 'burning':
      return burningBodies.has(target);
    case 'density':
      return typeof target.density === 'number' ? target.density : 0;
    case 'name':
    case 'label':
      return target.label || '';
    case 'friction':
      return typeof target.friction === 'number' ? target.friction : 0;
    case 'mass':
      return typeof target.mass === 'number' ? target.mass : 0;
    case 'angle':
      return typeof target.angle === 'number' ? target.angle : 0;
    case 'velocityx':
      return (target.velocity && target.velocity.x) || 0;
    case 'velocityy':
      return (target.velocity && target.velocity.y) || 0;
    case 'isstatic':
      return !!target.isStatic;
    case 'area':
      return target.area || 0;
    case 'x':
      return target.position ? target.position.x : 0;
    case 'y':
      return target.position ? target.position.y : 0;
    default:
      return null;
  }
}

function evaluateExpression(target, expr) {
  const trimmed = expr.trim();
  const cmpMatch = trimmed.match(/^(.*?)(==|!=|>=|<=|>|<)(.*)$/);
  if (cmpMatch) {
    const left = evaluateExpression(target, cmpMatch[1]);
    const operator = cmpMatch[2];
    const right = evaluateExpression(target, cmpMatch[3]);
    switch (operator) {
      case '==': return left === right;
      case '!=': return left !== right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '<': return left < right;
    }
  }

  if (/^\s*\.get\s*\(\s*([^)]*)\s*\)\s*$/i.test(trimmed)) {
    return getPropertyValue(target, trimmed.match(/^\s*\.get\s*\(\s*([^)]*)\s*\)\s*$/i)[1]);
  }
  if (/^['"].*['"]$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase() === 'true';
  }
  if (/^[-+]?\d*\.?\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  return trimmed;
}

function readBalanced(code, index, openChar, closeChar) {
  if (code[index] !== openChar) return null;
  let depth = 0;
  let i = index;
  for (; i < code.length; i++) {
    if (code[i] === openChar) depth += 1;
    if (code[i] === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return { text: code.slice(index + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function normalizeIndent(line) {
  return line.replace(/\t/g, '    ');
}

function parseIndentationStyle(code) {
  const lines = code.replace(/\r\n/g, '\n').split('\n').map(line => {
    const normalized = normalizeIndent(line);
    const indentMatch = normalized.match(/^( *)/);
    return {
      raw: line,
      text: normalized.trimEnd(),
      indent: indentMatch ? indentMatch[1].length : 0,
    };
  }).filter(line => line.text.trim().length > 0);

  function parseBlock(startIndex, minIndent) {
    const statements = [];
    let i = startIndex;

    while (i < lines.length) {
      const { indent, text } = lines[i];
      if (indent < minIndent) break;
      if (indent > minIndent) break;

      const trimmed = text.trim();
      const ifMatch = trimmed.match(/^if\s*\(?\s*(.*?)\s*\)?\s*:?\s*$/i);
      if (ifMatch) {
        const condition = ifMatch[1].trim();
        const thenStart = i + 1;
        const thenIndent = thenStart < lines.length ? lines[thenStart].indent : Infinity;
        let thenBody = [];
        let elseBody = null;
        let nextIndex = thenStart;

        if (thenStart < lines.length && thenIndent > indent) {
          const parsedThen = parseBlock(thenStart, thenIndent);
          thenBody = parsedThen.statements;
          nextIndex = parsedThen.next;
        }

        if (nextIndex < lines.length) {
          const nextLine = lines[nextIndex];
          if (nextLine.indent === indent && /^else\s*:?\s*$/i.test(nextLine.text.trim())) {
            const elseStart = nextIndex + 1;
            const elseIndent = elseStart < lines.length ? lines[elseStart].indent : Infinity;
            if (elseStart < lines.length && elseIndent > indent) {
              const parsedElse = parseBlock(elseStart, elseIndent);
              elseBody = parsedElse.statements;
              nextIndex = parsedElse.next;
            } else {
              elseBody = [];
              nextIndex = elseStart;
            }
          }
        }

        statements.push({ type: 'if', condition, thenBody, elseBody });
        i = nextIndex;
        continue;
      }

      statements.push({ type: 'command', text: trimmed.replace(/;\s*$/, '') });
      i += 1;
    }

    return { statements, next: i };
  }

  return parseBlock(0, 0).statements;
}

function isIndentationStyle(code) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    return /^if\s*\(.*\)\s*:?\s*$/i.test(trimmed) && !trimmed.includes('{');
  });
}

function parseBracketProgram(code) {
  const statements = [];
  let i = 0;
  while (i < code.length) {
    while (i < code.length && /\s/.test(code[i])) i += 1;
    if (i >= code.length) break;

    if (code.slice(i, i + 2).toLowerCase() === 'if') {
      i += 2;
      while (i < code.length && /\s/.test(code[i])) i += 1;
      const condition = readBalanced(code, i, '(', ')');
      if (!condition) break;
      i = condition.end;
      while (i < code.length && /\s/.test(code[i])) i += 1;
      const thenBlock = readBalanced(code, i, '{', '}');
      if (!thenBlock) break;
      i = thenBlock.end;
      let elseBlock = null;
      while (i < code.length && /\s/.test(code[i])) i += 1;
      if (code.slice(i, i + 4).toLowerCase() === 'else') {
        i += 4;
        while (i < code.length && /\s/.test(code[i])) i += 1;
        const parsedElse = readBalanced(code, i, '{', '}');
        if (parsedElse) {
          elseBlock = parsedElse.text;
          i = parsedElse.end;
        }
      }
      statements.push({ type: 'if', condition: condition.text.trim(), thenBody: thenBlock.text.trim(), elseBody: elseBlock ? elseBlock.trim() : null });
      continue;
    }

    let stmt = '';
    let depth = 0;
    while (i < code.length) {
      const ch = code[i];
      if (ch === ';' && depth === 0) {
        i += 1;
        break;
      }
      if (ch === '(' || ch === '{') depth += 1;
      if (ch === ')' || ch === '}') depth -= 1;
      stmt += ch;
      i += 1;
    }
    if (stmt.trim()) statements.push({ type: 'command', text: stmt.trim() });
  }
  return statements;
}

function parseEncoderProgram(code) {
  if (isIndentationStyle(code)) {
    return parseIndentationStyle(code);
  }
  return parseBracketProgram(code);
}

function runEncoderStatements(statements, encoder, target) {
  for (const statement of statements) {
    if (statement.type === 'if') {
      const result = evaluateExpression(target, statement.condition);
      if (result) {
        if (Array.isArray(statement.thenBody)) {
          runEncoderStatements(statement.thenBody, encoder, target);
        } else {
          runEncoderStatements(parseEncoderProgram(statement.thenBody), encoder, target);
        }
      } else if (statement.elseBody) {
        if (Array.isArray(statement.elseBody)) {
          runEncoderStatements(statement.elseBody, encoder, target);
        } else {
          runEncoderStatements(parseEncoderProgram(statement.elseBody), encoder, target);
        }
      }
      continue;
    }

    runSingleEncoderCommand(encoder, target, statement.text);
  }
}

function runSingleEncoderCommand(encoder, target, cmdText) {
  const parsed = parseEncoderCommand(cmdText);
  if (!parsed) {
    document.getElementById('console-feedback').textContent = `Invalid token parsed: ${cmdText}`;
    return;
  }

  const { name, args } = parsed;
  const feedback = document.getElementById('console-feedback');
  switch (name) {
    case 'teleport': {
      const [x, y] = args;
      if (typeof x === 'number' && typeof y === 'number') {
        Body.setPosition(target, { x, y });
        feedback.textContent = `Displaced entity vector to ${x}, ${y}.`;
      } else {
        feedback.textContent = 'teleport(x,y) structural syntax fault.';
      }
      break;
    }
    case 'transform': {
      const [type] = args;
      if (typeof type === 'string' && type.length > 0) {
        if (transformBody(target, type)) {
          feedback.textContent = `Transformed target schema to ${type}.`;
        } else {
          feedback.textContent = `Unknown element matrix type: ${type}.`;
        }
      } else {
        feedback.textContent = 'transform(item) parameters unassigned.';
      }
      break;
    }
    case 'setfriction': {
      const [value] = args;
      if (typeof value === 'number') {
        target.friction = value;
        feedback.textContent = `Entity friction coeff set to ${value}.`;
      } else {
        feedback.textContent = 'setfriction(value) requires valid float scalar.';
      }
      break;
    }
    case 'setdensity': {
      const [value] = args;
      if (typeof value === 'number') {
        Body.setDensity(target, value);
        feedback.textContent = `Target atomic density set to ${value}.`;
      } else {
        feedback.textContent = 'setdensity(value) parameter register invalid.';
      }
      break;
    }
    case 'burn': {
      igniteBody(target);
      feedback.textContent = 'Target thermal overload initialized.';
      break;
    }
    case 'isburnable': {
      const [value] = args;
      if (typeof value === 'boolean') {
        target.isBurnable = value;
        feedback.textContent = `Target thermal state set to ${value}.`;
      } else {
        feedback.textContent = 'isburnable(true/false) flag logic syntax error.';
      }
      break;
    }
    case 'delete': {
      World.remove(world, target);
      spawnedBodies = spawnedBodies.filter(b => b !== target);
      feedback.textContent = 'Asset purged from structural memory.';
      break;
    }
    case 'explode': {
      try {
        explodeTNT(target);
        feedback.textContent = 'Explosive reaction deployed.';
      } catch (err) {
        feedback.textContent = 'Reaction execution failure.';
      }
      break;
    }
    case 'push': {
      const [force, direction] = args;
      if (typeof force !== 'number') {
        feedback.textContent = 'push(force,direction) requires structural force scalar.';
        break;
      }
      let vec = { x: 0, y: 0 };
      if (typeof direction === 'string') {
        const dir = direction.toLowerCase();
        if (dir === 'left') vec = { x: -1, y: 0 };
        else if (dir === 'right') vec = { x: 1, y: 0 };
        else if (dir === 'up') vec = { x: 0, y: -1 };
        else if (dir === 'down') vec = { x: 0, y: 1 };
        else {
          const angle = parseFloat(direction);
          if (!isNaN(angle)) {
            vec = { x: Math.cos(angle * Math.PI / 180), y: Math.sin(angle * Math.PI / 180) };
          }
        }
      } else if (typeof direction === 'number') {
        const angle = direction;
        vec = { x: Math.cos(angle * Math.PI / 180), y: Math.sin(angle * Math.PI / 180) };
      } else {
        feedback.textContent = 'Direction orientation invalid.';
        break;
      }
      Body.applyForce(target, target.position, { x: vec.x * force, y: vec.y * force });
      feedback.textContent = `Kinetic force shift applied ${direction}.`;
      break;
    }
    case 'size': {
      const [value] = args;
      if (typeof value === 'number' && value > 0) {
        Body.scale(target, value, value);
        if (target.render && target.render.sprite) {
          target.render.sprite.xScale = (target.render.sprite.xScale || 1) * value;
          target.render.sprite.yScale = (target.render.sprite.yScale || 1) * value;
        }
        feedback.textContent = `Scaled object dimensional profile by ${value}.`;
      } else {
        feedback.textContent = 'Dimension values must be positive scalars.';
      }
      break;
    }
    case 'get': {
      const [prop] = args;
      if (typeof prop === 'string' && prop.length > 0) {
        const value = getPropertyValue(target, prop);
        feedback.textContent = `Query output: get(${prop}) = ${value}`;
      } else {
        feedback.textContent = 'Property pointer index blank.';
      }
      break;
    }
    case 'setlabel':
    case 'setname': {
      const [text] = args;
      if (typeof text === 'string' && text.length > 0) {
        target.label = text;
        feedback.textContent = `Entity namespace mapped to ${text}.`;
      } else {
        feedback.textContent = 'Namespace strings require character data.';
      }
      break;
    }
    case 'color':
    case 'paint': {
      const [color] = args;
      if (typeof color === 'string' && color.length > 0) {
        if (!target.render) target.render = {};
        target.render.fillStyle = color;
        feedback.textContent = `Render skin remapped to ${color}.`;
      } else {
        feedback.textContent = 'Remap colors require valid hex string parameters.';
      }
      break;
    }
    case 'rotate': {
      const [angle] = args;
      if (typeof angle === 'number') {
        Body.rotate(target, angle * Math.PI / 180);
        feedback.textContent = `Rotated structural chassis by ${angle}°.`;
      } else {
        feedback.textContent = 'Angle arguments must specify a float degree.';
      }
      break;
    }
    case 'force':
    case 'applyforce': {
      const [x, y] = args;
      if (typeof x === 'number' && typeof y === 'number') {
        Body.applyForce(target, target.position, { x, y });
        feedback.textContent = `Vector magnitude thrust (${x}, ${y}) applied.`;
      } else {
        feedback.textContent = 'Vector coordinates require pair scalars.';
      }
      break;
    }
    case 'setvelocity': {
      const [x, y] = args;
      if (typeof x === 'number' && typeof y === 'number') {
        Body.setVelocity(target, { x, y });
        feedback.textContent = `Chassis rate of change forced to (${x}, ${y}).`;
      } else {
        feedback.textContent = 'Velocity rates require functional vector elements.';
      }
      break;
    }
    case 'setgravity':
    case 'gravityset':
    case 'setforce': {
      const [force, radius] = args;
      if (typeof force !== 'number') {
        feedback.textContent = 'Force parameter array register invalid.';
        break;
      }
      if (target.isGravityWell) {
        target.pullStrength = force;
        if (typeof radius === 'number' && radius > 0) {
          target.gravityRadius = radius;
          feedback.textContent = `Gravity fields adjusted: Force: ${force}, Range: ${radius}.`;
        } else {
          feedback.textContent = `Gravity field magnitude locked to ${force}.`;
        }
      } else {
        feedback.textContent = 'Target instance is structurally non-magnetic.';
      }
      break;
    }
    case 'makestatic': {
      Body.setStatic(target, true);
      feedback.textContent = 'Entity position locked in grid coordinates.';
      break;
    }
    case 'makedynamic': {
      Body.setStatic(target, false);
      feedback.textContent = 'Entity physics loop unlatched.';
      break;
    }
    default: {
      feedback.textContent = `Runtime compilation error: .${name}() is undefined.`;
    }
  }
}

function runEncoderCommand(encoder, target) {
  if (!encoder || !target || !encoder.code) return;
  const program = parseEncoderProgram(encoder.code);
  runEncoderStatements(program, encoder, target);
}

function fireEncoderBeam(encoder) {
  if (!encoder || !encoder.code) {
    document.getElementById('console-feedback').textContent = 'Instruction matrix blank. Write a command buffer.';
    return;
  }

  const start = { x: encoder.position.x, y: encoder.position.y };
  const direction = Vector.sub(mouse.position, start);
  const distance = Vector.magnitude(direction);
  if (distance < 5) return;
  const end = { x: start.x + (direction.x / distance) * 2000, y: start.y + (direction.y / distance) * 2000 };
  const hits = Query.ray(spawnedBodies, start, end);
  const hit = hits.find(hitItem => hitItem.body !== encoder && !hitItem.body.isStatic);
  if (hit) {
    runEncoderCommand(encoder, hit.body);
    encoderBeam = { start, end: hit.point || hit.body.position, life: 30, hit: true };
  } else {
    encoderBeam = { start, end, life: 30, hit: false };
    document.getElementById('console-feedback').textContent = 'Compiler pulse emitted into void. No target intercepted.';
  }
}

// --- 🌀 Portal Animated Visual (Wormhole Style) ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const portal of portals) {
    if (!spawnedBodies.includes(portal)) continue;
    const { x, y } = portal.position;
    const isBlue = portal.label === "PortalBlue";
    const r = portal.circleRadius || 42;

    const coreColor   = isBlue ? [0, 188, 255]   : [255, 119, 0];
    const rimColor    = isBlue ? [100, 225, 255]  : [255, 180, 50];
    const glowColor   = isBlue ? [0, 90, 180]     : [180, 60, 0];
    const spiralColor = isBlue ? [150, 230, 255]  : [255, 200, 120];

    ctx.save();

    const haloGrad = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.2);
    haloGrad.addColorStop(0, `rgba(${glowColor},0.35)`);
    haloGrad.addColorStop(1, `rgba(${glowColor},0)`);
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    for (let i = 5; i >= 1; i--) {
      const depth = i / 5;
      const ringR = r * depth * 0.92;
      const speed = 1.4 + (5 - i) * 0.3;
      const alpha = 0.08 + (1 - depth) * 0.22;
      ctx.beginPath();
      ctx.ellipse(x, y, ringR, ringR * 0.38, now * 0.15, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${coreColor},${alpha})`;
      ctx.lineWidth = 2.5 - i * 0.3;
      ctx.stroke();
    }

    for (let arm = 0; arm < 4; arm++) {
      const armOffset = (arm / 4) * Math.PI * 2;
      const rot = now * (isBlue ? 2.2 : -2.2) + armOffset;
      ctx.beginPath();
      for (let s = 0; s < 48; s++) {
        const frac = s / 48;
        const sr = frac * r * 0.88;
        const angle = rot + frac * Math.PI * 3;
        const px = x + Math.cos(angle) * sr;
        const py = y + Math.sin(angle) * sr * 0.42;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(${spiralColor},${0.55 - arm * 0.1})`;
      ctx.lineWidth = 1.8 - arm * 0.3;
      ctx.stroke();
    }

    const numArcs = 10;
    for (let a = 0; a < numArcs; a++) {
      const baseAngle = (a / numArcs) * Math.PI * 2 + now * (isBlue ? 1.8 : -1.8);
      const jitter = Math.sin(now * 8 + a * 2.1) * 5;
      const ax = x + Math.cos(baseAngle) * (r + jitter);
      const ay = y + Math.sin(baseAngle) * (r + jitter) * 0.45;
      const bx = x + Math.cos(baseAngle + 0.6) * (r + jitter * 0.5);
      const by = y + Math.sin(baseAngle + 0.6) * (r + jitter * 0.5) * 0.45;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = `rgba(${rimColor},${0.6 + Math.sin(now * 12 + a) * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 0.65);
    const pulse = 0.55 + Math.sin(now * 3.5 + (isBlue ? 0 : Math.PI)) * 0.2;
    coreGrad.addColorStop(0,   `rgba(255,255,255,${pulse * 0.9})`);
    coreGrad.addColorStop(0.3, `rgba(${coreColor},${pulse * 0.8})`);
    coreGrad.addColorStop(0.7, `rgba(${glowColor},${pulse * 0.4})`);
    coreGrad.addColorStop(1,   `rgba(${glowColor},0)`);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    for (let p = 0; p < 6; p++) {
      const pAngle = now * (isBlue ? 3 : -3) + (p / 6) * Math.PI * 2;
      const pr = r * (0.55 + Math.sin(now * 2 + p) * 0.15);
      const px = x + Math.cos(pAngle) * pr;
      const py = y + Math.sin(pAngle) * pr * 0.4;
      const pAlpha = 0.5 + Math.sin(now * 4 + p * 1.3) * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rimColor},${pAlpha})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(${rimColor},0.9)`;
    ctx.shadowColor = `rgba(${rimColor},0.8)`;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
});

// --- 🌀 Gravity Well Animated Visual ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const well of gravityWells) {
    if (!spawnedBodies.includes(well)) continue;
    const { x, y } = well.position;
    const radius = well.gravityRadius || 280;
    const phase = well._pulsePhase || 0;

    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 3; i++) {
      const t = now * (0.8 + i * 0.3) + phase + i * (Math.PI * 2 / 3);
      const ringR = 20 + i * 18 + Math.sin(t * 1.4) * 6;
      const alpha = 0.55 - i * 0.12 + Math.sin(t) * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 110, 255, ${alpha})`;
      ctx.lineWidth = 3 - i * 0.6;
      ctx.stroke();
    }

    const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, 40);
    const pulse = 0.6 + Math.sin(now * 2.5 + phase) * 0.2;
    coreGrad.addColorStop(0, `rgba(230, 180, 255, ${pulse})`);
    coreGrad.addColorStop(0.4, `rgba(155, 89, 182, ${pulse * 0.7})`);
    coreGrad.addColorStop(1, `rgba(50, 0, 120, 0)`);
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    for (let arm = 0; arm < 2; arm++) {
      const armAngle = now * 1.6 + arm * Math.PI + phase;
      ctx.beginPath();
      for (let s = 0; s < 60; s++) {
        const frac = s / 60;
        const r = 14 + frac * 55;
        const angle = armAngle + frac * Math.PI * 1.5;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(180, 110, 255, ${0.35 - arm * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
});

Events.on(render, 'afterRender', () => {
  if (!encoderBeam) return;
  const ctx = render.context;
  ctx.save();
  ctx.strokeStyle = encoderBeam.hit ? '#c8a2c8' : '#64748b'; // Sleek cosmic gravity blast laser line
  ctx.lineWidth = 4;
  ctx.globalAlpha = Math.max(encoderBeam.life / 30, 0);
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(encoderBeam.start.x, encoderBeam.start.y);
  ctx.lineTo(encoderBeam.end.x, encoderBeam.end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  encoderBeam.life -= 1;
  if (encoderBeam.life <= 0) encoderBeam = null;
});

// =====================================================
// 🎨 ANIMATED VISUALS: TNT, CANNON, ENCODER, TORCH, ROPE
// =====================================================

// --- 💣 TNT Animated Visual ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const tnt of spawnedTNTs) {
    if (!spawnedBodies.includes(tnt)) continue;
    const { x, y } = tnt.position;
    const a = tnt.angle;
    const hw = 22, hh = 22;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);

    // Danger pulse glow
    const pulse = 0.5 + Math.sin(now * 5) * 0.3;
    const danger = 0.5 + Math.sin(now * 5 + Math.PI) * 0.3;

    // Outer glow
    const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, hw * 2.4);
    glowGrad.addColorStop(0, `rgba(255,50,30,${pulse * 0.5})`);
    glowGrad.addColorStop(0.5, `rgba(255,20,0,${pulse * 0.18})`);
    glowGrad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, hw * 2.4, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Main body (dark red)
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 4);
    const bodyGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    bodyGrad.addColorStop(0, '#7f1d1d');
    bodyGrad.addColorStop(0.5, '#991b1b');
    bodyGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Circuit lines (animated)
    ctx.strokeStyle = `rgba(248,113,113,${0.35 + danger * 0.4})`;
    ctx.lineWidth = 1;
    // horizontal bar
    ctx.beginPath(); ctx.moveTo(-hw + 5, -4); ctx.lineTo(hw - 5, -4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-hw + 5,  4); ctx.lineTo(hw - 5,  4); ctx.stroke();
    // tick marks
    for (let t = -3; t <= 3; t++) {
      const tx = t * 6;
      ctx.beginPath(); ctx.moveTo(tx, -4); ctx.lineTo(tx, 4); ctx.stroke();
    }

    // "TNT" label text
    ctx.font = `bold ${8 + Math.sin(now * 5) * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255,${80 + danger * 100 | 0},80,${0.85 + danger * 0.15})`;
    ctx.shadowColor = `rgba(255,50,0,${pulse * 0.9})`;
    ctx.shadowBlur = 8;
    ctx.fillText('TNT', 0, -10);
    ctx.shadowBlur = 0;

    // Fuse at top
    const fuseX = 0, fuseY = -hh;
    const fuseLen = 12 + Math.sin(now * 6) * 2;
    ctx.beginPath();
    ctx.moveTo(fuseX, fuseY);
    ctx.lineTo(fuseX + Math.sin(now * 4) * 3, fuseY - fuseLen);
    ctx.strokeStyle = `rgba(200,150,50,0.9)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Fuse spark
    const sparkAlpha = 0.6 + Math.sin(now * 12) * 0.4;
    ctx.beginPath();
    ctx.arc(fuseX + Math.sin(now * 4) * 3, fuseY - fuseLen, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,0,${sparkAlpha})`;
    ctx.shadowColor = 'rgba(255,180,0,0.9)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Corner bolts
    for (const [bx, by] of [[-hw+5,-hh+5],[hw-5,-hh+5],[-hw+5,hh-5],[hw-5,hh-5]]) {
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,80,80,0.8)`;
      ctx.fill();
    }

    // Red border
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 4);
    ctx.strokeStyle = `rgba(248,113,113,${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
});

// --- 🔫 Cannon Animated Visual ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const cannon of cannons) {
    if (!spawnedBodies.includes(cannon)) continue;
    const { x, y } = cannon.position;
    const a = cannon.angle;
    const hw = 60, hh = 20;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);

    const isLoading = cannon.isLoading;
    const charge = isLoading ? (0.5 + Math.sin(now * 6) * 0.5) : 0;

    // Body glow when loading
    if (isLoading) {
      const loadGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, hw * 1.5);
      loadGrad.addColorStop(0, `rgba(255,140,0,${charge * 0.35})`);
      loadGrad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.beginPath();
      ctx.ellipse(0, 0, hw * 1.5, hh * 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = loadGrad;
      ctx.fill();
    }

    // Main barrel body
    const barrelGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    barrelGrad.addColorStop(0, isLoading ? '#b45309' : '#1e3a5f');
    barrelGrad.addColorStop(0.4, isLoading ? '#d97706' : '#1e40af');
    barrelGrad.addColorStop(1, isLoading ? '#92400e' : '#0f172a');
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 6);
    ctx.fillStyle = barrelGrad;
    ctx.fill();

    // Barrel rings (3 rings along barrel)
    for (let r = 0; r < 3; r++) {
      const rx = -hw + 22 + r * 26;
      ctx.beginPath();
      ctx.ellipse(rx, 0, 6, hh, 0, 0, Math.PI * 2);
      ctx.fillStyle = isLoading
        ? `rgba(251,191,36,${0.5 + Math.sin(now * 5 + r) * 0.3})`
        : `rgba(56,189,248,${0.3 + Math.sin(now * 2 + r * 1.2) * 0.15})`;
      ctx.fill();
    }

    // Muzzle flash when loading
    if (isLoading) {
      const muzzleAlpha = 0.4 + Math.sin(now * 8) * 0.4;
      const mgGrad = ctx.createRadialGradient(hw, 0, 0, hw, 0, 22);
      mgGrad.addColorStop(0, `rgba(255,220,50,${muzzleAlpha})`);
      mgGrad.addColorStop(0.5, `rgba(255,120,0,${muzzleAlpha * 0.6})`);
      mgGrad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.beginPath();
      ctx.arc(hw, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = mgGrad;
      ctx.fill();
    }

    // Energy stream lines along barrel
    const streamAlpha = isLoading ? (0.5 + charge * 0.5) : (0.15 + Math.sin(now * 1.5) * 0.08);
    ctx.strokeStyle = isLoading
      ? `rgba(255,200,0,${streamAlpha})`
      : `rgba(0,188,255,${streamAlpha})`;
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 4; s++) {
      const sy = -hh + 8 + s * 8;
      ctx.beginPath();
      ctx.moveTo(-hw + 10, sy);
      ctx.lineTo(hw - 10, sy);
      ctx.stroke();
    }

    // Muzzle end cap
    ctx.beginPath();
    ctx.ellipse(hw, 0, 7, hh, 0, 0, Math.PI * 2);
    ctx.fillStyle = isLoading ? '#fbbf24' : '#0ea5e9';
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 6);
    ctx.strokeStyle = isLoading
      ? `rgba(251,191,36,${0.6 + charge * 0.4})`
      : `rgba(56,189,248,${0.35 + Math.sin(now * 1.8) * 0.15})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = isLoading ? 16 : 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
});

// --- 🖥️ Encoder Animated Visual ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const body of spawnedBodies) {
    if (!body.isEncoder) continue;
    const { x, y } = body.position;
    const a = body.angle;
    const hw = 40, hh = 40;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);

    const hasCode = !!(body.code && body.code.trim().length > 0);
    const pulse = 0.5 + Math.sin(now * 2.5) * 0.3;
    const fastPulse = 0.5 + Math.sin(now * 7) * 0.5;

    // Outer field glow
    const outerGrad = ctx.createRadialGradient(0, 0, hw * 0.5, 0, 0, hw * 2.0);
    outerGrad.addColorStop(0, `rgba(${hasCode ? '120,60,255' : '40,80,180'},${pulse * 0.3})`);
    outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, hw * 2.0, 0, Math.PI * 2);
    ctx.fillStyle = outerGrad;
    ctx.fill();

    // Body
    const bgGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    bgGrad.addColorStop(0, hasCode ? '#2d1b4e' : '#0f1929');
    bgGrad.addColorStop(0.5, hasCode ? '#1e0938' : '#0a1628');
    bgGrad.addColorStop(1, '#050810');
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 8);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Scanline effect (4 horizontal lines scrolling)
    const scanOffset = (now * 20) % (hh * 2);
    ctx.strokeStyle = `rgba(${hasCode ? '160,100,255' : '0,188,255'},0.12)`;
    ctx.lineWidth = 1;
    for (let s = 0; s < 8; s++) {
      const sy = -hh + ((s * 10 + scanOffset) % (hh * 2));
      ctx.beginPath();
      ctx.moveTo(-hw + 4, sy);
      ctx.lineTo(hw - 4, sy);
      ctx.stroke();
    }

    // Code dot matrix (3×4 grid of dots mimicking a display)
    const dotColor = hasCode
      ? `rgba(180,120,255,${0.5 + fastPulse * 0.5})`
      : `rgba(0,150,200,${0.3 + pulse * 0.3})`;
    for (let dr = 0; dr < 4; dr++) {
      for (let dc = 0; dc < 5; dc++) {
        const dotActive = hasCode
          ? Math.sin(now * 3 + dr * 1.7 + dc * 2.3) > 0.2
          : Math.sin(now * 1.5 + dr + dc) > 0.5;
        if (!dotActive) continue;
        ctx.beginPath();
        ctx.arc(-16 + dc * 8, -10 + dr * 6, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }
    }

    // Rotating compass ring
    ctx.save();
    ctx.rotate(now * (hasCode ? 1.8 : 0.6));
    ctx.beginPath();
    ctx.arc(0, 0, hw * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hasCode ? '160,80,255' : '0,188,255'},${0.2 + pulse * 0.15})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    // 4 tick marks on ring
    for (let t = 0; t < 4; t++) {
      const ta = (t / 4) * Math.PI * 2;
      const r1 = hw * 0.65, r2 = hw * 0.78;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * r1, Math.sin(ta) * r1);
      ctx.lineTo(Math.cos(ta) * r2, Math.sin(ta) * r2);
      ctx.strokeStyle = `rgba(${hasCode ? '200,130,255' : '80,220,255'},0.7)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Center beam emitter dot
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
    centerGrad.addColorStop(0, `rgba(255,255,255,${0.7 + fastPulse * 0.3})`);
    centerGrad.addColorStop(1, `rgba(${hasCode ? '160,80,255' : '0,200,255'},0.4)`);
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = hasCode ? 'rgba(160,80,255,0.9)' : 'rgba(0,200,255,0.8)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 8);
    ctx.strokeStyle = `rgba(${hasCode ? '160,80,255' : '0,188,255'},${0.5 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
});

// --- 🕯️ Torch Animated Visual ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const torch of torches) {
    if (!spawnedBodies.includes(torch)) continue;
    const { x, y } = torch.position;
    const a = torch.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);

    const flicker = Math.sin(now * 11) * 0.15 + Math.sin(now * 7.3) * 0.1;

    // Shaft body
    const shaftGrad = ctx.createLinearGradient(-6, -60, 6, 60);
    shaftGrad.addColorStop(0, '#92400e');
    shaftGrad.addColorStop(0.5, '#78350f');
    shaftGrad.addColorStop(1, '#451a03');
    ctx.beginPath();
    ctx.roundRect(-6, -50, 12, 100, 3);
    ctx.fillStyle = shaftGrad;
    ctx.fill();

    // Wood grain lines
    ctx.strokeStyle = 'rgba(120,60,10,0.5)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(-5, -40 + g * 22);
      ctx.lineTo(5, -38 + g * 22);
      ctx.stroke();
    }

    // Wrap bands
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.rect(-7, -30 + b * 24, 14, 5);
      ctx.fillStyle = `rgba(161,100,40,0.7)`;
      ctx.fill();
    }

    // Top ember cup
    ctx.beginPath();
    ctx.ellipse(0, -50, 9, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();

    // Flame halo glow
    const haloAlpha = 0.3 + flicker * 0.5;
    const haloGrad = ctx.createRadialGradient(0, -58, 2, 0, -58, 28);
    haloGrad.addColorStop(0, `rgba(255,200,50,${haloAlpha * 0.8})`);
    haloGrad.addColorStop(0.5, `rgba(255,100,0,${haloAlpha * 0.4})`);
    haloGrad.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.beginPath();
    ctx.arc(0, -58, 28, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // Flame shape (teardrop)
    const fh = 18 + flicker * 8;
    ctx.beginPath();
    ctx.moveTo(0, -50 - fh);
    ctx.bezierCurveTo(
      6 + flicker * 4, -50 - fh * 0.6,
      8, -52,
      0, -50
    );
    ctx.bezierCurveTo(
      -8, -52,
      -6 - flicker * 4, -50 - fh * 0.6,
      0, -50 - fh
    );
    const flameGrad = ctx.createLinearGradient(0, -50 - fh, 0, -50);
    flameGrad.addColorStop(0, `rgba(255,255,180,${0.9 + flicker * 0.1})`);
    flameGrad.addColorStop(0.3, `rgba(255,180,0,0.9)`);
    flameGrad.addColorStop(0.7, `rgba(255,80,0,0.8)`);
    flameGrad.addColorStop(1, `rgba(200,20,0,0.5)`);
    ctx.fillStyle = flameGrad;
    ctx.shadowColor = 'rgba(255,140,0,0.8)';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shaft border
    ctx.beginPath();
    ctx.roundRect(-6, -50, 12, 100, 3);
    ctx.strokeStyle = 'rgba(180,100,30,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
});

// --- 🔥 Flame Particle Enhanced Visual (overlay on existing) ---
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  // Draw embers on actively burning bodies
  for (const body of burningBodies) {
    if (!spawnedBodies.includes(body)) continue;
    const { x, y } = body.position;

    // Ember sparks orbiting the burning body
    for (let e = 0; e < 4; e++) {
      const eAngle = now * (3 + e * 0.7) + (e / 4) * Math.PI * 2;
      const er = 25 + Math.sin(now * 4 + e) * 8;
      const ex = x + Math.cos(eAngle) * er;
      const ey = y + Math.sin(eAngle) * er * 0.5 - 10;
      const eAlpha = 0.4 + Math.sin(now * 6 + e * 1.5) * 0.3;

      ctx.save();
      ctx.beginPath();
      ctx.arc(ex, ey, 2 + Math.sin(now * 8 + e) * 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${120 + (e * 30)|0},20,${eAlpha})`;
      ctx.shadowColor = 'rgba(255,100,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // Heat distortion ring at base
    const heatAlpha = 0.12 + Math.sin(now * 3) * 0.06;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 28 + Math.sin(now * 4) * 4, 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,140,0,${heatAlpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
});

// --- 🪢 Rope Enhanced Visual (replaces the existing rope renderer) ---
// Remove old rope renderer and replace with animated neon tether

/* =========================
   DELETE BUTTON
========================= */
const deleteBtn = document.createElement("button");
deleteBtn.id="delete-object"; deleteBtn.textContent="PURGE OBJECT DATA";
Object.assign(deleteBtn.style,{
  marginTop:"16px", width:"100%", padding:"12px", borderRadius:"10px", border:"none",
  background:"rgba(239, 68, 68, 0.1)", color:"#ef4444", border:"1px solid rgba(239, 68, 68, 0.25)",
  fontFamily:"'Orbitron', sans-serif", fontSize:"11px", fontWeight:"700", cursor:"pointer",
  transition:"0.3s", letterSpacing:"1px"
});
deleteBtn.addEventListener("mouseenter",()=>{ 
  deleteBtn.style.background="rgba(239, 68, 68, 0.2)"; 
  deleteBtn.style.boxShadow="0 0 12px rgba(239, 68, 68, 0.2)"; 
});
deleteBtn.addEventListener("mouseleave",()=>{ 
  deleteBtn.style.background="rgba(239, 68, 68, 0.1)"; 
  deleteBtn.style.boxShadow="none"; 
});
document.getElementById("prop-panel").appendChild(deleteBtn);

deleteBtn.addEventListener("click",()=>{
  if(!selectedBody) return;
  const name = selectedBody.label || "this object";
  if(confirm(`⚠️ Purge execution matrix data for "${name}" permanently?`)){
    World.remove(world,selectedBody);
    spawnedBodies = spawnedBodies.filter(b=>b!==selectedBody);
    if(typeof spawnedTNTs!=="undefined") spawnedTNTs = spawnedTNTs.filter(b=>b!==selectedBody);
    selectedBody=null; hideProperties();
  }
});

/* =========================
   APPLY PROPERTIES
========================= */
document.getElementById('apply-props').addEventListener('click',()=>{
  if(!selectedBody) return;
  selectedBody.label=document.getElementById('prop-label').value||selectedBody.label;
  const d=parseFloat(document.getElementById('prop-density').value);
  if(!isNaN(d) && d>0){ Body.setDensity(selectedBody,d); selectedBody.density=d; }
  const f=parseFloat(document.getElementById('prop-friction').value);
  if(!isNaN(f)) selectedBody.friction=f;
  selectedBody.isBurnable=!!document.getElementById('prop-burn').checked;

  const ctx=render.context;
  ctx.save(); ctx.beginPath();
  ctx.arc(selectedBody.position.x,selectedBody.position.y,28,0,2*Math.PI);
  ctx.lineWidth=3; ctx.strokeStyle='rgba(0,188,255,0.6)'; ctx.stroke(); ctx.restore();
});

/* =========================
   WINDOW + MOUSE
========================= */
window.addEventListener('resize',()=>{
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight-60;
  render.options.width=canvas.width; render.options.height=canvas.height;
  Render.lookAt(render,{min:{x:0,y:0},max:{x:canvas.width,y:canvas.height}});
});

document.addEventListener('click',ev=>{
  const target=ev.target;
  if(!sidebar.contains(target) && !uiMenuBtn.contains(target) && sidebar.classList.contains('open')){
    sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); uiHint.classList.remove('visible');
  }
});

document.querySelectorAll('.object-item').forEach(it=>{
  it.addEventListener('dragend',()=>{ setTimeout(()=>{ mouseConstraint.body=null; },10); });
});

/* =====================================================
   🤖 MODEL SYSTEM — SummonAI
   Spawned via Encoder command: .summonai(){ m.commands }
   Press M while Encoder is selected → Model spawns at mouse
   with animation. Supports: m.move(), m.goto(), m.pickup(), m.bring()
===================================================== */

const models = []; // all active model instances
let summonAnimations = []; // spawn particle animations

// ---------- Parse .summonai(){} block from encoder code ----------
function parseSummonAIBlock(code) {
  const match = code.match(/\.summonai\s*\(\s*\)\s*\{([\s\S]*)\}/);
  if (!match) return null;
  return match[1].trim();
}

// ---------- Parse model commands from inside {} ----------
function parseModelCommands(block) {
  const cmds = [];
  // Split by semicolons or newlines, trim whitespace
  const lines = block.split(/[\n;]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // m.move(value)
    let m = line.match(/^m\.move\(\s*([^)]+)\s*\)$/i);
    if (m) { cmds.push({ type: 'move', value: parseFloat(m[1]) || 50 }); continue; }
    // m.goto(label)
    m = line.match(/^m\.goto\(\s*([^)]+)\s*\)$/i);
    if (m) { cmds.push({ type: 'goto', label: m[1].replace(/['"]/g, '').trim() }); continue; }
    // m.pickup(label)
    m = line.match(/^m\.pickup\(\s*([^)]+)\s*\)$/i);
    if (m) { cmds.push({ type: 'pickup', label: m[1].replace(/['"]/g, '').trim() }); continue; }
    // m.bring()
    m = line.match(/^m\.bring\(\s*\)$/i);
    if (m) { cmds.push({ type: 'bring' }); continue; }
  }
  return cmds;
}

// ---------- Find body by label ----------
function findBodyByLabel(label) {
  return spawnedBodies.find(b => b.label && b.label.toLowerCase() === label.toLowerCase()) || null;
}

// ---------- Summon Particle Animation ----------
function createSummonAnimation(x, y, onComplete) {
  const anim = {
    x, y,
    age: 0,
    maxAge: 80,
    rings: Array.from({ length: 5 }, (_, i) => ({
      r: 0,
      maxR: 60 + i * 20,
      speed: 4 + i * 1.5,
      alpha: 0.9 - i * 0.12,
      color: [0, 255 - i * 30, 200 + i * 10]
    })),
    particles: Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2;
      return {
        angle,
        r: 0,
        maxR: 70 + Math.random() * 40,
        speed: 3 + Math.random() * 2.5,
        alpha: 1,
        size: 2 + Math.random() * 3,
        color: i % 3 === 0 ? [100, 255, 220] : i % 3 === 1 ? [80, 160, 255] : [200, 100, 255]
      };
    }),
    done: false,
    onComplete
  };
  summonAnimations.push(anim);
}

// ---------- Render Summon Animations ----------
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (let i = summonAnimations.length - 1; i >= 0; i--) {
    const anim = summonAnimations[i];
    anim.age++;

    const progress = anim.age / anim.maxAge;

    ctx.save();

    // Expanding shockwave rings
    for (const ring of anim.rings) {
      if (ring.r < ring.maxR) ring.r += ring.speed;
      const alpha = ring.alpha * (1 - progress * 0.9);
      ctx.beginPath();
      ctx.arc(anim.x, anim.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},${alpha})`;
      ctx.lineWidth = 3 * (1 - ring.r / ring.maxR) + 1;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Flying particles
    for (const p of anim.particles) {
      if (p.r < p.maxR) p.r += p.speed;
      p.alpha = Math.max(0, 1 - p.r / p.maxR);
      const px = anim.x + Math.cos(p.angle) * p.r;
      const py = anim.y + Math.sin(p.angle) * p.r;
      ctx.beginPath();
      ctx.arc(px, py, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Bright central flash fade-in/out
    if (progress < 0.5) {
      const flashAlpha = progress * 2;
      const flashGrad = ctx.createRadialGradient(anim.x, anim.y, 0, anim.x, anim.y, 40);
      flashGrad.addColorStop(0, `rgba(255,255,255,${flashAlpha * 0.9})`);
      flashGrad.addColorStop(0.4, `rgba(100,220,255,${flashAlpha * 0.6})`);
      flashGrad.addColorStop(1, `rgba(0,100,255,0)`);
      ctx.beginPath();
      ctx.arc(anim.x, anim.y, 40, 0, Math.PI * 2);
      ctx.fillStyle = flashGrad;
      ctx.fill();
    }

    ctx.restore();

    if (anim.age >= anim.maxAge) {
      if (anim.onComplete) anim.onComplete();
      summonAnimations.splice(i, 1);
    }
  }
});

// ---------- Spawn Model ----------
function spawnModel(x, y, commands, encoderRef) {
  const model = Bodies.rectangle(x, y - 10, 40, 60, {
    restitution: 0.3,
    friction: 0.7,
    frictionAir: 0.08,
    density: 0.004,
    render: {
      fillStyle: 'rgba(0,0,0,0)',
      strokeStyle: 'rgba(0,0,0,0)',
      lineWidth: 0
    },
    label: 'Model'
  });

  model.isModel = true;
  model.modelCommands = commands;
  model.modelCmdIndex = 0;
  model.modelState = 'idle'; // idle | moving | goto | pickup | bring
  model.pickedUpBody = null;
  model.targetPos = null;
  model.moveDir = 1; // 1 = right, -1 = left
  model.encoder = encoderRef;
  model._phase = Math.random() * Math.PI * 2;
  model._spawnTime = performance.now();
  model._isExecuting = false;

  World.add(world, model);
  spawnedBodies.push(model);
  models.push(model);

  // Start executing commands after spawn animation settles
  setTimeout(() => executeNextModelCommand(model), 600);

  return model;
}

// ---------- Execute model command queue ----------
function executeNextModelCommand(model) {
  if (!spawnedBodies.includes(model)) return;
  if (model.modelCmdIndex >= model.modelCommands.length) {
    model.modelState = 'idle';
    return;
  }

  const cmd = model.modelCommands[model.modelCmdIndex];
  model.modelCmdIndex++;

  switch (cmd.type) {
    case 'move': {
      // Move horizontally by `value` pixels (positive=right, negative=left)
      const dist = cmd.value;
      model.modelState = 'moving';
      const targetX = model.position.x + dist;
      model._moveTarget = targetX;
      model.moveDir = dist > 0 ? 1 : -1;
      // We'll track via afterUpdate
      break;
    }
    case 'goto': {
      const target = findBodyByLabel(cmd.label);
      if (!target) {
        // skip to next
        executeNextModelCommand(model);
        return;
      }
      model.modelState = 'goto';
      model._gotoTarget = target;
      model.moveDir = target.position.x > model.position.x ? 1 : -1;
      break;
    }
    case 'pickup': {
      const target = findBodyByLabel(cmd.label);
      if (!target || target.isStatic) {
        executeNextModelCommand(model);
        return;
      }
      model.modelState = 'pickup';
      model._pickupTarget = target;
      model.moveDir = target.position.x > model.position.x ? 1 : -1;
      break;
    }
    case 'bring': {
      if (!model.pickedUpBody) {
        executeNextModelCommand(model);
        return;
      }
      // Bring = move back to encoder position
      const enc = model.encoder;
      if (enc) {
        model.modelState = 'bring';
        model._bringTarget = enc.position;
        model.moveDir = enc.position.x > model.position.x ? 1 : -1;
      } else {
        executeNextModelCommand(model);
      }
      break;
    }
    default:
      executeNextModelCommand(model);
  }
}

// ---------- Model physics update ----------
Events.on(engine, 'afterUpdate', () => {
  const MOVE_SPEED = 3;
  const ARRIVE_DIST = 24;
  const PICKUP_DIST = 50;

  for (const model of models) {
    if (!spawnedBodies.includes(model)) continue;

    // Keep picked-up body glued above model
    if (model.pickedUpBody && spawnedBodies.includes(model.pickedUpBody)) {
      Body.setPosition(model.pickedUpBody, {
        x: model.position.x,
        y: model.position.y - 60
      });
      Body.setVelocity(model.pickedUpBody, { x: 0, y: 0 });
      Body.setStatic(model.pickedUpBody, true);
    }

    switch (model.modelState) {
      case 'moving': {
        const dx = model._moveTarget - model.position.x;
        if (Math.abs(dx) < ARRIVE_DIST) {
          model.modelState = 'idle';
          executeNextModelCommand(model);
        } else {
          Body.setVelocity(model, { x: model.moveDir * MOVE_SPEED, y: model.velocity.y });
        }
        break;
      }
      case 'goto': {
        const gt = model._gotoTarget;
        if (!gt || !spawnedBodies.includes(gt)) {
          model.modelState = 'idle';
          executeNextModelCommand(model);
          break;
        }
        const dx = gt.position.x - model.position.x;
        model.moveDir = dx > 0 ? 1 : -1;
        if (Math.abs(dx) < ARRIVE_DIST) {
          model.modelState = 'idle';
          executeNextModelCommand(model);
        } else {
          Body.setVelocity(model, { x: model.moveDir * MOVE_SPEED, y: model.velocity.y });
        }
        break;
      }
      case 'pickup': {
        const pt = model._pickupTarget;
        if (!pt || !spawnedBodies.includes(pt)) {
          model.modelState = 'idle';
          executeNextModelCommand(model);
          break;
        }
        const dx = pt.position.x - model.position.x;
        const dist = Math.abs(dx);
        model.moveDir = dx > 0 ? 1 : -1;
        if (dist < PICKUP_DIST) {
          // Pick it up!
          model.pickedUpBody = pt;
          Body.setStatic(pt, true);
          Body.setPosition(pt, { x: model.position.x, y: model.position.y - 60 });
          model.modelState = 'idle';
          model._pickupTarget = null;
          executeNextModelCommand(model);
        } else {
          Body.setVelocity(model, { x: model.moveDir * MOVE_SPEED, y: model.velocity.y });
        }
        break;
      }
      case 'bring': {
        const bt = model._bringTarget || (model.encoder && model.encoder.position);
        if (!bt) {
          model.modelState = 'idle';
          executeNextModelCommand(model);
          break;
        }
        const dx = bt.x - model.position.x;
        model.moveDir = dx > 0 ? 1 : -1;
        if (Math.abs(dx) < ARRIVE_DIST) {
          // Drop the item here
          if (model.pickedUpBody && spawnedBodies.includes(model.pickedUpBody)) {
            Body.setStatic(model.pickedUpBody, false);
            Body.setPosition(model.pickedUpBody, {
              x: model.position.x,
              y: model.position.y - 50
            });
          }
          model.pickedUpBody = null;
          model.modelState = 'idle';
          executeNextModelCommand(model);
        } else {
          Body.setVelocity(model, { x: model.moveDir * MOVE_SPEED, y: model.velocity.y });
        }
        break;
      }
    }
  }
});

// ---------- Render Model (custom animated draw) ----------
Events.on(render, 'afterRender', () => {
  const ctx = render.context;
  const now = performance.now() / 1000;

  for (const model of models) {
    if (!spawnedBodies.includes(model)) continue;

    const { x, y } = model.position;
    const isMoving = model.modelState !== 'idle';
    const walkCycle = isMoving ? Math.sin(now * 10) : 0;
    const dir = model.moveDir;
    const hasItem = !!model.pickedUpBody;

    // Scale-in animation on spawn
    const spawnAge = (performance.now() - model._spawnTime) / 1000;
    const scale = Math.min(1, spawnAge * 3);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * dir, scale); // flip based on direction
    ctx.translate(0, 0);

    // === BODY (torso) ===
    const bodyGrad = ctx.createLinearGradient(-15, -28, 15, 10);
    bodyGrad.addColorStop(0, 'rgba(0,220,255,0.95)');
    bodyGrad.addColorStop(0.5, 'rgba(0,140,200,0.9)');
    bodyGrad.addColorStop(1, 'rgba(0,80,160,0.85)');
    ctx.beginPath();
    ctx.roundRect(-15, -28, 30, 38, 5);
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(0,200,255,0.7)';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Chest panel lines
    ctx.strokeStyle = 'rgba(100,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let li = 0; li < 3; li++) {
      ctx.beginPath();
      ctx.moveTo(-10, -18 + li * 10);
      ctx.lineTo(10, -18 + li * 10);
      ctx.stroke();
    }

    // Chest glow dot (status indicator)
    const statusColor = hasItem ? 'rgba(255,200,0,0.9)' : isMoving ? 'rgba(0,255,150,0.9)' : 'rgba(100,200,255,0.7)';
    ctx.beginPath();
    ctx.arc(0, -14, 4, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.shadowColor = statusColor;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // === HEAD ===
    const headGrad = ctx.createLinearGradient(-12, -56, 12, -32);
    headGrad.addColorStop(0, 'rgba(30,240,255,0.98)');
    headGrad.addColorStop(1, 'rgba(0,100,200,0.9)');
    ctx.beginPath();
    ctx.roundRect(-12, -56, 24, 22, 4);
    ctx.fillStyle = headGrad;
    ctx.shadowColor = 'rgba(0,220,255,0.8)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes
    const eyePulse = 0.7 + Math.sin(now * 2.5 + model._phase) * 0.3;
    for (let eye = -1; eye <= 1; eye += 2) {
      ctx.beginPath();
      ctx.ellipse(eye * 5, -46, 3, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${eyePulse})`;
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner iris
      ctx.beginPath();
      ctx.arc(eye * 5, -46, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isMoving ? 'rgba(0,255,100,1)' : 'rgba(100,200,255,1)';
      ctx.fill();
    }

    // Antenna
    const antWave = Math.sin(now * 4 + model._phase) * 4;
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(antWave, -68);
    ctx.strokeStyle = 'rgba(100,240,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(antWave, -70, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,100,${0.7 + Math.sin(now * 6) * 0.3})`;
    ctx.shadowColor = 'rgba(255,255,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // === ARMS ===
    const armSwing = walkCycle * 18;
    // Left arm
    ctx.save();
    ctx.translate(-15, -20);
    ctx.rotate((armSwing - 10) * Math.PI / 180);
    ctx.beginPath();
    ctx.roundRect(-4, 0, 8, 22, 3);
    ctx.fillStyle = 'rgba(0,180,230,0.85)';
    ctx.fill();
    // Hand
    ctx.beginPath();
    ctx.arc(0, 23, 5, 0, Math.PI * 2);
    ctx.fillStyle = hasItem ? 'rgba(255,200,0,0.9)' : 'rgba(0,220,255,0.9)';
    ctx.fill();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(15, -20);
    ctx.rotate((-armSwing + 10) * Math.PI / 180);
    ctx.beginPath();
    ctx.roundRect(-4, 0, 8, 22, 3);
    ctx.fillStyle = 'rgba(0,180,230,0.85)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 23, 5, 0, Math.PI * 2);
    ctx.fillStyle = hasItem ? 'rgba(255,200,0,0.9)' : 'rgba(0,220,255,0.9)';
    ctx.fill();
    ctx.restore();

    // === LEGS ===
    const legSwing = walkCycle * 20;
    for (let leg = -1; leg <= 1; leg += 2) {
      ctx.save();
      ctx.translate(leg * 8, 10);
      ctx.rotate((leg * legSwing) * Math.PI / 180);
      ctx.beginPath();
      ctx.roundRect(-5, 0, 10, 24, 3);
      ctx.fillStyle = 'rgba(0,140,200,0.9)';
      ctx.fill();
      // Foot
      ctx.beginPath();
      ctx.roundRect(-6, 23, 12, 7, 2);
      ctx.fillStyle = 'rgba(0,100,180,0.95)';
      ctx.fill();
      ctx.restore();
    }

    // === Label above head ===
    ctx.save();
    ctx.scale(1 / (scale * dir), 1 / scale); // undo scale for text
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(180,255,255,0.85)';
    ctx.textAlign = 'center';
    const stateLabel = model.modelState === 'idle' ? 'MODEL' :
      model.modelState === 'moving' ? 'MOVING...' :
      model.modelState === 'goto' ? `GOTO: ${model._gotoTarget ? model._gotoTarget.label : '?'}` :
      model.modelState === 'pickup' ? `PICKUP: ${model._pickupTarget ? model._pickupTarget.label : '?'}` :
      model.modelState === 'bring' ? 'BRINGING...' : 'MODEL';
    ctx.fillText(stateLabel, 0, -78 * scale);
    ctx.restore();

    // === Footstep glow when moving ===
    if (isMoving) {
      ctx.save();
      ctx.scale(1, 1);
      const footGlow = ctx.createRadialGradient(0, 32, 0, 0, 32, 20);
      footGlow.addColorStop(0, `rgba(0,200,255,${0.3 + Math.abs(walkCycle) * 0.2})`);
      footGlow.addColorStop(1, 'rgba(0,200,255,0)');
      ctx.beginPath();
      ctx.ellipse(0, 32, 20, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = footGlow;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
});

// ---------- fireSummonAI — called when M is pressed with .summonai(){} ----------
function fireSummonAI(encoder) {
  const block = parseSummonAIBlock(encoder.code);
  if (block === null) {
    document.getElementById('console-feedback').textContent = 'No .summonai(){} block found.';
    return;
  }

  const commands = parseModelCommands(block);
  const spawnX = mouse.position.x;
  const spawnY = mouse.position.y;

  // Visual: change encoder texture/glow to purple "active" state
  encoder._summonActive = true;
  setTimeout(() => { encoder._summonActive = false; }, 2000);

  // Show feedback
  document.getElementById('console-feedback').textContent = `⚡ Summoning Model at (${spawnX|0}, ${spawnY|0}) with ${commands.length} command(s)…`;

  // Fire summon animation, spawn model on completion
  createSummonAnimation(spawnX, spawnY, () => {
    spawnModel(spawnX, spawnY, commands, encoder);
  });
}

// ---------- Add .summonai to encoder console autofill ----------
(function addSummonAIAutofill() {
  const autofillDiv = document.getElementById('console-autofill');
  if (!autofillDiv) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'autofill-btn';
  btn.textContent = '.summonai(){ m.move(200) }';
  btn.style.background = 'rgba(120,60,255,0.12)';
  btn.style.borderColor = 'rgba(160,80,255,0.4)';
  btn.style.color = '#c8a2ff';
  btn.addEventListener('click', () => {
    const input = document.getElementById('encoder-console-input');
    if (!input) return;
    input.value = '.summonai(){\n  m.goto(Box)\n  m.pickup(Box)\n  m.bring()\n}';
    input.focus();
  });
  autofillDiv.appendChild(btn);

  // Inject summonai section into the console guide
  const guide = document.querySelector('.console-guide');
  if (guide) {
    const modelSection = document.createElement('div');
    modelSection.style.cssText = 'margin-bottom:10px;padding:8px;background:rgba(120,60,255,0.07);border-left:2px solid rgba(160,80,255,0.5);border-radius:6px;';
    modelSection.innerHTML = `
      <strong style="color:#c084fc;font-size:12px">🤖 MODEL (SUMMONAI)</strong><br>
      <code>.summonai(){ commands }</code> — summon AI entity<br>
      <code>m.move(px)</code> — move by pixels (±)<br>
      <code>m.goto(label)</code> — walk to named object<br>
      <code>m.pickup(label)</code> — walk to & lift object<br>
      <code>m.bring()</code> — carry item back to encoder<br>
      <span style="font-size:11px;opacity:0.75">Press <strong>M</strong> to summon at mouse pointer.</span>
    `;
    guide.insertBefore(modelSection, guide.firstChild.nextSibling);
  }
})();

// ---------- Add Model to sidebar Objects tab ----------
(function addModelToSidebar() {
  const objectsTab = document.getElementById('tab-objects');
  if (!objectsTab) return;
  const item = document.createElement('div');
  item.className = 'object-item';
  item.setAttribute('draggable', 'true');
  item.setAttribute('data-type', 'model');
  item.textContent = '🤖 Model';
  objectsTab.insertBefore(item, objectsTab.querySelector('div[style]'));

  item.addEventListener('dragstart', ev => {
    ev.dataTransfer.setData('text/plain', 'model');
  });
})();

// Hook model into spawnFromType
const _origSpawnFromType = spawnFromType;
window.spawnFromType = function(type, x, y) {
  if (type === 'model') {
    // Spawn a model directly (idle, no commands)
    createSummonAnimation(x, y, () => {
      spawnModel(x, y, [], null);
    });
    return;
  }
  _origSpawnFromType(type, x, y);
}

// Override the canvas drop listener to use the new spawnFromType
// (The existing drop listener calls spawnFromType which is now patched via window.spawnFromType)
// We need to make the drop call the patched version:
canvas.addEventListener('drop', ev => {
  const type = ev.dataTransfer.getData('text/plain');
  if (type === 'model') {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    createSummonAnimation(x, y, () => spawnModel(x, y, [], null));
  }
});