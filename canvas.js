var canvas = document.querySelector("canvas");

const worldWidth = 6000;
const worldHeight = 3000;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

const map = new Image();
map.src = "/Assets/Final-map.png";

const sprite = new Image();
sprite.src = "/Assets/Player.png";

const keys = {};

const player = { x: 500, y: 500, width: 32, height: 32, speed: 8 };
const camera = { x: 0, y: 0 };
player.evoStage = 0;

const bugItems = [];
const bugItemImage = new Image();
bugItemImage.src = "/Assets/Player.png";

// Define item types with associated images and bug counts
const itemTypes = [
    { name: "End-Part", image: "/Assets/End-Part.png", bugs: 1 },
    { name: "Mid-Part", image: "/Assets/Mid-Part.png", bugs: 3 },
    { name: "Head", image: "/Assets/Head.png", bugs: 5 }
];

// Generate random bug items on the map
function spawnBugItems(count) {
    bugItems.length = 0;
    const typeCounts = {};
    itemTypes.forEach(type => typeCounts[type.name] = 0);

    let spawned = 0;
    while (spawned < count) {
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        if (typeCounts[type.name] < 10) {
            bugItems.push({
                x: Math.random() * (worldWidth - 32),
                y: Math.random() * (worldHeight - 32),
                width: 32,
                height: 32,
                collected: false,
                bugs: type.bugs,
                image: type.image
            });
            typeCounts[type.name]++;
            spawned++;
        }
        if (Object.values(typeCounts).every(v => v >= 10)) break;
    }
}
spawnBugItems(30);

// Swarms
let mainSwarm = [{ x: player.x, y: player.y }];
let splitSwarm = [];
let hasSplit = false;
let splitCooldown = 0;

// Collect bug items that the player collides with
function collectBugItems() {
    bugItems.forEach(bug => {
        if (!bug.collected) {
            // Check collision with all bugs in the mainSwarm
            mainSwarm.forEach(swarmBug => {
                if (
                    swarmBug.x < bug.x + bug.width &&
                    swarmBug.x + player.width > bug.x &&
                    swarmBug.y < bug.y + bug.height &&
                    swarmBug.y + player.height > bug.y
                ) {
                    bug.collected = true;
                    addBugToSwarm(bug.bugs);

                    // Respawn the item at a new random location with the same type
                    bug.x = Math.random() * (worldWidth - bug.width);
                    bug.y = Math.random() * (worldHeight - bug.height);
                    bug.collected = false;
                }
            });

            // Check collision with all bugs in the splitSwarm
            splitSwarm.forEach(swarmBug => {
                if (
                    swarmBug.x < bug.x + bug.width &&
                    swarmBug.x + player.width > bug.x &&
                    swarmBug.y < bug.y + bug.height &&
                    swarmBug.y + player.height > bug.y
                ) {
                    bug.collected = true;
                    addBugToSwarm(bug.bugs);

                    // Respawn the item at a new random location with the same type
                    bug.x = Math.random() * (worldWidth - bug.width);
                    bug.y = Math.random() * (worldHeight - bug.height);
                    bug.collected = false;
                }
            });
        }
    });
}

// Add a bug at a random offset around the player
function addBugToSwarm(count) {
    for (let i = 0; i < count; i++) {
        let last = mainSwarm.length > 0 ? mainSwarm[mainSwarm.length - 1] : player;
        mainSwarm.push({ x: last.x, y: last.y });
    }
}

// Draw swarm of bugs around player
function drawSwarm() {
    const attractionStrength = 0.1;
    const minDistance = 100;

    function updateSwarm(group) {
        for (let i = 0; i < group.length; i++) {
            const bug = group[i];

            // === GRAVITY-LIKE ATTRACTION TO PLAYER ===
            const dx = player.x - bug.x;
            const dy = player.y - bug.y;
            const distanceToPlayer = Math.hypot(dx, dy);

            if (distanceToPlayer > 1) {
                const pullX = dx * attractionStrength;
                const pullY = dy * attractionStrength;
                bug.x += pullX;
                bug.y += pullY;
            }

            // === BUG-TO-BUG COLLISION REPULSION ===
            for (let j = 0; j < group.length; j++) {
                if (i === j) continue;
                const other = group[j];
                const ox = bug.x - other.x;
                const oy = bug.y - other.y;
                const dist = Math.hypot(ox, oy);

                if (dist > 0 && dist < minDistance) {
                    const overlap = (minDistance - dist) / minDistance;
                    bug.x += (ox / dist) * overlap * 1.5;
                    bug.y += (oy / dist) * overlap * 1.5;
                }
            }

            ctx.drawImage(bugItemImage, bug.x - camera.x, bug.y - camera.y, 32, 32);
        }
    }

    updateSwarm(mainSwarm);

    if (hasSplit) {
        updateSwarm(splitSwarm);
        splitCooldown++;

        // Calculate average distance between player and splitSwarm bugs
        const avgDist = splitSwarm.reduce((acc, b) => {
            const dx = player.x - b.x;
            const dy = player.y - b.y;
            return acc + Math.hypot(dx, dy);
        }, 0) / splitSwarm.length;

        if (avgDist < 50 || splitCooldown > 600) {
            mainSwarm = mainSwarm.concat(splitSwarm);
            splitSwarm = [];
            hasSplit = false;
        }
    }
}

