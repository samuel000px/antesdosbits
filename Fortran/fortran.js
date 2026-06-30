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
    },
    {
        title: "Media de medicoes",
        text: "O laboratorio recebeu as medicoes 6, 7 e 8. Some os valores, calcule a media e imprima MEDIA = 7.",
        input: { VALUES: [6, 7, 8] },
        reward: 155,
        expectedOutput: "MEDIA = 7",
        answer: ["readMedidas", "zeroSoma", "doMedia", "addMedida", "endMedia", "calcMedia", "printMedia", "end"],
        cards: [
            { id: "readMedidas", code: "READ M(1), M(2), M(3)" },
            { id: "zeroSoma", code: "SOMA = 0" },
            { id: "doMedia", code: "DO 40 I = 1, 3" },
            { id: "addMedida", code: "SOMA = SOMA + M(I)" },
            { id: "endMedia", code: "40 CONTINUE" },
            { id: "calcMedia", code: "MEDIA = SOMA / 3" },
            { id: "printMedia", code: "PRINT MEDIA" },
            { id: "printSoma", code: "PRINT SOMA" },
            { id: "calcWrongMedia", code: "MEDIA = SOMA / 2" },
            { id: "end", code: "END" }
        ],
        execute(state, cardId, log) {
            if (cardId === "readMedidas") {
                state.M = [...this.input.VALUES];
                log.push("READ M(1),M(2),M(3)  -> M = [6,7,8]");
            }
            if (cardId === "zeroSoma") {
                state.SOMA = 0;
                log.push("SOMA = 0");
            }
            if (cardId === "doMedia") {
                state.loopReady = true;
                log.push("DO 40 I = 1,3  -> prepara 3 repeticoes");
            }
            if (cardId === "addMedida") {
                if (state.loopReady && state.M) {
                    state.M.forEach((value, index) => {
                        state.SOMA += value;
                        log.push("I = " + (index + 1) + "  SOMA = SOMA + " + value + "  -> " + state.SOMA);
                    });
                } else {
                    state.SOMA += state.M?.[0] || 0;
                    log.push("SOMA = SOMA + M(I)  -> laco nao preparado");
                }
            }
            if (cardId === "endMedia") {
                log.push("40 CONTINUE  -> fim do laco");
            }
            if (cardId === "calcMedia") {
                state.MEDIA = state.SOMA / 3;
                log.push("MEDIA = SOMA / 3  -> MEDIA = " + state.MEDIA);
            }
            if (cardId === "calcWrongMedia") {
                state.MEDIA = state.SOMA / 2;
                log.push("MEDIA = SOMA / 2  -> MEDIA = " + state.MEDIA);
            }
            if (cardId === "printMedia") {
                state.output = "MEDIA = " + state.MEDIA;
                log.push("PRINT MEDIA  -> " + state.output);
            }
            if (cardId === "printSoma") {
                state.output = "SOMA = " + state.SOMA;
                log.push("PRINT SOMA  -> " + state.output);
            }
        }
    },
    {
        title: "Maior valor da fita",
        text: "A fita trouxe X = 14 e Y = 9. Use o IF aritmetico para imprimir MAIOR = 14.",
        input: { X: 14, Y: 9 },
        reward: 165,
        expectedOutput: "MAIOR = 14",
        answer: ["readXY", "ifMaior", "labelX", "printX", "end"],
        cards: [
            { id: "readXY", code: "READ X, Y" },
            { id: "ifMaior", code: "IF (X - Y) 50, 60, 70" },
            { id: "wrongIfMaior", code: "IF (Y - X) 50, 60, 70" },
            { id: "labelX", code: "70 CONTINUE" },
            { id: "labelY", code: "50 CONTINUE" },
            { id: "printX", code: "PRINT X" },
            { id: "printY", code: "PRINT Y" },
            { id: "printDiff", code: "PRINT X - Y" },
            { id: "end", code: "END" }
        ],
        execute(state, cardId, log) {
            if (cardId === "readXY") {
                state.X = this.input.X;
                state.Y = this.input.Y;
                log.push("READ X,Y  -> X = " + state.X + "  Y = " + state.Y);
            }
            if (cardId === "ifMaior") {
                state.chooseX = state.X - state.Y > 0;
                log.push("IF (X - Y) 50,60,70  -> " + (state.chooseX ? "vai para 70" : "vai para 50"));
            }
            if (cardId === "wrongIfMaior") {
                state.chooseX = false;
                log.push("IF (Y - X) 50,60,70  -> desvio errado");
            }
            if (cardId === "labelX") {
                log.push("70 CONTINUE");
            }
            if (cardId === "labelY") {
                log.push("50 CONTINUE");
            }
            if (cardId === "printX") {
                state.output = state.chooseX ? "MAIOR = " + state.X : "MAIOR = " + state.X + " (fora de contexto)";
                log.push("PRINT X  -> " + state.output);
            }
            if (cardId === "printY") {
                state.output = "MAIOR = " + state.Y;
                log.push("PRINT Y  -> " + state.output);
            }
            if (cardId === "printDiff") {
                state.output = "DIF = " + (state.X - state.Y);
                log.push("PRINT X - Y  -> " + state.output);
            }
        }
    },
    {
        title: "Pedido com imposto",
        text: "Um pedido tem BASE = 200 e TAXA = 20. Calcule o total com imposto e imprima TOTAL = 240.",
        input: { BASE: 200, TAXA: 20 },
        reward: 175,
        expectedOutput: "TOTAL = 240",
        answer: ["readPedido", "calcImposto", "calcTotal", "printTotalPedido", "end"],
        cards: [
            { id: "readPedido", code: "READ BASE, TAXA" },
            { id: "calcImposto", code: "IMPOSTO = BASE * TAXA / 100" },
            { id: "calcTotal", code: "TOTAL = BASE + IMPOSTO" },
            { id: "printTotalPedido", code: "PRINT TOTAL" },
            { id: "printBase", code: "PRINT BASE" },
            { id: "wrongTotal", code: "TOTAL = BASE + TAXA" },
            { id: "wrongTax", code: "IMPOSTO = BASE / TAXA" },
            { id: "end", code: "END" }
        ],
        execute(state, cardId, log) {
            if (cardId === "readPedido") {
                state.BASE = this.input.BASE;
                state.TAXA = this.input.TAXA;
                log.push("READ BASE,TAXA  -> BASE = " + state.BASE + "  TAXA = " + state.TAXA);
            }
            if (cardId === "calcImposto") {
                state.IMPOSTO = state.BASE * state.TAXA / 100;
                log.push("IMPOSTO = BASE * TAXA / 100  -> IMPOSTO = " + state.IMPOSTO);
            }
            if (cardId === "wrongTax") {
                state.IMPOSTO = state.BASE / state.TAXA;
                log.push("IMPOSTO = BASE / TAXA  -> IMPOSTO = " + state.IMPOSTO);
            }
            if (cardId === "calcTotal") {
                state.TOTAL = state.BASE + state.IMPOSTO;
                log.push("TOTAL = BASE + IMPOSTO  -> TOTAL = " + state.TOTAL);
            }
            if (cardId === "wrongTotal") {
                state.TOTAL = state.BASE + state.TAXA;
                log.push("TOTAL = BASE + TAXA  -> TOTAL = " + state.TOTAL);
            }
            if (cardId === "printTotalPedido") {
                state.output = "TOTAL = " + state.TOTAL;
                log.push("PRINT TOTAL  -> " + state.output);
            }
            if (cardId === "printBase") {
                state.output = "BASE = " + state.BASE;
                log.push("PRINT BASE  -> " + state.output);
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
