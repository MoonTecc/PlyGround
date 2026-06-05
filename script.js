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
    background: "#161b22",
    wireframes: false,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// --- Boundaries ---
const ground = Bodies.rectangle(canvas.width/2, canvas.height, canvas.width, 60, { isStatic: true, label: "Ground" });
const leftWall = Bodies.rectangle(0, canvas.height/2, 60, canvas.height, { isStatic: true, label: "Wall" });
const rightWall = Bodies.rectangle(canvas.width, canvas.height/2, 60, canvas.height, { isStatic: true, label: "Wall" });
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
        texture: "quartz.png", // your Quartz texture file
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
        texture: "lamp.png", // your Lamp image file
        xScale: 0.2,
        yScale: 0.2
      }
    },
    label: "Lamp",
  });
  World.add(world, lamp);
  spawnedBodies.push(lamp);

  // ✨ Soft light effect around Lamp
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
      fillStyle: "rgba(0,120,255,0.45)",
      strokeStyle: "#3ac7ff"
    }
  });

  const orangePortal = Bodies.circle(secondX, y, size, {
    ...portalOpts,
    label: "PortalOrange",
    render: {
      ...portalOpts.render,
      fillStyle: "rgba(255,140,0,0.45)",
      strokeStyle: "#ff9f33"
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
      fillStyle: "#ffd835",
      strokeStyle: "#ff9f00",
      lineWidth: 3
    },
    label: "Cannon"
  });

  cannon.isCannon = true;
  cannon.isLoading = false;
  cannon.loadingTarget = null;
  cannon.loadTimer = null;
  cannon.render.fillStyle = "#ffd835";

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
          fillStyle: "#ffd835",
          strokeStyle: "#ff9f00",
          lineWidth: 3
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
          fillStyle: "#9b59b6",
          strokeStyle: "#f1c40f",
          lineWidth: 3
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
  cannon.render.fillStyle = "#ffa500";

  cannon.loadTimer = setTimeout(() => {
    if (!spawnedBodies.includes(cannon) || !spawnedBodies.includes(target)) {
      cannon.isLoading = false;
      cannon.loadingTarget = null;
      cannon.render.fillStyle = "#ffd835";
      return;
    }
    shootCannon(cannon, target);
  }, 2000);
}

function shootCannon(cannon, target) {
  if (!spawnedBodies.includes(cannon) || !spawnedBodies.includes(target)) {
    cannon.isLoading = false;
    cannon.loadingTarget = null;
    cannon.render.fillStyle = "#ffd835";
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
  cannon.render.fillStyle = "#ffd835";
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

    // --- 🟠 Draw flame particle ---
    const grad = ctx.createLinearGradient(f.x, f.y + f.size, f.x, f.y - f.size);
    grad.addColorStop(0, "rgba(255,0,0,0.9)");
    grad.addColorStop(1, "rgba(125,125,0,0.1)");
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grad;
    ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // cleanup dead fire particles
    if (f.life <= 0) fires.splice(i, 1);
  }

  ctx.restore();
})();
// Track mouse position
let mouseX = 0, mouseY = 0;

window.addEventListener("mousemove", (e) => {
  const rect = render.canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Listen for 'S' key press
window.addEventListener("keydown", (e) => {
  if (isTypingMode()) return;
  if (e.key.toLowerCase() === 's') {
    createFireCluster(mouseX, mouseY, 1); // sizeFactor = 1
  }
});


// --- IGNITE & ASH SYSTEM ---
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

// Apply property changes
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
          texture: "Ash.png",  // 💀 your ash texture file
          xScale: width / 512,         // adjust depending on texture resolution
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
          fillStyle: "#555",
          opacity: 1, // start fully visible
        },
        label: "AshFragment",
      }
    );

    // Apply a random flying force
    const forceMagnitude = 0.0005 + Math.random() * 0.0001;
    const angle = Math.random() * Math.PI * 2; // random direction
    Body.applyForce(frag, frag.position, {
      x: Math.cos(angle) * forceMagnitude,
      y: Math.sin(angle) * forceMagnitude,
    });

    World.add(world, frag);
    spawnedBodies.push(frag);

    // Gradually fade out and remove after 10s
    const fadeDuration = 10000; // 10 seconds
    const fadeStep = 100; // update every 0.1s
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


