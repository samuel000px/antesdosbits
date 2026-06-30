const INSTRUCTION_CARDS = [
    {
        id: "read",
        name: "READ C",
        title: "Entrada de dado",
        meaning: "O leitor deve perfurar um cartao que representa a instrucao READ C.",
        holes: [1, 14, 25, 38, 49],
        difficulty: "basico"
    },
    {
        id: "calc",
        name: "F = C * 9 / 5 + 32",
        title: "Calculo FORTRAN",
        meaning: "Monte a instrucao de processamento matematico usada para converter temperatura.",
        holes: [0, 5, 13, 18, 29, 34, 47, 58],
        difficulty: "medio"
    },
    {
        id: "ifgoto",
        name: "IF (N) 10,20,30",
        title: "Desvio condicional",
        meaning: "Perfure a instrucao que muda o fluxo do programa conforme o valor de N.",
        holes: [3, 9, 12, 21, 30, 42, 51, 57],
        difficulty: "medio"
    },
    {
        id: "print",
        name: "PRINT RESULT",
        title: "Saida impressa",
        meaning: "Represente o cartao que envia o resultado para impressao.",
        holes: [2, 16, 23, 31, 36, 44, 55],
        difficulty: "basico"
    },
    {
        id: "loop",
        name: "DO 20 I = 1,10",
        title: "Laco numerico",
        meaning: "Monte o cartao que repete uma rotina numerada.",
        holes: [4, 7, 15, 20, 26, 33, 41, 52, 59],
        difficulty: "dificil"
    },
    {
        id: "stop",
        name: "STOP",
        title: "Fim do programa",
        meaning: "Perfure o cartao que encerra a execucao do lote.",
        holes: [6, 17, 22, 28, 39, 46, 53],
        difficulty: "basico"
    }
];

const GRID_SIZE = 60;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_PLAYERS = 6;
const ROUND_BASE_POINTS = 120;

function createPlayerId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return "player-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

let coins = Number(localStorage.getItem("coins")) || 0;
let channel = null;
let roomCode = "";
let isHost = false;
let playerId = localStorage.getItem("modernPlayerId") || createPlayerId();
let playerName = localStorage.getItem("playerName") || "";
let selectedHoles = new Set();
let localSubmitted = false;
let roundStartedAt = 0;
let hostState = createEmptyState();

localStorage.setItem("modernPlayerId", playerId);

