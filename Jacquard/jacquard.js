// --- Supabase ranking ---
async function salvarRanking(nome, pontos, userId) {
    if (!window.supabaseClient) {
        return {
            ok: false,
            message: "Conexao com o Supabase nao carregou."
        };
    }

    const tentativas = [];

    if (userId) {
        tentativas.push(() =>
            window.supabaseClient
                .from("ranking")
                .upsert(
                    { user_id: userId, nome, pontos },
                    { onConflict: "user_id" }
                )
        );

        tentativas.push(() =>
            window.supabaseClient
                .from("ranking")
                .insert([{ user_id: userId, nome, pontos }])
        );
    }

    tentativas.push(() =>
        window.supabaseClient
            .from("ranking")
            .insert([{ nome, pontos }])
    );

    let ultimoErro = null;

    for (const tentativa of tentativas) {
        const { error } = await tentativa();

        if (!error) {
            return {
                ok: true
            };
        }

        ultimoErro = error;
        console.warn("Tentativa de salvar ranking falhou:", error.message);
    }

    return {
        ok: false,
        message: ultimoErro?.message || "Erro desconhecido ao salvar ranking."
    };
}

// --- Estado do jogo ---
let fabricMatrix = [];
let isRunning = false;
let stopRequested = false;

const orders = [
    { client: "Alfaiate Local",    minQuality: 30, maxCost: 50, minSize: 6,  reward: 100 },
    { client: "Mercador de Seda",  minQuality: 50, maxCost: 45, minSize: 10, reward: 180 },
    { client: "Nobre da Corte",    minQuality: 80, maxCost: 70, minSize: 15, reward: 300 },
    { client: "Comerciante Árabe", minQuality: 40, maxCost: 55, minSize: 8,  reward: 140 },
    { client: "Rei da França",     minQuality: 90, maxCost: 80, minSize: 20, reward: 400 }
];

function getRandomOrder() {
    return orders[Math.floor(Math.random() * orders.length)];
}

let order = JSON.parse(localStorage.getItem("currentOrder")) || getRandomOrder();
localStorage.setItem("currentOrder", JSON.stringify(order));

let completedOrders = Number(localStorage.getItem("completedOrders")) || 0;
let coins = Number(localStorage.getItem("coins")) || 0;

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

// --- Sleep helper ---
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Executar cartão (loop contínuo até 100 linhas) ---
document.getElementById("executeBtn").addEventListener("click", async () => {
    if (isRunning) return;

    if (fabricMatrix.length >= 100) {
        document.getElementById("resultBox").textContent = "⚠️ Tecido cheio (100 linhas). Finalize o pedido.";
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

    // Loop contínuo: repete o cartão até 100 linhas ou parar
        for (let rowIndex = 0; rowIndex < patterns.length; rowIndex++) {
            if (fabricMatrix.length >= 100 || stopRequested) break;

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

    if (fabricMatrix.length >= 100) {
        document.getElementById("resultBox").textContent = "🧵 Tecido completo (100 linhas)! Finalize o pedido.";
    }
});

// --- Finalizar pedido ---
document.getElementById("finishBtn").addEventListener("click", async () => {
    // Para o loop se estiver rodando
    stopRequested = true;

    const quality = getQuality(fabricMatrix);
    const cost    = getCost(fabricMatrix);
    const size    = getSize(fabricMatrix);

    const success =
        quality >= order.minQuality &&
        cost    <= order.maxCost    &&
        size    >= order.minSize;

    const resultBox = document.getElementById("resultBox");

    if (success) {
        let reward = order.reward;
        if (quality > order.minQuality + 20) reward += 50;
        if (cost    < order.maxCost    - 10) reward += 25;

        coins += reward;
        localStorage.setItem("coins", coins);
        updateCoins();

        completedOrders++;
        localStorage.setItem("completedOrders", completedOrders);

        resultBox.innerHTML =
            "<h3>✅ Pedido concluído</h3>" +
            "<p>Qualidade: " + quality + " / " + order.minQuality + "</p>" +
            "<p>Custo: "     + cost    + " / " + order.maxCost    + "</p>" +
            "<p>Tamanho: "   + size    + " / " + order.minSize    + "</p>" +
            "<p>Moedas recebidas: " + reward + "</p>";

        const { data: authData } = await window.supabaseClient.auth.getUser();
        const authUser = authData.user;
        const localUser = JSON.parse(localStorage.getItem("user"));
        const user = authUser || localUser;

        const nome =
            user?.user_metadata?.name ||
            user?.user_metadata?.nome ||
            localStorage.getItem("playerName") ||
            user?.email ||
            "Anônimo";

        const ranking = await salvarRanking(nome, coins, user?.id);

        if (ranking.ok) {
            resultBox.innerHTML += "<p>Ranking salvo com sucesso.</p>";
        } else {
            resultBox.innerHTML +=
                "<p>As moedas foram ganhas, mas o ranking nao salvou: " +
                ranking.message +
                "</p>";
        }

    } else {
        resultBox.innerHTML =
            "❌ Pedido recusado<br>" +
            "<small>Qualidade: " + quality + " / " + order.minQuality + " | " +
            "Custo: " + cost + " / " + order.maxCost + " | " +
            "Tamanho: " + size + " / " + order.minSize + "</small>";
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
    order = getRandomOrder();
    localStorage.setItem("currentOrder", JSON.stringify(order));

    resetFabric();
    resetCard();
    updateStats();
    updateCoins();
    renderOrder();
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

function getComplexity(fabric) {
    let n = 0;
    fabric.forEach(row => {
        for (let i = 1; i < row.length; i++) {
            if (row[i] !== row[i - 1]) n++;
        }
    });
    return n;
}

function getSymmetry(fabric) {
    let n = 0;
    fabric.forEach(row => {
        if (JSON.stringify(row) === JSON.stringify([...row].reverse())) n += 10;
    });
    return n;
}

function getQuality(fabric) { return getComplexity(fabric) + getSymmetry(fabric); }
function getCost(fabric)    { return getComplexity(fabric) + getSize(fabric) * 3; }
function getSize(fabric)    { return fabric.length; }

function updateStats() {
    document.getElementById("qualityValue").textContent = "Qualidade: " + getQuality(fabricMatrix);
    document.getElementById("costValue").textContent    = "Custo: "     + getCost(fabricMatrix);
    document.getElementById("sizeValue").textContent   = "Tamanho: "   + getSize(fabricMatrix) + " / 100";
}

function saveCard() {
    const holes = document.querySelectorAll(".hole");
    const state = [...holes].map(h => h.classList.contains("active"));
    localStorage.setItem("cardState", JSON.stringify(state));
}

function renderOrder() {
    document.getElementById("clientName").textContent   = order.client;
    document.getElementById("orderQuality").textContent = "Qualidade mínima: " + order.minQuality;
    document.getElementById("orderCost").textContent    = "Custo máximo: "     + order.maxCost;
    document.getElementById("orderSize").textContent    = "Tamanho mínimo: "   + order.minSize;
}

function updateCoins() {
    document.getElementById("coinsDisplay").textContent = "💰 " + coins + " moedas";
}


