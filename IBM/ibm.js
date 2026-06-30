const missions = [
    {
        title: "Folha de pagamento",
        text: "Uma empresa precisa do total de salários por departamento. Há um cartão com perfuração inválida. Monte o fluxo certo para verificar, ordenar, tabular e imprimir.",
        reward: 170,
        maxSteps: 4,
        deck: [
            { id: "P01", employee: "Ana", dept: "A", salary: 180, valid: true },
            { id: "P02", employee: "Rui", dept: "B", salary: 210, valid: true },
            { id: "P03", employee: "Lia", dept: "A", salary: 160, valid: true },
            { id: "P04", employee: "Noe", dept: "C", salary: 310, valid: true },
            { id: "P05", employee: "Ivo", dept: "B", salary: 215, valid: true },
            { id: "P06", employee: "X-ERR", dept: "B", salary: 900, valid: false }
        ],
        expected: [
            { group: "A", value: 340 },
            { group: "B", value: 425 },
            { group: "C", value: 310 }
        ],
        expectedTitle: "SOMA salary POR dept"
    },
    {
        title: "Estoque de peças IBM",
        text: "O depósito recebeu cartões de estoque. Calcule a falta de cada peça, filtre só o que precisa ser reposto e imprima o valor de compra por produto.",
        reward: 230,
        maxSteps: 6,
        deck: [
            { id: "S01", sku: "R-12", stock: 9, minimum: 15, unitCost: 6, valid: true },
            { id: "S02", sku: "T-40", stock: 22, minimum: 18, unitCost: 3, valid: true },
            { id: "S03", sku: "A-77", stock: 4, minimum: 12, unitCost: 9, valid: true },
            { id: "S04", sku: "M-05", stock: 8, minimum: 8, unitCost: 7, valid: true },
            { id: "S05", sku: "B-31", stock: 1, minimum: 6, unitCost: 11, valid: true }
        ],
        expected: [
            { group: "A-77", value: 72 },
            { group: "B-31", value: 55 },
            { group: "R-12", value: 36 }
        ],
        expectedTitle: "SOMA orderValue POR sku"
    },
    {
        title: "Vendas por região",
        text: "Cartões de vendas chegaram só com código de cliente. Use o arquivo mestre para descobrir segmento e região, filtre clientes industriais e gere total por região.",
        reward: 300,
        maxSteps: 6,
        deck: [
            { id: "V01", customer: "C01", amount: 120, valid: true },
            { id: "V02", customer: "C02", amount: 95, valid: true },
            { id: "V03", customer: "C03", amount: 180, valid: true },
            { id: "V04", customer: "C01", amount: 60, valid: true },
            { id: "V05", customer: "C04", amount: 130, valid: true },
            { id: "V06", customer: "C05", amount: 70, valid: true }
        ],
        masterKey: "customer",
        master: {
            C01: { region: "NORTE", segment: "IND" },
            C02: { region: "SUL", segment: "VAREJO" },
            C03: { region: "SUL", segment: "IND" },
            C04: { region: "NORTE", segment: "IND" },
            C05: { region: "LESTE", segment: "VAREJO" }
        },
        expected: [
            { group: "NORTE", value: 310 },
            { group: "SUL", value: 180 }
        ],
        expectedTitle: "SOMA amount POR region"
    },
    {
        title: "Auditoria de cartões válidos",
        text: "A chefia quer saber quantos cartões válidos existem em cada departamento. Há um cartão inválido misturado ao lote.",
        reward: 190,
        maxSteps: 4,
        deck: [
            { id: "A01", employee: "Mia", dept: "A", salary: 120, valid: true },
            { id: "A02", employee: "Leo", dept: "A", salary: 145, valid: true },
            { id: "A03", employee: "Bia", dept: "B", salary: 180, valid: true },
            { id: "A04", employee: "Gil", dept: "C", salary: 130, valid: true },
            { id: "A05", employee: "Eva", dept: "C", salary: 155, valid: true },
            { id: "A06", employee: "R-ERR", dept: "C", salary: 999, valid: false }
        ],
        expected: [
            { group: "A", value: 2 },
            { group: "B", value: 1 },
            { group: "C", value: 2 }
        ],
        expectedTitle: "CONTA cartões POR dept"
    },
    {
        title: "Faltas por produto",
        text: "O depósito não quer o valor de compra, só a quantidade faltando em cada SKU. Calcule a falta, filtre o que precisa de reposição e gere total por produto.",
        reward: 250,
        maxSteps: 6,
        deck: [
            { id: "F01", sku: "A-10", stock: 3, minimum: 8, unitCost: 5, valid: true },
            { id: "F02", sku: "R-12", stock: 12, minimum: 12, unitCost: 6, valid: true },
            { id: "F03", sku: "M-22", stock: 1, minimum: 4, unitCost: 8, valid: true },
            { id: "F04", sku: "Z-90", stock: 6, minimum: 9, unitCost: 7, valid: true },
            { id: "F05", sku: "B-31", stock: 10, minimum: 7, unitCost: 11, valid: true }
        ],
        expected: [
            { group: "A-10", value: 5 },
            { group: "M-22", value: 3 },
            { group: "Z-90", value: 3 }
        ],
        expectedTitle: "SOMA shortage POR sku"
    },
    {
        title: "Varejo por região",
        text: "Cartões de vendas chegaram com códigos de cliente. Use o arquivo mestre, filtre o segmento VAREJO e imprima o total vendido por região.",
        reward: 320,
        maxSteps: 6,
        deck: [
            { id: "R01", customer: "C02", amount: 100, valid: true },
            { id: "R02", customer: "C06", amount: 90, valid: true },
            { id: "R03", customer: "C01", amount: 120, valid: true },
            { id: "R04", customer: "C05", amount: 70, valid: true },
            { id: "R05", customer: "C02", amount: 40, valid: true },
            { id: "R06", customer: "C03", amount: 180, valid: true }
        ],
        masterKey: "customer",
        master: {
            C01: { region: "NORTE", segment: "IND" },
            C02: { region: "SUL", segment: "VAREJO" },
            C03: { region: "SUL", segment: "IND" },
            C05: { region: "LESTE", segment: "VAREJO" },
            C06: { region: "NORTE", segment: "VAREJO" }
        },
        expected: [
            { group: "LESTE", value: 70 },
            { group: "NORTE", value: 90 },
            { group: "SUL", value: 140 }
        ],
        expectedTitle: "SOMA amount POR region"
    }
];

