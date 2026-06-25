const CARDS = [
    {
        id: "firewall",
        name: "Firewall Adaptativo",
        type: "defesa",
        cost: 2,
        power: 5,
        text: "Bloqueia Malware e Zero-Day. Se bloquear, ganha +5.",
        counters: ["malware", "zeroDay"]
    },
    {
        id: "dataLake",
        name: "Data Lake",
        type: "dados",
        cost: 3,
        power: 6,
        text: "Ganha +2 por carta de IA ou Analytics na rodada.",
        synergy: ["ia", "analise"]
    },
    {
        id: "modelo",
        name: "Modelo Preditivo",
        type: "ia",
        cost: 4,
        power: 7,
        text: "Ganha +4 contra a carta mais repetida pelos rivais.",
        predicts: true
    },
    {
        id: "zeroDay",
        name: "Zero-Day",
        type: "ataque",
        cost: 5,
        power: 10,
        text: "Muito forte, mas perde 5 se alguém jogar Firewall.",
        riskyAgainst: "firewall"
    },
    {
        id: "edge",
        name: "Edge Computing",
        type: "infra",
        cost: 2,
        power: 4,
        text: "Ganha +3 se for a carta mais barata da rodada.",
        cheapestBonus: 3
    },
    {
        id: "blockchain",
        name: "Ledger Distribuído",
        type: "consenso",
        cost: 4,
        power: 6,
        text: "Ganha +2 por jogador que escolheu carta diferente.",
        diversityBonus: 2
    },
    {
        id: "malware",
        name: "Malware Polimórfico",
        type: "ataque",
        cost: 3,
        power: 6,
        text: "Rouba 3 pontos do maior placar se não for bloqueado.",
        stealsLeader: true
    },
    {
        id: "openSource",
        name: "Fork Open Source",
        type: "colaboracao",
        cost: 1,
        power: 3,
        text: "Copia metade do melhor bônus da rodada.",
        copiesBonus: true
    }
];

const MAX_PLAYERS = 6;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
const urlParams = new URLSearchParams(window.location.search);
const forcedPlayer = urlParams.get("player");
let playerId = forcedPlayer ? "player-" + forcedPlayer : (localStorage.getItem("modernPlayerId") || createPlayerId());
let playerName = urlParams.get("name") || localStorage.getItem("playerName") || "";
let localChoiceId = null;
let hostState = createEmptyState();
let lastResolvedChoices = [];

if (!forcedPlayer) {
    localStorage.setItem("modernPlayerId", playerId);
}

const coinsDisplay = document.getElementById("coinsDisplay");
const setupPanel = document.getElementById("setupPanel");
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

playerNameInput.value = playerName || "Jogador";

function createEmptyState() {
    return {
        roomCode: "",
        hostId: "",
        status: "lobby",
        round: 0,
        roundLimit: 5,
        energy: 7,
        players: [],
        choices: {},
        log: "Crie ou entre em uma sala para começar.",
        winners: [],
        matchWinnerIds: []
    };
}

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
            playerName ||
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

function getCard(cardId) {
    return CARDS.find(card => card.id === cardId);
}

function getPrize() {
    const humans = hostState.players.filter(player => !player.isAI).length;
    return 80 + hostState.roundLimit * 12 + Math.max(0, humans - 1) * 35;
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
    localChoiceId = null;

    channel = window.supabaseClient.channel("modern-room-" + roomCode, {
        config: { broadcast: { self: true } }
    });

    channel
        .on("broadcast", { event: "join_request" }, ({ payload }) => {
            if (isHost) addOnlinePlayer(payload.player);
        })
        .on("broadcast", { event: "state_update" }, ({ payload }) => {
            applyState(payload.state);
        })
        .on("broadcast", { event: "play_card" }, ({ payload }) => {
            if (isHost) receiveChoice(payload.playerId, payload.cardId);
        })
        .on("broadcast", { event: "start_game" }, () => {
            if (isHost) hostStartGame();
        })
        .on("broadcast", { event: "next_round" }, () => {
            if (isHost) hostNextRound();
        })
        .subscribe(status => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
                roundLog.textContent = "Nao foi possivel conectar a sala online. Verifique a internet e tente novamente.";
                return;
            }

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

    if (hostState.players.length >= MAX_PLAYERS || hostState.status !== "lobby") {
        return;
    }

    hostState.players.push({
        id: player.id,
        name: cleanName(player.name),
        isAI: false,
        score: 0,
        wins: 0,
        energy: hostState.energy,
        ready: false,
        lastType: null,
        lastCardId: null
    });

    hostState.log = player.name + " entrou na sala " + roomCode + ".";
    broadcastState();
}

