const missions = [
    {
        title: "Temperatura do laboratório",
        text: "O operador digitou C = 25. Monte uma pilha que leia Celsius, converta para Fahrenheit e imprima 77.",
        input: { C: 25 },
        reward: 90,
        expectedOutput: "F = 77",
        answer: ["readC", "calcF", "printF", "end"],
        cards: [
            { id: "readC", code: "READ C" },
            { id: "calcF", code: "F = C * 9 / 5 + 32" },
            { id: "printF", code: "PRINT F" },
            { id: "printC", code: "PRINT C" },
            { id: "calcWrong", code: "F = C + 32" },
            { id: "end", code: "END" }
        ],
        execute(state, cardId, log) {
            if (cardId === "readC") {
                state.C = this.input.C;
                log.push("READ C  -> C = " + state.C);
            }
            if (cardId === "calcF") {
                state.F = state.C * 9 / 5 + 32;
                log.push("F = C * 9 / 5 + 32  -> F = " + state.F);
            }
            if (cardId === "printF") {
                state.output = "F = " + state.F;
                log.push("PRINT F  -> " + state.output);
            }
            if (cardId === "printC") {
                state.output = "C = " + state.C;
                log.push("PRINT C  -> " + state.output);
            }
            if (cardId === "calcWrong") {
                state.F = state.C + 32;
                log.push("F = C + 32  -> F = " + state.F);
            }
        }
    },
    {
        title: "Controle de estoque",
        text: "O almoxarifado tem ESTOQUE = 8. Se for menor que 10, imprima REABASTECER. Use a lógica IF/GOTO da época.",
        input: { ESTOQUE: 8 },
        reward: 115,
        expectedOutput: "REABASTECER",
        answer: ["readEstoque", "ifLow", "gotoOk", "labelLow", "printRepor", "end"],
        cards: [
            { id: "readEstoque", code: "READ ESTOQUE" },
            { id: "ifLow", code: "IF (ESTOQUE - 10) 40, 50, 50" },
            { id: "gotoOk", code: "GOTO 50" },
            { id: "labelLow", code: "40 CONTINUE" },
            { id: "printRepor", code: "PRINT 'REABASTECER'" },
            { id: "printOk", code: "PRINT 'ESTOQUE OK'" },
            { id: "wrongIf", code: "IF (ESTOQUE - 10) 50, 40, 40" },
            { id: "end", code: "50 END" }
        ],
        execute(state, cardId, log) {
            if (cardId === "readEstoque") {
                state.ESTOQUE = this.input.ESTOQUE;
                log.push("READ ESTOQUE  -> ESTOQUE = " + state.ESTOQUE);
            }
            if (cardId === "ifLow") {
                state.flagLow = state.ESTOQUE - 10 < 0;
                log.push("IF (ESTOQUE - 10) 40,50,50  -> " + (state.flagLow ? "vai para 40" : "vai para 50"));
            }
            if (cardId === "wrongIf") {
                state.flagLow = false;
                log.push("IF invertido  -> desvia para o lado errado");
            }
            if (cardId === "labelLow") {
                log.push("40 CONTINUE  -> bloco de estoque baixo");
            }
            if (cardId === "printRepor") {
                state.output = state.flagLow ? "REABASTECER" : "REABASTECER (fora de contexto)";
                log.push("PRINT 'REABASTECER'  -> " + state.output);
            }
            if (cardId === "printOk") {
                state.output = "ESTOQUE OK";
                log.push("PRINT 'ESTOQUE OK'  -> " + state.output);
            }
        }
    },
    {
        title: "Soma com laço DO",
        text: "A máquina recebeu valores 2, 4 e 6. Monte um laço DO que some os três e imprima TOTAL = 12.",
        input: { VALUES: [2, 4, 6] },
        reward: 140,
        expectedOutput: "TOTAL = 12",
        answer: ["readValues", "zeroTotal", "doLoop", "addValue", "endLoop", "printTotal", "end"],
        cards: [
            { id: "readValues", code: "READ A(1), A(2), A(3)" },
            { id: "zeroTotal", code: "TOTAL = 0" },
            { id: "doLoop", code: "DO 30 I = 1, 3" },
            { id: "addValue", code: "TOTAL = TOTAL + A(I)" },
            { id: "endLoop", code: "30 CONTINUE" },
            { id: "printTotal", code: "PRINT TOTAL" },
            { id: "printA", code: "PRINT A(I)" },
            { id: "noZero", code: "TOTAL = 1" },
            { id: "end", code: "END" }
        ],
        execute(state, cardId, log) {
            if (cardId === "readValues") {
                state.A = [...this.input.VALUES];
                log.push("READ A(1),A(2),A(3)  -> A = [2,4,6]");
            }
            if (cardId === "zeroTotal") {
                state.TOTAL = 0;
                log.push("TOTAL = 0");
            }
            if (cardId === "noZero") {
                state.TOTAL = 1;
                log.push("TOTAL = 1  -> acumulador começou errado");
            }
            if (cardId === "doLoop") {
                state.loopReady = true;
                log.push("DO 30 I = 1,3  -> prepara 3 repetições");
            }
            if (cardId === "addValue") {
                if (state.loopReady && state.A) {
                    state.A.forEach((value, index) => {
                        state.TOTAL += value;
                        log.push("I = " + (index + 1) + "  TOTAL = TOTAL + " + value + "  -> " + state.TOTAL);
                    });
                } else {
                    state.TOTAL += state.A?.[0] || 0;
                    log.push("TOTAL = TOTAL + A(I)  -> laço não preparado");
                }
            }
            if (cardId === "endLoop") {
                log.push("30 CONTINUE  -> fim do laço");
            }
            if (cardId === "printTotal") {
                state.output = "TOTAL = " + state.TOTAL;
                log.push("PRINT TOTAL  -> " + state.output);
            }
            if (cardId === "printA") {
                state.output = "A(I) = " + (state.A?.[0] || 0);
                log.push("PRINT A(I)  -> " + state.output);
            }
        }
    }
];