// --- 🔦 TORCH SYSTEM (Dynamic, Textured Torch with Moving Flame) ---
const torches = [];

function spawnTorch(x, y) {
  const torch = Bodies.rectangle(x, y, 20, 120, {
    restitution: 0.3,
    friction: 0.6,
    density: 0.002,
    render: {
      sprite: {
        texture: "torch.png", // 🪵 Your torch image file
        xScale: 0.25,          // adjust these two if needed
        yScale: 0.25,
      },
    },
    label: "Torch",
  });

  World.add(world, torch);
  spawnedBodies.push(torch);
  torches.push(torch);



  // 🔥 Fire that follows the top dynamically
  const fireInterval = setInterval(() => {
    if (!spawnedBodies.includes(torch)) {
      clearInterval(fireInterval);
      return;
    }

    // Dynamic top position using rotation
    const topOffset = Vector.rotate({ x: 0, y: -60 }, torch.angle);
    const topX = torch.position.x + topOffset.x;
    const topY = torch.position.y + topOffset.y;

    createFireCluster(topX, topY, 1.2);
  }, 250);
}

// � Press "T" to spawn fire
document.addEventListener("keydown", e => {
  if (isTypingMode()) return;
  if (e.key.toLowerCase() === "t") {
    createFireCluster(mouse.position.x, mouse.position.y, 1.4);
  }
});

// 🌀 Press "P" to spawn a portal pair
// 🔫 Press "G" to spawn a cannon
// 🖥️ Press "M" to fire the selected encoder beam
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
      fireEncoderBeam(selectedEncoder);
    }
  }
});

// --- ARROW KEYS TO ROTATE HELD ITEM ---
document.addEventListener("keydown", e => {
  if (dragBody === null) return; // Only rotate if holding an item
  
  const rotationAmount = 0.1; // radians per keypress (~5.7 degrees)
  
  if (e.key === "ArrowLeft") {
    Body.rotate(dragBody, -rotationAmount); // Rotate clockwise (inverted)
  }
  if (e.key === "ArrowRight") {
    Body.rotate(dragBody, rotationAmount); // Rotate counter-clockwise (inverted)
  }
});

// --- TNT ARRAY ---
let spawnedTNTs = [];

// --- SPAWN TNT (Press X) ---
document.addEventListener("keydown", e => {
  if (isTypingMode()) return;
  if (e.key.toLowerCase() === "x") {
    const tnt = Bodies.rectangle(mouse.position.x, mouse.position.y, 45, 45, {
      label: "TNT",
      restitution: 0.4,
      friction: 0.6,
      render: {
        fillStyle: "#cc0000",
        strokeStyle: "#ffffff",
        lineWidth: 2
      }
    });
    World.add(world, tnt);
    spawnedBodies.push(tnt);
    spawnedTNTs.push(tnt);
  }
});

// --- IGNITE TNT (Press E) ---
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "e") {
    if (spawnedTNTs.length === 0) return;

    const nearestTNT = spawnedTNTs[spawnedTNTs.length - 1];

    // 🔥 Visual fuse flame
    createFireCluster(nearestTNT.position.x, nearestTNT.position.y, 1.4);

    // 🧨 Text hint
    const ctx = render.context;
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("💥 FUSE LIT! GET BACK!", nearestTNT.position.x - 60, nearestTNT.position.y - 60);

    // Delay for fuse (2.5s)
    setTimeout(() => explodeTNT(nearestTNT), 2500);
  }
});


