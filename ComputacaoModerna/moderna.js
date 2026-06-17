const cardDatabase = [
    {
        id: "algoritmo",
        name: "Algoritmo",
        power: 7,
        type: "processamento",
        text: "Ganha forca quando vence cartas de dados.",
        beats: ["dados"],
        bonus: 3
    },
    {
        id: "banco",
        name: "Banco de Dados",
        power: 6,
        type: "dados",
        text: "Organiza informacoes e segura vantagem contra redes.",
        beats: ["rede"],
        bonus: 3
    },
    {
        id: "rede",
        name: "Rede",
        power: 5,
        type: "rede",
        text: "Distribui processamento e supera cartas de IA isoladas.",
        beats: ["ia"],
        bonus: 4
    },
    {
        id: "criptografia",
        name: "Criptografia",
        power: 6,
        type: "seguranca",
        text: "Protege a jogada e bloqueia ataques de bug.",
        beats: ["bug"],
        bonus: 5
    },
    {
        id: "ia",
        name: "Inteligencia Artificial",
        power: 8,
        type: "ia",
        text: "Aprende com a rodada anterior e pressiona o placar.",
        beats: ["processamento", "dados"],
        bonus: 2
    },
    {
        id: "bug",
        name: "Bug Critico",
        power: 4,
        type: "bug",
        text: "Fraco sozinho, mas derruba algoritmos descuidados.",
        beats: ["processamento"],
        bonus: 6
    }
];

let coins = Number(localStorage.getItem("coins")) || 0;
let players = [];
let pendingHumans = [];
let currentHumanIndex = 0;
let round = 0;
let roundLimit = 5;
let gameActive = false;
let lastWinningType = null;

const coinsDisplay = document.getElementById("coinsDisplay");
const setupPanel = document.getElementById("setupPanel");
const humanCountInput = document.getElementById("humanCount");
const aiCountInput = document.getElementById("aiCount");
const roundLimitInput = document.getElementById("roundLimit");
const startBtn = document.getElementById("startBtn");
const nextRoundBtn = document.getElementById("nextRoundBtn");
const roundDisplay = document.getElementById("roundDisplay");
const turnDisplay = document.getElementById("turnDisplay");
const prizeDisplay = document.getElementById("prizeDisplay");
const scoreboard = document.getElementById("scoreboard");
const cardChoices = document.getElementById("cardChoices");
const roundLog = document.getElementById("roundLog");

function updateCoins() {
    coinsDisplay.textContent = coins + " moedas";
}

async function saveRanking() {
    if (!window.supabaseClient || !coins) return;

    try {
        const { data } = await window.supabaseClient.auth.getUser();
        const user = data.user || JSON.parse(localStorage.getItem("user") || "null");
        const nome =
            user?.user_metadata?.name ||
            user?.user_metadata?.nome ||
            localStorage.getItem("playerName") ||
            user?.email ||
            "Anonimo";

        if (user?.id) {
            const { error } = await window.supabaseClient
                .from("ranking")
                .upsert({ user_id: user.id, nome, pontos: coins }, { onConflict: "user_id" });

            if (!error) return;
        }

        await window.supabaseClient.from("ranking").insert([{ nome, pontos: coins }]);
    } catch (error) {
        console.warn("Ranking nao salvo:", error);
    }
}

function getPrize() {
    return 60 + roundLimit * 10 + Math.max(0, players.length - 2) * 20;
}

function createPlayer(name, isAI) {
    return {
        name,
        isAI,
        score: 0,
        wins: 0,
        choice: null,
        lastCard: null
    };
}

function startGame() {
    const humanCount = Number(humanCountInput.value);
    const aiCount = Number(aiCountInput.value);
    roundLimit = Number(roundLimitInput.value);

    players = [];
    for (let i = 1; i <= humanCount; i++) {
        players.push(createPlayer("Jogador " + i, false));
    }
    for (let i = 1; i <= aiCount; i++) {
        players.push(createPlayer("IA " + i, true));
    }

    round = 1;
    gameActive = true;
    lastWinningType = null;
    setupPanel.style.display = "none";
    nextRoundBtn.disabled = true;
    roundLog.textContent = "Partida iniciada.";

    beginSelection();
}

function beginSelection() {
    players.forEach(player => {
        player.choice = null;
    });

    players.filter(player => player.isAI).forEach(player => {
        player.choice = chooseAiCard(player);
    });

    pendingHumans = players.filter(player => !player.isAI);
    currentHumanIndex = 0;
    renderAll();
    renderCardsForCurrentHuman();
}

