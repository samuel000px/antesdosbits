
let fabricMatrix = [];

const orders = [

    {
        client: "Alfaiate Local",
        minQuality: 30,
        maxCost: 50,
        minSize: 6,
        reward: 100
    },

    {
        client: "Mercador de Seda",
        minQuality: 50,
        maxCost: 45,
        minSize: 10,
        reward: 180
    },

    {
        client: "Nobre da Corte",
        minQuality: 80,
        maxCost: 70,
        minSize: 15,
        reward: 300
    }

];
let currentOrderIndex = 0;

let order =
orders[currentOrderIndex];



let completedOrders =
Number(
localStorage.getItem(
"completedOrders"
)
) || 0;

const savedFabric =
localStorage.getItem("fabricMatrix");

if(savedFabric){

    fabricMatrix =
    JSON.parse(savedFabric);

}

let coins = Number(
    localStorage.getItem("coins")
) || 0;


const card =
document.getElementById("card");

function saveGame(){

    localStorage.setItem(
        "fabricMatrix",
        JSON.stringify(fabricMatrix)
    );

}

for(let i=0;i<15;i++){

    const hole =
    document.createElement("div");

    hole.classList.add("hole");

    hole.addEventListener("click",()=>{

        hole.classList.toggle("active");

        saveCard();

    });

    card.appendChild(hole);
    const savedCard =
JSON.parse(
    localStorage.getItem("cardState")
);

    if(savedCard){

        const holes =
        document.querySelectorAll(".hole");

        holes.forEach((hole,index)=>{

            if(savedCard[index]){

                hole.classList.add("active");

            }

        });

    }

}

const threads =
document.querySelectorAll(".thread");

document
.getElementById("executeBtn")
.addEventListener("click", executeCard);

function executeCard(){


    const holes =
    document.querySelectorAll(".hole");

    const patterns = [];

    // transformar o cartão em matriz

    for(let row = 0; row < 3; row++){

        const line = [];

        for(let col = 0; col < 5; col++){

            const index = row * 5 + col;

            line.push(
                holes[index]
                .classList
                .contains("active")
            );

        }

        patterns.push(line);

    }

    card.classList.add("reading");

    setTimeout(() => {

        card.classList.remove("reading");

        runPattern(patterns,0);

    },1500);

}

function runPattern(patterns,rowIndex){

    if(rowIndex >= patterns.length){


        return;

    }

    const holes =
    document.querySelectorAll(".hole");

    holes.forEach(h=>{

        h.classList.remove("highlight");

    });

    for(let col = 0; col < 5; col++){

        const index =
        rowIndex * 5 + col;

        holes[index]
        .classList
        .add("highlight");

    }

    const currentPattern =
    patterns[rowIndex];

    animateThreads(currentPattern);

    createFabricRow(currentPattern);

    setTimeout(()=>{

        runPattern(
            patterns,
            rowIndex + 1
        );

    },1200);

}

function animateThreads(pattern){

    threads.forEach((thread,index)=>{

        if(pattern[index]){

            thread.classList.add("up");

        }else{

            thread.classList.remove("up");

        }

    });

}


function updateStats(){

    const quality =
    getQuality(fabricMatrix);

    const cost =
    getCost(fabricMatrix);

    const size =
    getSize(fabricMatrix);

    const score =
    getScore(fabricMatrix);

    document.getElementById("qualityValue")
    .textContent =
    "Qualidade: " + quality;

    document.getElementById("costValue")
    .textContent =
    "Custo: " + cost;

    document.getElementById("sizeValue")
    .textContent =
    "Tamanho: " + size;

    document.getElementById("scoreValue")
    .textContent =
    "Pontuação: " + score;

}