// --- 💥 REVAMPED EXPLOSION FUNCTION ---
function explodeTNT(tnt) {
  const x = tnt.position.x;
  const y = tnt.position.y;
  const radius = 300;

  // Remove TNT body first
  World.remove(world, tnt);
  spawnedBodies = spawnedBodies.filter(b => b !== tnt);
  spawnedTNTs   = spawnedTNTs.filter(b => b !== tnt);

  // ── 1. Massive fire burst ──────────────────────────────────────
  for (let i = 0; i < 40; i++) createFireCluster(x, y, 2.2);

  // ── 2. Screenshake ────────────────────────────────────────────
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

  // ── 3. Flash overlay on canvas ────────────────────────────────
  const flashDiv = document.createElement('div');
  Object.assign(flashDiv.style, {
    position: 'fixed', inset: '0', zIndex: '9999', pointerEvents: 'none',
    background: 'radial-gradient(circle at ' + (x/canvas.width*100) + '% ' + ((y+60)/window.innerHeight*100) + '%, rgba(255,220,80,0.72) 0%, rgba(255,80,0,0.28) 45%, transparent 75%)',
    transition: 'opacity 0.55s ease-out', opacity: '1'
  });
  document.body.appendChild(flashDiv);
  requestAnimationFrame(() => requestAnimationFrame(() => { flashDiv.style.opacity = '0'; }));
  setTimeout(() => flashDiv.remove(), 700);

  // ── 4. Multi-ring shockwaves ──────────────────────────────────
  const ctx = render.context;
  const waves = [
    { r: 0, maxR: radius * 1.05, speed: 22, lw: 10, color: [255, 200, 60],  alpha: 0.95 },
    { r: 0, maxR: radius * 0.78, speed: 17, lw: 7,  color: [255, 100, 20],  alpha: 0.75 },
    { r: 0, maxR: radius * 0.55, speed: 13, lw: 5,  color: [255, 255, 200], alpha: 0.60 },
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

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(x, y, w.r, 0, Math.PI * 2);
      ctx.lineWidth = w.lw * (1 - progress * 0.5) + 2;
      ctx.strokeStyle = `rgba(${w.color[0]},${w.color[1]},${w.color[2]},${alpha})`;
      ctx.shadowColor  = `rgba(${w.color[0]},${w.color[1]},${w.color[2]},${alpha * 0.6})`;
      ctx.shadowBlur   = 18;
      ctx.stroke();
      ctx.shadowBlur   = 0;
    }

    // Debris sparks
    if (waves[0].r < waves[0].maxR * 0.4) {
      for (let i = 0; i < 5; i++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkR = waves[0].r * (0.5 + Math.random() * 0.5);
        const sx2 = x + Math.cos(sparkAngle) * sparkR;
        const sy2 = y + Math.sin(sparkAngle) * sparkR;
        const sparkAlpha = 0.8 - waves[0].r / waves[0].maxR;
        ctx.beginPath();
        ctx.arc(sx2, sy2, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${120 + Math.random()*100|0},30,${sparkAlpha})`;
        ctx.fill();
      }
    }

    // Smoke lingering cloud
    const smokeProgress = Math.max(0, (waves[0].r / waves[0].maxR - 0.3) / 0.7);
    if (smokeProgress > 0 && smokeProgress < 1) {
      const smokeGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.6 * smokeProgress);
      smokeGrad.addColorStop(0,   `rgba(60,50,40,${0.28 * (1 - smokeProgress)})`);
      smokeGrad.addColorStop(0.6, `rgba(40,35,30,${0.14 * (1 - smokeProgress)})`);
      smokeGrad.addColorStop(1,   `rgba(20,15,10,0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6 * smokeProgress, 0, Math.PI * 2);
      ctx.fillStyle = smokeGrad;
      ctx.fill();
    }

    ctx.restore();
    if (!allDone) requestAnimationFrame(animateExplosion);
  }
  animateExplosion();

  // ── 5. Blast physics ─────────────────────────────────────────
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

  // ── 6. Ignite nearby bodies ──────────────────────────────────
  for (const body of spawnedBodies) {
    const dx = body.position.x - x;
    const dy = body.position.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 220 && (body.label === "Box" || body.label === "Plank")) {
      igniteBody(body);
    }
  }
}
// --- 🪢 Real Rigid Rope Physics (no stretch, soft bend, realistic look) ---
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
    console.log(`🪢 Rope Mode: ${ropeMode ? "ON" : "OFF"}`);
  }

  // 🗑 Remove nearest rope
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
      console.log("❌ Rope removed.");
    }
  }
});

function removeRope(rope) {
  for (const seg of rope.segments) World.remove(world, seg);
  for (const c of rope.constraints) World.remove(world, c);
  ropes = ropes.filter(r => r !== rope);
}

