const CONTROL_CARDS = [
    {
        id: "classificador",
        name: "Cartao Mestre de Classificacao",
        role: "classificacao",
        machine: "Classificadora",
        cost: 4,
        tempo: 7,
        precision: 5,
        control: 4,
        risk: 1,
        tags: ["triagem", "inventario"],
        text: "Ordena o baralho por coluna-chave. Fica forte quando a ordem pede triagem ou estoque."
    },
    {
        id: "verificador",
        name: "Verificador de Colunas",
        role: "verificacao",
        machine: "Verificadora",
        cost: 3,
        tempo: 4,
        precision: 9,
        control: 6,
        risk: 0,
        tags: ["auditoria", "pagamento"],
        shield: true,
        detectsSabotage: true,
        text: "Protege seu lote e denuncia sabotagens. Excelente em auditoria e folha de pagamento."
    },
    {
        id: "desvio",
        name: "Desvio Condicional",
        role: "logica",
        machine: "Painel plugado",
        cost: 5,
        tempo: 5,
        precision: 6,
        control: 9,
        risk: 1,
        tags: ["calculo", "logica"],
        predictsTable: true,
        text: "Lê o padrão da mesa. Ganha muito quando vários rivais repetem o mesmo tipo de jogada."
    },
    {
        id: "duplicador",
        name: "Duplicador 514",
        role: "duplicacao",
        machine: "Reprodutora",
        cost: 4,
        tempo: 6,
        precision: 5,
        control: 5,
        risk: 2,
        tags: ["mestre", "inventario"],
        copiesBonus: true,
        text: "Copia parte do melhor ajuste da rodada. Perigoso se a mesa estiver cheia de verificadores."
    },
    {
        id: "colunaFantasma",
        name: "Coluna Fantasma",
        role: "sabotagem",
        machine: "Perfuradora clandestina",
        cost: 4,
        tempo: 6,
        precision: 2,
        control: 7,
        risk: 4,
        tags: ["blefe"],
        sabotage: true,
        text: "Fura uma coluna extra no lote rival. Destroi mesas desprotegidas, mas pode voltar contra voce."
    },
    {
        id: "checksum",
        name: "Checksum 80 Colunas",
        role: "blindagem",
        machine: "Conferidor",
        cost: 3,
        tempo: 3,
        precision: 8,
        control: 8,
        risk: 0,
        tags: ["auditoria", "logica"],
        shield: true,
        detectsSabotage: true,
        text: "Assina o baralho com paridade. Anula sabotagem contra voce e ganha bonus ao encontrar fraude."
    },
    {
        id: "leitorRapido",
        name: "Leitor em Alta Velocidade",
        role: "velocidade",
        machine: "Leitor 2501",
        cost: 5,
        tempo: 10,
        precision: 3,
        control: 4,
        risk: 3,
        tags: ["velocidade", "triagem"],
        text: "Processa muito rapido. Brilha em lotes urgentes, mas sofre quando o cartao esta fragil."
    },
    {
        id: "remendo",
        name: "Remendo de Campo",
        role: "reparo",
        machine: "Bancada tecnica",
        cost: 2,
        tempo: 3,
        precision: 6,
        control: 6,
        risk: 1,
        tags: ["auditoria", "mestre"],
        comeback: true,
        text: "Conserta furos tortos e recoloca seu lote na corrida. Forte para quem esta atras."
    },
    {
        id: "coladora",
        name: "Coladora de Arquivo Mestre",
        role: "colagem",
        machine: "Coladora",
        cost: 5,
        tempo: 6,
        precision: 7,
        control: 8,
        risk: 1,
        tags: ["mestre", "pagamento", "inventario"],
        diversityBonus: true,
        text: "Cruza o baralho da rodada com um arquivo mestre. Ganha com mesas variadas."
    },
    {
        id: "sentinela",
        name: "Sentinela IA de Padroes",
        role: "ia",
        machine: "Scanner neural",
        cost: 4,
        tempo: 5,
        precision: 7,
        control: 7,
        risk: 1,
        tags: ["logica", "auditoria"],
        detectsSabotage: true,
        predictsTable: true,
        text: "Detecta furos suspeitos e antecipa repeticoes. Uma ponte entre cartao fisico e IA moderna."
    }
];

