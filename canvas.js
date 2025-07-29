console.log("Hello, World!"); // Prints a message to the console

var canvas = document.querySelector("canvas"); // Gets the first <canvas> element from the page

const worldWidth = 6000;
const worldHeight = 3000;
canvas.width = window.innerWidth; // Sets canvas width to the window's width
canvas.height = window.innerHeight; // Sets canvas height to the window's height
const ctx = canvas.getContext("2d"); // Gets the 2D drawing context for the canvas

const map = new Image(); // Creates a new image object for the map
map.src = "/Assets/Final-map.png"; // Sets the image source file for the map

const sprite = new Image(); // Creates a new image object
sprite.src = "/Assets/Player.png"; // Sets the image source file

const spritesheet = new Image(); // Creates a new image object for the sprite sheet
spritesheet.src = "/Assets/modelsheet.png"; // Sets the image source file for the sprite sheet

const frames = {
    idle: { sx: 0, sy: 0, sWidth: 64, sHeight: 64 },
    run: { sx: 64, sy: 0, sWidth: 64, sHeight: 64 },
    jump: { sx: 128, sy: 0, sWidth: 64, sHeight: 64 }
}

spritesheet.onload = () => {
    // You can add code here to run when the spritesheet loads
}

const keys = {}; // Initializes an empty object to track key states

const player = { x: 500, y: 500, width: 100, height: 100, speed: 8 }; // Player properties
const camera = { x: 0, y: 0 }; // Camera position

const searchItem = new Image(); // Creates a new image object for the search item
searchItem.src = "/Assets/PotOfGreed.png"; // Sets the image source file for the search item
const search = { x: 800, y: 500, width: 200, height: 200, collision: true }; // Defines the search item properties

const inventory = []; // Player's inventory array

const searchCollision = new Event("collision", { 
    bubbles: true, 
    cancelable: true
}); // Custom event for collision
searchCollision.detail = { type: "search" };

// Define hitbox size offsets for the search item
const hitboxOffset = 50; // how much bigger on each side

// Returns the expanded hitbox for the search item
function getSearchHitbox() {
    return {
        x: search.x - hitboxOffset,
        y: search.y - hitboxOffset,
        width: search.width + hitboxOffset * 2,
        height: search.height + hitboxOffset * 2
    };
}

// Checks if the player will collide with the search item's hitbox
function willCollide(nextX, nextY) {
    const hitbox = getSearchHitbox();
    return (
        nextX < hitbox.x + hitbox.width &&
        nextX + player.width > hitbox.x &&
        nextY < hitbox.y + hitbox.height &&
        nextY + player.height > hitbox.y
    );
}

let collisionUIShown = false; // Tracks if the collision UI is currently shown
let paused = false; // Game paused state

// Example items for inventory
const items = [
    { name: "Fleckmite-Head", type: "evo", src: "/Assets/Fleckmite-Head.png" },
    { name: "Mana Potion", type: "consumable", src: "/Assets/ManaPotion.png" },
    { name: "Mystery Item", type: "mystery", src: "" }
];

// Try to add an item to inventory with a chance
function trySearchItem() {
    if (Math.random() < 0.5) {
        const item = items[Math.floor(Math.random() * items.length)];
        // Check if item already exists in inventory
        const found = inventory.find(i => i.name === item.name);
        if (found) {
            found.count = (found.count || 1) + 1;
        } else {
            inventory.push({ ...item, count: 1 });
        }
        alert("You found: " + item.name + "!\nInventory: " + inventory.map(i => `${i.name} x${i.count || 1}`).join(", "));
    } else {
        alert("Nothing found this time!");
    }
    document.getElementById('collision-ui').style.display = 'none';
    collisionUIShown = false;
}