function chooseAiCard(player) {
    const humanLastTypes = players
        .filter(opponent => !opponent.isAI && opponent.lastCard)
        .map(opponent => opponent.lastCard.type);

    const predictedType = humanLastTypes[0] || lastWinningType;
    const counters = cardDatabase.filter(card => predictedType && card.beats.includes(predictedType));

    if (counters.length && Math.random() < 0.72) {
        return counters[Math.floor(Math.random() * counters.length)];
    }

    const strongCards = cardDatabase.filter(card => card.power >= 6);
    return strongCards[Math.floor(Math.random() * strongCards.length)];
}

function renderAll() {
    roundDisplay.textContent = round + " / " + roundLimit;
    prizeDisplay.textContent = getPrize() + " moedas";
    renderScoreboard();
    updateCoins();
}

function renderScoreboard(winners = []) {
    scoreboard.innerHTML = "";

    players.forEach(player => {
        const card = document.createElement("article");
        card.className = "player-card";
        if (pendingHumans[currentHumanIndex] === player) card.classList.add("active");
        if (winners.includes(player)) card.classList.add("winner");

        const status = player.choice ? "Carta pronta" : "Aguardando";
        card.innerHTML =
            "<span>" + (player.isAI ? "Bot de IA" : "Competidor") + "</span>" +
            "<strong>" + player.name + "</strong>" +
            "<p>" + player.score + " pontos | " + player.wins + " vitorias</p>" +
            "<small>" + status + "</small>";

        scoreboard.appendChild(card);
    });
}

function renderCardsForCurrentHuman() {
    cardChoices.innerHTML = "";

    if (!gameActive) {
        turnDisplay.textContent = "Partida encerrada";
        return;
    }

    const player = pendingHumans[currentHumanIndex];

    if (!player) {
        turnDisplay.textContent = "Processando";
        resolveRound();
        return;
    }

    turnDisplay.textContent = player.name;

    cardDatabase.forEach(card => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-card";
        button.innerHTML =
            "<span class='power'>" + card.power + "</span>" +
            "<strong>" + card.name + "</strong>" +
            "<small>" + card.text + "</small>";

        button.addEventListener("click", () => selectHumanCard(player, card));
        cardChoices.appendChild(button);
    });
}

function selectHumanCard(player, card) {
    player.choice = card;
    player.lastCard = card;
    currentHumanIndex++;
    renderAll();
    renderCardsForCurrentHuman();
}

function scoreChoice(player) {
    let score = player.choice.power;

    players.forEach(opponent => {
        if (opponent === player || !opponent.choice) return;

        if (player.choice.beats.includes(opponent.choice.type)) {
            score += player.choice.bonus;
        }
        if (opponent.choice.beats.includes(player.choice.type)) {
            score -= 2;
        }
    });

    if (player.choice.type === "ia" && lastWinningType) {
        score += 1;
    }

    return Math.max(1, score);
}

function resolveRound() {
    const results = players.map(player => ({
        player,
        card: player.choice,
        score: scoreChoice(player)
    }));

    const bestScore = Math.max(...results.map(result => result.score));
    const winners = results
        .filter(result => result.score === bestScore)
        .map(result => result.player);

    winners.forEach(player => {
        player.score += 3;
        player.wins++;
    });

    results.forEach(result => {
        if (!winners.includes(result.player)) {
            result.player.score += 1;
        }
        result.player.lastCard = result.card;
    });

    lastWinningType = winners[0].choice.type;

    roundLog.textContent =
        "Rodada " + round + "\n\n" +
        results.map(result =>
            result.player.name + " usou " + result.card.name + " e marcou " + result.score
        ).join("\n") +
        "\n\nVencedor da rodada: " + winners.map(player => player.name).join(", ");

    renderScoreboard(winners);
    cardChoices.innerHTML = "";

    if (round >= roundLimit) {
        finishGame();
        return;
    }

    nextRoundBtn.disabled = false;
    turnDisplay.textContent = "Rodada resolvida";
}

async function finishGame() {
    gameActive = false;
    nextRoundBtn.disabled = true;
    setupPanel.style.display = "grid";

    const bestScore = Math.max(...players.map(player => player.score));
    const champions = players.filter(player => player.score === bestScore);
    const humanChampions = champions.filter(player => !player.isAI);
    const prize = getPrize();
    const participationReward = 20;
    const reward = humanChampions.length ? prize : participationReward;

    coins += reward;
    localStorage.setItem("coins", coins);
    updateCoins();

    roundLog.textContent +=
        "\n\nFim da partida." +
        "\nCampeao: " + champions.map(player => player.name).join(", ") +
        (humanChampions.length
            ? "\nMoedas recebidas: " + prize
            : "\nAs IAs venceram esta vez. Participacao: " + participationReward + " moedas.");

    turnDisplay.textContent = "Fim da partida";
    renderScoreboard(champions);
    saveRanking();
}

function nextRound() {
    round++;
    nextRoundBtn.disabled = true;
    beginSelection();
}

startBtn.addEventListener("click", startGame);
nextRoundBtn.addEventListener("click", nextRound);

updateCoins();
renderAll();