const coinsDisplay = document.getElementById("coinsDisplay");
const playerNameInput = document.getElementById("playerName");
const roomCodeInput = document.getElementById("roomCodeInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const aiCountInput = document.getElementById("aiCount");
const roundLimitInput = document.getElementById("roundLimit");
const startBtn = document.getElementById("startBtn");
const nextRoundBtn = document.getElementById("nextRoundBtn");
const roomDisplay = document.getElementById("roomDisplay");
const roundDisplay = document.getElementById("roundDisplay");
const turnDisplay = document.getElementById("turnDisplay");
const prizeDisplay = document.getElementById("prizeDisplay");
const scoreboard = document.getElementById("scoreboard");
const cardChoices = document.getElementById("cardChoices");
const roundLog = document.getElementById("roundLog");
const energyDisplay = document.getElementById("energyDisplay");
const jobTitle = document.getElementById("jobTitle");
const jobDescription = document.getElementById("jobDescription");
const jobFocus = document.getElementById("jobFocus");
const jobHazard = document.getElementById("jobHazard");
const jobMachine = document.getElementById("jobMachine");

playerNameInput.value = playerName || "Jogador";

function createEmptyState() {
    return {
        roomCode: "",
        hostId: "",
        status: "lobby",
        round: 0,
        roundLimit: 5,
        targetId: INSTRUCTION_CARDS[0].id,
        roundStartedAt: 0,
        players: [],
        submissions: {},
        log: "Crie ou entre em uma sala para comecar.",
        winners: [],
        matchWinnerIds: []
    };
}

function updateCoins() {
    coinsDisplay.textContent = coins + " moedas";
}

function cleanName(name) {
    return (name || "Jogador").trim().slice(0, 18) || "Jogador";
}

function makeRoomCode() {
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
}

function getTarget(targetId = hostState.targetId) {
    return INSTRUCTION_CARDS.find(card => card.id === targetId) || INSTRUCTION_CARDS[0];
}

function chooseTargetForRound(round) {
    const seed = roomCode.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return INSTRUCTION_CARDS[(seed + round * 2) % INSTRUCTION_CARDS.length];
}

function getPrize() {
    const humans = hostState.players.filter(player => !player.isAI).length;
    return 100 + hostState.roundLimit * 18 + Math.max(0, humans - 1) * 45;
}

function setLocalName() {
    playerName = cleanName(playerNameInput.value);
    localStorage.setItem("playerName", playerName);
}

async function connectRoom(code, hostMode) {
    if (!window.supabaseClient) {
        roundLog.textContent = "Supabase nao carregou. Abra por servidor local ou internet para jogar online.";
        return;
    }

    if (channel) {
        await window.supabaseClient.removeChannel(channel);
    }

    setLocalName();
    roomCode = code.toUpperCase();
    isHost = hostMode;
    resetLocalCard();

    channel = window.supabaseClient.channel("modern-room-" + roomCode, {
        config: { broadcast: { self: true } }
    });

    channel
        .on("broadcast", { event: "join_request" }, ({ payload }) => {
            if (isHost) addOnlinePlayer(payload.player);
        })
        .on("broadcast", { event: "state_update" }, ({ payload }) => applyState(payload.state))
        .on("broadcast", { event: "submit_pattern" }, ({ payload }) => {
            if (isHost) receiveSubmission(payload);
        })
        .on("broadcast", { event: "start_game" }, () => {
            if (isHost) hostStartGame();
        })
        .on("broadcast", { event: "next_round" }, () => {
            if (isHost) hostNextRound();
        })
        .subscribe(status => {
            if (status !== "SUBSCRIBED") {
                roundLog.textContent = "Conectando a sala " + roomCode + "...";
                return;
            }

            if (isHost) {
                hostState = createEmptyState();
                hostState.roomCode = roomCode;
                hostState.hostId = playerId;
                addOnlinePlayer({ id: playerId, name: playerName });
                hostState.log = "Sala " + roomCode + " criada. Compartilhe o codigo.";
                broadcastState();
            } else {
                sendEvent("join_request", {
                    player: { id: playerId, name: playerName }
                });
                roundLog.textContent = "Entrando na sala " + roomCode + "...";
            }
        });

    render();
}

function sendEvent(event, payload = {}) {
    if (!channel) return;
    channel.send({ type: "broadcast", event, payload });
}

function broadcastState() {
    render();
    sendEvent("state_update", { state: hostState });
}

function addOnlinePlayer(player) {
    if (!player || !player.id || hostState.players.some(existing => existing.id === player.id)) {
        broadcastState();
        return;
    }

    if (hostState.players.length >= MAX_PLAYERS || hostState.status !== "lobby") return;

    hostState.players.push({
        id: player.id,
        name: cleanName(player.name),
        isAI: false,
        score: 0,
        wins: 0,
        lastAccuracy: 0,
        lastTime: 0,
        ready: false
    });

    hostState.log = cleanName(player.name) + " entrou na sala.";
    broadcastState();
}

function applyState(nextState) {
    if (!nextState || nextState.roomCode !== roomCode) return;

    const previousRound = hostState.round;
    const previousStatus = hostState.status;
    hostState = nextState;

    if (previousRound !== hostState.round || previousStatus !== hostState.status && hostState.status === "choosing") {
        resetLocalCard();
    }

    roundStartedAt = hostState.roundStartedAt || Date.now();

    if (hostState.status === "finished" && hostState.matchWinnerIds.includes(playerId)) {
        awardCoins(getPrize());
    }

    render();
}

function awardCoins(amount) {
    const awardKey = "modernAward:" + roomCode + ":" + hostState.round;
    if (localStorage.getItem(awardKey)) return;

    localStorage.setItem(awardKey, "1");
    coins += amount;
    localStorage.setItem("coins", coins);
    updateCoins();
}

function hostStartGame() {
    if (!isHost || hostState.status !== "lobby") return;

    const aiCount = Number(aiCountInput.value);
    hostState.roundLimit = Number(roundLimitInput.value);
    hostState.round = 1;
    hostState.targetId = chooseTargetForRound(hostState.round).id;
    hostState.roundStartedAt = Date.now();
    hostState.status = "choosing";
    hostState.submissions = {};
    hostState.winners = [];
    hostState.matchWinnerIds = [];

    hostState.players = hostState.players.filter(player => !player.isAI);
    for (let i = 1; i <= aiCount && hostState.players.length < MAX_PLAYERS; i++) {
        hostState.players.push({
            id: "ai-" + i,
            name: "IA Perfuradora " + i,
            isAI: true,
            score: 0,
            wins: 0,
            lastAccuracy: 0,
            lastTime: 0,
            ready: false
        });
    }

    hostState.players.forEach(player => {
        player.ready = false;
        player.lastAccuracy = 0;
        player.lastTime = 0;
    });

    hostState.log = "Partida iniciada. Instrucao alvo: " + getTarget().name + ".";
    makeAiSubmissions();
    broadcastState();
    tryResolveRound();
}

function hostNextRound() {
    if (!isHost || hostState.status !== "resolved") return;

    if (hostState.round >= hostState.roundLimit) {
        finishMatch();
        return;
    }

    hostState.round++;
    hostState.targetId = chooseTargetForRound(hostState.round).id;
    hostState.roundStartedAt = Date.now();
    hostState.status = "choosing";
    hostState.submissions = {};
    hostState.winners = [];
    hostState.players.forEach(player => {
        player.ready = false;
        player.lastAccuracy = 0;
        player.lastTime = 0;
    });

    hostState.log = "Rodada " + hostState.round + ". Instrucao alvo: " + getTarget().name + ".";
    makeAiSubmissions();
    broadcastState();
    tryResolveRound();
}

function receiveSubmission(payload) {
    if (!isHost || hostState.status !== "choosing") return;

    const player = hostState.players.find(candidate => candidate.id === payload.playerId);
    if (!player || hostState.submissions[payload.playerId]) return;

    const holes = Array.isArray(payload.holes)
        ? payload.holes.map(Number).filter(index => index >= 0 && index < GRID_SIZE)
        : [];
    const elapsed = Math.max(300, Number(payload.elapsed) || Date.now() - hostState.roundStartedAt);

    hostState.submissions[payload.playerId] = {
        holes,
        elapsed,
        submittedAt: Date.now()
    };
    player.ready = true;
    broadcastState();
    tryResolveRound();
}

function makeAiSubmissions() {
    const target = getTarget();
    hostState.players.filter(player => player.isAI).forEach(player => {
        const holes = mutatePattern(target.holes, player.score);
        const elapsed = Math.round(2200 + Math.random() * 4300 - Math.min(player.score, 50) * 18);
        hostState.submissions[player.id] = { holes, elapsed, submittedAt: Date.now() + elapsed };
        player.ready = true;
    });
}

function mutatePattern(holes, score) {
    const accuracyBoost = Math.min(0.28, score / 400);
    const missChance = Math.max(0.05, 0.22 - accuracyBoost);
    const output = new Set(holes);

    holes.forEach(hole => {
        if (Math.random() < missChance) output.delete(hole);
    });

    if (Math.random() < missChance * 2) {
        output.add(Math.floor(Math.random() * GRID_SIZE));
    }

    return [...output].sort((a, b) => a - b);
}

function tryResolveRound() {
    if (!isHost || hostState.status !== "choosing") return;
    if (!hostState.players.every(player => hostState.submissions[player.id])) return;
    resolveRound();
}

function scoreSubmission(submission, target) {
    const expected = new Set(target.holes);
    const actual = new Set(submission.holes);
    let correct = 0;

    actual.forEach(hole => {
        if (expected.has(hole)) correct++;
    });

    const missed = [...expected].filter(hole => !actual.has(hole)).length;
    const extra = [...actual].filter(hole => !expected.has(hole)).length;
    const accuracy = Math.max(0, Math.round((correct / target.holes.length) * 100 - (missed + extra) * 8));
    const speedBonus = Math.max(0, Math.round(45 - submission.elapsed / 180));
    const perfectBonus = accuracy === 100 ? 35 : 0;
    const score = Math.max(1, accuracy + speedBonus + perfectBonus);

    return { correct, missed, extra, accuracy, speedBonus, perfectBonus, score };
}

function resolveRound() {
    const target = getTarget();
    const results = hostState.players.map(player => {
        const submission = hostState.submissions[player.id];
        const result = scoreSubmission(submission, target);
        return { player, submission, ...result };
    });

    const perfectResults = results.filter(result => result.accuracy === 100);
    const contenders = perfectResults.length ? perfectResults : results;
    contenders.sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.submission.elapsed - b.submission.elapsed;
    });

    const winner = contenders[0];
    hostState.winners = [winner.player.id];

    results.forEach(result => {
        const player = hostState.players.find(candidate => candidate.id === result.player.id);
        player.score += result.score;
        player.lastAccuracy = result.accuracy;
        player.lastTime = result.submission.elapsed;
        player.ready = false;
        if (player.id === winner.player.id) player.wins++;
    });

    hostState.status = "resolved";
    hostState.log =
        "Instrucao alvo: " + target.name + "\n\n" +
        results
            .sort((a, b) => b.score - a.score)
            .map(result =>
                result.player.name +
                ": " + result.accuracy + "%, " +
                formatTime(result.submission.elapsed) +
                ", +" + result.score + " pts" +
                (result.extra ? " (" + result.extra + " furo extra)" : "") +
                (result.missed ? " (" + result.missed + " faltando)" : "")
            ).join("\n") +
        "\n\nVenceu a rodada: " + winner.player.name + ".";

    broadcastState();

    if (hostState.round >= hostState.roundLimit) {
        finishMatch();
    }
}