// --- Rope creation ---
Events.on(mouseConstraint, "mousedown", () => {
  if (!ropeMode) return;
  const mousePos = mouse.position;
  const found = Query.point(spawnedBodies, mousePos);
  if (found.length > 0) {
    const body = found[0];
    if (!ropeStart) {
      ropeStart = body;
      console.log("🔹 First body selected for rope.");
    } else if (body !== ropeStart) {
      createRealRope(ropeStart, body);
      ropeStart = null;
      console.log("🪢 Rope created.");
    }
  }
});

// --- Highlight body under mouse ---
Events.on(render, "beforeRender", () => {
  if (!ropeMode) {
    highlightBody = null;
    return;
  }
  const found = Query.point(spawnedBodies, mouse.position);
  highlightBody = found.length > 0 ? found[0] : null;
});

// --- Create Rigid Rope (zero stretch, soft bend) ---
function createRealRope(bodyA, bodyB, segments = 15) {
  const ropeSegments = [];
  const constraints = [];

  const start = bodyA.position;
  const end = bodyB.position;
  const dx = (end.x - start.x) / (segments + 1);
  const dy = (end.y - start.y) / (segments + 1);
  const segmentLength = Math.sqrt(dx * dx + dy * dy);

  // 🧩 Create rigid rope links
  for (let i = 0; i < segments; i++) {
    const link = Bodies.circle(start.x + dx * (i + 1), start.y + dy * (i + 1), 3, {
      friction: 0.8,
      restitution: 0,
      mass: 0.1,
      density: 0.005,
      collisionFilter: { group: -1 },
      render: { fillStyle: "#ffaa00" }
    });
    ropeSegments.push(link);
    World.add(world, link);
  }

  // 🔗 Create very stiff constraints (virtually rigid)
  const makeConstraint = (A, B) => Constraint.create({
    bodyA: A,
    bodyB: B,
    length: segmentLength,
    stiffness: 1,      // <--- full stiffness (no stretch)
    damping: 0.2,      // <--- removes vibration
    render: { visible: false }
  });

  // connect first link to bodyA
  constraints.push(makeConstraint(bodyA, ropeSegments[0]));

  // connect middle links
  for (let i = 0; i < ropeSegments.length - 1; i++) {
    constraints.push(makeConstraint(ropeSegments[i], ropeSegments[i + 1]));
  }

  // connect last link to bodyB
  constraints.push(makeConstraint(ropeSegments[ropeSegments.length - 1], bodyB));

  // add to world
  for (const c of constraints) World.add(world, c);

  ropes.push({ bodyA, bodyB, segments: ropeSegments, constraints });
}


// --- Rope Auto-Break System ---
Events.on(engine, "afterUpdate", () => {
  for (let i = ropes.length - 1; i >= 0; i--) {
    const rope = ropes[i];
    if (!world.bodies.includes(rope.bodyA) || !world.bodies.includes(rope.bodyB)) {
      removeRope(rope);
      console.log("💥 Rope broke: connected body removed.");
    }
  }
});

// --- Render rope (fiber texture + bend + highlight) ---
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.save();

  for (const rope of ropes) {
    const pts = [rope.bodyA.position, ...rope.segments.map(s => s.position), rope.bodyB.position];
    if (pts.length < 2) continue;

    // 🎨 Rope gradient (brown-gold fiber)
    const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    grad.addColorStop(0, "#b8860b");
    grad.addColorStop(0.5, "#d2b48c");
    grad.addColorStop(1, "#b8860b");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.shadowColor = "#d2b48c";
    ctx.shadowBlur = 8;

    // 🪶 Smooth natural rope bend (quadratic curve)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  // ✅ Keep your green/blue selection outline
  if (highlightBody) {
    const b = highlightBody.bounds;
    ctx.strokeStyle = ropeStart ? "#00ffff" : "#00ff00";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.strokeRect(b.min.x - 2, b.min.y - 2, b.max.x - b.min.x + 4, b.max.y - b.min.y + 4);
  }

  ctx.restore();
});