function applyState(nextState) {
    if (!nextState || nextState.roomCode !== roomCode) return;
    hostState = nextState;

    if (hostState.status !== "choosing") {
        localChoiceId = null;
    }

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
    saveRanking();
}

function hostStartGame() {
    if (!isHost || hostState.status !== "lobby") return;

    const aiCount = Number(aiCountInput.value);
    hostState.roundLimit = Number(roundLimitInput.value);
    hostState.round = 1;
    hostState.energy = 7;
    hostState.status = "choosing";
    hostState.choices = {};
    hostState.winners = [];
    hostState.matchWinnerIds = [];

    hostState.players = hostState.players.filter(player => !player.isAI);
    for (let i = 1; i <= aiCount && hostState.players.length < MAX_PLAYERS; i++) {
        hostState.players.push({
            id: "ai-" + i,
            name: "IA Neural " + i,
            isAI: true,
            score: 0,
            wins: 0,
            energy: hostState.energy,
            ready: false,
            lastType: null,
            lastCardId: null
        });
    }

    hostState.log = "Partida online iniciada na sala " + roomCode + ".";
    makeAiChoices();
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
    hostState.energy = Math.min(10, 7 + hostState.round);
    hostState.status = "choosing";
    hostState.choices = {};
    hostState.winners = [];
    hostState.players.forEach(player => {
        player.energy = hostState.energy;
        player.ready = false;
    });

    hostState.log = "Rodada " + hostState.round + ": escolha sua carta.";
    makeAiChoices();
    broadcastState();
    tryResolveRound();
}

function receiveChoice(choicePlayerId, cardId) {
    if (!isHost || hostState.status !== "choosing") return;

    const player = hostState.players.find(candidate => candidate.id === choicePlayerId);
    const card = getCard(cardId);

    if (!player || !card || card.cost > player.energy || hostState.choices[choicePlayerId]) {
        return;
    }

    hostState.choices[choicePlayerId] = cardId;
    player.ready = true;
    broadcastState();
    tryResolveRound();
}

function makeAiChoices() {
    hostState.players
        .filter(player => player.isAI)
        .forEach(player => {
            const card = chooseSmartAiCard(player);
            hostState.choices[player.id] = card.id;
            player.ready = true;
        });
}

function chooseSmartAiCard(aiPlayer) {
    const opponents = hostState.players.filter(player => player.id !== aiPlayer.id);
    const predictedTypes = opponents
        .map(player => player.lastType)
        .filter(Boolean);

    const leader = [...hostState.players].sort((a, b) => b.score - a.score)[0];
    const needsComeback = leader && leader.id !== aiPlayer.id && leader.score - aiPlayer.score >= 3;

    let bestCard = CARDS[0];
    let bestScore = -Infinity;

    CARDS.filter(card => card.cost <= aiPlayer.energy).forEach(card => {
        let score = card.power - card.cost * 0.35;

        predictedTypes.forEach(type => {
            if (card.type === "defesa" && ["ataque"].includes(type)) score += 2.5;
            if (card.type === "ia" && ["dados", "analise"].includes(type)) score += 2;
            if (card.type === "ataque" && ["ia", "dados"].includes(type)) score += 1.5;
        });

        if (needsComeback && card.id === "zeroDay") score += 3;
        if (needsComeback && card.id === "malware") score += 2.5;
        if (lastResolvedChoices.some(choice => choice.cardId === "firewall") && card.id === "zeroDay") score -= 4;
        if (lastResolvedChoices.some(choice => choice.cardId === "zeroDay") && card.id === "firewall") score += 4;
        if (card.id === "blockchain" && opponents.length >= 3) score += 2;
        if (card.id === "openSource" && hostState.round > 1) score += 1.5;

        score += Math.random() * 1.2;

        if (score > bestScore) {
            bestScore = score;
            bestCard = card;
        }
    });

    return bestCard;
}

