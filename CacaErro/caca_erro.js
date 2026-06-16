const cardGrid = document.getElementById("cardGrid");
const consoleLog = document.getElementById("consoleLog");
const timerEl = document.getElementById("timer");
const attemptsEl = document.getElementById("attempts");
const rewardPreviewEl = document.getElementById("rewardPreview");
const coinsDisplay = document.getElementById("coinsDisplay");
const newRoundBtn = document.getElementById("newRoundBtn");
const hintBtn = document.getElementById("hintBtn");
const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgainBtn");

const modules = [
    "LEITURA", "MEMORIA", "SALTO", "PILHA",
    "IMPRESSAO", "LOOP", "ENTRADA", "SAIDA",
    "SOMA", "INDICE", "FITA", "REGISTRO"
];

let cards = [];
let bugIndex = 0;
let attempts = 6;
let timeLeft = 60;
let roundActive = true;
let timerId = null;
let coins = Number(localStorage.getItem("coins")) || 0;

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(list) {
    return [...list].sort(() => Math.random() - 0.5);
}

function makePunches(index, corrupted) {
    const seed = index + (corrupted ? 7 : 3);
    return Array.from({ length: 24 }, (_, i) => (i * seed + index) % 5 === 0);
}

function updateCoins() {
    coinsDisplay.textContent = `${coins} moedas`;
}

function rewardValue() {
    return Math.max(25, 70 + timeLeft + attempts * 10);
}

function updateHud() {
    timerEl.textContent = `${timeLeft}s`;
    attemptsEl.textContent = attempts;
    rewardPreviewEl.textContent = rewardValue();
    updateCoins();
}

function distanceFromBug(index) {
    const bugRow = Math.floor(bugIndex / 4);
    const bugCol = bugIndex % 4;
    const row = Math.floor(index / 4);
    const col = index % 4;

    return Math.abs(bugRow - row) + Math.abs(bugCol - col);
}

function clueForDistance(distance) {
    if (distance === 0) return "ERRO LOCALIZADO: algo se moveu entre os furos.";
    if (distance === 1) return "Sinal quente: o checksum vibrou perto daqui.";
    if (distance === 2) return "Sinal morno: o lote falhou alguns cartões adiante.";
    return "Sinal frio: este cartão parece limpo.";
}

function cardNote(card, index) {
    if (!card.inspected) {
        return "Clique para examinar este cartão.";
    }

    return clueForDistance(distanceFromBug(index));
}

function renderCards() {
    cardGrid.innerHTML = "";

    cards.forEach((card, index) => {
        const button = document.createElement("button");
        button.className = "bug-card";
        button.type = "button";
        button.disabled = !roundActive;

        if (card.inspected) button.classList.add("inspected");
        if (card.found) button.classList.add("found");

        const punchRows = [0, 1, 2].map(row => {
            const holes = card.punches
                .slice(row * 8, row * 8 + 8)
                .map(open => `<span class="hole ${open ? "open" : ""}"></span>`)
                .join("");

            return `<div class="punch-row">${holes}</div>`;
        }).join("");

        button.innerHTML = `
            <span class="card-number">Cartao ${String(index + 1).padStart(2, "0")}</span>
            <span class="card-title">${card.module}</span>
            ${punchRows}
            <p class="card-note">${cardNote(card, index)}</p>
            <span class="beetle" aria-hidden="true">
                <span class="leg one"></span>
                <span class="leg two"></span>
                <span class="leg three"></span>
                <span class="leg four"></span>
            </span>
        `;

        button.addEventListener("click", () => inspectCard(index));
        cardGrid.appendChild(button);
    });
}

function writeConsole(message) {
    consoleLog.textContent = message;
}

function startTimer() {
    clearInterval(timerId);

    timerId = setInterval(() => {
        if (!roundActive) return;

        timeLeft--;
        updateHud();

        if (timeLeft <= 0) {
            endRound(false, "Tempo esgotado. O lote travou antes da captura.");
        }
    }, 1000);
}

function startRound() {
    const chosenModules = shuffle(modules).slice(0, 12);

    bugIndex = randomBetween(0, 11);
    attempts = 6;
    timeLeft = 60;
    roundActive = true;

    cards = chosenModules.map((module, index) => ({
        module,
        punches: makePunches(index, index === bugIndex),
        inspected: false,
        found: false
    }));

    resultModal.hidden = true;
    hintBtn.disabled = false;
    writeConsole("Lote carregado. O besouro esta escondido em um dos cartoes.");
    updateHud();
    renderCards();
    startTimer();
}

async function saveRanking() {
    if (!window.supabaseClient || !coins) {
        return;
    }

    const { data } = await window.supabaseClient.auth.getUser();
    const user = data.user;

    if (!user) {
        return;
    }

    const nome =
        user.user_metadata?.name ||
        user.user_metadata?.nome ||
        localStorage.getItem("playerName") ||
        user.email;

    const attemptsToSave = [
        () => window.supabaseClient
            .from("ranking")
            .upsert(
                { user_id: user.id, nome, pontos: coins },
                { onConflict: "user_id" }
            ),
        () => window.supabaseClient
            .from("ranking")
            .insert([{ user_id: user.id, nome, pontos: coins }]),
        () => window.supabaseClient
            .from("ranking")
            .insert([{ nome, pontos: coins }])
    ];

    for (const save of attemptsToSave) {
        const { error } = await save();

        if (!error) {
            return;
        }

        console.warn("Ranking nao salvo:", error.message);
    }
}

async function inspectCard(index) {
    if (!roundActive || cards[index].found) {
        return;
    }

    cards[index].inspected = true;
    attempts--;

    const distance = distanceFromBug(index);

    if (distance === 0) {
        cards[index].found = true;
        const reward = rewardValue();
        coins += reward;
        localStorage.setItem("coins", coins);
        await saveRanking();
        endRound(true, `Voce capturou o besouro e ganhou ${reward} moedas.`);
        return;
    }

    writeConsole(clueForDistance(distance));

    if (attempts <= 0) {
        endRound(false, "As tentativas acabaram. O besouro escapou para outro lote.");
        return;
    }

    updateHud();
    renderCards();
}

function useDetector() {
    if (!roundActive) return;

    const bugRow = Math.floor(bugIndex / 4) + 1;
    attempts = Math.max(1, attempts - 1);
    hintBtn.disabled = true;
    writeConsole(`Detector ativado: a anomalia esta na fileira ${bugRow}.`);
    updateHud();
}

function endRound(success, message) {
    roundActive = false;
    clearInterval(timerId);
    updateHud();
    renderCards();

    resultTitle.textContent = success ? "Erro depurado" : "Execucao interrompida";
    resultText.textContent = message;
    resultModal.hidden = false;
}

newRoundBtn.addEventListener("click", startRound);
hintBtn.addEventListener("click", useDetector);
playAgainBtn.addEventListener("click", startRound);

updateCoins();
startRound();
