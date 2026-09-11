const c = document.getElementById("game");
const x = c.getContext("2d");
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const highEl = document.getElementById("high");
const lifeEl = document.getElementById("lives");
const diffModal = document.getElementById("difficulty-modal");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");

let high = +localStorage.getItem("arcadeHigh") || 0;
let running = false;
let score = 0;
let lives = 3;
let last = 0;
let spawn = 0;
let keys = {};
let objs = [];
let particles = [];
let shake = 0;

// ระบบความเร็วของจรวด
let speed = 10; // m/s
let speedTimer = 0;
let currentDiff = 'normal';

let p = {
    x: 450,
    targetX: 450,
    y: 485,
    w: 46,
    h: 34,
    moveSpeed: 550
};

highEl.textContent = high;

const DIFF_SETTINGS = {
    baby: { baseSpeed: 8, spawnRate: 0.6, penalty: 3, minSpeed: 5 },
    normal: { baseSpeed: 12, spawnRate: 0.45, penalty: 5, minSpeed: 8 },
    hard: { baseSpeed: 18, spawnRate: 0.3, penalty: 7, minSpeed: 10 },
    hardcore: { baseSpeed: 26, spawnRate: 0.18, penalty: 10, minSpeed: 12 }
};

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

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
    let coin = Math.random() < 0.22;
    objs.push({
        coin,
        x: 30 + Math.random() * (c.width - 60),
        y: -30,
        w: coin ? 25 : 36,
        h: coin ? 25 : 36,
        s: coin ? (190 + Math.random() * 70) : (240 + Math.random() * 140),
        r: Math.random() * 6
    });
}

function hit(a, b) {
    return a.x - a.w / 2 < b.x + b.w / 2 &&
           a.x + a.w / 2 > b.x - b.w / 2 &&
           a.y - a.h / 2 < b.y + b.h / 2 &&
           a.y + a.h / 2 > b.y - b.h / 2;
}

function burst(px, py, kind = "hit") {
    let n = kind === "coin" ? 18 : 32;
    for (let i = 0; i < n; i++) {
        let a = Math.random() * Math.PI * 2;
        let s = kind === "coin" ? 80 + Math.random() * 180 : 100 + Math.random() * 300;
        particles.push({
            x: px, y: py,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.45 + Math.random() * 0.45,
            max: 0.8,
            size: kind === "coin" ? 3 + Math.random() * 4 : 4 + Math.random() * 7,
            kind
        });
    }
}

function loop(t) {
    if (!running) return;
    let dt = Math.min((t - last) / 1000, 0.03);
    last = t;

    const config = DIFF_SETTINGS[currentDiff];

    // เพิ่มความเร็ว 1 m/s ทุกๆ 1 วินาที
    speedTimer += dt;
    if (speedTimer >= 1.0) {
        speedTimer -= 1.0;
        speed += 1;
    }

    score += dt * speed * 1.2;
    spawn += dt;

    if (spawn > config.spawnRate) {
        spawn = 0;
        add();
    }

    // เคลื่อนที่จรวดพร้อมแอนิเมชันความราบรื่น (Smooth movement)
    if (keys.a || keys.arrowleft) p.targetX -= p.moveSpeed * dt;
    if (keys.d || keys.arrowright) p.targetX += p.moveSpeed * dt;
    p.targetX = Math.max(30, Math.min(c.width - 30, p.targetX));
    p.x += (p.targetX - p.x) * 18 * dt;

    // อัปเดตอุปสรรคและเหรียญ
    objs.forEach(o => {
        o.y += (o.s + speed * 20) * dt;
        o.r += dt * 2;
    });

    // อัปเดตพาร์ทิเคิล
    particles.forEach(q => {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 240 * dt;
        q.life -= dt;
    });
    particles = particles.filter(q => q.life > 0);

    if (shake > 0) shake -= dt;

    // ตรวจจับการชน
    for (let i = objs.length - 1; i >= 0; i--) {
        let o = objs[i];
        if (hit(p, o)) {
            burst(o.x, o.y, o.coin ? "coin" : "hit");
            if (o.coin) {
                score += 50;
            } else {
                lives--;
                shake = 0.22;
                
                // ชนแล้วลดความเร็ว!
                speed = Math.max(config.minSpeed, speed - config.penalty);

                if (lives <= 0) {
                    running = false;
                    if (Math.floor(score) > high) {
                        high = Math.floor(score);
                        localStorage.setItem("arcadeHigh", high);
                    }
                    update();
                    draw(true);
                    return;
                }
            }
            objs.splice(i, 1);
        } else if (o.y > c.height + 40) {
            objs.splice(i, 1);
        }
    }

    update();
    draw();
    requestAnimationFrame(loop);
}

function update() {
    scoreEl.textContent = Math.floor(score);
    speedEl.textContent = Math.floor(speed) + " m/s";
    highEl.textContent = high;
    lifeEl.textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function draw(over = false) {
    x.save();
    if (shake > 0) x.translate((Math.random() - .5) * 14, (Math.random() - .5) * 14);

    let g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, "#07132a");
    g.addColorStop(1, "#12345b");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);

    // ดวงดาวขยับตามความเร็ว
    x.fillStyle = "#fff";
    let starOffset = (performance.now() * speed * 0.04) % c.height;
    for (let i = 0; i < 80; i++) {
        x.globalAlpha = 0.25 + (i % 4) * 0.12;
        let sy = ((i * 83) + starOffset) % c.height;
        x.fillRect((i * 137) % c.width, sy, 2, 2);
    }
    x.globalAlpha = 1;

    // ออบเจกต์ (อุกกาบาต/เหรียญ)
    objs.forEach(o => {
        x.save();
        x.translate(o.x, o.y);
        x.rotate(o.r);
        x.font = o.coin ? "34px 'Segoe UI Emoji','Apple Color Emoji',sans-serif" : "42px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.shadowColor = o.coin ? "#ffd43b" : "#ff5a3c";
        x.shadowBlur = 18;
        x.fillText(o.coin ? "🪙" : "☄️", 0, 0);
        x.restore();
    });

    // พาร์ทิเคิล
    particles.forEach(q => {
        x.globalAlpha = Math.max(0, q.life / q.max);
        x.fillStyle = q.kind === "coin" ? "#ffd84d" : "#ff7048";
        x.shadowColor = x.fillStyle;
        x.shadowBlur = 12;
        x.beginPath();
        x.arc(q.x, q.y, q.size, 0, Math.PI * 2);
        x.fill();
    });

    // ผู้เล่น (จรวด)
    x.globalAlpha = 1;
    x.shadowColor = "#63a7ff";
    x.shadowBlur = 20;
    x.font = "52px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("🚀", p.x, p.y);

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
    score = 0;
    lives = 3;
    speed = config.baseSpeed;
    speedTimer = 0;
    objs = [];
    particles = [];
    shake = 0;
    p.x = 450;
    p.targetX = 450;
    update();
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
}

function goHome() {
    window.parent.postMessage("close-game", "*");
}

draw();