function tryResolveRound() {
    if (!isHost || hostState.status !== "choosing") return;

    const allReady = hostState.players.every(player => hostState.choices[player.id]);
    if (!allReady) return;

    resolveRound();
}

function resolveRound() {
    const played = hostState.players.map(player => ({
        player,
        card: getCard(hostState.choices[player.id]),
        cardId: hostState.choices[player.id],
        base: getCard(hostState.choices[player.id]).power,
        bonus: 0,
        penalty: 0,
        score: 0,
        notes: []
    }));

    const typeCounts = countBy(played.map(item => item.card.type));
    const cardCounts = countBy(played.map(item => item.card.id));
    const uniqueCardCount = Object.keys(cardCounts).length;
    const cheapestCost = Math.min(...played.map(item => item.card.cost));
    const bestRawBonus = { value: 0 };

    played.forEach(item => {
        const blockedByFirewall = played.some(other =>
            other.player.id !== item.player.id &&
            other.card.id === "firewall" &&
            other.card.counters?.includes(item.card.id)
        );

        if (item.card.id === "firewall") {
            const blocked = played.filter(other =>
                other.player.id !== item.player.id &&
                item.card.counters.includes(other.card.id)
            ).length;
            if (blocked) {
                item.bonus += blocked * 5;
                item.notes.push("bloqueou ataque");
            }
        }

        if (item.card.id === "dataLake") {
            const synergy = played.filter(other => item.card.synergy.includes(other.card.type)).length;
            item.bonus += synergy * 2;
            if (synergy) item.notes.push("dados alimentaram a jogada");
        }

        if (item.card.id === "modelo") {
            const mostRepeatedType = getMostRepeated(typeCounts);
            if (mostRepeatedType && typeCounts[mostRepeatedType] > 1) {
                item.bonus += 4;
                item.notes.push("previu o padrao da mesa");
            }
        }

        if (item.card.id === "zeroDay" && blockedByFirewall) {
            item.penalty += 5;
            item.notes.push("foi contido por Firewall");
        }

        if (item.card.id === "edge" && item.card.cost === cheapestCost) {
            item.bonus += item.card.cheapestBonus;
            item.notes.push("venceu em latencia");
        }

        if (item.card.id === "blockchain") {
            item.bonus += uniqueCardCount * item.card.diversityBonus;
            item.notes.push("ganhou consenso distribuido");
        }

        if (item.card.id === "malware" && !blockedByFirewall) {
            item.bonus += 3;
            item.notes.push("roubou prioridade do lider");
        }

        bestRawBonus.value = Math.max(bestRawBonus.value, item.bonus);
    });

    played.forEach(item => {
        if (item.card.id === "openSource" && bestRawBonus.value > 0) {
            item.bonus += Math.floor(bestRawBonus.value / 2);
            item.notes.push("copiou melhoria da comunidade");
        }

        item.score = Math.max(1, item.base + item.bonus - item.penalty);
    });

    const bestScore = Math.max(...played.map(item => item.score));
    const roundWinners = played.filter(item => item.score === bestScore);
    const winnerIds = roundWinners.map(item => item.player.id);

    played.forEach(item => {
        const player = hostState.players.find(candidate => candidate.id === item.player.id);
        player.lastType = item.card.type;
        player.lastCardId = item.card.id;
        player.ready = false;

        if (winnerIds.includes(player.id)) {
            player.score += 4;
            player.wins++;
        } else {
            player.score += 1;
        }
    });

    hostState.status = "resolved";
    hostState.winners = winnerIds;
    lastResolvedChoices = played.map(item => ({
        playerId: item.player.id,
        cardId: item.card.id,
        type: item.card.type,
        score: item.score
    }));

    hostState.log =
        "Rodada " + hostState.round + " resolvida\n\n" +
        played.map(item => {
            const details = item.notes.length ? " (" + item.notes.join(", ") + ")" : "";
            return item.player.name + " jogou " + item.card.name + ": " + item.score + details;
        }).join("\n") +
        "\n\nVencedor da rodada: " + roundWinners.map(item => item.player.name).join(", ");

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
        "\n\nFim da partida." +
        "\nCampeao: " + champions.map(player => player.name).join(", ") +
        "\nPremio para campeao humano: " + getPrize() + " moedas.";

    broadcastState();
}

function countBy(values) {
    return values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
}