let coins = Number(localStorage.getItem("coins")) || 0;
let currentMission = 0;
let selectedDeck = [];
let completed = new Set(JSON.parse(localStorage.getItem("fortranCompleted") || "[]"));

const tutorialPanel = document.getElementById("tutorialPanel");
const gamePanel = document.getElementById("gamePanel");
const coinsDisplay = document.getElementById("coinsDisplay");
const startTutorialBtn = document.getElementById("startTutorialBtn");
const missionTitle = document.getElementById("missionTitle");
const missionText = document.getElementById("missionText");
const missionCounter = document.getElementById("missionCounter");
const rewardDisplay = document.getElementById("rewardDisplay");
const statusDisplay = document.getElementById("statusDisplay");
const availableCards = document.getElementById("availableCards");
const deck = document.getElementById("deck");
const consoleOutput = document.getElementById("consoleOutput");
const resetBtn = document.getElementById("resetBtn");
const runBtn = document.getElementById("runBtn");
const nextBtn = document.getElementById("nextBtn");

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

function showGame() {
    tutorialPanel.classList.remove("visible");
    gamePanel.classList.add("visible");
    renderMission();
}

function renderMission() {
    const mission = missions[currentMission];
    selectedDeck = [];

    missionTitle.textContent = mission.title;
    missionText.textContent = mission.text;
    missionCounter.textContent = (currentMission + 1) + " / " + missions.length;
    rewardDisplay.textContent = mission.reward + " moedas";
    statusDisplay.textContent = "Monte a pilha";
    consoleOutput.textContent = "Escolha os cartões na ordem em que o leitor deve executar.";
    nextBtn.disabled = true;

    renderCards();
    renderDeck();
    updateCoins();
}

function renderCards() {
    const mission = missions[currentMission];
    availableCards.innerHTML = "";

    mission.cards.forEach(card => {
        const used = selectedDeck.includes(card.id);
        const button = createCardElement(card, used);
        button.disabled = used;
        button.addEventListener("click", () => {
            if (!selectedDeck.includes(card.id)) {
                selectedDeck.push(card.id);
                renderCards();
                renderDeck();
            }
        });
        availableCards.appendChild(button);
    });
}