function finishMatch() {
    const bestScore = Math.max(...hostState.players.map(player => player.score));
    const champions = hostState.players.filter(player => player.score === bestScore);

    hostState.status = "finished";
    hostState.matchWinnerIds = champions.map(player => player.id);
    hostState.log +=
        "\n\nFim da batalha." +
        "\nCampeao da perfuracao: " + champions.map(player => player.name).join(", ") +
        "\nPremio para campeao humano: " + getPrize() + " moedas.";

    broadcastState();
}

function formatTime(milliseconds) {
    return (milliseconds / 1000).toFixed(2) + "s";
}

function submitPattern() {
    if (!roomCode || hostState.status !== "choosing" || localSubmitted) return;

    localSubmitted = true;
    const elapsed = Date.now() - (roundStartedAt || hostState.roundStartedAt || Date.now());
    sendEvent("submit_pattern", {
        playerId,
        holes: [...selectedHoles].sort((a, b) => a - b),
        elapsed
    });
    render();
}

function resetLocalCard() {
    selectedHoles = new Set();
    localSubmitted = false;
    roundStartedAt = hostState.roundStartedAt || Date.now();
}

function createRoom() {
    connectRoom(makeRoomCode(), true);
}

function joinRoom() {
    const code = roomCodeInput.value.trim().toUpperCase();
    if (code.length < 4) {
        roundLog.textContent = "Digite o codigo da sala.";
        return;
    }

    connectRoom(code, false);
}

