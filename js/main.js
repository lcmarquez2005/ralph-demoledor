
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
const gameMusic = new Audio('assets/gameMusic.mp3');
const fixMusic = new Audio('assets/fixMusic.mp3');
const crashMusic = new Audio('assets/crashMusic.mp3');
const gameOverMusic = new Audio('assets/gameOver.mp3');

gameMusic.loop = true; // Repetir la música de fondo


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
    
        this.playerName;

        this.score = 0
        this.canvas = document.getElementById("gameCanvas");
        this.scoreTag = document.getElementById("score");
        this.livesTag = document.getElementById("lives");
        this.ctx = this.canvas.getContext("2d");
        this.canvasWidth = 420;

        this.canvasHeight = 600;
        this.canvas.width = this.canvasWidth-50;
        this.canvas.height = this.canvasHeight;
        this.buildingOffset = 0;
        this.scrollSpeed = 0.5;
        this.lives = 3;

        this.floors = [];
        this.fallingObjects = []; // Lista de objetos que caen
        this.fallingProbability = 0.00; // Probabilidad de que un objeto caiga
        this.init();
        this.collisionCooldown = false;
    }

    init() {
        this.cursor = new Cursor(this.canvas);
        this.ralph = new Ralph(this.canvasWidth, this.canvasHeight);
        this.generateInitialFloors();
        this.setupEventListeners();
        this.askPlayerName();
    }
    showGameIntro() {
       
        Swal.fire({
            title: "¡Bienvenido a Fix-It Felix!",
            html: `
                <p>¡Hola ${this.playerName}! 👋</p>
                <p><strong>¿En qué consiste el juego?</strong></p>
                <ul style="text-align: left;">
                    <li>🔨 Debes reparar las ventanas rotas haciendo clic en ellas.</li>
                    <li>🏚️ Ralph tratará de impedirlo lanzando bloques desde arriba.</li>
                    <li>💀 Evita los bloques que caen, o perderás una vida.</li>
                    <li>❤️ Tienes <strong>3 vidas</strong>. Si las pierdes, ¡el juego termina!</li>
                    <li>🚀 A medida que subes de nivel, el juego se vuelve más rápido y difícil.</li>
                </ul>
                <p>🎯 <strong>Objetivo:</strong> ¡Repara tantas ventanas como puedas y consigue el mejor puntaje!</p>
                <p>🎮 ¡Buena suerte!</p>
            `,
            confirmButtonText: "¡Comenzar!",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(() => {
            this.showFullscreenPrompt(); // Pregunta si quiere jugar a pantalla completa
        });
    }
    
    showFullscreenPrompt() {
        Swal.fire({
            title: "¿Quieres jugar en pantalla completa? 🎮",
            text: "¡Disfrutarás mejor la experiencia si juegas a pantalla completa!",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, activar",
            cancelButtonText: "No, gracias",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            this.startGame(); // Inicia el juego después de la presentación

            if (result.isConfirmed) {
                const element = document.documentElement;
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen(); // Firefox
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen(); // Chrome, Safari, Opera
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen(); // IE/Edge
                }
                Swal.fire({
                    icon: "success",
                    title: "¡Pantalla completa activada! 🚀",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: "info",
                    title: "Jugando en modo normal 😊",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
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
                        fixMusic.currentTime = 0; // Reinicia el audio antes de reproducirlo
                        fixMusic.play(); // Reproducir sonido de reparación
                            
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
            console.log("¡Juego terminado! Guardando puntaje...");
            gameMusic.pause(); // Detener la música de fondo
            gameOverMusic.play(); // Reproducir música de derrota

            database.sendScoreToFirebase(this.playerName, this.score).then(() => {
                Swal.fire({
                    icon: "error",
                    title: "¡Game Over! 🎮",
                    html: `
                        <p>Tu puntaje de <strong>${this.score}</strong> ha sido registrado correctamente. 🏆</p>
                        <p>¿Quieres intentarlo de nuevo?</p>
                    `,
                    showCancelButton: true,
                    confirmButtonText: "🔁 Reiniciar",
                    cancelButtonText: "❌ Salir",
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        location.reload(); // Reinicia el juego si elige reiniciar
                    } else {

                        }
                });

            }
        );
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
        this.dificultad();
    }

    checkCollisions() {
        if (this.collisionCooldown) return;  // Si el temporizador está activado, no detectar colisiones

        // Obtener las posiciones y tamaños de Ralph con el ajuste de 30px a la derecha
        const ralphX = this.ralph.x + 30;  // Desplazamos la colisión 30px a la derecha
        const ralphY = this.ralph.y;
        const ralphWidth = this.ralph.collisionWidth;  // Usamos el área de colisión ajustada
        const ralphHeight = this.ralph.collisionHeight;  // Usamos el área de colisión ajustada

        // Obtener las posiciones del cursor
        const cursorX = this.cursor.x;
        const cursorY = this.cursor.y;
        const cursorWidth = this.cursor.width;
        const cursorHeight = this.cursor.height;

        // Verificar si hay colisión entre el cursor y el área de colisión de Ralph
        if (cursorX < ralphX + ralphWidth &&
            cursorX + cursorWidth > ralphX &&
            cursorY < ralphY + ralphHeight &&
            cursorY + cursorHeight > ralphY) {
            console.log("¡El cursor ha chocado con Ralph!");
            crashMusic.currentTime = 0; // Reinicia el audio antes de reproducirlo
            crashMusic.play(); // Reproducir sonido de choque

            this.lives -= 1;
            Swal.fire({
                icon: "warning",
                title: "¡Has Perdido una Vida! 😢\nMuevete o Perderas otra!",
                text: `Vidas restantes: ${this.lives}`,
                toast: true,
                position: "top-end", // Otras opciones: 'bottom-end', 'top-start'
                showConfirmButton: false,
                timer: 1500, // Se cierra automáticamente después de 1.5 segundos
                timerProgressBar: true,
            });
            
            
            // Actualizar la UI de vidas restantes
            if (this.livesTag && this.livesTag.lastElementChild) {
                this.livesTag.removeChild(this.livesTag.lastElementChild);
                this.cursor.x = 150;  // Reiniciar posición del cursor
                this.cursor.y = 500;
            }

            // Activar el temporizador de cooldown
            this.collisionCooldown = true;

            // Desactivar el temporizador después de 200ms
            setTimeout(() => {
                this.collisionCooldown = false;  // Restaurar la detección de colisiones
            }, 1500);
        }

        // Comprobar las colisiones con los objetos que caen
        this.fallingObjects.forEach((obj, index) => {
            const closestX = Math.max(cursorX, Math.min(obj.x, cursorX + cursorWidth - 10));
            const closestY = Math.max(cursorY, Math.min(obj.y, cursorY + cursorHeight));

            const distanceX = obj.x - closestX;
            const distanceY = obj.y - closestY;
            const distanceSquared = distanceX * distanceX + distanceY * distanceY;

            if (distanceSquared <= obj.radius * obj.radius) {
                console.log("¡El círculo ha chocado con el cursor!");
                crashMusic.currentTime = 0; // Reinicia el audio antes de reproducirlo
                crashMusic.play(); // Reproducir sonido de choque
    
                this.lives -= 1;
                Swal.fire({
                    icon: "warning",
                    title: "¡Has Perdido una Vida! 😢\nMuevete o Perderas otra!",
                    text: `Vidas restantes: ${this.lives}`,
                    toast: true,
                    position: "top-end", // Otras opciones: 'bottom-end', 'top-start'
                    showConfirmButton: false,
                    timer: 1500, // Se cierra automáticamente después de 1.5 segundos
                    timerProgressBar: true,
                });
                
                if (this.livesTag && this.livesTag.lastElementChild) {
                    this.livesTag.removeChild(this.livesTag.lastElementChild);
                }
                this.fallingObjects.splice(index, 1); // Remove the object after collision
            }
        });
    }
    
    dificultad() {
        // Ajuste gradual de la probabilidad de caída
        this.fallingProbability = Math.min(0.003 + this.score / 5000, 0.1); // Aumenta lentamente la probabilidad hasta un máximo de 0.1
        
        // Ajuste gradual de la velocidad de desplazamiento
        this.scrollSpeed = Math.min(1.5, 0.5+  this.score / 50); // Reduce lentamente la velocidad a medida que aumenta la puntuación, pero no por debajo de 0.5
        console.log(this.scrollSpeed, this.fallingProbability)
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
        gameMusic.play()


        const gameLoop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    askPlayerName() {
        Swal.fire({
            title: "¡Bienvenido a Fix-It Felix! 🎮",
            input: "text",
            inputPlaceholder: "Introduce tu nombre",
            allowOutsideClick: false,
            allowEscapeKey: false,
            inputValidator: (value) => {
                if (!value) {
                    return "⚠️ Por favor, introduce tu nombre para continuar.";
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value.trim() !== "") {
                this.playerName = result.value.trim();
                document.getElementById("playerName").innerText = `Jugador: ${this.playerName}`;
                this.showGameIntro(); // Llamar a la presentación del juego después
            } else {
                window.location.reload(); // Recargar si no introduce un nombre
            }
        });
    }
    

}

class DB {
    constructor() {
        this.firebaseConfig = {
            apiKey: "AIzaSyCcG53GogS5OKe-L4y_jgge7ni9bW7LTQo",
            authDomain: "wreck-it-ralph-ada75.firebaseapp.com",
            databaseURL: "https://wreck-it-ralph-ada75-default-rtdb.firebaseio.com",
            projectId: "wreck-it-ralph-ada75",
            storageBucket: "wreck-it-ralph-ada75.firebasestorage.app",
            messagingSenderId: "13262546710",
            appId: "1:13262546710:web:b1f77828e41c75bb0b9237",
            measurementId: "G-8K52T8JZW4"
        };

        // Inicializar Firebase
        this.app = initializeApp(this.firebaseConfig);
        this.db = getFirestore(this.app);
    }

    async sendScoreToFirebase(playerName, score) {
        try {
            await addDoc(collection(this.db, "scores"), {
                name: playerName,
                score: score,
                timestamp: serverTimestamp()
            });
            console.log("Puntaje guardado en Firebase");
        } catch (error) {
            console.error("Error al guardar puntaje:", error);
        }
    }
    async getTopScores(limitCount = 5) {
        try {
            // Crear una consulta para obtener los puntajes ordenados de mayor a menor
            const q = query(
                collection(this.db, "scores"),
                orderBy("score", "desc"),
                limit(limitCount)  // Limitar a los mejores "limitCount" puntajes
            );

            // Obtener los documentos de la consulta
            const querySnapshot = await getDocs(q);

            // Crear un array con los puntajes y los nombres
            let topScores = [];
            querySnapshot.forEach((doc) => {
                topScores.push({
                    name: doc.data().name,
                    score: doc.data().score,
                    timestamp: doc.data().timestamp
                });
            });

            // Mostrar los puntajes en consola o realizar otras acciones
            console.log("Top Scores:", topScores);

            // Aquí puedes hacer algo con los datos, como mostrarlos en un HTML
            return topScores;
        } catch (error) {
            console.error("Error al obtener los mejores puntajes:", error);
        }
    }
}
const database = new DB();


// Llamar a la función para obtener los mejores puntajes
database.getTopScores().then(topScores => {
    // Crear un string de HTML para mostrar los puntajes
    let scoresHtml = "<h3>Top Scores</h3>";
    topScores.forEach((score, index) => {
        scoresHtml += `
            <p>Rank ${index + 1}: ${score.name} - ${score.score} puntos</p>
        `;
    });

    // Mostrar los puntajes en el div con id 'top-scores'
    document.getElementById("top-scores").innerHTML = scoresHtml;
});

// **Ejemplo de uso**:
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
        this.collisionWidth = this.width - 90;  // Ajustar el área de colisión
        this.collisionHeight = this.height - 30;  // Ajustar el área de colisión

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
let multiplier= 1
let window_width = 45   *(multiplier);

class Floor {
    static floorHeight = 80;
    static windowsPerFloor = 4;
    static windowWidth = window_width;
    static windowHeight = window_width;
    static windowSpacing = 28;
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
                x: 40*multiplier + i * (Floor.windowWidth + Floor.windowSpacing),
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