// --- 🔩 SCREW SYSTEM (With Texture + Removal) ---
let screwMode = false;
let screws = []; // store screws with linked bodies

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  // Toggle screw mode
  if (key === "z") {
    screwMode = !screwMode;
    console.log(`🔩 Screw Mode: ${screwMode ? "ON" : "OFF"}`);

    // When pressing Z while dragging a body
    if (screwMode && mouseConstraint.body && !mouseConstraint.body.isStatic) {
      const target = mouseConstraint.body;
      const pos = { x: mouse.position.x, y: mouse.position.y };

      // Create screw visual
      const screw = Bodies.circle(pos.x, pos.y, 15, {
        isStatic: true,
        render: {
          sprite: {
            texture: "Screw.png", // 🧷 your screw texture file
            xScale: 0.1,
            yScale: 0.1,
          }
        },
        label: "Screw"
      });
      World.add(world, screw);

      // Turn body static
      Body.setStatic(target, true);
      console.log("🧱 Object screwed and fixed in place.");

      screws.push({ screw, target });
      screwMode = false; // auto turn off mode after placing
    }
  }

  // Remove screw (press C)
  if (key === "c") {
    const mousePos = mouse.position;
    for (let i = screws.length - 1; i >= 0; i--) {
      const { screw, target } = screws[i];
      const dx = mousePos.x - screw.position.x;
      const dy = mousePos.y - screw.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If mouse near screw, unscrew it
      if (dist < 40) {
        World.remove(world, screw);
        Body.setStatic(target, false);
        console.log("🔓 Screw removed — object is now dynamic again!");
        screws.splice(i, 1);

        // 🔄 Small unscrew animation effect
        const ctx = render.context;
        ctx.save();
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
});

// Optional visual marker glow (so you can see all screws)
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.save();
  for (const { screw } of screws) {
    ctx.beginPath();
    ctx.arc(screw.position.x, screw.position.y, 16, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,0,0.4)";
    ctx.stroke();
  }
  ctx.restore();
});
/* =========================
   FULL UI + OBJECT + CONSOLE SYSTEM
========================= */

// Sidebar toggle
const uiMenuBtn = document.getElementById('uiMenuBtn');
const sidebar = document.getElementById('sidebar');
const uiHint = document.getElementById('uiHint');

uiMenuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebar.setAttribute('aria-hidden', !sidebar.classList.contains('open'));
  uiHint.classList.toggle('visible', sidebar.classList.contains('open'));
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
  });
});

// Drag setup for object items
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