function createFabricRow(pattern){

    console.log("CRIANDO LINHA", pattern);
    fabricMatrix.push(
    pattern.map(bit => bit ? 1 : 0)
);

    saveGame();

    const fabric =
    document.getElementById("fabric");

    const row =
    document.createElement("div");

    row.classList.add("fabricRow");

    pattern.forEach(bit=>{

        const cell =
        document.createElement("div");

        cell.classList.add("fabricCell");

        if(bit){

            cell.classList.add("upCell");

        }else{

            cell.classList.add("downCell");

        }

        row.appendChild(cell);

    });

    fabric.appendChild(row);
    updateStats();

}
function getComplexity(fabric){

    let complexity = 0;

    fabric.forEach(row => {

        for(let i=1;i<row.length;i++){

            if(row[i] !== row[i-1]){

                complexity++;

            }

        }

    });

    return complexity;

}
function getSymmetry(fabric){

    let symmetry = 0;

    fabric.forEach(row => {

        const mirrored =
        [...row].reverse();

        if(
            JSON.stringify(row)
            ===
            JSON.stringify(mirrored)
        ){

            symmetry += 10;

        }

    });

    return symmetry;

}
function getQuality(fabric){

    return (
        getComplexity(fabric)
        +
        getSymmetry(fabric)
    );

}
function getCost(fabric){

    return (

        getComplexity(fabric)

        +

        getSize(fabric) * 3

    );

}
function getSize(fabric){

    return fabric.length;

}
function getScore(fabric){

    const quality =
    getQuality(fabric);

    const cost =
    getCost(fabric);

    let score = 0;

    score += quality * 10;

    score -= cost * 2;

    return Math.max(score,0);

}

function saveCard(){

    const holes =
    document.querySelectorAll(".hole");

    const state = [];

    holes.forEach(h=>{

        state.push(
            h.classList.contains("active")
        );

    });

    localStorage.setItem(
        "cardState",
        JSON.stringify(state)
    );

}

function finishOrder(){

    let reward =
    order.reward;
    const quality =
    getQuality(fabricMatrix);

    const cost =
    getCost(fabricMatrix);

    const size =
    getSize(fabricMatrix);

    let success = true;

    if(
        quality <
        order.minQuality
    ){
        success = false;
    }

    if(
        cost >
        order.maxCost
    ){
        success = false;
    }

    if(
        size <
        order.minSize
    ){
        success = false;
    }

    const resultBox =
    document.getElementById(
        "resultBox"
    );

    if(success){

    coins += order.reward;

    localStorage.setItem(
        "coins",
        coins
    );

    updateCoins();

    completedOrders++;

    localStorage.setItem(
        "completedOrders",
        completedOrders
    );


    resultBox.innerHTML =

    "<h3>✅ Pedido concluído</h3>" +

    "<p>Moedas recebidas: " +
    order.reward +
    "</p>" +

    "<p>Total de moedas: " +
    coins +
    "</p>";

    resultBox.innerHTML =

"<h3>✅ Pedido concluído</h3>" +

"<p>Qualidade: " + quality +
" / " + order.minQuality + "</p>" +

"<p>Custo: " + cost +
" / " + order.maxCost + "</p>" +

"<p>Tamanho: " + size +
" / " + order.minSize + "</p>" +

"<p>Moedas recebidas: " +
order.reward + "</p>";


    if(
    quality >
    order.minQuality + 20
    ){

    reward += 50;

    }

    if(
    cost <
    order.maxCost - 10
    ){

    reward += 25;

    }


        if(
            currentOrderIndex <
            orders.length
        ){

            order =
            orders[
                currentOrderIndex
            ];

            renderOrder();

        }

    }else{

        resultBox.innerHTML =

        "❌ Pedido recusado";

    }

}
function renderOrder(){

    document.getElementById("clientName")
    .textContent =
    order.client;

    document.getElementById("orderQuality")
    .textContent =
    "Qualidade mínima: " +
    order.minQuality;

    document.getElementById("orderCost")
    .textContent =
    "Custo máximo: " +
    order.maxCost;

    document.getElementById("orderSize")
    .textContent =
    "Tamanho mínimo: " +
    order.minSize;

}
renderOrder();

document
.getElementById("finishBtn")
.addEventListener(
    "click",
    finishOrder
);
function updateCoins(){

    document
    .getElementById("coinsDisplay")
    .textContent =
    "💰 " + coins + " moedas";

}

updateCoins();




