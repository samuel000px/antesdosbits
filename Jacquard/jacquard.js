// --- Supabase ranking ---
async function salvarRanking(nome, pontos, userId) {
    try {
        if (userId) {
            const { error } = await window.supabaseClient
                .from("ranking")
                .upsert(
                    { user_id: userId, nome, pontos },
                    { onConflict: "user_id" }
                );

            if (!error) {
                return;
            }
        }

        await window.supabaseClient.from("ranking").insert([{ nome, pontos }]);
    } catch (e) {
        console.error("Erro ao salvar ranking:", e);
    }
}

// --- Estado do jogo ---
let fabricMatrix = [];
let isRunning = false;
let stopRequested = false;

const MAX_FABRIC_ROWS = 100;
const FABRIC_WIDTH = 5;

const orderDatabase = {
    facil: [
        {
            client: "Alfaiate Local",
            difficulty: "Fácil",
            minQuality: 42,
            maxCost: 95,
            minSize: 6,
            minDensity: 30,
            minRegularity: 45,
            reward: 110
        },
        {
            client: "Feira da Vila",
            difficulty: "Fácil",
            minQuality: 48,
            maxCost: 110,
            minSize: 8,
            minDensity: 35,
            minRegularity: 40,
            reward: 135
        },
        {
            client: "Oficina de Uniformes",
            difficulty: "Fácil",
            minQuality: 52,
            maxCost: 120,
            minSize: 10,
            minDensity: 38,
            minRegularity: 50,
            reward: 155
        }
    ],
    intermediario: [
        {
            client: "Mercador de Seda",
            difficulty: "Intermediário",
            minQuality: 62,
            maxCost: 175,
            minSize: 14,
            minDensity: 42,
            minRegularity: 58,
            reward: 230
        },
        {
            client: "Comerciante Árabe",
            difficulty: "Intermediário",
            minQuality: 66,
            maxCost: 195,
            minSize: 16,
            minDensity: 45,
            minRegularity: 60,
            reward: 260
        },
        {
            client: "Casa de Tapeçaria",
            difficulty: "Intermediário",
            minQuality: 70,
            maxCost: 220,
            minSize: 18,
            minDensity: 48,
            minRegularity: 62,
            reward: 290
        }
    ],
    dificil: [
        {
            client: "Nobre da Corte",
            difficulty: "Difícil",
            minQuality: 78,
            maxCost: 260,
            minSize: 22,
            minDensity: 50,
            minRegularity: 68,
            reward: 380
        },
        {
            client: "Guilda dos Mestres Tecelões",
            difficulty: "Difícil",
            minQuality: 84,
            maxCost: 305,
            minSize: 26,
            minDensity: 52,
            minRegularity: 72,
            reward: 460
        },
        {
            client: "Rei da França",
            difficulty: "Difícil",
            minQuality: 90,
            maxCost: 340,
            minSize: 30,
            minDensity: 55,
            minRegularity: 76,
            reward: 560
        }
    ]
};

function getAutoDifficultyKey() {
    if (completedOrders < 3) return "facil";
    if (completedOrders < 7) return "intermediario";
    return "dificil";
}

function getDifficultyKey() {
    if (selectedDifficulty !== "auto") return selectedDifficulty;
    return getAutoDifficultyKey();
}

function getRandomOrder() {
    const pool = orderDatabase[getDifficultyKey()] || orderDatabase.facil;
    return pool[Math.floor(Math.random() * pool.length)];
}

function isValidOrder(savedOrder) {
    return savedOrder &&
        typeof savedOrder.minQuality === "number" &&
        typeof savedOrder.maxCost === "number" &&
        typeof savedOrder.minSize === "number" &&
        typeof savedOrder.minDensity === "number" &&
        typeof savedOrder.minRegularity === "number";
}

let completedOrders = Number(localStorage.getItem("completedOrders")) || 0;
let coins = Number(localStorage.getItem("coins")) || 0;
let selectedDifficulty = localStorage.getItem("jacquardDifficulty") || "auto";
let order = JSON.parse(localStorage.getItem("currentOrder")) || getRandomOrder();

if (!orderDatabase[selectedDifficulty] && selectedDifficulty !== "auto") {
    selectedDifficulty = "auto";
    localStorage.setItem("jacquardDifficulty", selectedDifficulty);
}

if (!isValidOrder(order) || getOrderDifficultyKey(order) !== getDifficultyKey()) {
    order = getRandomOrder();
}

localStorage.setItem("currentOrder", JSON.stringify(order));

// --- Cria buracos do cartão ---
const card = document.getElementById("card");

for (let i = 0; i < 15; i++) {
    const hole = document.createElement("div");
    hole.classList.add("hole");
    hole.addEventListener("click", () => {
        hole.classList.toggle("active");
        saveCard();
    });
    card.appendChild(hole);
}

