class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = 400;
        this.canvasHeight = 600;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.buildingOffset = 0;
        this.scrollSpeed = 0.5;
        this.lives = 3;
        this.floors = [];
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
        this.buildingOffset += this.scrollSpeed;
        this.ralph.update();
        this.manageFloors();
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
        this.x = 0;
        this.y = 0;
        this.img = new Image();
        this.img.src = "assets/felix.png";
    }

    updatePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.x = event.clientX - rect.left;
        this.y = event.clientY - rect.top;
    }

    draw(ctx) {
        if (this.img.complete) {
            ctx.drawImage(this.img, this.x - 32, this.y - 32, 90, 90);
        }
    }
}

class Ralph {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = 0;
        this.y = 0;
        this.width = 64;
        this.height = 128;
        this.speed =2;
        this.direction = 1;
        this.jumpHeight = 20;
        this.jumpSpeed = 0.2;
        this.jumping = true;
        this.velocityY = 1;
        this.gravity = 0.05;
        this.img = new Image();
        this.img.src = "assets/felix.png";
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x + this.width > this.canvasWidth || this.x < 0) {
            this.direction = -this.direction;
        }
        if (this.jumping) {
            this.velocityY -= this.gravity;
            this.y += this.velocityY;
            if (this.y >= 0) {
                this.y = 0;
                this.velocityY = 0;
            }
            if (this.y === 0) {
                this.velocityY = this.jumpHeight;
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
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