function requestStart() {
    if (isHost) hostStartGame();
    else sendEvent("start_game");
}

function requestNextRound() {
    if (isHost) hostNextRound();
    else sendEvent("next_round");
}

function render() {
    updateCoins();

    const target = getTarget();
    roomDisplay.textContent = roomCode || "Sem sala";
    roundDisplay.textContent = hostState.round + " / " + hostState.roundLimit;
    prizeDisplay.textContent = getPrize() + " moedas";
    roundLog.textContent = hostState.log;
    jobTitle.textContent = hostState.round ? target.name : "Aguardando instrucao";
    jobDescription.textContent = hostState.round
        ? target.meaning
        : "A rodada mostra uma instrucao. Monte o cartao perfurado correto e envie antes dos oponentes.";
    jobFocus.textContent = hostState.round ? target.title : "--";
    jobHazard.textContent = hostState.round ? target.difficulty : "--";
    jobMachine.textContent = "Perfuradora 80 colunas";

    const localPlayer = hostState.players.find(player => player.id === playerId);
    const isMyTurn = hostState.status === "choosing" && localPlayer && !hostState.submissions[playerId] && !localSubmitted;
    const humanCount = hostState.players.filter(player => !player.isAI).length;

    if (!roomCode) turnDisplay.textContent = "Entre em uma sala";
    else if (hostState.status === "lobby") turnDisplay.textContent = isHost ? "Aguardando jogadores" : "Na sala";
    else if (hostState.status === "choosing") turnDisplay.textContent = isMyTurn ? "Monte e envie" : "Aguardando mesa";
    else if (hostState.status === "resolved") turnDisplay.textContent = isHost ? "Avance a rodada" : "Rodada conferida";
    else turnDisplay.textContent = "Fim da batalha";

    startBtn.disabled = !isHost || hostState.status !== "lobby" || humanCount < 1;
    nextRoundBtn.disabled = !isHost || hostState.status !== "resolved";
    aiCountInput.disabled = !isHost || hostState.status !== "lobby";
    roundLimitInput.disabled = !isHost || hostState.status !== "lobby";

    renderScoreboard();
    renderPunchBoard(localPlayer, isMyTurn);
}