// Cartão sempre começa limpo ao abrir a página
localStorage.removeItem("cardState");

// Restaura tecido salvo
const savedFabric = localStorage.getItem("fabricMatrix");
if (savedFabric) {
    fabricMatrix = JSON.parse(savedFabric);
    redrawFabric();
}

updateStats();
updateCoins();
renderOrder();
setupDifficultyControls();

// --- Sleep helper ---
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Executar cartão ---
document.getElementById("executeBtn").addEventListener("click", async () => {
    if (isRunning) return;

    if (fabricMatrix.length >= MAX_FABRIC_ROWS) {
        document.getElementById("resultBox").textContent = "⚠️ Tecido cheio (" + MAX_FABRIC_ROWS + " linhas). Finalize o pedido.";
        return;
    }

    isRunning = true;
    stopRequested = false;
    document.getElementById("executeBtn").disabled = true;
    document.getElementById("resultBox").textContent = "";

    const holes = document.querySelectorAll(".hole");

    // Lê o cartão (3 linhas × 5 colunas)
    const patterns = [];
    for (let row = 0; row < 3; row++) {
        const line = [];
        for (let col = 0; col < 5; col++) {
            line.push(holes[row * 5 + col].classList.contains("active"));
        }
        patterns.push(line);
    }

    // Animação de leitura do cartão
    card.classList.add("reading");
    await sleep(1000);
    card.classList.remove("reading");

    // Executa somente as linhas do cartão atual, respeitando o limite do tecido.
        for (let rowIndex = 0; rowIndex < patterns.length; rowIndex++) {
            if (fabricMatrix.length >= MAX_FABRIC_ROWS || stopRequested) break;

            // Destaca linha atual no cartão
            holes.forEach(h => h.classList.remove("highlight"));
            for (let col = 0; col < 5; col++) {
                holes[rowIndex * 5 + col].classList.add("highlight");
            }

            // Anima os fios
            const pattern = patterns[rowIndex];
            document.querySelectorAll(".thread").forEach((thread, i) => {
                thread.classList.toggle("up", !!pattern[i]);
            });

            createFabricRow(pattern);
            await sleep(400);
        }

    // Limpeza
    holes.forEach(h => h.classList.remove("highlight"));
    document.querySelectorAll(".thread").forEach(t => t.classList.remove("up"));
    isRunning = false;
    stopRequested = false;
    document.getElementById("executeBtn").disabled = false;

    if (fabricMatrix.length >= MAX_FABRIC_ROWS) {
        document.getElementById("resultBox").textContent = "🧵 Tecido completo (" + MAX_FABRIC_ROWS + " linhas)! Finalize o pedido.";
    }
});

// --- Finalizar pedido ---
document.getElementById("finishBtn").addEventListener("click", () => {
    // Para o loop se estiver rodando
    stopRequested = true;

    const metrics = getFabricMetrics(fabricMatrix);

    const success =
        metrics.quality >= order.minQuality &&
        metrics.cost <= order.maxCost &&
        metrics.size >= order.minSize &&
        metrics.density >= order.minDensity &&
        metrics.regularity >= order.minRegularity;

    const resultBox = document.getElementById("resultBox");

    if (success) {
        let reward = order.reward;
        if (metrics.quality > order.minQuality + 12) reward += 50;
        if (metrics.cost < order.maxCost - 20) reward += 25;
        if (metrics.regularity > order.minRegularity + 12) reward += 25;

        coins += reward;
        localStorage.setItem("coins", coins);
        updateCoins();

        completedOrders++;
        localStorage.setItem("completedOrders", completedOrders);

        resultBox.innerHTML =
            "<h3>✅ Pedido concluído</h3>" +
            "<p>Qualidade: " + metrics.quality + " / " + order.minQuality + "</p>" +
            "<p>Custo: " + metrics.cost + " / " + order.maxCost + "</p>" +
            "<p>Tamanho: " + metrics.size + " / " + order.minSize + "</p>" +
            "<p>Densidade: " + metrics.density + "% / " + order.minDensity + "%</p>" +
            "<p>Regularidade: " + metrics.regularity + " / " + order.minRegularity + "</p>" +
            "<p>Moedas recebidas: " + reward + "</p>";

        // Salva no ranking
        const user = JSON.parse(localStorage.getItem("user"));
        const nome =
            user?.user_metadata?.name ||
            user?.user_metadata?.nome ||
            localStorage.getItem("playerName") ||
            user?.email ||
            "Anônimo";

        salvarRanking(nome, coins, user?.id);

    } else {
        resultBox.innerHTML =
            "❌ Pedido recusado<br>" +
            "<small>Qualidade: " + metrics.quality + " / " + order.minQuality + " | " +
            "Custo: " + metrics.cost + " / " + order.maxCost + " | " +
            "Tamanho: " + metrics.size + " / " + order.minSize + " | " +
            "Densidade: " + metrics.density + "% / " + order.minDensity + "% | " +
            "Regularidade: " + metrics.regularity + " / " + order.minRegularity + "</small>";
    }

    // Próximo pedido e reset do tecido/cartão
    order = getRandomOrder();
    localStorage.setItem("currentOrder", JSON.stringify(order));
    renderOrder();
    resetFabric();
    resetCard();
    document.getElementById("executeBtn").disabled = false;
    isRunning = false;
    stopRequested = false;
});

