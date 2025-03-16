const canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
const interactSound = new Audio('assets/bounce.mp3'); // Cambia por la URL del sonido si lo prefieres


const window_height = (window.innerHeight * 0.95);
const window_width = (window.innerWidth * 0.9 > 600) ? 600 : window.innerWidth * 0.9;
canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "#ff8";

let circles = [];
let eliminatedCount = 0;
let level = 1;
let numCirclesPerLevel = 3;
let baseSpeed = 0.5;

class Circle {
    constructor(x, y, radius, color, text, speedY) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;
        this.originalColor = color;
        this.text = text;
        this.dy = speedY;
        this.opacity = 1;
        this.markedForDeletion = false;
        this.clicked = false;
    }
    draw(context) {
        context.beginPath();
        context.globalAlpha = this.opacity;
        context.fillStyle = this.color;
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
        context.fill();
        
        // Agregar el borde negro
        context.strokeStyle = "black";  // Color del borde
        context.lineWidth = 3;          // Grosor del borde
        context.stroke();               // Dibuja el borde
        
        context.globalAlpha = 1;
        context.closePath();
    
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "20px Arial";
        context.fillText(this.text, this.posX, this.posY);
    }
    
    update() {
        // Existing movement code
        this.posY -= this.dy;
        this.posX += Math.sin(this.posY / 50) * 2;
        if (this.posX - this.radius < 0 || this.posX + this.radius > window_width) {
            this.posX -= Math.sin(this.posY / 50) * 2;
        }

        // New: Track total scroll progress
        const totalScroll = this.dy * (performance.now() - this.spawnTime);
        
        // Check if COMPLETELY off-screen (including radius)
        if (this.posY + this.radius < 0) {
            this.markedForDeletion = true;
        }

        // Fade-out logic only for clicked circles
        if (this.markedForDeletion) {
            this.opacity -= 0.15;
            if (this.opacity <= 0) {
                circles = circles.filter(c => c !== this);
                if (this.clicked) {
                    eliminatedCount++;
                    interactSound.play();
                    updateScore();
                    if (eliminatedCount >= numCirclesPerLevel) {
                        nextLevel();
                    }
                }
            }
        }
    }
}

// Modified update function with proper cleanup
function updateCircle() {
    requestAnimationFrame(updateCircle);
    ctx.clearRect(0, 0, window_width, window_height);

    // Update and remove in separate passes
    circles.forEach(circle => circle.update());
    
    // Immediate removal for off-screen circles
    circles = circles.filter(circle => 
        !circle.markedForDeletion && 
        circle.posY + circle.radius > 0
    );

    circles.forEach(circle => circle.draw(ctx));
}
function updateScore() {
    document.getElementById("score").innerText = `Eliminados: ${eliminatedCount} / ${numCirclesPerLevel} Nivel: ${level}`;
}

function nextLevel() {
    level++;
    eliminatedCount = 0;
    numCirclesPerLevel += Math.min(level, 10);
    baseSpeed += 0.2;
    circles = [];
    generateCircles();
}

canvas.addEventListener("mousemove", (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    
    circles.forEach(circle => {
        let dx = mouseX - circle.posX;
        let dy = mouseY - circle.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle.radius) {
            circle.color = "blue";
        } else {
            circle.color = circle.originalColor;
        }
    });
});
// Modificado para manejar clics correctamente en el canvas
canvas.addEventListener("click", (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    
    circles.forEach(circle => {
        let dx = mouseX - circle.posX;
        let dy = mouseY - circle.posY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        // Aumentamos el radio de clic en 2 píxeles
        if (distance < circle.radius + 2) {
            circle.markedForDeletion = true;
            circle.clicked = true;
        }
    });
});


function generateCircles() {
    for (let i = 0; i < numCirclesPerLevel; i++) {
        setTimeout(() => {
            let radius = Math.floor(Math.random() * 30) + 20;
            let posX = Math.random() * (window_width - radius * 2) + radius;
            let posY = window_height + radius;
            let speedY = Math.random() * 1.5 + baseSpeed;
            let color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            let text = `${i + 1}`;
            
            circles.push(new Circle(posX, posY, radius, color, text, speedY));
        }, Math.random() * 3000);
    }
}



generateCircles();
updateCircle();
