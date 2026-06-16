
async function salvarRanking(nome, pontos){

    await supabase
    .from("ranking")
    .insert([
        {
            nome: nome,
            pontos: pontos
        }
    ]);

}


let fabricMatrix = [];

const orders = [
    { client: "Alfaiate Local", minQuality: 30, maxCost: 50, minSize: 6, reward: 100 },
    { client: "Mercador de Seda", minQuality: 50, maxCost: 45, minSize: 10, reward: 180 },
    { client: "Nobre da Corte", minQuality: 80, maxCost: 70, minSize: 15, reward: 300 },
    { client: "Comerciante Árabe", minQuality: 40, maxCost: 55, minSize: 8, reward: 140 },
    { client: "Rei da França", minQuality: 90, maxCost: 80, minSize: 20, reward: 400 }
];

function getRandomOrder() {
    return orders[
        Math.floor(Math.random() * orders.length)
    ];
}

let order =
JSON.parse(localStorage.getItem("currentOrder"));

if (!order) {

    order = getRandomOrder();

    localStorage.setItem(
        "currentOrder",
        JSON.stringify(order)
    );

}
let completedOrders = Number(localStorage.getItem("completedOrders")) || 0;
let coins = Number(localStorage.getItem("coins")) || 0;

const card = document.getElementById("card");

// Cria os 15 buracos
for (let i = 0; i < 15; i++) {
    const hole = document.createElement("div");
    hole.classList.add("hole");
    hole.addEventListener("click", () => {
        hole.classList.toggle("active");
        saveCard();
    });
    card.appendChild(hole);
}

// Restaura estado do cartão — FORA do loop
const savedCard = JSON.parse(localStorage.getItem("cardState"));
if (savedCard) {
    const holes = document.querySelectorAll(".hole");
    holes.forEach((hole, index) => {
        if (savedCard[index]) hole.classList.add("active");
    });
}

const savedFabric =
localStorage.getItem("fabricMatrix");

if (savedFabric) {

    fabricMatrix = JSON.parse(savedFabric);

    const fabric =
    document.getElementById("fabric");

    fabric.innerHTML = "";

    fabricMatrix.forEach(rowData => {

        const row =
        document.createElement("div");

        row.classList.add("fabricRow");

        rowData.forEach(bit => {

            const cell =
            document.createElement("div");

            cell.classList.add("fabricCell");
            cell.classList.add(
                bit ? "upCell" : "downCell"
            );

            row.appendChild(cell);

        });

        fabric.appendChild(row);

    });

    updateStats();

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById("executeBtn").addEventListener("click", async () => {
    

    const holes = document.querySelectorAll(".hole");

    // Monta as 3 linhas do cartão
    const patterns = [];
    for (let row = 0; row < 3; row++) {
        const line = [];
        for (let col = 0; col < 5; col++) {
            line.push(holes[row * 5 + col].classList.contains("active"));
        }
        patterns.push(line);
    }

    // Animação de leitura
    card.classList.add("reading");
    await sleep(1500);
    card.classList.remove("reading");

    // Processa cada linha do cartão, uma por vez
    for (let rowIndex = 0; rowIndex < patterns.length; rowIndex++) {
        // Remove highlight anterior
        holes.forEach(h => h.classList.remove("highlight"));

        // Destaca linha atual no cartão
        for (let col = 0; col < 5; col++) {
            holes[rowIndex * 5 + col].classList.add("highlight");
        }

        // Anima os fios
        const pattern = patterns[rowIndex];
        const threads = document.querySelectorAll(".thread");
        threads.forEach((thread, i) => {
            if (pattern[i]) {
                thread.classList.add("up");
            } else {
                thread.classList.remove("up");
            }
        });

        // Cria linha no tecido
        createFabricRow(pattern);

        // Espera antes da próxima linha
        await sleep(1200);
    }

    // Remove highlight ao final
    holes.forEach(h => h.classList.remove("highlight"));
});

function createFabricRow(pattern) {
    fabricMatrix.push(pattern.map(bit => bit ? 1 : 0));
    localStorage.setItem("fabricMatrix", JSON.stringify(fabricMatrix));

    const fabric = document.getElementById("fabric");
    const row = document.createElement("div");
    row.classList.add("fabricRow");

    pattern.forEach(bit => {
        const cell = document.createElement("div");
        cell.classList.add("fabricCell");
        cell.classList.add(bit ? "upCell" : "downCell");
        row.appendChild(cell);
    });

    fabric.appendChild(row);
    updateStats();
}

function getComplexity(fabric) {
    let complexity = 0;
    fabric.forEach(row => {
        for (let i = 1; i < row.length; i++) {
            if (row[i] !== row[i - 1]) complexity++;
        }
    });
    return complexity;
}

function getSymmetry(fabric) {
    let symmetry = 0;
    fabric.forEach(row => {
        const mirrored = [...row].reverse();
        if (JSON.stringify(row) === JSON.stringify(mirrored)) symmetry += 10;
    });
    return symmetry;
}

function getQuality(fabric) { return getComplexity(fabric) + getSymmetry(fabric); }
function getCost(fabric)    { return getComplexity(fabric) + getSize(fabric) * 3; }
function getSize(fabric)    { return fabric.length; }

function getScore(fabric) {
    return Math.max(getQuality(fabric) * 10 - getCost(fabric) * 2, 0);
}

function updateStats() {
    document.getElementById("qualityValue").textContent = "Qualidade: " + getQuality(fabricMatrix);
    document.getElementById("costValue").textContent    = "Custo: "     + getCost(fabricMatrix);
    document.getElementById("sizeValue").textContent   = "Tamanho: "   + getSize(fabricMatrix);
}

function saveCard() {
    const holes = document.querySelectorAll(".hole");
    const state = [...holes].map(h => h.classList.contains("active"));
    localStorage.setItem("cardState", JSON.stringify(state));
}

function finishOrder() {
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

        order = getRandomOrder();
        renderOrder();

        currentOrderIndex++;
        if (currentOrderIndex < orders.length) {
            order = orders[currentOrderIndex];
            renderOrder();
        }
    } else {
        resultBox.innerHTML = "❌ Pedido recusado";
    }
    order = getRandomOrder();

    localStorage.setItem(
        "currentOrder",
        JSON.stringify(order)
    );

    renderOrder();
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

renderOrder();
updateCoins();

document.getElementById("restartBtn")
.addEventListener("click", () => {

    if (confirm("Recomeçar o jogo?")) {

        // Mantém as moedas
        const savedCoins =
        localStorage.getItem("coins");

        // Apaga todo o resto
        localStorage.clear();

        // Restaura as moedas
        if (savedCoins !== null) {
            localStorage.setItem(
                "coins",
                savedCoins
            );
        }

        location.reload();
    }

});

document
.getElementById("finishBtn")
.addEventListener(
    "click",
    finishOrder
);

salvarRanking(
    "Samuel",
    totalScore
);