const machines = [
    {
        type: "verify",
        name: "Verificadora 056",
        description: "Confere cartões e remove perfurações inválidas.",
        params: []
    },
    {
        type: "sort",
        name: "Classificadora 082",
        description: "Ordena o baralho por uma coluna.",
        params: [{ name: "field", label: "Coluna", options: ["dept", "sku", "customer", "region", "segment"] }]
    },
    {
        type: "collate",
        name: "Coladora 077",
        description: "Une o baralho ao arquivo mestre. Exige baralho ordenado pela chave.",
        params: [{ name: "key", label: "Chave", options: ["customer", "sku"] }]
    },
    {
        type: "reproduce",
        name: "Reprodutora 514",
        description: "Cria campos calculados em novos cartões.",
        params: [{ name: "formula", label: "Cálculo", options: ["shortage", "orderValue"] }]
    },
    {
        type: "select",
        name: "Selecionadora",
        description: "Separa cartões que obedecem a uma condição.",
        params: [
            { name: "field", label: "Campo", options: ["shortage", "segment", "region", "valid"] },
            { name: "operator", label: "Teste", options: [">", "=", "!="] },
            { name: "value", label: "Valor", options: ["0", "IND", "VAREJO", "NORTE", "SUL", "true"] }
        ]
    },
    {
        type: "tabulate",
        name: "Tabuladora 405",
        description: "Agrupa cartões e soma/conta valores. Exige baralho ordenado pelo grupo.",
        params: [
            { name: "groupBy", label: "Grupo", options: ["dept", "sku", "region", "segment"] },
            { name: "metric", label: "Operação", options: ["sum", "count"] },
            { name: "valueField", label: "Valor", options: ["salary", "orderValue", "amount", "shortage"] }
        ]
    },
    {
        type: "print",
        name: "Impressora 407",
        description: "Imprime o relatório tabulado.",
        params: []
    }
];

