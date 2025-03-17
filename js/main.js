class FallingObject {
    constructor(posicionX, posicionY, imageSrc) {
        this.x = posicionX+40; // Posición aleatoria en X
        this.y = posicionY+60; // Empieza fuera del canvas (ajustado para la altura de la imagen)
        this.speed = Math.random() * 2 + 1; // Velocidad aleatoria entre 1 y 3
        this.image = new Image(); // Crear una nueva imagen
        this.image.src = imageSrc; // Asignar la ruta de la imagen PNG
        this.width = 30; // Ancho de la imagen (ajustar según el tamaño de la imagen)
        this.height = 30; // Alto de la imagen (ajustar según el tamaño de la imagen)
        this.radius = 5
    }

    update() {
        this.y += this.speed; // Mover el objeto hacia abajo
    }

    draw(ctx) {
        if (this.image.complete) { // Asegurarse de que la imagen esté cargada
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}
class Game {
    constructor() {
    
        this.playerName = prompt("Introduce tu nombre: ");
        if (this.playerName == null || this.playerName == "") {
            window.location.reload();
        } else {
            alert("¡Hola " + this.playerName + "! ¡Bienvenido a Fix-It Felix!");
            document.getElementById("playerName").innerText = `Jugador: ${this.playerName}`;
        }
        this.score = 0
        this.canvas = document.getElementById("gameCanvas");
        this.scoreTag = document.getElementById("score");
        this.livesTag = document.getElementById("lives");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = 400;

        this.canvasHeight = 600;
        this.canvas.width = this.canvasWidth* multiplier;
        this.canvas.height = this.canvasHeight;
        this.buildingOffset = 0;
        this.scrollSpeed = 0.5;
        this.lives = 3;

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
                        window.disabled = true; // Bloquear temporalmente
    
                        console.log("Ventana reparada en", window.x, adjustedY);
                        this.score++;
                        this.scoreTag.innerText = `Score: ${this.score}`;
    
                        // Reactivar la ventana tras 100ms (evita dobles clics accidentales)
                        setTimeout(() => window.disabled = false, 100);
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
            this.fallingObjects.push(new FallingObject(this.ralph.x, this.ralph.y, "assets/brick.webp"));
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
                if (this.livesTag && this.livesTag.lastElementChild) {
                    this.livesTag.removeChild(this.livesTag.lastElementChild);
                } 
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

        this.ctx.fillRect(10, 0, this.canvasWidth+10 - (50*multiplier*2), this.canvasHeight);
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

class DB {
    constructor() {
        this.firebaseConfig = {
            apiKey: "TU_API_KEY",
            authDomain: "TU_AUTH_DOMAIN",
            projectId: "TU_PROJECT_ID",
            storageBucket: "TU_STORAGE_BUCKET",
            messagingSenderId: "TU_MESSAGING_SENDER_ID",
            appId: "TU_APP_ID"
        };

        // Inicializar Firebase
        firebase.initializeApp(this.firebaseConfig);
        this.db = firebase.firestore();
    }

    sendScoreToFirebase(playerName, score) {
        this.db.collection("scores").add({
            name: playerName,
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            console.log("Puntaje guardado en Firebase");
        })
        .catch((error) => {
            console.error("Error al guardar puntaje:", error);
        });
    }
}

// Uso:
const database = new DB();
// Llamar cuando el jugador pierde
database.sendScoreToFirebase("Jugador1", 1200);

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
    static x = 0;

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
multiplier= 0.90
window_width = 45   *(multiplier);

class Floor {
    static floorHeight = 80;
    static windowsPerFloor = 4;
    static windowWidth = window_width;
    static windowHeight = window_width;
    static windowSpacing = 33* multiplier;
    static brokenWindowChance = 0.3;

    constructor(y, windows = null) {
        this.y = y;
        this.windows = windows || this.generateWindows();
        this.windowImage = new Image(); // Image for normal windows
        this.windowImage.src = "assets/window.png"; // Path to normal window PNG
        this.brokenWindowImage = new Image(); // Image for broken windows
        this.brokenWindowImage.src = "assets/broken-window2.png"; // Path to broken window PNG
    }

    generateWindows() {
        const windows = [];
        for (let i = 0; i < Floor.windowsPerFloor; i++) {
            windows.push({
                x: 50*multiplier + i * (Floor.windowWidth + Floor.windowSpacing),
                y: this.y,
                width: Floor.windowWidth* multiplier,
                height: Floor.windowHeight *multiplier,
                broken: Math.random() < Floor.brokenWindowChance
            });
        }
        return windows;
    }

    draw(ctx, buildingOffset) {
        this.windows.forEach(win => {
            const image = win.broken ? this.brokenWindowImage : this.windowImage;
            if (image.complete) { // Ensure the image is loaded before drawing
                ctx.drawImage(image, win.x, this.y + buildingOffset, win.width, win.height);
            } else {
                // Fallback: Draw a colored rectangle if the image isn't loaded yet
                ctx.fillStyle = win.broken ? "red" : "blue";
                ctx.fillRect(win.x, this.y + buildingOffset, win.width, win.height);
            }
        });
    }
}

// Initialize the game
new Game();