// Drop onto canvas
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
    case 'tnt': {
      const tnt = Bodies.rectangle(x,y,45,45,{label:"TNT", restitution:0.4, friction:0.6,
        render:{sprite:{texture:"tnt.png", xScale:0.18, yScale:0.18}}});
      World.add(world,tnt); spawnedBodies.push(tnt); spawnedTNTs.push(tnt);
    } break;
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
    selectedBody.render.strokeStyle='cyan'; selectedBody.render.lineWidth=4;
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
  document.getElementById('console-feedback').textContent = 'Press M to fire the encoder beam at an object.';
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
  document.getElementById('console-feedback').textContent = commandText ? 'Command saved.' : 'Encoder code cleared.';
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
    document.getElementById('console-feedback').textContent = `Invalid command: ${cmdText}`;
    return;
  }

  const { name, args } = parsed;
  const feedback = document.getElementById('console-feedback');
  switch (name) {
    case 'teleport': {
      const [x, y] = args;
      if (typeof x === 'number' && typeof y === 'number') {
        Body.setPosition(target, { x, y });
        feedback.textContent = `Teleported target to ${x}, ${y}.`;
      } else {
        feedback.textContent = 'teleport(x,y) requires two numbers.';
      }
      break;
    }
    case 'transform': {
      const [type] = args;
      if (typeof type === 'string' && type.length > 0) {
        if (transformBody(target, type)) {
          feedback.textContent = `Transformed target into ${type}.`;
        } else {
          feedback.textContent = `Unknown transform type: ${type}.`;
        }
      } else {
        feedback.textContent = 'transform(item) requires a valid type.';
      }
      break;
    }
    case 'setfriction': {
      const [value] = args;
      if (typeof value === 'number') {
        target.friction = value;
        feedback.textContent = `Target friction set to ${value}.`;
      } else {
        feedback.textContent = 'setfriction(value) requires a number.';
      }
      break;
    }
    case 'setdensity': {
      const [value] = args;
      if (typeof value === 'number') {
        Body.setDensity(target, value);
        feedback.textContent = `Target density set to ${value}.`;
      } else {
        feedback.textContent = 'setdensity(value) requires a number.';
      }
      break;
    }
    case 'burn': {
      igniteBody(target);
      feedback.textContent = 'Target ignited.';
      break;
    }
    case 'isburnable': {
      const [value] = args;
      if (typeof value === 'boolean') {
        target.isBurnable = value;
        feedback.textContent = `Target burnable set to ${value}.`;
      } else {
        feedback.textContent = 'isburnable(true/false) requires a boolean.';
      }
      break;
    }
    case 'delete': {
      World.remove(world, target);
      spawnedBodies = spawnedBodies.filter(b => b !== target);
      feedback.textContent = 'Target deleted.';
      break;
    }
    case 'explode': {
      try {
        explodeTNT(target);
        feedback.textContent = 'Target exploded.';
      } catch (err) {
        feedback.textContent = 'explode() failed.';
      }
      break;
    }
    case 'push': {
      const [force, direction] = args;
      if (typeof force !== 'number') {
        feedback.textContent = 'push(force,direction) requires a numeric force.';
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
        feedback.textContent = 'push(force,direction) direction must be left/right/up/down or a number.';
        break;
      }
      Body.applyForce(target, target.position, { x: vec.x * force, y: vec.y * force });
      feedback.textContent = `Pushed target ${direction} with force ${force}.`;
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
        feedback.textContent = `Scaled target by ${value}.`;
      } else {
        feedback.textContent = 'size(value) requires a positive number.';
      }
      break;
    }
    case 'get': {
      const [prop] = args;
      if (typeof prop === 'string' && prop.length > 0) {
        const value = getPropertyValue(target, prop);
        feedback.textContent = `get(${prop}) = ${value}`;
      } else {
        feedback.textContent = 'get(property) requires a property name.';
      }
      break;
    }
    case 'setlabel':
    case 'setname': {
      const [text] = args;
      if (typeof text === 'string' && text.length > 0) {
        target.label = text;
        feedback.textContent = `Target label set to ${text}.`;
      } else {
        feedback.textContent = 'setlabel(name) requires a string.';
      }
      break;
    }
    case 'color':
    case 'paint': {
      const [color] = args;
      if (typeof color === 'string' && color.length > 0) {
        if (!target.render) target.render = {};
        target.render.fillStyle = color;
        feedback.textContent = `Target color set to ${color}.`;
      } else {
        feedback.textContent = 'color(value) requires a color string.';
      }
      break;
    }
    case 'rotate': {
      const [angle] = args;
      if (typeof angle === 'number') {
        Body.rotate(target, angle * Math.PI / 180);
        feedback.textContent = `Rotated target by ${angle} degrees.`;
      } else {
        feedback.textContent = 'rotate(angle) requires a number.';
      }
      break;
    }
    case 'force':
    case 'applyforce': {
      const [x, y] = args;
      if (typeof x === 'number' && typeof y === 'number') {
        Body.applyForce(target, target.position, { x, y });
        feedback.textContent = `Applied force (${x}, ${y}) to target.`;
      } else {
        feedback.textContent = 'force(x,y) requires two numbers.';
      }
      break;
    }
    case 'setvelocity': {
      const [x, y] = args;
      if (typeof x === 'number' && typeof y === 'number') {
        Body.setVelocity(target, { x, y });
        feedback.textContent = `Velocity set to (${x}, ${y}).`;
      } else {
        feedback.textContent = 'setvelocity(x,y) requires two numbers.';
      }
      break;
    }
    case 'setgravity':
    case 'gravityset':
    case 'setforce': {
      // Works on GravityWell targets — sets pull strength and optionally radius
      const [force, radius] = args;
      if (typeof force !== 'number') {
        feedback.textContent = 'setgravity(force[, radius]) requires a numeric force (e.g. 0.0005).';
        break;
      }
      if (target.isGravityWell) {
        target.pullStrength = force;
        if (typeof radius === 'number' && radius > 0) {
          target.gravityRadius = radius;
          feedback.textContent = `GravityWell force set to ${force}, radius to ${radius}.`;
        } else {
          feedback.textContent = `GravityWell force set to ${force}.`;
        }
      } else {
        feedback.textContent = 'setgravity() can only target a GravityWell object.';
      }
      break;
    }
    case 'makestatic': {
      Body.setStatic(target, true);
      feedback.textContent = 'Target made static.';
      break;
    }
    case 'makedynamic': {
      Body.setStatic(target, false);
      feedback.textContent = 'Target made dynamic.';
      break;
    }
    default: {
      feedback.textContent = `Unknown command .${name}().`;
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
    document.getElementById('console-feedback').textContent = 'Please enter a command before firing.';
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
    document.getElementById('console-feedback').textContent = 'Beam fired; no target hit.';
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

    // Colors per portal type
    const coreColor   = isBlue ? [0, 160, 255]   : [255, 130, 0];
    const rimColor    = isBlue ? [80, 220, 255]   : [255, 200, 60];
    const glowColor   = isBlue ? [0, 100, 200]    : [200, 80, 0];
    const spiralColor = isBlue ? [120, 200, 255]  : [255, 180, 80];

    ctx.save();

    // --- Outer glow halo ---
    const haloGrad = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.2);
    haloGrad.addColorStop(0, `rgba(${glowColor},0.28)`);
    haloGrad.addColorStop(1, `rgba(${glowColor},0)`);
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // --- Depth tunnel rings (perspective effect) ---
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

    // --- Rotating spiral arms ---
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

    // --- Rim electric arc ring ---
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

    // --- Core inner glow ---
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

    // --- Particle debris orbiting ---
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

    // --- Outer rim solid ring ---
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

    // Radius boundary ring (faint dashed)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(140, 60, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3 pulsing rings
    for (let i = 0; i < 3; i++) {
      const t = now * (0.8 + i * 0.3) + phase + i * (Math.PI * 2 / 3);
      const ringR = 20 + i * 18 + Math.sin(t * 1.4) * 6;
      const alpha = 0.55 - i * 0.12 + Math.sin(t) * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 120, 255, ${alpha})`;
      ctx.lineWidth = 3 - i * 0.6;
      ctx.stroke();
    }

    // Core glow
    const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, 40);
    const pulse = 0.6 + Math.sin(now * 2.5 + phase) * 0.2;
    coreGrad.addColorStop(0, `rgba(220, 160, 255, ${pulse})`);
    coreGrad.addColorStop(0.4, `rgba(130, 40, 255, ${pulse * 0.7})`);
    coreGrad.addColorStop(1, `rgba(60, 0, 160, 0)`);
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Spiral arms
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
      ctx.strokeStyle = `rgba(200, 130, 255, ${0.35 - arm * 0.1})`;
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
  ctx.strokeStyle = encoderBeam.hit ? '#7fffd4' : '#888';
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

/* =========================
   DELETE BUTTON
========================= */
const deleteBtn = document.createElement("button");
deleteBtn.id="delete-object"; deleteBtn.textContent="DELETE";
Object.assign(deleteBtn.style,{
  marginTop:"10px", width:"100%", padding:"8px", borderRadius:"8px", border:"none",
  background:"linear-gradient(90deg,#ff3b3b,#cc0000)", color:"#fff", fontWeight:"700", cursor:"pointer",
  transition:"0.3s", letterSpacing:"1px"
});
deleteBtn.addEventListener("mouseenter",()=>{ deleteBtn.style.filter="brightness(1.2)"; deleteBtn.style.transform="scale(1.05)"; });
deleteBtn.addEventListener("mouseleave",()=>{ deleteBtn.style.filter="none"; deleteBtn.style.transform="scale(1)"; });
document.getElementById("prop-panel").appendChild(deleteBtn);

deleteBtn.addEventListener("click",()=>{
  if(!selectedBody) return;
  const name = selectedBody.label || "this object";
  if(confirm(`⚠️ Delete "${name}" permanently?`)){
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
  ctx.lineWidth=3; ctx.strokeStyle='rgba(0,255,255,0.6)'; ctx.stroke(); ctx.restore();
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