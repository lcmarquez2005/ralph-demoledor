const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = 400;
const canvasHeight = 600;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
let brokenWindowChance = 0.3;

let scrollSpeed = 0.5;
let buildingOffset = 0;
let lives = 3;
const windowsPerFloor = 4;
const floorHeight = 80;
const windowWidth = 60;
const windowHeight = 60;
const windowSpacing = 20;
const floors = [];

// Manejar clicks en ventanas
canvas.addEventListener("click", handleClick);

function generateFloor(y) {
    const windows = [];
    for (let i = 0; i < windowsPerFloor; i++) {
        const isBroken = Math.random() < brokenWindowChance;
        windows.push({
            x: 50 + i * (windowWidth + windowSpacing),
            y,
            width: windowWidth,
            height: windowHeight,
            broken: isBroken
        });
    }
    floors.unshift({ y, windows });
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    floors.forEach(floor => {
        floor.windows.forEach(window => {
            let adjustedY = window.y + buildingOffset; // Ajusta la posición de la ventana con el desplazamiento

            if (
                clickX >= window.x &&
                clickX <= window.x + window.width &&
                clickY >= adjustedY &&
                clickY <= adjustedY + window.height
            ) {
                if (window.broken) {
                    window.broken = false; // Reparar la ventana
                    console.log("Ventana reparada en", window.x, adjustedY);
                }
            }
        });
    });
}


function update() {
    buildingOffset += scrollSpeed;
    
    // Calculate total scroll distance in floors
    const totalFloorsScrolled = Math.floor(buildingOffset / floorHeight);

    // Remove only floors that have COMPLETELY scrolled off screen
    while (floors.length > 0 && 
           floors[floors.length - 1].y + (totalFloorsScrolled * floorHeight) >= canvasHeight) {
        floors.pop();
    }

    // Generate new floors at the top with precise positioning
    const neededTopFloors = Math.ceil((canvasHeight - (30)) / floorHeight) +1;
    while (floors.length < neededTopFloors) {
        const newY = (floors[0]?.y || canvasHeight) - floorHeight;
        generateFloor(newY);

    }
}





function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#444";
    ctx.fillRect(40, 0, canvasWidth - 80, canvasHeight);
    
    floors.forEach(floor => {
        floor.windows.forEach(win => {
            ctx.fillStyle = win.broken ? "red" : "blue";
            ctx.fillRect(win.x, floor.y + buildingOffset, windowWidth, windowHeight);
        });
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

for (let i = 0; i < canvasHeight / floorHeight + 2; i++) {
    generateFloor(canvasHeight - i * floorHeight);
}

gameLoop();
