const c = document.getElementById("game");
const x = c.getContext("2d");
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const lifeEl = document.getElementById("lives");
const diffModal = document.getElementById("difficulty-modal");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");

let run = false;
let score = 0;
let lives = 3;
let last = 0;
let spawn = 0;
let keys = {};
let cars = [];
let particles = [];
let shake = 0;

// ระบบความเร็วและการเปลี่ยนเลนราบรื่น
let speed = 10; // m/s
let speedTimer = 0;
let currentDiff = 'normal';

let p = {
    lane: 1,           // Target lane (0, 1, 2)
    currentX: 450,     // Smooth X position
    y: 475
};

const DIFF_SETTINGS = {
    baby: { baseSpeed: 8, spawnRate: 0.8, penalty: 3, minSpeed: 5 },
    normal: { baseSpeed: 12, spawnRate: 0.55, penalty: 5, minSpeed: 8 },
    hard: { baseSpeed: 18, spawnRate: 0.4, penalty: 7, minSpeed: 10 },
    hardcore: { baseSpeed: 25, spawnRate: 0.28, penalty: 10, minSpeed: 12 }
};

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function laneX(l) { return 285 + l * 165; }

function selectDifficulty(diff) {
    currentDiff = diff;
    diffModal.classList.add('hidden');
    startCountdown();
}

function startCountdown() {
    countdownOverlay.classList.remove('hidden');
    let count = 3;
    countdownText.textContent = count;
    
    let timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else if (count === 0) {
            countdownText.textContent = "START!";
        } else {
            clearInterval(timer);
            countdownOverlay.classList.add('hidden');
            startGameplay();
        }
    }, 1000);
}

function add() {
    cars.push({
        lane: Math.floor(Math.random() * 3),
        y: -60,
        s: (180 + Math.random() * 100)
    });
}

function hit(a, b) {
    return Math.abs(a.x - b.x) < 45 && Math.abs(a.y - b.y) < 55;
}

function burst(px, py) {
    for (let i = 0; i < 38; i++) {
        let a = Math.random() * Math.PI * 2;
        let s = 100 + Math.random() * 320;
        particles.push({
            x: px, y: py,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.4 + Math.random() * 0.5,
            max: 0.9,
            size: 3 + Math.random() * 7
        });
    }
}

function loop(t) {
    if (!run) return;
    let dt = Math.min((t - last) / 1000, 0.03);
    last = t;

    const config = DIFF_SETTINGS[currentDiff];

    // ทุกๆ 1 วินาที เพิ่มความเร็ว 1 m/s
    speedTimer += dt;
    if (speedTimer >= 1.0) {
        speedTimer -= 1.0;
        speed += 1;
    }

    score += dt * speed * 1.5;
    spawn += dt;

    if (spawn > config.spawnRate) {
        spawn = 0;
        add();
    }

    // Input สำหรับเปลี่ยนเลน
    if (keys.a || keys.arrowleft) {
        p.lane = Math.max(0, p.lane - 1);
        keys.a = false; keys.arrowleft = false;
    }
    if (keys.d || keys.arrowright) {
        p.lane = Math.min(2, p.lane + 1);
        keys.d = false; keys.arrowright = false;
    }

    // แอนิเมชันการเปลี่ยนเลนแบบ Lerp (ราบรื่น)
    let targetX = laneX(p.lane);
    p.currentX += (targetX - p.currentX) * 15 * dt;

    // เคลื่อนที่รถคันอื่นตามความเร็วเกม (Speed)
    cars.forEach(o => o.y += (o.s + speed * 25) * dt);

    // พาร์ทิเคิล
    particles.forEach(q => {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 220 * dt;
        q.life -= dt;
    });
    particles = particles.filter(q => q.life > 0);

    if (shake > 0) shake -= dt;

    // ตรวจจับการชน
    for (let i = cars.length - 1; i >= 0; i--) {
        let o = cars[i];
        if (hit({ x: p.currentX, y: p.y }, { x: laneX(o.lane), y: o.y })) {
            burst(laneX(o.lane), o.y);
            shake = 0.25;
            lives--;
            
            // ทุกครั้งที่ชน -> ความเร็วลดลง!
            speed = Math.max(config.minSpeed, speed - config.penalty);

            cars.splice(i, 1);
            if (lives <= 0) {
                run = false;
                update();
                draw(true);
                return;
            }
        } else if (o.y > 620) {
            cars.splice(i, 1);
        }
    }

    update();
    draw();
    requestAnimationFrame(loop);
}

