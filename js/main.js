const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let mouseX = 0, mouseY = 0;
const cursorImg = new Image();
cursorImg.src = "assets/felix.png"; // Asegúrate de que la imagen existe

// Imagen de Ralph
const ralphImg = new Image();
ralphImg.src = "assets/felix.png"; // Asegúrate de que la imagen de Ralph exista

// Variables de Ralph
let ralphX = 0;
let ralphY = 0;
const ralphWidth = 64;
const ralphHeight = 128;

// Variables de salto
let jumpHeight = 20; // Altura máxima del salto
let jumpSpeed = 0.2; // Velocidad del salto (cuánto cambia la posición Y por frame)
let jumping = true;
let velocityY = 1; // Velocidad en el eje Y (vertical)
let gravity = 0.05; // Gravedad (aplica un efecto descendente al salto)

// Variables de movimiento horizontal
let ralphSpeed = 2; // Velocidad de movimiento horizontal
let direction = 1; // Dirección de movimiento (1 para derecha, -1 para izquierda)

// Actualizar la posición del mouse
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

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
const windowWidth = 50;
const windowHeight = 50;
const windowSpacing = 33;
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

    // Movimiento horizontal de Ralph (de izquierda a derecha)
    ralphX += ralphSpeed * direction;

    // Invertir la dirección de Ralph cuando llegue al borde de la pantalla
    if (ralphX + ralphWidth > canvasWidth || ralphX < 0) {
        direction = -direction; // Cambiar dirección de izquierda a derecha
    }

    // Movimiento vertical (simulando el salto)
    if (jumping) {
        velocityY -= gravity; // Aplica la gravedad
        ralphY += velocityY; // Suma la velocidad al movimiento vertical de Ralph

        // Limitar el salto, no debe caer por debajo del suelo
        if (ralphY >= 0) {
            ralphY = 0; // Ajustar al suelo
            velocityY = 0; // Detener la caída
        }

        // Hacer que suba y baje (simulando un salto continuo)
        if (ralphY === 0) {
            velocityY = jumpHeight; // Comienza un nuevo salto hacia arriba
        }
    }

    // Remover los pisos que han salido completamente de la pantalla
    while (floors.length > 0 && floors[floors.length - 1].y + buildingOffset >= canvasHeight) {
        floors.pop();
    }

    // Generar nuevos pisos en la parte superior
    while (floors.length < Math.ceil(canvasHeight / floorHeight) + 1) {
        const newY = (floors[0]?.y || canvasHeight) - floorHeight;
        generateFloor(newY);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#444";
    ctx.fillRect(40, 0, canvasWidth - 80, canvasHeight);
    
    // Primero dibujamos las ventanas
    floors.forEach(floor => {
        floor.windows.forEach(win => {
            ctx.fillStyle = win.broken ? "red" : "blue";
            ctx.fillRect(win.x, floor.y + buildingOffset, windowWidth, windowHeight);
        });
    });

    // Luego dibujamos a Ralph encima de las ventanas (con movimiento de salto)
    ctx.drawImage(ralphImg, ralphX, ralphY, ralphWidth, ralphHeight);

    drawCursor(); // Dibujar el cursor encima de todo
}

function drawCursor() {
    if (cursorImg.complete) { // Verifica que la imagen ha cargado antes de dibujarla
        ctx.drawImage(cursorImg, mouseX -32, mouseY -32, 90, 90);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Generar pisos iniciales
for (let i = 0; i < canvasHeight / floorHeight + 2; i++) {
    generateFloor(canvasHeight - i * floorHeight);
}

// Iniciar el juego cuando la imagen del cursor y Ralph hayan cargado
cursorImg.onload = () => {
    ralphImg.onload = () => {
        gameLoop();
    };
};

cursorImg.onerror = () => console.error("Error cargando la imagen del cursor.");
ralphImg.onerror = () => console.error("Error cargando la imagen de Ralph.");
