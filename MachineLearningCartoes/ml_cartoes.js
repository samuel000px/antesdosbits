const GRID_ROWS = 5;
const GRID_COLS = 12;
const CARD_AREA = { x: 90, y: 90, w: 720, h: 330 };

const instructions = [
    {
        id: "read",
        name: "READ",
        code: "READ C",
        meaning: "Entrada de dados: o computador lê o valor perfurado para uma variável.",
        holes: [1, 14, 25, 38, 49]
    },
    {
        id: "calc",
        name: "CALCULO",
        code: "F = C * 9 / 5 + 32",
        meaning: "Processamento matemático típico de FORTRAN.",
        holes: [0, 5, 13, 18, 29, 34, 47, 58]
    },
    {
        id: "if",
        name: "IF / GOTO",
        code: "IF (N) 10,20,30",
        meaning: "Desvio condicional: escolhe outro cartão conforme o valor.",
        holes: [3, 9, 12, 21, 30, 42, 51, 57]
    },
    {
        id: "print",
        name: "PRINT",
        code: "PRINT RESULT",
        meaning: "Saída: imprime o resultado calculado.",
        holes: [2, 16, 23, 31, 36, 44, 55]
    }
];

let currentImage = null;
let currentPattern = Array(GRID_ROWS * GRID_COLS).fill(false);
let lastFeatures = [];

const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");
const imageInput = document.getElementById("imageInput");
const sampleBtn = document.getElementById("sampleBtn");
const detectBtn = document.getElementById("detectBtn");
const trainBtn = document.getElementById("trainBtn");
const exportBtn = document.getElementById("exportBtn");
const clearTrainingBtn = document.getElementById("clearTrainingBtn");
const labelSelect = document.getElementById("labelSelect");
const modelStatus = document.getElementById("modelStatus");
const sampleCount = document.getElementById("sampleCount");
const imageStatus = document.getElementById("imageStatus");
const predictionBox = document.getElementById("predictionBox");
const holeMatrix = document.getElementById("holeMatrix");
const legendBox = document.getElementById("legendBox");

function getTrainingSamples() {
    return JSON.parse(localStorage.getItem("cardMlSamples") || "[]");
}

function setTrainingSamples(samples) {
    localStorage.setItem("cardMlSamples", JSON.stringify(samples));
}

function updateTrainingStatus() {
    const samples = getTrainingSamples();
    sampleCount.textContent = samples.length;
    modelStatus.textContent = samples.length ? "Modelo treinado local" : "Modelo inicial";
}

function renderInstructionOptions() {
    labelSelect.innerHTML = "";
    instructions.forEach(instruction => {
        const option = document.createElement("option");
        option.value = instruction.id;
        option.textContent = instruction.name + " - " + instruction.code;
        labelSelect.appendChild(option);
    });
}

function renderLegend() {
    legendBox.innerHTML = "";
    instructions.forEach(instruction => {
        const article = document.createElement("article");
        article.innerHTML =
            "<strong>" + instruction.name + "</strong><br>" +
            "<code>" + instruction.code + "</code><br>" +
            "<span>" + instruction.meaning + "</span>";
        legendBox.appendChild(article);
    });
}

function renderMatrix() {
    holeMatrix.innerHTML = "";

    currentPattern.forEach((active, index) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "hole-cell" + (active ? " on" : "");
        cell.title = "Furo " + (index + 1);
        cell.addEventListener("click", () => {
            currentPattern[index] = !currentPattern[index];
            renderMatrix();
            drawOverlay();
        });
        holeMatrix.appendChild(cell);
    });
}

function drawEmptyCanvas() {
    ctx.fillStyle = "#fff8e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6a5537";
    ctx.font = "24px Arial";
    ctx.fillText("Envie uma foto ou gere um cartão realista.", 230, 260);
}

function drawSyntheticCard(instruction = instructions[Math.floor(Math.random() * instructions.length)]) {
    currentImage = null;
    currentPattern = Array(GRID_ROWS * GRID_COLS).fill(false);
    instruction.holes.forEach(index => currentPattern[index] = true);
    labelSelect.value = instruction.id;

    ctx.fillStyle = "#2b261d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(80, 70, 820, 430);
    gradient.addColorStop(0, "#d9b77d");
    gradient.addColorStop(1, "#c99b5e");
    ctx.fillStyle = gradient;
    roundRect(ctx, 70, 70, 760, 360, 18);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(92, 92, 716, 1);
    ctx.fillStyle = "rgba(76,47,18,.08)";
    for (let i = 0; i < 500; i++) {
        ctx.fillRect(80 + Math.random() * 740, 78 + Math.random() * 340, 1, 1);
    }

    ctx.fillStyle = "#b9874e";
    ctx.fillRect(112, 116, 675, 1);
    ctx.fillRect(112, 390, 675, 1);
    ctx.fillStyle = "#3c2a18";
    ctx.font = "bold 18px Courier New";
    ctx.fillText("FORTRAN PUNCHED CARD  //  " + instruction.code, 120, 102);

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const index = row * GRID_COLS + col;
            const point = gridPoint(row, col);
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, 12, 17, 0, 0, Math.PI * 2);
            if (currentPattern[index]) {
                ctx.fillStyle = "#16110d";
                ctx.fill();
                ctx.strokeStyle = "rgba(0,0,0,.65)";
                ctx.stroke();
            } else {
                ctx.strokeStyle = "rgba(63,43,22,.32)";
                ctx.stroke();
            }
        }
    }
    imageStatus.textContent = "Cartão sintético realista";
    renderMatrix();
    detectInstruction();
}

function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
}