// Evolve player
function evolvePlayer() {
    const bugCount = mainSwarm.length + splitSwarm.length;

    if (player.evoStage === 0 && bugCount >= 30) {
        player.width = 64;
        player.height = 64;
        player.speed = 10;
        sprite.src = "/Assets/fleckmite-Head.png";
        bugItemImage.src = "/Assets/fleckmite-Head.png";
        mainSwarm = [{ x: player.x, y: player.y }];
        splitSwarm = [];
        hasSplit = false;
        player.evoStage = 1;
        console.log("Evolved to Stage 1! Bugs collected:", bugCount);
    } else if (player.evoStage === 1 && bugCount >= 60) {
        player.width = 120;
        player.height = 120;
        player.speed = 8;
        sprite.src = "/Assets/final-evo.png";
        bugItemImage.src = "/Assets/final-bug.png";
        mainSwarm = [{ x: player.x, y: player.y }];
        splitSwarm = [];
        hasSplit = false;
        player.evoStage = 2;
        console.log("Evolved to Stage 2! Bugs collected:", bugCount);
    }
}

// Main game loop
function gameloop() {
    let nextX = player.x;
    let nextY = player.y;

    if (keys['ArrowUp']) nextY -= player.speed;
    if (keys['ArrowDown']) nextY += player.speed;
    if (keys['ArrowRight']) nextX += player.speed;
    if (keys['ArrowLeft']) nextX -= player.speed;

    player.x = nextX;
    player.y = nextY;

    // Clamp player within world
    player.x = Math.max(0, Math.min(player.x, worldWidth - player.width));
    player.y = Math.max(0, Math.min(player.y, worldHeight - player.height));

    // Center camera on player
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // Clamp camera
    camera.x = Math.max(0, Math.min(camera.x, worldWidth - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, worldHeight - canvas.height));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the map
    ctx.drawImage(map, -camera.x, -camera.y, worldWidth, worldHeight);

    collectBugItems();
    evolvePlayer();
    drawSwarm();

    // Draw bug items
    bugItems.forEach(bug => {
        if (!bug.collected) {
            const img = new Image();
            img.src = bug.image;
            ctx.drawImage(img, bug.x - camera.x, bug.y - camera.y, bug.width, bug.height);
        }
    });

    requestAnimationFrame(gameloop);
}

// Start game when sprite loads
sprite.onload = () => {
    gameloop();
};

// Input handling
document.addEventListener('keydown', function (e) {
    keys[e.key] = true;

    if (e.code === "Space" && !hasSplit && mainSwarm.length > 1) {
        const half = Math.floor(mainSwarm.length / 2);
        splitSwarm = mainSwarm.splice(-half);
        hasSplit = true;
        splitCooldown = 0;

        // Push the splitSwarm forward based on current movement direction
        const dx = (keys['ArrowRight'] ? 1 : 0) - (keys['ArrowLeft'] ? 1 : 0);
        const dy = (keys['ArrowDown'] ? 1 : 0) - (keys['ArrowUp'] ? 1 : 0);

        const magnitude = Math.hypot(dx, dy) || 1; // Prevent divide by 0
        const pushDistance = 300; // Increased push distance

        for (let bug of splitSwarm) {
            bug.x += (dx / magnitude) * pushDistance;
            bug.y += (dy / magnitude) * pushDistance;
        }
    }
});

document.addEventListener('keyup', function (e) {
    keys[e.key] = false; // Reset the key state when released
});