function update() {
    scoreEl.textContent = Math.floor(score);
    speedEl.textContent = Math.floor(speed) + " m/s";
    lifeEl.textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function draw(over = false) {
    x.save();
    if (shake > 0) x.translate((Math.random() - .5) * 18, (Math.random() - .5) * 14);

    x.fillStyle = "#080d1b";
    x.fillRect(0, 0, c.width, c.height);

    // ถนน
    x.fillStyle = "#10192e";
    x.fillRect(200, 0, 500, c.height);

    // เส้นแบ่งเลน (ขยับตามความเร็ว)
    x.strokeStyle = "#ffffff30";
    x.lineWidth = 5;
    let dashOffset = (performance.now() * speed * 0.05) % 55;
    for (let i = 1; i < 3; i++) {
        x.setLineDash([30, 25]);
        x.lineDashOffset = -dashOffset;
        x.beginPath();
        x.moveTo(200 + i * 166, 0);
        x.lineTo(200 + i * 166, c.height);
        x.stroke();
    }
    x.setLineDash([]);

    // เอฟเฟกต์แสงข้างทาง
    x.globalAlpha = .7;
    for (let i = 0; i < 22; i++) {
        let yy = (i * 37 + (performance.now() * speed * 0.08)) % c.height;
        x.strokeStyle = "#5ce1ff55";
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(215 + i * 31, yy);
        x.lineTo(215 + i * 31, yy + 15);
        x.stroke();
    }
    x.globalAlpha = 1;

    // วาดรถคันอื่น
    cars.forEach(o => {
        x.save();
        x.shadowColor = "#ff4fd8";
        x.shadowBlur = 18;
        x.font = "56px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText("🚙", laneX(o.lane), o.y);
        x.restore();
    });

    // วาดพาร์ทิเคิล
    particles.forEach(q => {
        x.globalAlpha = Math.max(0, q.life / q.max);
        x.fillStyle = "#ffcf4a";
        x.shadowColor = "#ff4d4d";
        x.shadowBlur = 15;
        x.beginPath();
        x.arc(q.x, q.y, q.size, 0, Math.PI * 2);
        x.fill();
    });

    // วาดรถผู้เล่น (ใช้ตำแหน่ง p.currentX เพื่อความราบรื่น)
    x.globalAlpha = 1;
    x.save();
    x.shadowColor = "#39dfff";
    x.shadowBlur = 25;
    x.font = "62px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("🏎️", p.currentX, p.y);
    x.restore();

    x.restore();

    if (over) {
        x.fillStyle = "#000a";
        x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = "#fff";
        x.textAlign = "center";
        x.font = "bold 44px Arial";
        x.fillText("GAME OVER", 450, 250);
        x.font = "20px Arial";
        x.fillText("คะแนน " + Math.floor(score), 450, 290);
    }
}

document.getElementById("start").onclick = () => {
    diffModal.classList.remove('hidden');
};

function startGameplay() {
    const config = DIFF_SETTINGS[currentDiff];
    run = true;
    score = 0;
    lives = 3;
    speed = config.baseSpeed;
    speedTimer = 0;
    cars = [];
    particles = [];
    shake = 0;
    p.lane = 1;
    p.currentX = laneX(1);
    last = performance.now();
    update();
    requestAnimationFrame(loop);
}

function goHome() {
    window.parent.postMessage("close-game", "*");
}

draw();