function renderDeck() {
    const mission = missions[currentMission];
    deck.innerHTML = "";

    if (!selectedDeck.length) {
        const empty = document.createElement("div");
        empty.className = "empty-deck";
        empty.textContent = "Nenhum cartão na pilha ainda.";
        deck.appendChild(empty);
        return;
    }

    selectedDeck.forEach((cardId, index) => {
        const card = mission.cards.find(item => item.id === cardId);
        const button = createCardElement(card, false);
        button.title = "Clique para remover este cartão da pilha";
        button.addEventListener("click", () => {
            selectedDeck.splice(index, 1);
            renderCards();
            renderDeck();
        });
        deck.appendChild(button);
    });
}

function createCardElement(card, used) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "program-card";
    button.innerHTML =
        "<strong>Cartão FORTRAN</strong>" +
        "<code>" + card.code + "</code>" +
        (used ? "<small>Já está na pilha.</small>" : "");
    return button;
}

function runDeck() {
    const mission = missions[currentMission];
    const state = {};
    const log = ["Leitor iniciou a pilha...", ""];

    selectedDeck.forEach((cardId, index) => {
        const card = mission.cards.find(item => item.id === cardId);
        log.push("Cartão " + (index + 1) + ": " + card.code);
        mission.execute(state, cardId, log);
        if (cardId === "end") {
            log.push("END  -> programa encerrado");
        }
        log.push("");
    });

    const exactOrder = mission.answer.join("|") === selectedDeck.join("|");
    const outputOk = state.output === mission.expectedOutput;

    if (exactOrder && outputOk) {
        completeMission(log);
    } else {
        failMission(log, state.output, outputOk);
    }
}

function completeMission(log) {
    const mission = missions[currentMission];
    const key = String(currentMission);
    let reward = mission.reward;

    if (completed.has(key)) {
        reward = Math.round(reward * 0.25);
        log.push("Missão já concluída antes. Bônus de revisão: +" + reward + " moedas.");
    } else {
        completed.add(key);
        localStorage.setItem("fortranCompleted", JSON.stringify([...completed]));
        log.push("Pilha correta. Programa aceito pelo operador.");
        log.push("Moedas recebidas: +" + reward);
    }

    coins += reward;
    localStorage.setItem("coins", coins);
    updateCoins();
    saveRanking();

    statusDisplay.textContent = "Programa aceito";
    consoleOutput.textContent = log.join("\n");
    nextBtn.disabled = currentMission >= missions.length - 1;

    if (currentMission >= missions.length - 1) {
        consoleOutput.textContent += "\n\nVocê completou a fase FORTRAN. A pilha está pronta para o museu.";
    }
}

function failMission(log, output, outputOk) {
    const mission = missions[currentMission];
    const expected = mission.answer.map(id => {
        const card = mission.cards.find(item => item.id === id);
        return card.code;
    });

    log.push("Pilha rejeitada.");
    log.push("Saída esperada: " + mission.expectedOutput);
    log.push("Sua saída: " + (output || "nenhuma"));

    if (outputOk) {
        log.push("A saída até bateu, mas a ordem histórica da pilha não ficou correta.");
    } else {
        log.push("Revise a ordem: entrada, cálculo/desvio/laço, saída e END.");
    }

    log.push("");
    log.push("Pilha de referência:");
    expected.forEach((line, index) => log.push((index + 1) + ". " + line));

    statusDisplay.textContent = "Pilha rejeitada";
    consoleOutput.textContent = log.join("\n");
}

function resetDeck() {
    selectedDeck = [];
    statusDisplay.textContent = "Monte a pilha";
    consoleOutput.textContent = "Pilha limpa. Escolha os cartões de novo.";
    nextBtn.disabled = true;
    renderCards();
    renderDeck();
}

function nextMission() {
    if (currentMission < missions.length - 1) {
        currentMission++;
        renderMission();
    }
}

startTutorialBtn.addEventListener("click", showGame);
resetBtn.addEventListener("click", resetDeck);
runBtn.addEventListener("click", runDeck);
nextBtn.addEventListener("click", nextMission);

tutorialPanel.classList.add("visible");
updateCoins();
