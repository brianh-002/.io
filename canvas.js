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
spritesheet.src = "/Assets/modelsheet.png"; // Sets the image source file for the

const frames = {
    idle: { sx: 0, sy: 0, sWidth: 64, sHeight: 64 },
    run: { sx: 64, sy: 0, sWidth: 64, sHeight: 64 },
    jump: { sx: 128, sy: 0, sWidth: 64, sHeight: 64 }
}

spritesheet.onload = () => {

}





const keys = {}; // Initializes an empty object to track key states
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);


const player = { x: 500, y: 500, width: 100, height: 100, speed: 8 };
const camera = { x: 0, y: 0 };

const searchItem = new Image(); // Creates a new image object for the search item
searchItem.src = "/Assets/PotOfGreed.png"; // Sets the image source file for the search item
const search = { x: 800, y: 500, width: 200, height: 200, collision: true }; // Defines the search item properties

const searchCollision = new Event("collision", { 
    bubbles: true, 
    cancelable: true
});
searchCollision.detail = { type: "search" };

// Define hitbox size offsets
const hitboxOffset = 50; // how much bigger on each side

function getSearchHitbox() {
    return {
        x: search.x - hitboxOffset,
        y: search.y - hitboxOffset,
        width: search.width + hitboxOffset * 2,
        height: search.height + hitboxOffset * 2
    };
}

function willCollide(nextX, nextY) {
    const hitbox = getSearchHitbox();
    return (
        nextX < hitbox.x + hitbox.width &&
        nextX + player.width > hitbox.x &&
        nextY < hitbox.y + hitbox.height &&
        nextY + player.height > hitbox.y
    );
}

function gameloop() {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the entire map at offset
    ctx.drawImage(map, -camera.x, -camera.y, worldWidth, worldHeight);

    // Draw player (adjust for camera)
    ctx.drawImage(sprite, player.x - camera.x, player.y - camera.y, player.width, player.height);

    // Draw search item (visual size stays the same)
    ctx.drawImage(searchItem, search.x - camera.x, search.y - camera.y, search.width, search.height);

    // Get the expanded hitbox
    const searchHitbox = getSearchHitbox();

    // Check collision using the hitbox
    if (
        player.x < searchHitbox.x + searchHitbox.width &&
        player.x + player.width > searchHitbox.x &&
        player.y < searchHitbox.y + searchHitbox.height &&
        player.y + player.height > searchHitbox.y
    )  {
        dispatchEvent(searchCollision);
        console.log("Collision with search item detected!");
        document.getElementById('collision-ui').style.display = 'block'; // Show
    }

    // Loop
    requestAnimationFrame(gameloop);
}

sprite.onload = () => {
    gameloop();
};