// --- Recomeçar jogo ---
document.getElementById("restartBtn").addEventListener("click", () => {
    if (!confirm("Recomeçar o jogo? Moedas e progresso serão perdidos.")) return;

    stopRequested = true;
    isRunning = false;

    localStorage.removeItem("currentOrder");
    localStorage.removeItem("completedOrders");
    localStorage.removeItem("coins");
    localStorage.removeItem("fabricMatrix");
    localStorage.removeItem("cardState");

    fabricMatrix = [];
    coins = 0;
    completedOrders = 0;
    selectedDifficulty = "auto";
    localStorage.setItem("jacquardDifficulty", selectedDifficulty);
    order = getRandomOrder();
    localStorage.setItem("currentOrder", JSON.stringify(order));

    resetFabric();
    resetCard();
    updateStats();
    updateCoins();
    renderOrder();
    updateDifficultyControls();
    document.getElementById("resultBox").textContent = "";
    document.getElementById("executeBtn").disabled = false;
});

// --- Funções auxiliares ---

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetFabric() {
    fabricMatrix = [];
    localStorage.removeItem("fabricMatrix");
    document.getElementById("fabric").innerHTML = "";
    updateStats();
}

function resetCard() {
    document.querySelectorAll(".hole").forEach(h => h.classList.remove("active"));
    localStorage.removeItem("cardState");
}

function redrawFabric() {
    const fabric = document.getElementById("fabric");
    fabric.innerHTML = "";
    fabricMatrix.forEach(rowData => {
        const row = document.createElement("div");
        row.classList.add("fabricRow");
        rowData.forEach(bit => {
            const cell = document.createElement("div");
            cell.classList.add("fabricCell", bit ? "upCell" : "downCell");
            row.appendChild(cell);
        });
        fabric.appendChild(row);
    });
    fabric.scrollTop = fabric.scrollHeight;
}