const JOBS = [
    {
        id: "censo",
        title: "Censo relampago",
        description: "Um lote enorme de fichas chegou fora de ordem. Vence quem classifica rapido sem perder consistencia.",
        focus: "triagem",
        hazard: "baralho embaralhado",
        machine: "Classificadora",
        weights: { tempo: 1.15, precision: 1.05, control: 0.75, risk: 0.7 }
    },
    {
        id: "folha",
        title: "Folha de pagamento critica",
        description: "Salarios e departamentos precisam bater com o arquivo mestre. Um furo errado vira pagamento errado.",
        focus: "pagamento",
        hazard: "auditoria humana",
        machine: "Verificadora",
        weights: { tempo: 0.75, precision: 1.35, control: 1.05, risk: 1.05 }
    },
    {
        id: "inventario",
        title: "Inventario IBM de pecas",
        description: "Cartoes de estoque, pedidos e fornecedores precisam ser cruzados antes que a linha pare.",
        focus: "inventario",
        hazard: "arquivo mestre atrasado",
        machine: "Coladora",
        weights: { tempo: 0.9, precision: 1.1, control: 1.2, risk: 0.85 }
    },
    {
        id: "auditoria",
        title: "Auditoria surpresa",
        description: "A sala suspeita de furos falsos. Quem provar integridade ganha vantagem sobre jogadas agressivas.",
        focus: "auditoria",
        hazard: "fraude escondida",
        machine: "Conferidor",
        weights: { tempo: 0.65, precision: 1.45, control: 1.2, risk: 1.2 }
    },
    {
        id: "fragil",
        title: "Cartoes umidos no leitor",
        description: "O papel esta fragil. Aceleracao demais amassa o lote, mas jogar lento deixa a fila crescer.",
        focus: "mestre",
        hazard: "cartao fragil",
        machine: "Bancada tecnica",
        weights: { tempo: 0.85, precision: 1.2, control: 1.15, risk: 1.25 }
    },
    {
        id: "logica",
        title: "Programa plugado ao vivo",
        description: "O painel precisa decidir desvios, repeticoes e excecoes. Ler o padrao dos rivais vira vantagem.",
        focus: "logica",
        hazard: "desvio imprevisivel",
        machine: "Painel plugado",
        weights: { tempo: 0.8, precision: 1.0, control: 1.45, risk: 0.9 }
    },
    {
        id: "urgente",
        title: "Janela de processamento noturna",
        description: "O mainframe so fica livre por poucos minutos. O melhor lote combina velocidade e risco calculado.",
        focus: "velocidade",
        hazard: "fila de jobs",
        machine: "Leitor 2501",
        weights: { tempo: 1.45, precision: 0.8, control: 0.75, risk: 0.7 }
    }
];

const ROLE_LABELS = {
    classificacao: "Classificacao",
    verificacao: "Verificacao",
    logica: "Logica",
    duplicacao: "Duplicacao",
    sabotagem: "Sabotagem",
    blindagem: "Blindagem",
    velocidade: "Velocidade",
    reparo: "Reparo",
    colagem: "Colagem",
    ia: "IA"
};

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
        columns: 10,
        currentJobId: JOBS[0].id,
        players: [],
        choices: {},
        log: "Crie ou entre em uma sala para comecar.",
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
    return CONTROL_CARDS.find(card => card.id === cardId);
}

function getJob(jobId = hostState.currentJobId) {
    return JOBS.find(job => job.id === jobId) || JOBS[0];
}

function chooseJobForRound(round) {
    const seed = roomCode.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return JOBS[(seed + round * 3) % JOBS.length];
}

function getPrize() {
    const humans = hostState.players.filter(player => !player.isAI).length;
    return 90 + hostState.roundLimit * 15 + Math.max(0, humans - 1) * 45;
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
                hostState.log = "Sala " + roomCode + " criada. Envie o codigo para outros jogadores.";
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
        columns: hostState.columns,
        ready: false,
        lastRole: null,
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
    hostState.columns = 10;
    hostState.currentJobId = chooseJobForRound(hostState.round).id;
    hostState.status = "choosing";
    hostState.choices = {};
    hostState.winners = [];
    hostState.matchWinnerIds = [];
    lastResolvedChoices = [];

    hostState.players = hostState.players.filter(player => !player.isAI);
    for (let i = 1; i <= aiCount && hostState.players.length < MAX_PLAYERS; i++) {
        hostState.players.push({
            id: "ai-" + i,
            name: "IA Leitora " + i,
            isAI: true,
            score: 0,
            wins: 0,
            columns: hostState.columns,
            ready: false,
            lastRole: null,
            lastCardId: null
        });
    }

    hostState.log = "Partida iniciada. Ordem atual: " + getJob().title + ".";
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
    hostState.columns = Math.min(14, 9 + hostState.round);
    hostState.currentJobId = chooseJobForRound(hostState.round).id;
    hostState.status = "choosing";
    hostState.choices = {};
    hostState.winners = [];
    hostState.players.forEach(player => {
        player.columns = hostState.columns;
        player.ready = false;
    });

    hostState.log = "Rodada " + hostState.round + ". Nova ordem: " + getJob().title + ".";
    makeAiChoices();
    broadcastState();
    tryResolveRound();
}