function renderScoreboard() {
    scoreboard.innerHTML = "";

    if (!hostState.players.length) {
        scoreboard.innerHTML = "<article class='player-card'><span>Mesa online</span><strong>Nenhum jogador</strong><p>Crie uma sala e compartilhe o codigo.</p></article>";
        return;
    }

    hostState.players.forEach(player => {
        const article = document.createElement("article");
        article.className = "player-card";
        if (player.id === playerId) article.classList.add("active");
        if (hostState.winners.includes(player.id) || hostState.matchWinnerIds.includes(player.id)) {
            article.classList.add("winner");
        }

        const readyText = hostState.status === "choosing"
            ? (hostState.submissions[player.id] ? "Cartao enviado" : "Perfurando")
            : (player.lastTime ? player.lastAccuracy + "% em " + formatTime(player.lastTime) : "Sem envio");

        article.innerHTML =
            "<span>" + (player.isAI ? "IA perfuradora" : (player.id === hostState.hostId ? "Host" : "Jogador")) + "</span>" +
            "<strong>" + player.name + "</strong>" +
            "<p>" + player.score + " pts | " + player.wins + " rodadas</p>" +
            "<small>" + readyText + "</small>";

        scoreboard.appendChild(article);
    });
}

function renderPunchBoard(localPlayer, isMyTurn) {
    cardChoices.innerHTML = "";
    energyDisplay.textContent = "Furos marcados: " + selectedHoles.size;

    if (!localPlayer) {
        cardChoices.innerHTML = "<div class='empty-hand'>Entre em uma sala para receber o cartao em branco.</div>";
        return;
    }

    if (hostState.status !== "choosing") {
        cardChoices.innerHTML = "<div class='empty-hand'>Aguarde a proxima instrucao.</div>";
        return;
    }

    const target = getTarget();
    const panel = document.createElement("div");
    panel.className = "punch-workbench";
    panel.innerHTML =
        "<div class='target-card'>" +
            "<span>Instrucao alvo</span>" +
            "<strong>" + target.name + "</strong>" +
            "<small>Pinte exatamente os furos do cartao. Envie rapido: em empate de acerto, menor tempo vence.</small>" +
            "<code>" + target.holes.map(index => index + 1).join(", ") + "</code>" +
        "</div>" +
        "<div class='punch-grid' id='punchGrid'></div>" +
        "<div class='submit-row'>" +
            "<button type='button' id='clearPunchBtn'>Limpar furos</button>" +
            "<button type='button' id='submitPunchBtn'>Enviar cartão</button>" +
        "</div>";

    cardChoices.appendChild(panel);

    const grid = document.getElementById("punchGrid");
    for (let index = 0; index < GRID_SIZE; index++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "punch-hole" + (selectedHoles.has(index) ? " active" : "");
        button.textContent = index + 1;
        button.disabled = !isMyTurn;
        button.addEventListener("click", () => {
            if (selectedHoles.has(index)) selectedHoles.delete(index);
            else selectedHoles.add(index);
            render();
        });
        grid.appendChild(button);
    }

    const clearBtn = document.getElementById("clearPunchBtn");
    const submitBtn = document.getElementById("submitPunchBtn");
    clearBtn.disabled = !isMyTurn;
    submitBtn.disabled = !isMyTurn;
    clearBtn.addEventListener("click", () => {
        selectedHoles.clear();
        render();
    });
    submitBtn.addEventListener("click", submitPattern);
}

createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);
startBtn.addEventListener("click", requestStart);
nextRoundBtn.addEventListener("click", requestNextRound);

updateCoins();
render();
