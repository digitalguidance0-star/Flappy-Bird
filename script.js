// ELEMENTS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bgColor = document.getElementById("bgColor").value;
let pipeShape = document.getElementById("pipeShape").value;

let scoreDisplay = document.getElementById("score");
let highScoreDisplay = document.getElementById("highScore");

let gameOverScreen = document.getElementById("gameOver");
let celebration = document.getElementById("celebration");

document.body.style.backgroundColor = bgColor;


// BIRD
let bird = { x: 80, y: 220, size: 20, velocity: 0 };


// OBSTACLES
let pipes = [];
let pipeGap = 180;
let pipeWidth = 50;
let pipeSpeed = 2;


// GAME STATE
let gravity = 0.5;
let jumpStrength = -8;
let score = 0;
let highScore = 0;
let timeSincePipe = 0;
let gameOver = false;


// COLOR CHANGE
document.getElementById("bgColor").addEventListener("change", e => {
    bgColor = e.target.value;
    document.body.style.backgroundColor = bgColor;
});

// SHAPE CHANGE
document.getElementById("pipeShape").addEventListener("change", e => {
    pipeShape = e.target.value;
});


// JUMP
function jump() {
    if (!gameOver) bird.velocity = jumpStrength;
}

canvas.addEventListener("click", () => {
    if (gameOver) restartGame();
    else jump();
});

document.addEventListener("keydown", e => {
    if (e.code === "Space") {
        if (gameOver) restartGame();
        else jump();
        e.preventDefault();
    }
});


// CREATE OBSTACLE
function createPipe() {
    let topHeight = Math.random() * 180 + 70;
    let bottomHeight = canvas.height - topHeight - pipeGap;

    let pipe = {
        x: canvas.width,
        width: pipeWidth,
        top: topHeight,
        bottom: bottomHeight,
        passed: false,
        shape: pipeShape
    };

    // HEARTS MOVE AROUND
    if (pipeShape === "heart") {
        pipe.drift = (Math.random() * 1.7) + 0.4;
        pipe.direction = Math.random() < 0.5 ? -1 : 1;
    }

    pipes.push(pipe);
}


// HEART SHAPE
function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size, x, y + size * 1.3);
    ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
}


// RESET
function restartGame() {
    score = 0;
    scoreDisplay.textContent = "Flappy Points: 0";

    bird = { x: 80, y: 220, size: 20, velocity: 0 };

    pipes = [];
    timeSincePipe = 0;
    gameOver = false;

    gameOverScreen.style.display = "none";
    celebration.style.display = "none";
}


// UPDATE LOOP
function update() {
    if (gameOver) return;

    bird.velocity += gravity;
    bird.y += bird.velocity;

    // OUT OF BOUNDS
    if (bird.y - bird.size < 0 || bird.y + bird.size > canvas.height) {
        triggerGameOver();
        return;
    }

    // GENERATE PIPES
    timeSincePipe++;
    if (timeSincePipe > 130) {
        createPipe();
        timeSincePipe = 0;
    }

    // MOVE OBSTACLES
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        // HEARTS DRIFT
        if (pipe.shape === "heart") {
            pipe.top += pipe.drift * pipe.direction;
            pipe.bottom -= pipe.drift * pipe.direction;

            if (pipe.top < 70 || pipe.bottom < 70) {
                pipe.direction *= -1;
            }
        }

        // SCORING
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            score++;
            scoreDisplay.textContent = "Flappy Points: " + score;

            if (score > highScore) {
                highScore = score;
                highScoreDisplay.textContent = "High Score: " + highScore;

                celebration.style.display = "block";
                celebration.classList.add("pop");

                spawnConfetti(window.innerWidth / 2, 80);
                floatHeart(window.innerWidth / 2, 120);

                setTimeout(() => {
                    celebration.style.display = "none";
                    celebration.classList.remove("pop");
                }, 1800);
            }
        }

        // COLLISION
        const hitTop =
            bird.x + bird.size > pipe.x &&
            bird.x - bird.size < pipe.x + pipe.width &&
            bird.y - bird.size < pipe.top;

        const hitBottom =
            bird.x + bird.size > pipe.x &&
            bird.x - bird.size < pipe.x + pipe.width &&
            bird.y + bird.size > canvas.height - pipe.bottom;

        if (hitTop || hitBottom) triggerGameOver();
    });

    // CLEAR REMOVED PIPES
    pipes = pipes.filter(p => p.x + p.width > 0);
}


// GAME OVER HANDLER
function triggerGameOver() {
    gameOver = true;
    gameOverScreen.style.display = "flex";
}


// DRAW LOOP
function draw() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // BIRD
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
    ctx.fill();

    // OBSTACLES
    ctx.fillStyle = "green";

    pipes.forEach(pipe => {
        if (pipe.shape === "rect") {
            ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
            ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
        }

        if (pipe.shape === "square") {
            ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
            ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
        }

        if (pipe.shape === "circle") {
            ctx.beginPath();
            ctx.arc(pipe.x + pipe.width / 2, pipe.top - 20, 35, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pipe.x + pipe.width / 2, canvas.height - pipe.bottom + 20, 35, 0, Math.PI * 2);
            ctx.fill();
        }

        if (pipe.shape === "heart") {
            drawHeart(pipe.x + pipe.width / 2, pipe.top - 50, 40);
            drawHeart(pipe.x + pipe.width / 2, canvas.height - pipe.bottom - 10, 40);
        }
    });
}


// GAME LOOP
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();


// CONFETTI EFFECT
function spawnConfetti(x, y) {
    for (let i = 0; i < 25; i++) {
        const piece = document.createElement("div");
        piece.classList.add("confetti");

        piece.style.left = x + "px";
        piece.style.top = y + "px";
        piece.style.backgroundColor =
            ["red", "blue", "yellow", "green", "purple"][Math.floor(Math.random() * 5)];

        document.body.appendChild(piece);

        setTimeout(() => piece.remove(), 1200);
    }
}

// FLOATING HEARTS
function floatHeart(x, y) {
    const h = document.createElement("div");
    h.classList.add("heart-float");
    h.textContent = "❤️";

    h.style.left = x + "px";
    h.style.top = y + "px";

    document.body.appendChild(h);

    setTimeout(() => h.remove(), 2500);
}