function receiveChoice(choicePlayerId, cardId) {
    if (!isHost || hostState.status !== "choosing") return;

    const player = hostState.players.find(candidate => candidate.id === choicePlayerId);
    const card = getCard(cardId);

    if (!player || !card || card.cost > player.columns || hostState.choices[choicePlayerId]) {
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
    const job = getJob();
    const opponents = hostState.players.filter(player => player.id !== aiPlayer.id);
    const leader = [...hostState.players].sort((a, b) => b.score - a.score)[0];
    const needsComeback = leader && leader.id !== aiPlayer.id && leader.score - aiPlayer.score >= 12;
    const recentRoles = opponents.map(player => player.lastRole).filter(Boolean);
    const recentSabotage = lastResolvedChoices.some(choice => choice.role === "sabotagem");

    let bestCard = CONTROL_CARDS[0];
    let bestScore = -Infinity;

    CONTROL_CARDS.filter(card => card.cost <= aiPlayer.columns).forEach(card => {
        let score = estimateCardValue(card, job);

        if (card.tags.includes(job.focus)) score += 5;
        if (card.machine === job.machine) score += 4;
        if (needsComeback && card.comeback) score += 7;
        if (needsComeback && card.sabotage) score += 3;
        if (recentSabotage && card.detectsSabotage) score += 6;
        if (job.hazard.includes("fraude") && card.detectsSabotage) score += 4;
        if (job.hazard.includes("fragil") && card.risk >= 3) score -= 5;
        if (card.predictsTable && hasRepeatedValue(recentRoles)) score += 4;
        if (card.diversityBonus && opponents.length >= 3) score += 3;
        if (card.role !== aiPlayer.lastRole) score += 1.5;
        if (card.sabotage && recentSabotage) score -= 2;

        score += Math.random() * 1.4;

        if (score > bestScore) {
            bestScore = score;
            bestCard = card;
        }
    });

    return bestCard;
}

function estimateCardValue(card, job) {
    return Math.round(
        card.tempo * job.weights.tempo +
        card.precision * job.weights.precision +
        card.control * job.weights.control -
        card.risk * job.weights.risk
    );
}

function tryResolveRound() {
    if (!isHost || hostState.status !== "choosing") return;

    const allReady = hostState.players.every(player => hostState.choices[player.id]);
    if (!allReady) return;

    resolveRound();
}

function resolveRound() {
    const job = getJob();
    const played = hostState.players.map(player => {
        const card = getCard(hostState.choices[player.id]);
        return {
            player,
            card,
            cardId: card.id,
            base: estimateCardValue(card, job),
            bonus: 0,
            penalty: 0,
            score: 0,
            notes: []
        };
    });

    const roleCounts = countBy(played.map(item => item.card.role));
    const uniqueRoleCount = Object.keys(roleCounts).length;
    const sabotageItems = played.filter(item => item.card.sabotage);
    const defenders = played.filter(item => item.card.shield || item.card.detectsSabotage);
    const leaderBeforeRound = [...hostState.players].sort((a, b) => b.score - a.score)[0];

    played.forEach(item => {
        if (item.card.tags.includes(job.focus)) {
            item.bonus += 5;
            item.notes.push("combina com a ordem");
        }

        if (item.card.machine === job.machine) {
            item.bonus += 4;
            item.notes.push("maquina ideal");
        }

        if (item.card.role !== item.player.lastRole && item.player.lastRole) {
            item.bonus += 2;
            item.notes.push("variou o baralho");
        }

        if (item.card.predictsTable && hasRepeatedValue(played.map(play => play.card.role))) {
            item.bonus += 5;
            item.notes.push("previu repeticao da mesa");
        }

        if (item.card.diversityBonus && uniqueRoleCount >= 3) {
            item.bonus += Math.min(8, uniqueRoleCount * 2);
            item.notes.push("cruzou arquivos diferentes");
        }

        if (item.card.comeback && leaderBeforeRound && leaderBeforeRound.id !== item.player.id) {
            const gap = leaderBeforeRound.score - item.player.score;
            if (gap >= 8) {
                item.bonus += 7;
                item.notes.push("recuperou lote atrasado");
            }
        }

        if (item.card.id === "leitorRapido" && job.focus === "velocidade") {
            item.bonus += 5;
            item.notes.push("aproveitou janela noturna");
        }

        if (item.card.id === "leitorRapido" && job.hazard.includes("fragil")) {
            item.penalty += 6;
            item.notes.push("amassou cartoes frageis");
        }

        if (item.card.id === "duplicador" && defenders.some(defender => defender.player.id !== item.player.id)) {
            item.penalty += 3;
            item.notes.push("duplicacao ficou sob vigilancia");
        }

        if (job.hazard.includes("auditoria") && item.card.risk >= 3) {
            item.penalty += 4;
            item.notes.push("risco alto na auditoria");
        }
    });

    sabotageItems.forEach(sabotage => {
        const inspectors = defenders.filter(defender => defender.player.id !== sabotage.player.id);
        if (inspectors.length) {
            sabotage.penalty += 7;
            sabotage.notes.push("sabotagem flagrada");
            inspectors.forEach(inspector => {
                inspector.bonus += 3;
                inspector.notes.push("detectou coluna falsa");
            });
        }

        played
            .filter(item => item.player.id !== sabotage.player.id)
            .forEach(target => {
                if (target.card.shield || target.card.detectsSabotage) {
                    target.notes.push("blindou o proprio lote");
                    return;
                }

                target.penalty += 4;
                target.notes.push("sofreu coluna fantasma");
            });

        if (!inspectors.length) {
            sabotage.bonus += 4;
            sabotage.notes.push("baguncou a mesa");
        }
    });

    const bestBonusBeforeCopy = Math.max(0, ...played.map(item => item.bonus));
    played.forEach(item => {
        if (item.card.copiesBonus && bestBonusBeforeCopy > 0) {
            item.bonus += Math.floor(bestBonusBeforeCopy * 0.55);
            item.notes.push("replicou ajuste vencedor");
        }

        item.score = Math.max(1, item.base + item.bonus - item.penalty);
    });

    const bestScore = Math.max(...played.map(item => item.score));
    const roundWinners = played.filter(item => item.score === bestScore);
    const winnerIds = roundWinners.map(item => item.player.id);

    played.forEach(item => {
        const player = hostState.players.find(candidate => candidate.id === item.player.id);
        player.lastRole = item.card.role;
        player.lastCardId = item.card.id;
        player.ready = false;
        player.score += item.score;

        if (winnerIds.includes(player.id)) {
            player.wins++;
        }
    });

    hostState.status = "resolved";
    hostState.winners = winnerIds;
    lastResolvedChoices = played.map(item => ({
        playerId: item.player.id,
        cardId: item.card.id,
        role: item.card.role,
        score: item.score
    }));

    hostState.log =
        "Ordem: " + job.title + "\n\n" +
        played.map(item => {
            const details = item.notes.length ? " (" + uniqueNotes(item.notes).join(", ") + ")" : "";
            return item.player.name + " perfurou " + item.card.name + ": " + item.score + " pts" + details;
        }).join("\n") +
        "\n\nVenceu a rodada: " + roundWinners.map(item => item.player.name).join(", ");

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
        "\n\nFim da corrida." +
        "\nCampeao do baralho: " + champions.map(player => player.name).join(", ") +
        "\nPremio para campeao humano: " + getPrize() + " moedas.";

    broadcastState();
}

function countBy(values) {
    return values.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
}

function hasRepeatedValue(values) {
    const counts = countBy(values.filter(Boolean));
    return Object.values(counts).some(count => count >= 2);
}

function uniqueNotes(notes) {
    return [...new Set(notes)];
}

function playCard(cardId) {
    if (!roomCode || hostState.status !== "choosing" || localChoiceId) return;

    const player = hostState.players.find(candidate => candidate.id === playerId);
    const card = getCard(cardId);

    if (!player || !card || card.cost > player.columns) return;

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

    const job = getJob();
    roomDisplay.textContent = roomCode || "Sem sala";
    roundDisplay.textContent = hostState.round + " / " + hostState.roundLimit;
    prizeDisplay.textContent = getPrize() + " moedas";
    roundLog.textContent = hostState.log;
    jobTitle.textContent = hostState.round ? job.title : "Aguardando lote";
    jobDescription.textContent = hostState.round
        ? job.description
        : "Cada rodada revela uma ordem de processamento. Escolha o cartao perfurado que melhor resolve, protege ou sabota o lote.";
    jobFocus.textContent = hostState.round ? job.focus : "--";
    jobHazard.textContent = hostState.round ? job.hazard : "--";
    jobMachine.textContent = hostState.round ? job.machine : "--";

    const localPlayer = hostState.players.find(player => player.id === playerId);
    const isMyTurn = hostState.status === "choosing" && localPlayer && !hostState.choices[playerId];
    const humanCount = hostState.players.filter(player => !player.isAI).length;

    if (!roomCode) {
        turnDisplay.textContent = "Entre em uma sala";
    } else if (hostState.status === "lobby") {
        turnDisplay.textContent = isHost ? "Aguardando jogadores" : "Na sala";
    } else if (hostState.status === "choosing") {
        turnDisplay.textContent = isMyTurn ? "Perfure seu cartao" : "Aguardando mesa";
    } else if (hostState.status === "resolved") {
        turnDisplay.textContent = isHost ? "Avance a rodada" : "Rodada conferida";
    } else {
        turnDisplay.textContent = "Fim da corrida";
    }

    startBtn.disabled = !isHost || hostState.status !== "lobby" || humanCount < 2;
    nextRoundBtn.disabled = !isHost || hostState.status !== "resolved";
    aiCountInput.disabled = !isHost || hostState.status !== "lobby";
    roundLimitInput.disabled = !isHost || hostState.status !== "lobby";

    renderScoreboard();
    renderCards(localPlayer, isMyTurn);
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
            ? (hostState.choices[player.id] ? "Cartao lacrado" : "Escolhendo furo")
            : (player.lastCardId ? getCard(player.lastCardId).name : "Sem cartao");

        article.innerHTML =
            "<span>" + (player.isAI ? "IA leitora" : (player.id === hostState.hostId ? "Host" : "Jogador")) + "</span>" +
            "<strong>" + player.name + "</strong>" +
            "<p>" + player.score + " pts | " + player.wins + " rodadas</p>" +
            "<small>" + readyText + "</small>";

        scoreboard.appendChild(article);
    });
}