let coins = Number(localStorage.getItem("coins")) || 0;
let currentMission = 0;
let workflow = [];
let deckSeed = 0;
let completed = new Set(JSON.parse(localStorage.getItem("ibmCompleted") || "[]"));

const coinsDisplay = document.getElementById("coinsDisplay");
const missionText = document.getElementById("missionText");
const missionCounter = document.getElementById("missionCounter");
const rewardDisplay = document.getElementById("rewardDisplay");
const statusDisplay = document.getElementById("statusDisplay");
const cardDeck = document.getElementById("cardDeck");
const machineList = document.getElementById("machineList");
const workflowList = document.getElementById("workflow");
const expectedReport = document.getElementById("expectedReport");
const printedReport = document.getElementById("printedReport");
const consoleOutput = document.getElementById("consoleOutput");
const clearFlowBtn = document.getElementById("clearFlowBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const runBtn = document.getElementById("runBtn");
const nextMissionBtn = document.getElementById("nextMissionBtn");

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

function renderMission() {
    const mission = missions[currentMission];
    workflow = [];

    missionText.textContent = mission.text;
    missionCounter.textContent = (currentMission + 1) + " / " + missions.length;
    rewardDisplay.textContent = mission.reward + " moedas";
    statusDisplay.textContent = "Monte o fluxo";
    consoleOutput.textContent = "Escolha máquinas na ordem correta. Cuidado: a tabuladora precisa receber cartões ordenados.";
    printedReport.textContent = "Nenhum relatório impresso.";
    nextMissionBtn.disabled = true;

    renderDeck();
    renderMachines();
    renderWorkflow();
    renderExpected();
    updateCoins();
}

function getMissionDeck() {
    const cards = missions[currentMission].deck.map(card => ({ ...card }));

    for (let i = cards.length - 1; i > 0; i--) {
        const j = (i + deckSeed * 3) % cards.length;
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
}

function renderDeck(cards = getMissionDeck()) {
    cardDeck.innerHTML = "";

    cards.forEach(card => {
        const article = document.createElement("article");
        article.className = "data-card" + (card.valid === false ? " invalid" : "");
        article.innerHTML =
            "<strong>" + card.id + (card.valid === false ? " • ERRO" : "") + "</strong>" +
            "<small>" + Object.entries(card)
                .filter(([key]) => key !== "id")
                .map(([key, value]) => key + "=" + value)
                .join(" | ") + "</small>";
        cardDeck.appendChild(article);
    });
}

function renderMachines() {
    machineList.innerHTML = "";

    machines.forEach((machine, index) => {
        const card = document.createElement("article");
        card.className = "machine-card";

        const params = document.createElement("div");
        params.className = "params";

        machine.params.forEach(param => {
            const select = document.createElement("select");
            select.dataset.param = param.name;
            param.options.forEach(optionValue => {
                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionValue;
                select.appendChild(option);
            });
            params.appendChild(labelWrap(param.label, select));
        });

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = "Adicionar";
        addButton.addEventListener("click", () => {
            const op = {
                type: machine.type,
                name: machine.name,
                params: {}
            };

            card.querySelectorAll("select").forEach(select => {
                op.params[select.dataset.param] = select.value;
            });

            workflow.push(op);
            renderWorkflow();
        });

        card.innerHTML =
            "<strong>" + machine.name + "</strong>" +
            "<p>" + machine.description + "</p>";
        card.appendChild(params);
        card.appendChild(addButton);
        machineList.appendChild(card);
    });
}

function labelWrap(text, child) {
    const label = document.createElement("label");
    label.textContent = text;
    label.appendChild(child);
    return label;
}

function renderWorkflow() {
    workflowList.innerHTML = "";

    if (!workflow.length) {
        const li = document.createElement("li");
        li.innerHTML = "<b>0</b><span>Nenhuma máquina no fluxo.</span>";
        workflowList.appendChild(li);
        return;
    }

    workflow.forEach((op, index) => {
        const li = document.createElement("li");
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "x";
        remove.addEventListener("click", () => {
            workflow.splice(index, 1);
            renderWorkflow();
        });

        li.innerHTML =
            "<b>" + (index + 1) + "</b>" +
            "<span>" + describeOperation(op) + "</span>";
        li.appendChild(remove);
        workflowList.appendChild(li);
    });
}

function describeOperation(op) {
    const p = op.params;
    if (op.type === "verify") return op.name;
    if (op.type === "sort") return op.name + " por " + p.field;
    if (op.type === "collate") return op.name + " pela chave " + p.key;
    if (op.type === "reproduce") return op.name + " calcula " + p.formula;
    if (op.type === "select") return op.name + " onde " + p.field + " " + p.operator + " " + p.value;
    if (op.type === "tabulate") return op.name + " " + p.metric + " " + p.valueField + " por " + p.groupBy;
    if (op.type === "print") return op.name;
    return op.name;
}

function renderExpected() {
    expectedReport.innerHTML = reportToTable(missions[currentMission].expected, missions[currentMission].expectedTitle);
}

function runWorkflow() {
    const mission = missions[currentMission];
    const state = {
        cards: getMissionDeck(),
        sortedBy: null,
        report: null,
        printed: null,
        cost: 0,
        errors: [],
        log: ["Operador iniciou o lote: " + mission.title, ""]
    };

    workflow.forEach((op, index) => {
        state.log.push((index + 1) + ". " + describeOperation(op));
        applyOperation(state, op, mission);
        state.log.push("");
    });

    const success = reportsEqual(state.printed, mission.expected) && !state.errors.length;
    const overSteps = Math.max(0, workflow.length - mission.maxSteps);
    const penalty = overSteps * 25 + state.errors.length * 35;

    if (success) {
        const key = String(currentMission);
        let reward = Math.max(30, mission.reward - penalty);

        if (completed.has(key)) {
            reward = Math.round(reward * 0.25);
            state.log.push("Ordem já concluída antes. Revisão paga +" + reward + " moedas.");
        } else {
            completed.add(key);
            localStorage.setItem("ibmCompleted", JSON.stringify([...completed]));
            state.log.push("Relatório aceito pela chefia.");
            state.log.push("Moedas recebidas: +" + reward);
        }

        coins += reward;
        localStorage.setItem("coins", coins);
        updateCoins();
        saveRanking();

        statusDisplay.textContent = "Relatório aceito";
        nextMissionBtn.disabled = currentMission >= missions.length - 1;
    } else {
        state.log.push("Relatório rejeitado.");
        if (!reportsEqual(state.printed, mission.expected)) {
            state.log.push("Os totais impressos não batem com a ordem de serviço.");
        }
        if (state.errors.length) {
            state.log.push("Falhas encontradas:");
            state.errors.forEach(error => state.log.push("- " + error));
        }
        state.log.push("Dica: verifique cartões inválidos, ordenação antes da tabulação e campos calculados.");
        statusDisplay.textContent = "Relatório rejeitado";
        nextMissionBtn.disabled = true;
    }

    printedReport.innerHTML = state.printed ? reportToTable(state.printed, "IMPRESSO") : "Nada foi impresso.";
    consoleOutput.textContent = state.log.join("\n");
    renderDeck(state.cards);
}

function applyOperation(state, op, mission) {
    state.cost += 1;

    if (op.type === "verify") {
        const before = state.cards.length;
        state.cards = state.cards.filter(card => card.valid !== false);
        state.log.push("Verificadora removeu " + (before - state.cards.length) + " cartão inválido.");
        return;
    }

    if (op.type === "sort") {
        const field = op.params.field;
        state.cards.sort((a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? ""), "pt-BR", { numeric: true }));
        state.sortedBy = field;
        state.log.push("Baralho ordenado por " + field + ".");
        return;
    }

    if (op.type === "collate") {
        const key = op.params.key;
        if (!mission.master || !mission.masterKey || mission.masterKey !== key) {
            state.errors.push("A coladora recebeu uma chave sem arquivo mestre compatível.");
            return;
        }

        if (state.sortedBy !== key) {
            state.errors.push("A coladora emperrou: o baralho precisava estar ordenado por " + key + ".");
        }

        state.cards = state.cards.map(card => ({ ...card, ...(mission.master[card[key]] || {}) }));
        state.sortedBy = null;
        state.log.push("Arquivo mestre colado aos cartões.");
        return;
    }

    if (op.type === "reproduce") {
        if (op.params.formula === "shortage") {
            state.cards = state.cards.map(card => ({ ...card, shortage: Math.max(0, (Number(card.minimum) || 0) - (Number(card.stock) || 0)) }));
            state.log.push("Campo shortage perfurado nos cartões.");
        }

        if (op.params.formula === "orderValue") {
            state.cards = state.cards.map(card => ({ ...card, orderValue: (Number(card.shortage) || 0) * (Number(card.unitCost) || 0) }));
            state.log.push("Campo orderValue perfurado nos cartões.");
        }

        state.sortedBy = null;
        return;
    }

    if (op.type === "select") {
        const { field, operator, value } = op.params;
        const before = state.cards.length;
        state.cards = state.cards.filter(card => compareValue(card[field], operator, value));
        state.log.push("Selecionadora manteve " + state.cards.length + " de " + before + " cartões.");
        return;
    }

    if (op.type === "tabulate") {
        const { groupBy, metric, valueField } = op.params;

        if (state.sortedBy !== groupBy) {
            state.errors.push("A tabuladora exige baralho ordenado por " + groupBy + ".");
        }

        const totals = new Map();
        state.cards.forEach(card => {
            const group = String(card[groupBy] ?? "SEM-CAMPO");
            const current = totals.get(group) || 0;
            totals.set(group, current + (metric === "count" ? 1 : Number(card[valueField]) || 0));
        });

        state.report = [...totals.entries()]
            .map(([group, value]) => ({ group, value }))
            .sort((a, b) => String(a.group).localeCompare(String(b.group), "pt-BR", { numeric: true }));
        state.log.push("Tabuladora gerou " + state.report.length + " linha(s).");
        return;
    }

    if (op.type === "print") {
        if (!state.report) {
            state.errors.push("A impressora não recebeu relatório da tabuladora.");
            return;
        }
        state.printed = state.report.map(row => ({ ...row }));
        state.log.push("Impressora 407 produziu relatório.");
    }
}

function compareValue(actual, operator, expectedRaw) {
    const expected = isNaN(Number(expectedRaw)) ? expectedRaw : Number(expectedRaw);
    const value = isNaN(Number(actual)) ? actual : Number(actual);

    if (operator === ">") return value > expected;
    if (operator === "=") return value === expected;
    if (operator === "!=") return value !== expected;
    return false;
}

function reportsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return a.every((row, index) => row.group === b[index].group && Number(row.value) === Number(b[index].value));
}

function reportToTable(report, title) {
    if (!report || !report.length) return "Sem linhas.";

    return "<strong>" + title + "</strong>" +
        "<table><thead><tr><th>Grupo</th><th>Total</th></tr></thead><tbody>" +
        report.map(row => "<tr><td>" + row.group + "</td><td>" + row.value + "</td></tr>").join("") +
        "</tbody></table>";
}

function clearFlow() {
    workflow = [];
    statusDisplay.textContent = "Monte o fluxo";
    consoleOutput.textContent = "Fluxo limpo. Monte a sequência de máquinas.";
    printedReport.textContent = "Nenhum relatório impresso.";
    nextMissionBtn.disabled = true;
    renderWorkflow();
}

function shuffleDeck() {
    deckSeed++;
    renderDeck();
}

function nextMission() {
    if (currentMission < missions.length - 1) {
        currentMission++;
        deckSeed = 0;
        renderMission();
    }
}

clearFlowBtn.addEventListener("click", clearFlow);
shuffleBtn.addEventListener("click", shuffleDeck);
runBtn.addEventListener("click", runWorkflow);
nextMissionBtn.addEventListener("click", nextMission);

renderMission();
