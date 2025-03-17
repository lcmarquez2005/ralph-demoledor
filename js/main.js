class FallingObject {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth; // Posición aleatoria en X
        this.y = -5; // Empieza fuera del canvas
        this.radius = 5;
        this.speed = Math.random() * 2 + 1; // Velocidad aleatoria entre 1 y 3
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.livesTag = document.getElementById("lives");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = 400;
        this.canvasHeight = 600;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.buildingOffset = 0;
        this.scrollSpeed = 0.5;
        this.lives = 3;
        this.livesTag.textContent = "Te quedan: " + this.lives + " vidas";

        this.floors = [];
        this.fallingObjects = []; // Lista de objetos que caen
        this.fallingProbability = 0.05; // Probabilidad de que un objeto caiga
        this.init();
    }

    init() {
        this.cursor = new Cursor(this.canvas);
        this.ralph = new Ralph(this.canvasWidth, this.canvasHeight);
        this.generateInitialFloors();
        this.setupEventListeners();
        this.startGame();
    }

    generateInitialFloors() {
        for (let i = 0; i < Math.ceil(this.canvasHeight / Floor.floorHeight) + 2; i++) {
            const y = this.canvasHeight - i * Floor.floorHeight;
            this.floors.push(new Floor(y));
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener("mousemove", (event) => this.cursor.updatePosition(event));
        this.canvas.addEventListener("click", (event) => this.handleClick(event));
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        this.floors.forEach(floor => {
            floor.windows.forEach(window => {
                let adjustedY = window.y + this.buildingOffset;
                if (clickX >= window.x && clickX <= window.x + window.width &&
                    clickY >= adjustedY && clickY <= adjustedY + window.height) {
                    if (window.broken) {
                        window.broken = false;
                        console.log("Ventana reparada en", window.x, adjustedY);
                    }
                }
            });
        });
    }

    update() {
        if (this.lives <= 0) {
            if (confirm("Game Over. ¿Quieres reiniciar?")) {
                location.reload();
            }
            exit;
        }
        this.buildingOffset += this.scrollSpeed;
        this.ralph.update();
        this.manageFloors();
        
        if (Math.random() < this.fallingProbability) {
            this.fallingObjects.push(new FallingObject(this.canvasWidth, this.canvasHeight));
        }
        
        this.fallingObjects = this.fallingObjects.filter(obj => {
            obj.update();
            return obj.y < this.canvasHeight;
        });
        
        this.checkCollisions();
    }
    checkCollisions() {
        this.fallingObjects.forEach((obj, index) => {
            // Find the closest point on the rectangle to the circle's center
            const closestX = Math.max(this.cursor.x, Math.min(obj.x , this.cursor.x + this.cursor.width-10));
            const closestY = Math.max(this.cursor.y, Math.min(obj.y, this.cursor.y + this.cursor.height));
    
            // Calculate the distance between the circle's center and the closest point on the rectangle
            const distanceX = obj.x - closestX;
            const distanceY = obj.y - closestY;
            const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
            // Check if the distance is less than or equal to the circle's radius
            if (distanceSquared <= obj.radius * obj.radius) {
                console.log("¡El círculo ha chocado con el cursor!");
                this.lives -= 1;
                alert("Has Perdido una Vida!\nVidas restantes:"+ this.lives);
                this.fallingObjects.splice(index, 1); // Remove the circle after collision
            }
        });
    
        // Check if the player has run out of lives
        if (this.lives <= 0) {
            console.log("¡Juego terminado! Felix ha perdido todas sus vidas.");
            // You might want to trigger a game over state here
        }
    }


    manageFloors() {
        // Remove floors that have scrolled out of view
        while (this.floors.length > 0 && this.floors[this.floors.length - 1].y + this.buildingOffset >= this.canvasHeight) {
            this.floors.pop();
        }
    
        // Add new floors at the top when the first floor starts to leave the screen
        if (this.floors.length > 0 && this.floors[0].y + this.buildingOffset > 0) {
            const newY = this.floors[0].y - Floor.floorHeight;
            this.floors.unshift(new Floor(newY));
        }
    }
    
    generateFloor(y) {
        const windows = [];
        for (let i = 0; i < Floor.windowsPerFloor; i++) {
            windows.push({
                x: 50 + i * (Floor.windowWidth + Floor.windowSpacing),
                y: y,
                width: Floor.windowWidth,
                height: Floor.windowHeight,
                broken: Math.random() < Floor.brokenWindowChance
            });
        }
        this.floors.unshift(new Floor(y, windows));  // Correct floor creation
        console.log('generating')
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctx.fillStyle = "#444";
        this.ctx.fillRect(40, 0, this.canvasWidth - 80, this.canvasHeight);
        this.floors.forEach(floor => floor.draw(this.ctx, this.buildingOffset));
        this.ralph.draw(this.ctx);
        this.cursor.draw(this.ctx);
        this.fallingObjects.forEach(obj => obj.draw(this.ctx));
    }

    startGame() {
        const gameLoop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

}

class Cursor {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 200;
        this.y = 500;
        this.width = 64;
        this.height = 64;
        this.img = new Image();
        this.img.src = "assets/felix.png";

        // Agregar el event listener para actualizar la posición del cursor
        canvas.addEventListener('mousemove', this.updatePosition.bind(this));
    }

    updatePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        // Actualizar inmediatamente la posición del cursor
        this.x = event.clientX - rect.left - this.width / 2;
        this.y = event.clientY - rect.top - this.height / 2;
    }

    draw(ctx) {
        if (this.img.complete) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
}



class Ralph {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = 100;
        this.y = 0;
        this.width = 128;
        this.height = 128;
        this.speed = 2;
        this.direction = 1;
        
        // Crear un canvas interno para dibujar el GIF
        this.ghostCanvas = document.createElement('canvas');
        this.ghostCanvas.width = this.width;
        this.ghostCanvas.height = this.height;
        this.ghostCtx = this.ghostCanvas.getContext('2d');

        this.gif = null;
        gifler("assets/ralph gif.gif").get((anim) => {
            this.gif = anim;
            this.gif.animateInCanvas(this.ghostCanvas);
        });
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x + this.width > this.canvasWidth || this.x < 0) {
            this.direction = -this.direction;
        }
    }

    draw(ctx) {
        if (this.gif) {
            ctx.drawImage(this.ghostCanvas, this.x, this.y, this.width, this.height);
        }
    }
}


class Floor {
    static floorHeight = 80;
    static windowsPerFloor = 4;
    static windowWidth = 50;
    static windowHeight = 50;
    static windowSpacing = 33;
    static brokenWindowChance = 0.3;

    constructor(y, windows = null) {
        this.y = y;
        this.windows = windows || this.generateWindows();
    }

    generateWindows() {
        const windows = [];
        for (let i = 0; i < Floor.windowsPerFloor; i++) {
            windows.push({
                x: 50 + i * (Floor.windowWidth + Floor.windowSpacing),
                y: this.y,
                width: Floor.windowWidth,
                height: Floor.windowHeight,
                broken: Math.random() < Floor.brokenWindowChance
            });
        }
        return windows;
    }

    draw(ctx, buildingOffset) {
        this.windows.forEach(win => {
            ctx.fillStyle = win.broken ? "red" : "blue";
            ctx.fillRect(win.x, this.y + buildingOffset, win.width, win.height);
        });
    }
}

// Initialize the game
new Game();