function createFabricRow(pattern) {
    fabricMatrix.push(pattern.map(bit => bit ? 1 : 0));
    localStorage.setItem("fabricMatrix", JSON.stringify(fabricMatrix));

    const fabric = document.getElementById("fabric");
    const row = document.createElement("div");
    row.classList.add("fabricRow");
    pattern.forEach(bit => {
        const cell = document.createElement("div");
        cell.classList.add("fabricCell", bit ? "upCell" : "downCell");
        row.appendChild(cell);
    });
    fabric.appendChild(row);
    fabric.scrollTop = fabric.scrollHeight;
    updateStats();
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getFabricMetrics(fabric) {
    const size = getSize(fabric);

    if (size === 0) {
        return {
            quality: 0,
            cost: 0,
            size: 0,
            density: 0,
            regularity: 0,
            patternDefinition: 0,
            materialUse: 0,
            workTime: 0
        };
    }

    const totalCells = size * FABRIC_WIDTH;
    let liftedThreads = 0;
    let horizontalChanges = 0;
    let verticalChanges = 0;
    let repeatedRows = 0;
    let balancedRows = 0;
    const rowTypes = new Set();

    fabric.forEach((row, rowIndex) => {
        const rowKey = row.join("");
        rowTypes.add(rowKey);

        const rowLifted = row.reduce((sum, bit) => sum + bit, 0);
        liftedThreads += rowLifted;
        if (rowLifted >= 2 && rowLifted <= 3) balancedRows++;

        for (let col = 1; col < row.length; col++) {
            if (row[col] !== row[col - 1]) horizontalChanges++;
        }

        if (rowIndex > 0) {
            const previousRow = fabric[rowIndex - 1];
            if (rowKey === previousRow.join("")) repeatedRows++;

            for (let col = 0; col < row.length; col++) {
                if (row[col] !== previousRow[col]) verticalChanges++;
            }
        }
    });

    const density = Math.round((liftedThreads / totalCells) * 100);
    const balanceScore = clamp(100 - Math.abs(density - 50) * 2, 0, 100);
    const regularity = Math.round(clamp((balancedRows / size) * 100 - repeatedRows * 4, 0, 100));
    const interlacingRate = ((horizontalChanges + verticalChanges) / Math.max(1, totalCells - FABRIC_WIDTH)) * 100;
    const varietyScore = clamp((rowTypes.size / Math.min(size, 6)) * 100, 0, 100);
    const patternDefinition = Math.round(clamp(interlacingRate * 0.55 + varietyScore * 0.45, 0, 100));

    const quality = Math.round(
        balanceScore * 0.35 +
        regularity * 0.35 +
        patternDefinition * 0.30
    );

    const materialUse = Math.round(size * 3 + liftedThreads * 1.4);
    const workTime = Math.round(size * 1.2 + horizontalChanges * 0.7 + verticalChanges * 0.5);
    const cost = Math.round(materialUse + workTime * 0.6 + Math.max(0, patternDefinition - 55) * 0.45);

    return {
        quality,
        cost,
        size,
        density,
        regularity,
        patternDefinition,
        materialUse,
        workTime
    };
}

function getQuality(fabric) { return getFabricMetrics(fabric).quality; }
function getCost(fabric) { return getFabricMetrics(fabric).cost; }
function getSize(fabric) { return fabric.length; }

function getOrderDifficultyKey(targetOrder) {
    if (!targetOrder) return "";

    return Object.keys(orderDatabase).find(key =>
        orderDatabase[key].some(candidate => candidate.client === targetOrder.client)
    ) || "";
}

function getDifficultyLabel(key) {
    if (key === "facil") return "Fácil";
    if (key === "intermediario") return "Intermediário";
    if (key === "dificil") return "Difícil";
    return "Automático";
}

function setupDifficultyControls() {
    document.querySelectorAll("[data-difficulty]").forEach(button => {
        button.addEventListener("click", () => {
            selectedDifficulty = button.dataset.difficulty;
            localStorage.setItem("jacquardDifficulty", selectedDifficulty);

            stopRequested = true;
            isRunning = false;
            order = getRandomOrder();
            localStorage.setItem("currentOrder", JSON.stringify(order));

            resetFabric();
            resetCard();
            renderOrder();
            document.getElementById("resultBox").textContent = "";
            document.getElementById("executeBtn").disabled = false;
        });
    });

    updateDifficultyControls();
}

function updateDifficultyControls() {
    document.querySelectorAll("[data-difficulty]").forEach(button => {
        button.classList.toggle("active", button.dataset.difficulty === selectedDifficulty);
    });

    const progress = document.getElementById("difficultyProgress");
    if (!progress) return;

    if (selectedDifficulty === "auto") {
        const nextText = completedOrders < 3
            ? "Complete " + (3 - completedOrders) + " pedido(s) para o automático entrar no intermediário."
            : completedOrders < 7
                ? "Complete " + (7 - completedOrders) + " pedido(s) para o automático entrar no difícil."
                : "Automático no nível difícil.";

        progress.textContent =
            "Modo automático: " + getDifficultyLabel(getAutoDifficultyKey()) +
            " | Pedidos concluídos: " + completedOrders +
            " | " + nextText;
    } else {
        progress.textContent =
            "Modo escolhido: " + getDifficultyLabel(selectedDifficulty) +
            ". Você pode testar este nível sem esperar a progressão automática.";
    }
}

function updateStats() {
    const metrics = getFabricMetrics(fabricMatrix);
    document.getElementById("qualityValue").textContent = "Qualidade: " + metrics.quality;
    document.getElementById("costValue").textContent = "Custo: " + metrics.cost;
    document.getElementById("sizeValue").textContent = "Tamanho: " + metrics.size + " / " + MAX_FABRIC_ROWS;

    document.getElementById("densityValue").textContent = "Densidade do fio: " + metrics.density + "%";
    document.getElementById("regularityValue").textContent = "Regularidade: " + metrics.regularity;
    document.getElementById("patternValue").textContent = "Definição do desenho: " + metrics.patternDefinition;
    document.getElementById("materialValue").textContent = "Uso de material: " + metrics.materialUse;
}

function saveCard() {
    const holes = document.querySelectorAll(".hole");
    const state = [...holes].map(h => h.classList.contains("active"));
    localStorage.setItem("cardState", JSON.stringify(state));
}

function renderOrder() {
    document.getElementById("clientName").textContent = order.client + " (" + order.difficulty + ")";
    document.getElementById("orderQuality").textContent = "Qualidade mínima: " + order.minQuality;
    document.getElementById("orderCost").textContent = "Custo máximo: " + order.maxCost;
    document.getElementById("orderSize").textContent =
        "Tamanho mínimo: " + order.minSize +
        " | Densidade mínima: " + order.minDensity + "%" +
        " | Regularidade mínima: " + order.minRegularity;
    updateDifficultyControls();
}

function updateCoins() {
    document.getElementById("coinsDisplay").textContent = "💰 " + coins + " moedas";
}

