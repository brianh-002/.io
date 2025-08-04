console.log("Hello, World!");

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
player.evoStage = 0;//////////////////


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
    // Track how many of each type have been spawned
    const typeCounts = {};
    itemTypes.forEach(type => typeCounts[type.name] = 0);

    let spawned = 0;
    while (spawned < count) {
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        if (typeCounts[type.name] < 10) { // Cap at 10 per type
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
        // If all types are capped, break to avoid infinite loop
        if (Object.values(typeCounts).every(v => v >= 10)) break;
    }
}
spawnBugItems(30);

const swarm = []; // Each entry is a bug sprite position

// Add a starting bug to the swarm
swarm.push({ x: player.x, y: player.y });

// Collect bug items that the player collides with
function collectBugItems() {
    bugItems.forEach(bug => {
        if (!bug.collected &&
            player.x < bug.x + bug.width &&
            player.x + player.width > bug.x &&
            player.y < bug.y + bug.height &&
            player.y + player.height > bug.y
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

// Add a bug at a random offset around the player
function addBugToSwarm(count) {
    for (let i = 0; i < count; i++) {
        let last = swarm.length > 0 ? swarm[swarm.length - 1] : player;
        swarm.push({ x: last.x, y: last.y });
    }
}

// Draw swarm of bugs around player
function drawSwarm() {
    const attractionStrength = 0.1;  // Pull toward player
    const minDistance = 100;          // Personal space radius

    for (let i = 0; i < swarm.length; i++) {
        const bug = swarm[i];

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
        for (let j = 0; j < swarm.length; j++) {
            if (i === j) continue;

            const other = swarm[j];
            const ox = bug.x - other.x;
            const oy = bug.y - other.y;
            const dist = Math.hypot(ox, oy);

            if (dist > 0 && dist < minDistance) {
                const overlap = (minDistance - dist) / minDistance;
                bug.x += (ox / dist) * overlap * 1.5;
                bug.y += (oy / dist) * overlap * 1.5;
            }
        }

        // === DRAW THE BUG ===
        ctx.drawImage(bugItemImage, bug.x - camera.x, bug.y - camera.y, 32, 32);
    }
}






function evolvePlayer() {
    if (player.evoStage === undefined) player.evoStage = 0;

    const bugCount = swarm.length;

    if (player.evoStage === 0 && bugCount >= 30) {
        player.width = 64;
        player.height = 64;
        player.speed = 10;
        sprite.src = "/Assets/fleckmite-Head.png";
        bugItemImage.src = "/Assets/fleckmite-Head.png";  // Change swarm bug image too
        swarm.length = 1; // Reset swarm to one bug centered on player
        swarm[0] = { x: player.x, y: player.y };
        player.evoStage = 1;
        console.log("Evolved to Stage 1! Bugs collected:", bugCount);
    } else if (player.evoStage === 1 && bugCount >= 60) {
        player.width = 120;
        player.height = 120;
        player.speed = 8;
        sprite.src = "/Assets/final-evo.png";
        bugItemImage.src = "/Assets/final-bug.png"; // Final bug image
        swarm.length = 1;
        swarm[0] = { x: player.x, y: player.y };
        player.evoStage = 2;
        console.log("Evolved to Stage 2! Bugs collected:", bugCount);
    } else if (player.evoStage === 2) {
        console.log("Already at max evolution.");
    } else {
        console.log(`Need more bugs to evolve. Current swarm: ${bugCount}`);
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
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x > worldWidth - player.width) player.x = worldWidth - player.width;
    if (player.y > worldHeight - player.height) player.y = worldHeight - player.height;

    // Update camera to center on player
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // Clamp camera within world
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
    if (camera.x > worldWidth - canvas.width) camera.x = worldWidth - canvas.width;
    if (camera.y > worldHeight - canvas.height) camera.y = worldHeight - canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the entire map at offset
    ctx.drawImage(map, -camera.x, -camera.y, worldWidth, worldHeight);

    // Draw player (adjust for camera)
    // ctx.drawImage(sprite, player.x - camera.x, player.y - camera.y, player.width, player.height);

    collectBugItems(); // Check for bug collection

    evolvePlayer(); // Check if player can evolve

    drawSwarm(); // Draw bugs around player

    // Draw bug items on map
    bugItems.forEach(bug => {
        if (!bug.collected) {
            const img = new Image();
            img.src = bug.image;
            ctx.drawImage(img, bug.x - camera.x, bug.y - camera.y, bug.width, bug.height);
        }
    });

    requestAnimationFrame(gameloop);
}

sprite.onload = () => {
    gameloop();
};

document.addEventListener('keydown', function(e) {
    keys[e.key] = true;
});
document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});


