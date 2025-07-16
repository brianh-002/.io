console.log("Hello, World!");
var canvas = document.querySelector("canvas")
    ;
console.log(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext("2d");

// c.fillRect(500, 100, 100, 100);
// c.fillRect(700, 100, 100, 100);
console.log(c.x);
for (var i = 0; i < 5; i++) {
    console.log(i)
    // c.fillRect(100 + i * 200, 300, 100, 100);
    c.translate(100 + i * 200, 300);
    c.fillRect(100, 100, 100, 100);

}

console.log(c.x);