// Show inventory UI
function showInventory() {
    const inventoryUI = document.getElementById('inventory-ui');
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = "";

    if (inventory.length === 0) {
        inventoryList.innerHTML = "<div style='grid-column: span 3;'>(Empty)</div>";
    } else {
        inventory.forEach(item => {
            // Outer wrapper for cell and name
            const wrapper = document.createElement('div');
            wrapper.style.display = "flex";
            wrapper.style.flexDirection = "column";
            wrapper.style.alignItems = "center";

            // The cell (image, badge, etc.)
            const cell = document.createElement('div');
            cell.style.display = "flex";
            cell.style.flexDirection = "column";
            cell.style.alignItems = "center";
            cell.style.justifyContent = "center";
            cell.style.background = "transparent"; // Make cell background invisible
            cell.style.border = "none";            // Remove border
            cell.style.borderRadius = "0";         // Remove border radius
            cell.style.padding = "0";              // Remove extra padding
            cell.style.minHeight = "0";
            cell.style.width = "48px";
            cell.style.height = "48px";
            cell.style.position = "relative";

            // Item image
            if (item.src) {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.name;
                img.style.width = "48px";
                img.style.height = "48px";
                img.style.objectFit = "contain";
                cell.appendChild(img);

                // Quantity badge
                if (item.count && item.count > 1) {
                    const badge = document.createElement('div');
                    badge.textContent = item.count + "x";
                    badge.style.position = "absolute";
                    badge.style.top = "4px";
                    badge.style.right = "8px";
                    badge.style.background = "rgba(0,0,0,0.7)";
                    badge.style.color = "#fff";
                    badge.style.fontSize = "13px";
                    badge.style.padding = "2px 6px";
                    badge.style.borderRadius = "10px";
                    badge.style.pointerEvents = "none";
                    cell.appendChild(badge);
                }
            }

            // Append cell to wrapper
            wrapper.appendChild(cell);

            // Item name (outside the cell, below)
            const name = document.createElement('div');
            name.textContent = item.name;
            name.style.marginTop = "6px";
            name.style.fontSize = "14px";
            name.style.textAlign = "center";
            name.style.color = "#222";
            wrapper.appendChild(name);

            inventoryList.appendChild(wrapper);
        });
    }
    inventoryUI.style.display = 'block';
}

// Main game loop
function gameloop() {
    if (!paused) {
        let nextX = player.x;
        let nextY = player.y;

        if (keys['ArrowUp']) nextY -= player.speed;
        if (keys['ArrowDown']) nextY += player.speed;
        if (keys['ArrowRight']) nextX += player.speed;
        if (keys['ArrowLeft']) nextX -= player.speed;

        // Only move if not colliding with search item
        if (!willCollide(nextX, nextY)) {
            player.x = nextX;
            player.y = nextY;
            collisionUIShown = false; // Reset flag if not colliding
        } else if (!collisionUIShown) {
            // Player tried to move into the hitbox
            dispatchEvent(searchCollision);
            console.log("Collision with search item detected!");
            document.getElementById('collision-ui').style.display = 'block'; // Show UI
            collisionUIShown = true;
        }

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
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the entire map at offset
    ctx.drawImage(map, -camera.x, -camera.y, worldWidth, worldHeight);

    // Draw player (adjust for camera)
    ctx.drawImage(sprite, player.x - camera.x, player.y - camera.y, player.width, player.height);

    // Draw search item (visual size stays the same)
    ctx.drawImage(searchItem, search.x - camera.x, search.y - camera.y, search.width, search.height);

    // Loop
    requestAnimationFrame(gameloop);
}

sprite.onload = () => {
    gameloop();
};

// Unified keydown/keyup logic for all controls
document.addEventListener('keydown', function(e) {
    keys[e.key] = true;

    // If E is pressed and UI is shown, try to add item
    if ((e.key === 'e' || e.key === 'E') && collisionUIShown) {
        trySearchItem();
    }

    // Show inventory on Q (prevent default if needed)
    if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        showInventory();
    }
});

document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});