function gridPoint(row, col) {
    return {
        x: CARD_AREA.x + (col + 0.5) * (CARD_AREA.w / GRID_COLS),
        y: CARD_AREA.y + (row + 0.5) * (CARD_AREA.h / GRID_ROWS)
    };
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = event => {
        const image = new Image();
        image.onload = () => {
            currentImage = image;
            fitImageToCanvas(image);
            imageStatus.textContent = "Imagem carregada";
            detectInstruction();
        };
        image.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function fitImageToCanvas(image) {
    ctx.fillStyle = "#11151b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    ctx.drawImage(image, x, y, width, height);
}

function getModelThreshold() {
    const samples = getTrainingSamples();

    if (!samples.length) {
        return 0.46;
    }

    const values = [];
    samples.forEach(sample => {
        sample.features.forEach((feature, index) => {
            values.push({ feature, active: sample.pattern[index] });
        });
    });

    const holeValues = values.filter(item => item.active).map(item => item.feature);
    const blankValues = values.filter(item => !item.active).map(item => item.feature);

    if (!holeValues.length || !blankValues.length) {
        return 0.46;
    }

    const holeAvg = average(holeValues);
    const blankAvg = average(blankValues);
    return (holeAvg + blankAvg) / 2;
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function detectPatternFromCanvas() {
    const threshold = getModelThreshold();
    const features = [];
    const pattern = [];

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const point = gridPoint(row, col);
            const darkness = sampleDarkness(point.x, point.y, 18);
            features.push(darkness);
            pattern.push(darkness >= threshold);
        }
    }

    lastFeatures = features;
    currentPattern = pattern;
}

function sampleDarkness(x, y, radius) {
    const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
    let darkness = 0;
    let count = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const luma = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
        darkness += 1 - luma;
        count++;
    }

    return darkness / count;
}

function detectInstruction() {
    if (currentImage) {
        fitImageToCanvas(currentImage);
    }

    detectPatternFromCanvas();
    renderMatrix();
    drawOverlay();

    const prediction = classifyPattern(currentPattern);
    renderPrediction(prediction);
}

function classifyPattern(pattern) {
    const ranked = instructions.map(instruction => {
        const expected = Array(GRID_ROWS * GRID_COLS).fill(false);
        instruction.holes.forEach(index => expected[index] = true);

        let matches = 0;
        for (let i = 0; i < expected.length; i++) {
            if (expected[i] === pattern[i]) matches++;
        }

        return {
            instruction,
            confidence: Math.round((matches / expected.length) * 100)
        };
    }).sort((a, b) => b.confidence - a.confidence);

    return ranked[0];
}

function renderPrediction(prediction) {
    predictionBox.innerHTML =
        "<strong>" + prediction.instruction.name + "</strong>" +
        "<code>" + prediction.instruction.code + "</code>" +
        "<p>" + prediction.instruction.meaning + "</p>" +
        "<p>Confiança: " + prediction.confidence + "%</p>";
}

function drawOverlay() {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(126,199,188,.95)";
    ctx.strokeRect(CARD_AREA.x, CARD_AREA.y, CARD_AREA.w, CARD_AREA.h);

    currentPattern.forEach((active, index) => {
        const row = Math.floor(index / GRID_COLS);
        const col = index % GRID_COLS;
        const point = gridPoint(row, col);

        ctx.beginPath();
        ctx.arc(point.x, point.y, active ? 17 : 8, 0, Math.PI * 2);
        ctx.fillStyle = active ? "rgba(167,63,54,.72)" : "rgba(47,95,90,.18)";
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(255,248,232,.9)" : "rgba(47,95,90,.35)";
        ctx.stroke();
    });

    const prediction = classifyPattern(currentPattern);
    ctx.fillStyle = "rgba(17,21,27,.9)";
    roundRect(ctx, 105, 36, 690, 42, 8);
    ctx.fill();
    ctx.fillStyle = "#cfe9df";
    ctx.font = "bold 20px Courier New";
    ctx.fillText("IA detectou: " + prediction.instruction.code + "  (" + prediction.confidence + "%)", 124, 64);
    ctx.restore();
}

function saveTrainingSample() {
    if (!lastFeatures.length) {
        detectPatternFromCanvas();
    }

    const samples = getTrainingSamples();
    samples.push({
        label: labelSelect.value,
        pattern: currentPattern,
        features: lastFeatures,
        createdAt: new Date().toISOString()
    });

    setTrainingSamples(samples);
    updateTrainingStatus();
    predictionBox.innerHTML =
        "<strong>Amostra salva</strong>" +
        "<p>Essa foto rotulada agora ajuda o limiar local a separar furo e papel.</p>";
}

function exportDataset() {
    const dataset = {
        grid: { rows: GRID_ROWS, cols: GRID_COLS },
        instructions,
        samples: getTrainingSamples()
    };

    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dataset-cartoes-perfurados.json";
    link.click();
    URL.revokeObjectURL(url);
}

function clearTraining() {
    localStorage.removeItem("cardMlSamples");
    updateTrainingStatus();
    predictionBox.textContent = "Treino local limpo. O detector voltou ao modelo inicial.";
}

imageInput.addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
        loadImage(file);
    }
});

sampleBtn.addEventListener("click", () => drawSyntheticCard());
detectBtn.addEventListener("click", detectInstruction);
trainBtn.addEventListener("click", saveTrainingSample);
exportBtn.addEventListener("click", exportDataset);
clearTrainingBtn.addEventListener("click", clearTraining);

renderInstructionOptions();
renderLegend();
renderMatrix();
drawEmptyCanvas();
updateTrainingStatus();