function renderCards(localPlayer, isMyTurn) {
    cardChoices.innerHTML = "";
    energyDisplay.textContent = "Colunas livres: " + (localPlayer?.columns || 0);

    if (!localPlayer) {
        cardChoices.innerHTML = "<div class='empty-hand'>Entre em uma sala para receber os cartoes de controle.</div>";
        return;
    }

    if (hostState.status !== "choosing") {
        cardChoices.innerHTML = "<div class='empty-hand'>Aguarde a proxima ordem de processamento.</div>";
        return;
    }

    CONTROL_CARDS.forEach(card => {
        const button = document.createElement("button");
        const disabled = !isMyTurn || card.cost > localPlayer.columns;
        button.type = "button";
        button.className = "action-card punch-card";
        button.disabled = disabled;
        if (localChoiceId === card.id || hostState.choices[playerId] === card.id) {
            button.classList.add("selected");
        }

        button.innerHTML =
            "<div class='punch-code' aria-hidden='true'>" + renderPunchPattern(card.id) + "</div>" +
            "<div class='card-topline'>" +
                "<span class='power'>" + estimateCardValue(card, getJob()) + "</span>" +
                "<em>" + ROLE_LABELS[card.role] + "</em>" +
            "</div>" +
            "<strong>" + card.name + "</strong>" +
            "<small>" + card.text + "</small>" +
            "<div class='metric-row'>" +
                "<span>Vel " + card.tempo + "</span>" +
                "<span>Prec " + card.precision + "</span>" +
                "<span>Ctrl " + card.control + "</span>" +
            "</div>" +
            "<em>" + card.cost + " colunas | " + card.machine + "</em>";

        button.addEventListener("click", () => playCard(card.id));
        cardChoices.appendChild(button);
    });
}

function renderPunchPattern(seedText) {
    const hash = seedText.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
    let html = "";

    for (let i = 0; i < 24; i++) {
        const open = ((hash >> (i % 9)) + i * 7 + hash) % 5 < 2;
        html += "<i class='" + (open ? "open" : "") + "'></i>";
    }

    return html;
}

createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);
startBtn.addEventListener("click", requestStart);
nextRoundBtn.addEventListener("click", requestNextRound);

updateCoins();
render();
