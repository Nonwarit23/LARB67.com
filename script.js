const games = {
  "dodge-rush": {
    title: "🚀 Dodge Rush",
    path: "games/dodge-rush/index.html"
  },
  "neon-racer": {
    title: "🏎️ Neon Racer",
    path: "games/neon-racer/index.html"
  }
};

function openGame(name){
  const game = games[name];
  if(!game) return;
  document.getElementById("gameTitle").textContent = game.title;
  document.getElementById("gameFrame").src = game.path;
  document.getElementById("gameModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeGame(){
  document.getElementById("gameModal").classList.add("hidden");
  document.getElementById("gameFrame").src = "";
  document.body.style.overflow = "";
}

document.addEventListener("keydown", e => {
  if(e.key === "Escape") closeGame();
});

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".card").forEach(card => {
    card.style.display = card.dataset.name.includes(q) ? "" : "none";
  });
});

window.addEventListener("message", e => { if(e.data === "close-game") closeGame(); });
