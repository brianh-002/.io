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

// Timer variables
let timer = 90; // 2 minutes in seconds
let timerInterval;

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
        // Stage 1 Evolution
        player.width = 64;
        player.height = 64;
        player.speed = 10;
        backgroundColor = "rgba(253, 61, 202, 0.5)"; // Optional: Change background color on evolution
        sprite.src = "/Assets/Player.png";
        bugItemImage.src = "/Assets/fleckmite-Head.png";
        mainSwarm = [{ x: player.x, y: player.y }];
        splitSwarm = [];
        hasSplit = false;
        player.evoStage = 1;
        console.log("Evolved to Stage 1! Bugs collected:", bugCount);
    } else if (player.evoStage === 1 && bugCount >= 60) {
        // Stage 2 Evolution
        player.width = 120;
        player.height = 120;
        player.speed = 8;
        sprite.src = "/Assets/Player.png";
        bugItemImage.src = "/Assets/fleckmite-Head.png";
        mainSwarm = [{ x: player.x, y: player.y }];
        splitSwarm = [];
        hasSplit = false;
        player.evoStage = 2;
        console.log("Evolved to Stage 2! Bugs collected:", bugCount);
    } else if (player.evoStage === 2 && bugCount >= 100) {
        // Stage 3 Evolution
        player.width = 200;
        player.height = 200;
        player.speed = 6;
        sprite.src = "/Assets/Player.png"; // Add a new sprite for this stage
        bugItemImage.src = "/Assets/fleckmite-Head.png"; // Add a new bug image for this stage
        mainSwarm = [{ x: player.x, y: player.y }];
        splitSwarm = [];
        hasSplit = false;
        player.evoStage = 3;
        console.log("Evolved to Stage 3! Bugs collected:", bugCount);
    } else if (player.evoStage === 3 && bugCount >= 150) {
        // Stage 4 Evolution
        player.width = 300;
        player.height = 300;
        player.speed = 4;
        sprite.src = "/Assets/Player.png"; // Add a new sprite for this stage
        bugItemImage.src = "/Assets/fleckmite-Head.png"; // Add a new bug image for this stage
        mainSwarm = [{ x: player.x, y: player.y }];
        splitSwarm = [];
        hasSplit = false;
        player.evoStage = 4;
        console.log("Evolved to Stage 4! Bugs collected:", bugCount);
    }
}

// Enemy
const enemy = {
    x: Math.random() * worldWidth,
    y: Math.random() * worldHeight,
    width: 64,
    height: 64,
    speed: 4,
    bugs: 20,
    chasing: false,
};

function updateEnemy() {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distanceToPlayer = Math.hypot(dx, dy);

    if (distanceToPlayer < 300) {
        enemy.chasing = true;
    } else {
        enemy.chasing = false;
    }

    if (enemy.chasing) {
        const magnitude = Math.hypot(dx, dy) || 1;
        enemy.x += (dx / magnitude) * enemy.speed;
        enemy.y += (dy / magnitude) * enemy.speed;
    } else {
        enemy.x += (Math.random() - 0.5) * enemy.speed;
        enemy.y += (Math.random() - 0.5) * enemy.speed;

        enemy.x = Math.max(0, Math.min(enemy.x, worldWidth - enemy.width));
        enemy.y = Math.max(0, Math.min(enemy.y, worldHeight - enemy.height));
    }
}

function drawEnemy() {
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x - camera.x, enemy.y - camera.y, enemy.width, enemy.height);
}

function checkEnemyCollision() {
    if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
    ) {
        if (mainSwarm.length > enemy.bugs) {
            console.log("Enemy defeated!");
            enemy.x = Math.random() * worldWidth;
            enemy.y = Math.random() * worldHeight;
        } else {
            console.log("Not enough bugs to defeat the enemy!");
        }
    }
}

const enemySwarm = [];
const enemyBugImage = new Image();
enemyBugImage.src = "/Assets/alien.png"; // Use the same PNG as the player

function initializeEnemySwarm() {
    for (let i = 0; i < 20; i++) {
        enemySwarm.push({
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            width: 32,
            height: 32,
        });
    }
}
initializeEnemySwarm();

function updateEnemySwarm() {
    enemySwarm.forEach(bug => {
        const dx = player.x - bug.x;
        const dy = player.y - bug.y;
        const distanceToPlayer = Math.hypot(dx, dy);

        if (distanceToPlayer < 300) {
            const magnitude = Math.hypot(dx, dy) || 1;
            bug.x += (dx / magnitude) * 2;
            bug.y += (dy / magnitude) * 2;
        } else {
            bug.x += (Math.random() - 0.5) * 2;
            bug.y += (Math.random() - 0.5) * 2;

            bug.x = Math.max(0, Math.min(bug.x, worldWidth - bug.width));
            bug.y = Math.max(0, Math.min(bug.y, worldHeight - bug.height));
        }
    });
}

function drawEnemySwarm() {
    enemySwarm.forEach(bug => {
        ctx.drawImage(enemyBugImage, bug.x - camera.x, bug.y - camera.y, bug.width, bug.height);
    });
}

function checkEnemySwarmCollision() {
    enemySwarm.forEach(bug => {
        if (
            player.x < bug.x + bug.width &&
            player.x + player.width > bug.x &&
            player.y < bug.y + bug.height &&
            player.y + player.height > bug.y
        ) {
            console.log("Touched by enemy swarm! Restarting the game...");
            restartGame();
        }
    });
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

    // Update and draw the enemy swarm
    updateEnemySwarm();
    drawEnemySwarm();
    checkEnemySwarmCollision();

    // Draw bug items
    bugItems.forEach(bug => {
        if (!bug.collected) {
            const img = new Image();
            img.src = bug.image;
            ctx.drawImage(img, bug.x - camera.x, bug.y - camera.y, bug.width, bug.height);
        }
    });

    // Draw the timer at the top of the screen
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText(`Time Remaining: ${timer}s`, 20, 40); // Fixed position at the top-left corner of the canvas

    requestAnimationFrame(gameloop);
}

// Timer logic
function startTimer() {
    timerInterval = setInterval(() => {
        timer--;
        console.log(`Time remaining: ${timer}s`);

        if (timer <= 0) {
            clearInterval(timerInterval);
            restartGame(); // Restart the game when the timer ends
        }
    }, 1000); // Update every second
}

function restartGame() {
    console.log("Time's up! Restarting the game...");
    location.reload(); // Refresh the page to restart the game
}

// Start game when sprite loads
sprite.onload = () => {
    startTimer(); // Start the timer
    gameloop();   // Start the game loop
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