function getMostRepeated(counts) {
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

function playCard(cardId) {
    if (!roomCode || hostState.status !== "choosing" || localChoiceId) return;

    const player = hostState.players.find(candidate => candidate.id === playerId);
    const card = getCard(cardId);

    if (!player || !card || card.cost > player.energy) return;

    localChoiceId = cardId;
    sendEvent("play_card", { playerId, cardId });
    render();
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
    if (isHost) {
        hostStartGame();
    } else {
        sendEvent("start_game");
    }
}

function requestNextRound() {
    if (isHost) {
        hostNextRound();
    } else {
        sendEvent("next_round");
    }
}

function render() {
    updateCoins();

    roomDisplay.textContent = roomCode || "Sem sala";
    roundDisplay.textContent = hostState.round + " / " + hostState.roundLimit;
    prizeDisplay.textContent = getPrize() + " moedas";
    roundLog.textContent = hostState.log;

    const localPlayer = hostState.players.find(player => player.id === playerId);
    const isMyTurn = hostState.status === "choosing" && localPlayer && !hostState.choices[playerId];

    if (!roomCode) {
        turnDisplay.textContent = "Entre em uma sala";
    } else if (hostState.status === "lobby") {
        turnDisplay.textContent = isHost ? "Aguardando jogadores" : "Na sala";
    } else if (hostState.status === "choosing") {
        turnDisplay.textContent = isMyTurn ? "Sua jogada" : "Aguardando mesa";
    } else if (hostState.status === "resolved") {
        turnDisplay.textContent = isHost ? "Avance a rodada" : "Rodada resolvida";
    } else {
        turnDisplay.textContent = "Fim da partida";
    }

    startBtn.disabled = !isHost || hostState.status !== "lobby" || hostState.players.filter(player => !player.isAI).length < 2;
    nextRoundBtn.disabled = !isHost || hostState.status !== "resolved";
    aiCountInput.disabled = !isHost || hostState.status !== "lobby";
    roundLimitInput.disabled = !isHost || hostState.status !== "lobby";

    renderScoreboard();
    renderCards(localPlayer, isMyTurn);
}

function renderScoreboard() {
    scoreboard.innerHTML = "";

    if (!hostState.players.length) {
        scoreboard.innerHTML = "<article class='player-card'><span>Mesa online</span><strong>Nenhum jogador</strong><p>Crie ou entre em uma sala.</p></article>";
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
            ? (hostState.choices[player.id] ? "Carta travada" : "Pensando")
            : (player.lastCardId ? getCard(player.lastCardId).name : "Sem carta");

        article.innerHTML =
            "<span>" + (player.isAI ? "IA online" : (player.id === hostState.hostId ? "Host" : "Jogador")) + "</span>" +
            "<strong>" + player.name + "</strong>" +
            "<p>" + player.score + " pts | " + player.wins + " vitorias</p>" +
            "<small>" + readyText + "</small>";

        scoreboard.appendChild(article);
    });
}

function renderCards(localPlayer, isMyTurn) {
    cardChoices.innerHTML = "";
    energyDisplay.textContent = "Energia: " + (localPlayer?.energy || 0);

    if (!localPlayer) {
        cardChoices.innerHTML = "<div class='empty-hand'>Entre em uma sala para receber uma mão.</div>";
        return;
    }

    if (hostState.status !== "choosing") {
        cardChoices.innerHTML = "<div class='empty-hand'>Aguarde a próxima rodada.</div>";
        return;
    }

    CARDS.forEach(card => {
        const button = document.createElement("button");
        const disabled = !isMyTurn || card.cost > localPlayer.energy;
        button.type = "button";
        button.className = "action-card";
        button.disabled = disabled;
        if (localChoiceId === card.id || hostState.choices[playerId] === card.id) {
            button.classList.add("selected");
        }

        button.innerHTML =
            "<span class='power'>" + card.power + "</span>" +
            "<strong>" + card.name + "</strong>" +
            "<small>" + card.text + "</small>" +
            "<em>Custo " + card.cost + " | " + card.type + "</em>";

        button.addEventListener("click", () => playCard(card.id));
        cardChoices.appendChild(button);
    });
}

createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);
startBtn.addEventListener("click", requestStart);
nextRoundBtn.addEventListener("click", requestNextRound);

updateCoins();
render();
