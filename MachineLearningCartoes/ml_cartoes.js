const GRID_ROWS = 5;
const GRID_COLS = 12;
const CARD_AREA = { x: 90, y: 90, w: 720, h: 330 };
const ML_IMAGE_SIZE = 64;
const TF_MODEL_KEY = "punch-card-instruction-model";
const CLOUD_SAMPLE_TABLE = "card_ml_samples";
const MASK_HOLE_RADIUS_X = 13;
const MASK_HOLE_RADIUS_Y = 18;
const DEFAULT_MASK_THRESHOLD = 0.16;
const PAPER_SCAN_STEP = 8;
const MIN_CARD_WIDTH = 230;
const MIN_CARD_HEIGHT = 120;
const HOLE_SEARCH_POINTS = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
];

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
let currentSyntheticInstruction = null;
let currentPattern = Array(GRID_ROWS * GRID_COLS).fill(false);
let lastFeatures = [];
let neuralModel = null;
let neuralReady = false;
let cameraStream = null;
let scannerLive = false;
let scannerBusy = false;
let lastScannerScan = 0;
let activeCardArea = { ...CARD_AREA };
let cachedMaskThreshold = null;

const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");
const cameraVideo = document.getElementById("cameraVideo");
const imageInput = document.getElementById("imageInput");
const startCameraBtn = document.getElementById("startCameraBtn");
const captureFrameBtn = document.getElementById("captureFrameBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const sampleBtn = document.getElementById("sampleBtn");
const detectBtn = document.getElementById("detectBtn");
const trainBtn = document.getElementById("trainBtn");
const fitModelBtn = document.getElementById("fitModelBtn");
const predictMlBtn = document.getElementById("predictMlBtn");
const loadCloudBtn = document.getElementById("loadCloudBtn");
const syncCloudBtn = document.getElementById("syncCloudBtn");
const exportBtn = document.getElementById("exportBtn");
const clearTrainingBtn = document.getElementById("clearTrainingBtn");
const labelSelect = document.getElementById("labelSelect");
const modelStatus = document.getElementById("modelStatus");
const modelSummary = document.getElementById("modelSummary");
const sampleCount = document.getElementById("sampleCount");
const imageStatus = document.getElementById("imageStatus");
const predictionBox = document.getElementById("predictionBox");
const trainingBox = document.getElementById("trainingBox");
const datasetBox = document.getElementById("datasetBox");
const holeMatrix = document.getElementById("holeMatrix");
const legendBox = document.getElementById("legendBox");

function getTrainingSamples() {
    try {
        return normalizeSamples(JSON.parse(localStorage.getItem("cardMlSamples") || "[]"));
    } catch (error) {
        return [];
    }
}

function setTrainingSamples(samples) {
    localStorage.setItem("cardMlSamples", JSON.stringify(normalizeSamples(samples)));
    cachedMaskThreshold = null;
}

function getImageSamples() {
    return getTrainingSamples().filter(sample => sample.imageBytes);
}

function createSampleId(sample = null) {
    if (sample?.label && sample?.imageBytes) {
        const stableSource = [
            sample.label,
            sample.createdAt || "sem-data",
            String(sample.imageBytes.length),
            sample.imageBytes.slice(0, 24)
        ].join("-");
        return "sample-" + stableSource.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 110);
    }

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return "sample-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function normalizeSamples(samples) {
    const seen = new Set();
    return (Array.isArray(samples) ? samples : [])
        .filter(sample => sample && sample.label && sample.imageBytes)
        .map(sample => ({
            ...sample,
            id: sample.id || createSampleId(sample),
            pattern: Array.isArray(sample.pattern) ? sample.pattern.map(Boolean) : Array(GRID_ROWS * GRID_COLS).fill(false),
            features: Array.isArray(sample.features) ? sample.features.map(Number) : [],
            featureMode: sample.featureMode || sample.feature_mode || "legacy",
            size: Number(sample.size) || ML_IMAGE_SIZE,
            createdAt: sample.createdAt || new Date().toISOString(),
            source: sample.source || "local"
        }))
        .filter(sample => {
            if (seen.has(sample.id)) return false;
            seen.add(sample.id);
            return true;
        });
}

function updateTrainingStatus(extraText = "") {
    const samples = getTrainingSamples();
    const imageSamples = samples.filter(sample => sample.imageBytes);
    const labelCount = new Set(imageSamples.map(sample => sample.label)).size;

    sampleCount.textContent = imageSamples.length;
    renderDatasetPanel(imageSamples);

    if (neuralReady) {
        modelStatus.textContent = "Modelo neural treinado";
        modelSummary.textContent = imageSamples.length + " fotos | " + labelCount + " rótulos";
        if (extraText) {
            trainingBox.textContent = extraText;
        }
        return;
    }

    if (imageSamples.length) {
        modelStatus.textContent = "Coletando fotos";
        modelSummary.textContent = imageSamples.length + " fotos salvas. Clique em Treinar modelo real.";
    } else {
        modelStatus.textContent = "Modelo inicial";
        modelSummary.textContent = "Colete fotos reais e treine o modelo.";
    }

    if (extraText) {
        trainingBox.textContent = extraText;
    }
}

function getInstructionById(id) {
    return instructions.find(instruction => instruction.id === id) || instructions[0];
}

function countSamplesByLabel(samples) {
    return instructions.reduce((counts, instruction) => {
        counts[instruction.id] = samples.filter(sample => sample.label === instruction.id).length;
        return counts;
    }, {});
}

function renderDatasetPanel(samples = getImageSamples()) {
    const counts = countSamplesByLabel(samples);
    const weakLabels = instructions
        .filter(instruction => counts[instruction.id] > 0 && counts[instruction.id] < 8)
        .map(instruction => instruction.name);
    const missingLabels = instructions
        .filter(instruction => counts[instruction.id] === 0)
        .map(instruction => instruction.name);

    if (!samples.length) {
        datasetBox.innerHTML =
            "<div class='dataset-empty'>Nenhuma foto rotulada ainda. Congele uma imagem, escolha o rótulo correto e salve.</div>";
        return;
    }

    datasetBox.innerHTML =
        "<div class='dataset-summary'>" +
            instructions.map(instruction =>
                "<article><span>" + instruction.name + "</span><strong>" + counts[instruction.id] + "</strong></article>"
            ).join("") +
        "</div>" +
        renderDatasetWarning(samples, weakLabels, missingLabels) +
        "<div class='sample-list' id='sampleList'></div>";

    renderSampleTiles(samples);
}

function renderDatasetWarning(samples, weakLabels, missingLabels) {
    const labelCount = new Set(samples.map(sample => sample.label)).size;

    if (samples.length < 8 || labelCount < 2) {
        return "<div class='dataset-warning'>Para treinar o modelo real, junte pelo menos 8 fotos e 2 tipos de instrução.</div>";
    }

    if (weakLabels.length) {
        return "<div class='dataset-warning'>Poucas fotos em: " + weakLabels.join(", ") + ". O ideal é 10 a 20 por tipo.</div>";
    }

    if (missingLabels.length) {
        return "<div class='dataset-warning'>Sem exemplos de: " + missingLabels.join(", ") + ". O modelo não aprenderá esses tipos.</div>";
    }

    return "";
}

function renderSampleTiles(samples) {
    const sampleList = document.getElementById("sampleList");
    if (!sampleList) return;

    sampleList.innerHTML = "";

    samples.slice().reverse().forEach(sample => {
        const realIndex = getTrainingSamples().findIndex(candidate => candidate.id === sample.id);
        const tile = document.createElement("article");
        tile.className = "sample-tile";
        tile.innerHTML =
            "<canvas width='" + ML_IMAGE_SIZE + "' height='" + ML_IMAGE_SIZE + "'></canvas>" +
            "<span>" + getInstructionById(sample.label).name + "</span>" +
            "<button type='button'>Apagar</button>";

        drawSampleThumb(tile.querySelector("canvas"), sample);
        tile.querySelector("button").addEventListener("click", () => void removeTrainingSample(realIndex));
        sampleList.appendChild(tile);
    });
}

function drawSampleThumb(thumbCanvas, sample) {
    const thumbCtx = thumbCanvas.getContext("2d");
    const imageData = thumbCtx.createImageData(ML_IMAGE_SIZE, ML_IMAGE_SIZE);
    const bytes = base64ToBytes(sample.imageBytes);

    for (let i = 0; i < bytes.length; i++) {
        const value = bytes[i];
        const offset = i * 4;
        imageData.data[offset] = value;
        imageData.data[offset + 1] = value;
        imageData.data[offset + 2] = value;
        imageData.data[offset + 3] = 255;
    }

    thumbCtx.putImageData(imageData, 0, 0);
}

async function removeTrainingSample(sampleIndex) {
    if (sampleIndex < 0) return;

    const samples = getTrainingSamples();
    samples.splice(sampleIndex, 1);
    setTrainingSamples(samples);

    if (neuralModel) {
        neuralModel.dispose();
        neuralModel = null;
    }

    neuralReady = false;

    if (window.tf) {
        try {
            await tf.io.removeModel("indexeddb://" + TF_MODEL_KEY);
        } catch (error) {
            // O modelo pode ainda não existir.
        }
    }

    updateTrainingStatus("Amostra removida. Treine novamente para atualizar o modelo.");
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
    currentImage = null;
    currentSyntheticInstruction = null;
    activeCardArea = { ...CARD_AREA };
    ctx.fillStyle = "#fff8e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6a5537";
    ctx.font = "24px Arial";
    ctx.fillText("Envie uma foto ou gere um cartão realista.", 230, 260);
}

function drawSyntheticCard(instruction = instructions[Math.floor(Math.random() * instructions.length)]) {
    stopLiveScanner();
    currentImage = null;
    currentSyntheticInstruction = instruction;
    paintSyntheticCard(instruction);
    imageStatus.textContent = "Cartão sintético realista";
    renderMatrix();
    void detectInstruction();
}

function paintSyntheticCard(instruction) {
    currentPattern = Array(GRID_ROWS * GRID_COLS).fill(false);
    activeCardArea = { ...CARD_AREA };
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
    const area = activeCardArea;
    return {
        x: area.x + (col + 0.5) * (area.w / GRID_COLS),
        y: area.y + (row + 0.5) * (area.h / GRID_ROWS)
    };
}

function loadImage(file) {
    stopLiveScanner();
    const reader = new FileReader();
    reader.onload = event => {
        const image = new Image();
        image.onload = () => {
            currentImage = image;
            currentSyntheticInstruction = null;
            fitImageToCanvas(image);
            imageStatus.textContent = "Imagem carregada";
            void detectInstruction();
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

function fitVideoToCanvas(video) {
    ctx.fillStyle = "#11151b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const videoWidth = video.videoWidth || canvas.width;
    const videoHeight = video.videoHeight || canvas.height;
    const scale = Math.max(canvas.width / videoWidth, canvas.height / videoHeight);
    const width = videoWidth * scale;
    const height = videoHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    ctx.drawImage(video, x, y, width, height);
}

function redrawBaseImage() {
    if (scannerLive && cameraVideo.videoWidth) {
        fitVideoToCanvas(cameraVideo);
        return;
    }

    if (currentImage) {
        fitImageToCanvas(currentImage);
        return;
    }

    if (currentSyntheticInstruction) {
        const savedPattern = [...currentPattern];
        paintSyntheticCard(currentSyntheticInstruction);
        currentPattern = savedPattern;
    }
}

async function startLiveScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
        imageStatus.textContent = "Câmera indisponível neste navegador";
        return;
    }

    stopLiveScanner(false);

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        cameraVideo.srcObject = cameraStream;
        await cameraVideo.play();

        currentImage = null;
        currentSyntheticInstruction = null;
        scannerLive = true;
        imageStatus.textContent = "Scanner ao vivo";
        startCameraBtn.disabled = true;
        captureFrameBtn.disabled = false;
        stopCameraBtn.disabled = false;
        scanLiveFrame();
    } catch (error) {
        console.error(error);
        imageStatus.textContent = "Não foi possível abrir a câmera";
        startCameraBtn.disabled = false;
        captureFrameBtn.disabled = true;
        stopCameraBtn.disabled = true;
    }
}

function stopLiveScanner(clearStatus = true) {
    scannerLive = false;
    scannerBusy = false;

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    cameraVideo.srcObject = null;
    startCameraBtn.disabled = false;
    captureFrameBtn.disabled = true;
    stopCameraBtn.disabled = true;

    if (clearStatus) {
        imageStatus.textContent = "Scanner fechado";
    }
}

function scanLiveFrame(timestamp = 0) {
    if (!scannerLive) return;

    requestAnimationFrame(scanLiveFrame);

    if (scannerBusy || timestamp - lastScannerScan < 220) return;

    scannerBusy = true;
    lastScannerScan = timestamp;
    void detectInstruction().finally(() => {
        scannerBusy = false;
    });
}

function captureScannerFrame() {
    if (!scannerLive || !cameraVideo.videoWidth) return;

    fitVideoToCanvas(cameraVideo);
    stopLiveScanner(false);
    currentImage = new Image();
    currentImage.onload = () => {
        fitImageToCanvas(currentImage);
        imageStatus.textContent = "Foto congelada do scanner";
        void detectInstruction(true);
    };
    currentImage.src = canvas.toDataURL("image/png");
}

function getModelThreshold() {
    if (cachedMaskThreshold !== null) {
        return cachedMaskThreshold;
    }

    const samples = getTrainingSamples();

    if (!samples.length) {
        cachedMaskThreshold = DEFAULT_MASK_THRESHOLD;
        return cachedMaskThreshold;
    }

    const values = [];
    samples.forEach(sample => {
        if (sample.featureMode !== "mask-v2") return;
        if (!sample.features || !sample.pattern) return;
        sample.features.forEach((feature, index) => {
            values.push({ feature, active: sample.pattern[index] });
        });
    });

    const holeValues = values.filter(item => item.active).map(item => item.feature);
    const blankValues = values.filter(item => !item.active).map(item => item.feature);

    if (!holeValues.length || !blankValues.length) {
        cachedMaskThreshold = DEFAULT_MASK_THRESHOLD;
        return cachedMaskThreshold;
    }

    const holeAvg = average(holeValues);
    const blankAvg = average(blankValues);
    cachedMaskThreshold = (holeAvg + blankAvg) / 2;
    return cachedMaskThreshold;
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
            const score = sampleMaskedHoleScore(row, col);
            features.push(score);
            pattern.push(score >= threshold);
        }
    }

    lastFeatures = features;
    currentPattern = pattern;
}

function sampleMaskedHoleScore(row, col) {
    const point = gridPoint(row, col);
    const cellW = activeCardArea.w / GRID_COLS;
    const cellH = activeCardArea.h / GRID_ROWS;
    const offsetX = Math.min(12, Math.max(6, cellW * 0.16));
    const offsetY = Math.min(15, Math.max(7, cellH * 0.16));
    const outerRadiusX = MASK_HOLE_RADIUS_X + 8;
    const outerRadiusY = MASK_HOLE_RADIUS_Y + 8;
    const innerRadiusX = MASK_HOLE_RADIUS_X + 2;
    const innerRadiusY = MASK_HOLE_RADIUS_Y + 2;
    const left = Math.max(0, Math.floor(point.x - outerRadiusX - offsetX));
    const top = Math.max(0, Math.floor(point.y - outerRadiusY - offsetY));
    const right = Math.min(canvas.width, Math.ceil(point.x + outerRadiusX + offsetX));
    const bottom = Math.min(canvas.height, Math.ceil(point.y + outerRadiusY + offsetY));
    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) return 0;

    const imageData = ctx.getImageData(left, top, width, height);
    let bestScore = 0;

    HOLE_SEARCH_POINTS.forEach(([dx, dy]) => {
        const sampleX = point.x + dx * offsetX;
        const sampleY = point.y + dy * offsetY;
        let centerDarkness = 0;
        let ringDarkness = 0;
        let centerCount = 0;
        let ringCount = 0;

        for (let pixelRow = 0; pixelRow < height; pixelRow++) {
            for (let pixelCol = 0; pixelCol < width; pixelCol++) {
                const pixelX = left + pixelCol + 0.5;
                const pixelY = top + pixelRow + 0.5;
                const outerDx = (pixelX - sampleX) / outerRadiusX;
                const outerDy = (pixelY - sampleY) / outerRadiusY;
                if (outerDx * outerDx + outerDy * outerDy > 1) continue;

                const offset = (pixelRow * width + pixelCol) * 4;
                const darkness = pixelDarkness(imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2]);
                const centerDx = (pixelX - sampleX) / MASK_HOLE_RADIUS_X;
                const centerDy = (pixelY - sampleY) / MASK_HOLE_RADIUS_Y;

                if (centerDx * centerDx + centerDy * centerDy <= 1) {
                    centerDarkness += darkness;
                    centerCount++;
                    continue;
                }

                const innerDx = (pixelX - sampleX) / innerRadiusX;
                const innerDy = (pixelY - sampleY) / innerRadiusY;
                if (innerDx * innerDx + innerDy * innerDy <= 1) continue;

                ringDarkness += darkness;
                ringCount++;
            }
        }

        if (!centerCount || !ringCount) return;

        bestScore = Math.max(bestScore, centerDarkness / centerCount - ringDarkness / ringCount);
    });

    return Math.max(0, Math.min(1, bestScore));
}

function sampleEllipseDarkness(x, y, radiusX, radiusY) {
    const left = Math.max(0, Math.floor(x - radiusX));
    const top = Math.max(0, Math.floor(y - radiusY));
    const width = Math.min(canvas.width - left, Math.ceil(radiusX * 2));
    const height = Math.min(canvas.height - top, Math.ceil(radiusY * 2));
    const imageData = ctx.getImageData(left, top, width, height);
    let darkness = 0;
    let count = 0;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const dx = (left + col + 0.5 - x) / radiusX;
            const dy = (top + row + 0.5 - y) / radiusY;
            if (dx * dx + dy * dy > 1) continue;

            const offset = (row * width + col) * 4;
            darkness += pixelDarkness(imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2]);
            count++;
        }
    }

    return count ? darkness / count : 0;
}

function sampleRingDarkness(x, y, outerRadiusX, outerRadiusY, innerRadiusX, innerRadiusY) {
    const left = Math.max(0, Math.floor(x - outerRadiusX));
    const top = Math.max(0, Math.floor(y - outerRadiusY));
    const width = Math.min(canvas.width - left, Math.ceil(outerRadiusX * 2));
    const height = Math.min(canvas.height - top, Math.ceil(outerRadiusY * 2));
    const imageData = ctx.getImageData(left, top, width, height);
    let darkness = 0;
    let count = 0;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixelX = left + col + 0.5;
            const pixelY = top + row + 0.5;
            const outerDx = (pixelX - x) / outerRadiusX;
            const outerDy = (pixelY - y) / outerRadiusY;
            const innerDx = (pixelX - x) / innerRadiusX;
            const innerDy = (pixelY - y) / innerRadiusY;

            if (outerDx * outerDx + outerDy * outerDy > 1) continue;
            if (innerDx * innerDx + innerDy * innerDy <= 1) continue;

            const offset = (row * width + col) * 4;
            darkness += pixelDarkness(imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2]);
            count++;
        }
    }

    return count ? darkness / count : 0;
}

function sampleDarkness(x, y, radius) {
    const imageData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
    let darkness = 0;
    let count = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        darkness += pixelDarkness(r, g, b);
        count++;
    }

    return darkness / count;
}

function pixelDarkness(r, g, b) {
    return 1 - pixelLuma(r, g, b);
}

function pixelLuma(r, g, b) {
    return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
}

async function detectInstruction(forceNeural = false) {
    redrawBaseImage();

    const cardCheck = detectCardInFrame();

    if (!cardCheck.detected) {
        currentPattern = Array(GRID_ROWS * GRID_COLS).fill(false);
        lastFeatures = [];
        renderMatrix();
        drawCardGateOverlay(false);
        renderCardGate(false, cardCheck);
        return;
    }

    detectPatternFromCanvas();
    renderMatrix();

    const patternPrediction = classifyPattern(currentPattern);
    const neuralPrediction = forceNeural ? await predictCurrentImage() : null;
    const finalPrediction = forceNeural && neuralPrediction ? neuralPrediction : patternPrediction;

    imageStatus.textContent = "Cartão detectado";
    drawOverlay(finalPrediction);
    drawCardGateOverlay(true);
    renderPrediction(patternPrediction, neuralPrediction, finalPrediction);
}

function detectCardInFrame() {
    const paperArea = findPaperArea();
    if (paperArea) {
        activeCardArea = smoothDetectedArea(paperToMaskArea(paperArea));
    } else if (!scannerLive) {
        activeCardArea = { ...CARD_AREA };
    }

    const area = activeCardArea;
    const inside = measureArea(area.x, area.y, area.w, area.h);
    const outer = measureFrameAroundCard(area);
    const contrast = inside.avgLuma - outer.avgLuma;
    const paperLike = inside.brightRatio > 0.24 && inside.darkRatio < 0.58;
    const separatedFromBackground = contrast > 0.035;
    const enoughTexture = inside.lumaSpread > 0.06;
    const areaLooksUsable = area.w >= MIN_CARD_WIDTH && area.h >= MIN_CARD_HEIGHT;
    const fallbackAllowed = !scannerLive && (separatedFromBackground || enoughTexture);

    return {
        detected: areaLooksUsable && paperLike && (!!paperArea || fallbackAllowed),
        brightRatio: inside.brightRatio,
        darkRatio: inside.darkRatio,
        contrast,
        area
    };
}

function paperToMaskArea(paperArea) {
    const padX = Math.max(10, paperArea.w * 0.035);
    const padTop = Math.max(12, paperArea.h * 0.06);
    const padBottom = Math.max(8, paperArea.h * 0.045);
    return {
        x: Math.round(paperArea.x + padX),
        y: Math.round(paperArea.y + padTop),
        w: Math.round(Math.max(MIN_CARD_WIDTH, paperArea.w - padX * 2)),
        h: Math.round(Math.max(MIN_CARD_HEIGHT, paperArea.h - padTop - padBottom))
    };
}

function findPaperArea() {
    const step = PAPER_SCAN_STEP;
    const cols = Math.ceil(canvas.width / step);
    const rows = Math.ceil(canvas.height / step);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const lumas = new Float32Array(cols * rows);
    let lumaSum = 0;
    let sampleCount = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = Math.min(canvas.width - 1, col * step + Math.floor(step / 2));
            const y = Math.min(canvas.height - 1, row * step + Math.floor(step / 2));
            const offset = (y * canvas.width + x) * 4;
            const luma = pixelLuma(imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2]);
            lumas[row * cols + col] = luma;
            lumaSum += luma;
            sampleCount++;
        }
    }

    const avgLuma = sampleCount ? lumaSum / sampleCount : 0;
    const threshold = Math.max(0.43, Math.min(0.7, avgLuma + 0.08));
    const paperCells = new Uint8Array(cols * rows);

    for (let i = 0; i < lumas.length; i++) {
        paperCells[i] = lumas[i] > threshold || lumas[i] > 0.68 ? 1 : 0;
    }

    return findLargestPaperComponent(paperCells, cols, rows, step);
}

function findLargestPaperComponent(cells, cols, rows, step) {
    const visited = new Uint8Array(cells.length);
    let best = null;

    for (let start = 0; start < cells.length; start++) {
        if (!cells[start] || visited[start]) continue;

        const stack = [start];
        visited[start] = 1;
        let count = 0;
        let minCol = cols;
        let maxCol = 0;
        let minRow = rows;
        let maxRow = 0;

        while (stack.length) {
            const index = stack.pop();
            const row = Math.floor(index / cols);
            const col = index % cols;
            count++;
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);

            const neighbors = [
                index - 1,
                index + 1,
                index - cols,
                index + cols
            ];

            neighbors.forEach(next => {
                if (next < 0 || next >= cells.length || visited[next] || !cells[next]) return;
                const nextRow = Math.floor(next / cols);
                const nextCol = next % cols;
                if (Math.abs(nextRow - row) + Math.abs(nextCol - col) !== 1) return;
                visited[next] = 1;
                stack.push(next);
            });
        }

        const x = Math.max(0, minCol * step - step);
        const y = Math.max(0, minRow * step - step);
        const w = Math.min(canvas.width - x, (maxCol - minCol + 2) * step);
        const h = Math.min(canvas.height - y, (maxRow - minRow + 2) * step);
        const aspect = w / Math.max(1, h);
        const areaRatio = (w * h) / (canvas.width * canvas.height);
        const fillRatio = count / ((maxCol - minCol + 1) * (maxRow - minRow + 1));
        const score = count * (aspect > 1.25 && aspect < 3.6 ? 1.3 : 0.75);

        if (
            w >= MIN_CARD_WIDTH &&
            h >= MIN_CARD_HEIGHT &&
            areaRatio > 0.045 &&
            areaRatio < 0.92 &&
            aspect > 1.18 &&
            aspect < 4.2 &&
            fillRatio > 0.36 &&
            (!best || score > best.score)
        ) {
            best = { x, y, w, h, score };
        }
    }

    if (!best) return null;
    return {
        x: Math.round(best.x),
        y: Math.round(best.y),
        w: Math.round(best.w),
        h: Math.round(best.h)
    };
}

function smoothDetectedArea(nextArea) {
    if (!scannerLive) return nextArea;

    const currentCenterX = activeCardArea.x + activeCardArea.w / 2;
    const currentCenterY = activeCardArea.y + activeCardArea.h / 2;
    const nextCenterX = nextArea.x + nextArea.w / 2;
    const nextCenterY = nextArea.y + nextArea.h / 2;
    const centerShift = Math.hypot(currentCenterX - nextCenterX, currentCenterY - nextCenterY);

    if (centerShift > 120 || Math.abs(activeCardArea.w - nextArea.w) > 180) {
        return nextArea;
    }

    const keep = 0.62;
    const take = 1 - keep;
    return {
        x: Math.round(activeCardArea.x * keep + nextArea.x * take),
        y: Math.round(activeCardArea.y * keep + nextArea.y * take),
        w: Math.round(activeCardArea.w * keep + nextArea.w * take),
        h: Math.round(activeCardArea.h * keep + nextArea.h * take)
    };
}

function measureArea(x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height);
    let lumaSum = 0;
    let minLuma = 1;
    let maxLuma = 0;
    let brightPixels = 0;
    let darkPixels = 0;
    let total = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const luma = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

        lumaSum += luma;
        minLuma = Math.min(minLuma, luma);
        maxLuma = Math.max(maxLuma, luma);
        if (luma > 0.45) brightPixels++;
        if (luma < 0.24) darkPixels++;
        total++;
    }

    return {
        avgLuma: lumaSum / total,
        brightRatio: brightPixels / total,
        darkRatio: darkPixels / total,
        lumaSpread: maxLuma - minLuma
    };
}

function measureFrameAroundCard(area = activeCardArea) {
    const margin = 34;
    const x = Math.max(0, area.x - margin);
    const y = Math.max(0, area.y - margin);
    const width = Math.min(canvas.width - x, area.w + margin * 2);
    const height = Math.min(canvas.height - y, area.h + margin * 2);
    const imageData = ctx.getImageData(x, y, width, height);
    let lumaSum = 0;
    let total = 0;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const canvasX = x + col;
            const canvasY = y + row;
            const insideCard =
                canvasX >= area.x &&
                canvasX <= area.x + area.w &&
                canvasY >= area.y &&
                canvasY <= area.y + area.h;

            if (insideCard) continue;

            const index = (row * width + col) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const luma = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

            lumaSum += luma;
            total++;
        }
    }

    return { avgLuma: total ? lumaSum / total : 0 };
}

function renderCardGate(detected, cardCheck) {
    imageStatus.textContent = detected ? "Cartão detectado" : "Cartão não detectado";
    predictionBox.classList.toggle("missing-card", !detected);
    predictionBox.innerHTML = detected
        ? "<strong>Cartão detectado</strong><p>Máscara ajustada automaticamente sobre o papel.</p>"
        : "<strong>Cartão não detectado</strong><p>Mostre um papel claro no quadro. A máscara tenta se ajustar sozinha, sem precisar encaixar perfeito.</p>" +
            "<p>Confiança visual: " + Math.round(Math.max(0, cardCheck.brightRatio - cardCheck.darkRatio) * 100) + "%</p>";
}

function drawCardGateOverlay(detected) {
    const area = activeCardArea;
    ctx.save();
    ctx.lineWidth = detected ? 4 : 3;
    ctx.strokeStyle = detected ? "rgba(47,95,90,.96)" : "rgba(167,63,54,.96)";
    ctx.strokeRect(area.x, area.y, area.w, area.h);

    ctx.fillStyle = detected ? "rgba(47,95,90,.92)" : "rgba(167,63,54,.92)";
    roundRect(ctx, area.x, Math.max(8, area.y - 54), 330, 40, 8);
    ctx.fill();
    ctx.fillStyle = "#fff8e8";
    ctx.font = "bold 20px Arial";
    ctx.fillText(detected ? "Cartão detectado" : "Cartão não detectado", area.x + 18, Math.max(34, area.y - 28));
    ctx.restore();
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
            source: "mask",
            instruction,
            confidence: Math.round((matches / expected.length) * 100)
        };
    }).sort((a, b) => b.confidence - a.confidence);

    return ranked[0];
}

function renderPrediction(patternPrediction, neuralPrediction, finalPrediction) {
    predictionBox.classList.remove("missing-card");

    const prediction = finalPrediction || neuralPrediction || patternPrediction;
    const learnedLine = neuralPrediction
        ? "<p>" + (neuralPrediction.source === "neural" ? "Modelo neural" : "Dataset por exemplos") + ": " +
            neuralPrediction.instruction.name + " (" + neuralPrediction.confidence + "%)</p>"
        : "<p>Modelo neural: ainda não treinado neste navegador.</p>";
    const sourceText = prediction.source === "neural"
        ? "IA treinada por fotos"
        : prediction.source === "dataset"
            ? "comparação com dataset"
            : "máscara dos furos";

    predictionBox.innerHTML =
        "<strong>" + prediction.instruction.name + "</strong>" +
        "<code>" + prediction.instruction.code + "</code>" +
        "<p>" + prediction.instruction.meaning + "</p>" +
        "<p>Resultado usado: " + sourceText +
        " | Confiança: " + prediction.confidence + "%</p>" +
        learnedLine +
        "<p>Leitura por máscara: " + patternPrediction.instruction.name + " (" + patternPrediction.confidence + "%)</p>";
}

function drawOverlay(predictionOverride) {
    const area = activeCardArea;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(126,199,188,.95)";
    ctx.strokeRect(area.x, area.y, area.w, area.h);

    currentPattern.forEach((active, index) => {
        const row = Math.floor(index / GRID_COLS);
        const col = index % GRID_COLS;
        const point = gridPoint(row, col);

        ctx.beginPath();
        ctx.ellipse(point.x, point.y, active ? 17 : 10, active ? 22 : 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = active ? "rgba(167,63,54,.72)" : "rgba(47,95,90,.18)";
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(255,248,232,.9)" : "rgba(47,95,90,.35)";
        ctx.stroke();
    });

    const prediction = predictionOverride || classifyPattern(currentPattern);
    ctx.fillStyle = "rgba(17,21,27,.9)";
    roundRect(ctx, 105, 36, 690, 42, 8);
    ctx.fill();
    ctx.fillStyle = "#cfe9df";
    ctx.font = "bold 20px Courier New";
    ctx.fillText("IA detectou: " + prediction.instruction.code + "  (" + prediction.confidence + "%)", 124, 64);
    ctx.restore();
}

function captureTrainingImageBytes() {
    const workCanvas = document.createElement("canvas");
    workCanvas.width = ML_IMAGE_SIZE;
    workCanvas.height = ML_IMAGE_SIZE;
    const workCtx = workCanvas.getContext("2d");
    const area = activeCardArea;

    workCtx.fillStyle = "#fff";
    workCtx.fillRect(0, 0, ML_IMAGE_SIZE, ML_IMAGE_SIZE);
    workCtx.drawImage(
        canvas,
        area.x,
        area.y,
        area.w,
        area.h,
        0,
        0,
        ML_IMAGE_SIZE,
        ML_IMAGE_SIZE
    );

    const imageData = workCtx.getImageData(0, 0, ML_IMAGE_SIZE, ML_IMAGE_SIZE);
    const bytes = new Uint8Array(ML_IMAGE_SIZE * ML_IMAGE_SIZE);

    for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        bytes[j] = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
    }

    return bytesToBase64(bytes);
}

async function saveTrainingSample() {
    redrawBaseImage();

    if (!lastFeatures.length) {
        detectPatternFromCanvas();
    }

    const imageBytes = captureTrainingImageBytes();
    const samples = getTrainingSamples();
    const sample = {
        id: createSampleId(),
        label: labelSelect.value,
        pattern: currentPattern,
        features: lastFeatures,
        featureMode: "mask-v2",
        imageBytes,
        size: ML_IMAGE_SIZE,
        createdAt: new Date().toISOString(),
        source: "local"
    };

    samples.push(sample);

    setTrainingSamples(samples);
    updateTrainingStatus("Foto rotulada salva. Ela agora pode entrar no treino real do modelo neural.");
    drawOverlay();

    const savedOnline = await saveSamplesToCloud([sample], true);
    if (savedOnline) {
        updateTrainingStatus("Foto rotulada salva localmente e enviada ao banco de dados.");
    }
}

function createNeuralModel() {
    const model = tf.sequential();

    model.add(tf.layers.conv2d({
        inputShape: [ML_IMAGE_SIZE, ML_IMAGE_SIZE, 1],
        filters: 8,
        kernelSize: 3,
        activation: "relu",
        padding: "same"
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.conv2d({
        filters: 16,
        kernelSize: 3,
        activation: "relu",
        padding: "same"
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: instructions.length, activation: "softmax" }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
}

async function trainNeuralModel() {
    const samples = getImageSamples();
    const labelCount = new Set(samples.map(sample => sample.label)).size;

    if (!window.tf) {
        trainingBox.innerHTML =
            "<strong>TensorFlow.js não carregou</strong>" +
            "<p>Mesmo assim, o laboratório ainda consegue aprender por vizinho mais parecido usando as fotos salvas. Para rede neural, abra com internet para carregar TensorFlow.js.</p>";
        updateTrainingStatus();
        return;
    }

    if (samples.length < 8 || labelCount < 2) {
        trainingBox.innerHTML =
            "<strong>Faltam fotos</strong>" +
            "<p>Para começar um treino útil, salve pelo menos 8 fotos rotuladas e pelo menos 2 tipos de instrução. O ideal é 10 a 20 fotos por instrução.</p>";
        updateTrainingStatus();
        return;
    }

    fitModelBtn.disabled = true;
    trainingBox.innerHTML = "<strong>Treinando...</strong><p>Preparando fotos rotuladas.</p>";

    const { xs, ys } = buildTrainingTensors(samples);

    if (neuralModel) {
        neuralModel.dispose();
    }

    neuralModel = createNeuralModel();
    neuralReady = false;

    try {
        await neuralModel.fit(xs, ys, {
            epochs: 30,
            batchSize: Math.min(8, samples.length),
            shuffle: true,
            validationSplit: samples.length >= 16 ? 0.2 : 0,
            callbacks: {
                onEpochEnd(epoch, logs) {
                    const acc = logs.acc ?? logs.accuracy ?? 0;
                    const loss = logs.loss ?? 0;
                    trainingBox.innerHTML =
                        "<strong>Treinando modelo neural</strong>" +
                        "<p>Época " + (epoch + 1) + " / 30</p>" +
                        "<p>Acerto no treino: " + Math.round(acc * 100) + "% | Erro: " + loss.toFixed(3) + "</p>";
                }
            }
        });

        await neuralModel.save("indexeddb://" + TF_MODEL_KEY);
        neuralReady = true;
        trainingBox.innerHTML =
            "<strong>Modelo treinado e salvo</strong>" +
            "<p>A rede neural agora usa as fotos reais deste navegador para reconhecer novas imagens.</p>";
        await detectInstruction(true);
    } catch (error) {
        console.error(error);
        trainingBox.innerHTML =
            "<strong>Não foi possível treinar</strong>" +
            "<p>Confira se há fotos suficientes e tente novamente.</p>";
    } finally {
        xs.dispose();
        ys.dispose();
        fitModelBtn.disabled = false;
        updateTrainingStatus();
    }
}

function buildTrainingTensors(samples) {
    const pixels = new Float32Array(samples.length * ML_IMAGE_SIZE * ML_IMAGE_SIZE);
    const labels = new Int32Array(samples.length);

    samples.forEach((sample, sampleIndex) => {
        const bytes = base64ToBytes(sample.imageBytes);
        for (let i = 0; i < bytes.length; i++) {
            pixels[sampleIndex * ML_IMAGE_SIZE * ML_IMAGE_SIZE + i] = bytes[i] / 255;
        }
        labels[sampleIndex] = instructions.findIndex(instruction => instruction.id === sample.label);
    });

    const xs = tf.tensor4d(pixels, [samples.length, ML_IMAGE_SIZE, ML_IMAGE_SIZE, 1]);
    const labelTensor = tf.tensor1d(labels, "int32");
    const ys = tf.oneHot(labelTensor, instructions.length);
    labelTensor.dispose();

    return { xs, ys };
}

async function predictCurrentImage() {
    const neuralPrediction = predictWithNeuralModel();
    if (neuralPrediction) return neuralPrediction;

    return predictWithNearestSample();
}

function predictWithNeuralModel() {
    if (!window.tf || !neuralModel || !neuralReady) return null;

    redrawBaseImage();
    const imageBytes = captureTrainingImageBytes();
    const bytes = base64ToBytes(imageBytes);
    const input = tf.tidy(() => {
        const pixels = new Float32Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            pixels[i] = bytes[i] / 255;
        }
        return tf.tensor4d(pixels, [1, ML_IMAGE_SIZE, ML_IMAGE_SIZE, 1]);
    });

    const output = neuralModel.predict(input);
    const scores = Array.from(output.dataSync());
    input.dispose();
    output.dispose();

    const bestIndex = scores.reduce((best, value, index) => value > scores[best] ? index : best, 0);
    return {
        source: "neural",
        instruction: instructions[bestIndex],
        confidence: Math.round(scores[bestIndex] * 100)
    };
}

function predictWithNearestSample() {
    const samples = getImageSamples();
    if (!samples.length) return null;

    redrawBaseImage();
    const currentBytes = base64ToBytes(captureTrainingImageBytes());
    let bestSample = null;
    let bestDistance = Infinity;

    samples.forEach(sample => {
        const bytes = base64ToBytes(sample.imageBytes);
        let distance = 0;
        for (let i = 0; i < currentBytes.length; i++) {
            const diff = currentBytes[i] - bytes[i];
            distance += diff * diff;
        }

        if (distance < bestDistance) {
            bestDistance = distance;
            bestSample = sample;
        }
    });

    if (!bestSample) return null;

    const normalizedDistance = Math.sqrt(bestDistance / currentBytes.length) / 255;
    const confidence = Math.round(Math.max(25, Math.min(96, (1 - normalizedDistance) * 100)));

    return {
        source: "dataset",
        instruction: getInstructionById(bestSample.label),
        confidence
    };
}

async function loadSavedNeuralModel() {
    if (!window.tf) {
        trainingBox.innerHTML =
            "<strong>TensorFlow.js indisponível</strong>" +
            "<p>A página ainda salva fotos e usa comparação por exemplo, mas a rede neural precisa da biblioteca TensorFlow.js.</p>";
        updateTrainingStatus();
        return;
    }

    try {
        neuralModel = await tf.loadLayersModel("indexeddb://" + TF_MODEL_KEY);
        neuralReady = true;
        trainingBox.innerHTML =
            "<strong>Modelo neural carregado</strong>" +
            "<p>Este navegador já tem um modelo treinado salvo.</p>";
    } catch (error) {
        neuralReady = false;
        trainingBox.innerHTML = "O modelo neural ainda não foi treinado neste navegador.";
    }

    updateTrainingStatus();
}

async function useTrainedModel() {
    if (!neuralReady && window.tf) {
        await loadSavedNeuralModel();
    }

    if (!neuralReady && !getImageSamples().length) {
        trainingBox.innerHTML =
            "<strong>Sem modelo treinado</strong>" +
            "<p>Salve fotos rotuladas e clique em Treinar modelo real.</p>";
        return;
    }

    await detectInstruction(true);
}

function exportDataset() {
    const dataset = {
        grid: { rows: GRID_ROWS, cols: GRID_COLS },
        imageModel: { size: ML_IMAGE_SIZE, format: "grayscale-base64" },
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

function getSupabaseClient() {
    return window.supabaseClient || null;
}

function sampleToCloudRow(sample) {
    return {
        id: sample.id,
        label: sample.label,
        pattern: sample.pattern,
        features: sample.features,
        feature_mode: sample.featureMode || "mask-v2",
        image_bytes: sample.imageBytes,
        size: sample.size || ML_IMAGE_SIZE,
        created_at: sample.createdAt,
        updated_at: new Date().toISOString()
    };
}

function cloudRowToSample(row) {
    return {
        id: row.id,
        label: row.label,
        pattern: Array.isArray(row.pattern) ? row.pattern : [],
        features: Array.isArray(row.features) ? row.features : [],
        featureMode: row.feature_mode || "mask-v2",
        imageBytes: row.image_bytes,
        size: Number(row.size) || ML_IMAGE_SIZE,
        createdAt: row.created_at || new Date().toISOString(),
        source: "supabase"
    };
}

async function saveSamplesToCloud(samples, silent = false) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        if (!silent) {
            trainingBox.innerHTML =
                "<strong>Banco indisponível</strong>" +
                "<p>Supabase não carregou. Abra pelo GitHub Pages com internet para salvar o dataset online.</p>";
        }
        return false;
    }

    const rows = normalizeSamples(samples).map(sampleToCloudRow);
    if (!rows.length) {
        if (!silent) {
            trainingBox.innerHTML =
                "<strong>Nada para enviar</strong>" +
                "<p>Salve fotos rotuladas antes de sincronizar com o banco.</p>";
        }
        return false;
    }

    const { error } = await supabase
        .from(CLOUD_SAMPLE_TABLE)
        .upsert(rows, { onConflict: "id" });

    if (error) {
        if (!silent) {
            trainingBox.innerHTML =
                "<strong>Banco ainda não configurado</strong>" +
                "<p>Crie a tabela card_ml_samples no Supabase usando o SQL do projeto. Erro: " + error.message + "</p>";
        }
        return false;
    }

    if (!silent) {
        trainingBox.innerHTML =
            "<strong>Dataset enviado ao banco</strong>" +
            "<p>" + rows.length + " foto(s) rotulada(s) foram salvas no Supabase.</p>";
    }
    return true;
}

async function syncTrainingToCloud() {
    const samples = getImageSamples();
    setTrainingSamples(samples);
    const saved = await saveSamplesToCloud(samples);
    if (saved) {
        updateTrainingStatus(samples.length + " foto(s) enviadas ao banco de dados.");
    }
}

async function loadCloudTrainingSamples(silent = false) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        if (!silent) {
            trainingBox.innerHTML =
                "<strong>Banco indisponível</strong>" +
                "<p>Supabase não carregou. Abra pelo GitHub Pages com internet para carregar o dataset online.</p>";
        }
        return;
    }

    const { data, error } = await supabase
        .from(CLOUD_SAMPLE_TABLE)
        .select("id,label,pattern,features,feature_mode,image_bytes,size,created_at")
        .order("created_at", { ascending: false })
        .limit(800);

    if (error) {
        if (!silent) {
            trainingBox.innerHTML =
                "<strong>Dataset online não carregou</strong>" +
                "<p>Confira se a tabela card_ml_samples existe no Supabase. Erro: " + error.message + "</p>";
        }
        return;
    }

    const localSamples = getTrainingSamples();
    const cloudSamples = normalizeSamples((data || []).map(cloudRowToSample));
    const merged = new Map();

    [...localSamples, ...cloudSamples].forEach(sample => {
        merged.set(sample.id, sample);
    });

    setTrainingSamples([...merged.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))));
    updateTrainingStatus(
        silent
            ? ""
            : "Dataset online carregado. " + cloudSamples.length + " amostra(s) vieram do Supabase."
    );
}

async function clearTraining() {
    localStorage.removeItem("cardMlSamples");
    cachedMaskThreshold = null;

    if (neuralModel) {
        neuralModel.dispose();
        neuralModel = null;
    }

    neuralReady = false;

    if (window.tf) {
        try {
            await tf.io.removeModel("indexeddb://" + TF_MODEL_KEY);
        } catch (error) {
            // O modelo pode não existir ainda.
        }
    }

    updateTrainingStatus("Treino local limpo. A rede neural e as fotos rotuladas foram removidas deste navegador.");
    predictionBox.textContent = "Treino local limpo. Carregue uma imagem para detectar novamente.";
}

function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

imageInput.addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
        loadImage(file);
    }
});

startCameraBtn.addEventListener("click", () => void startLiveScanner());
captureFrameBtn.addEventListener("click", captureScannerFrame);
stopCameraBtn.addEventListener("click", () => stopLiveScanner());
sampleBtn.addEventListener("click", () => drawSyntheticCard());
detectBtn.addEventListener("click", () => void detectInstruction());
trainBtn.addEventListener("click", () => void saveTrainingSample());
fitModelBtn.addEventListener("click", () => void trainNeuralModel());
predictMlBtn.addEventListener("click", () => void useTrainedModel());
loadCloudBtn.addEventListener("click", () => void loadCloudTrainingSamples());
syncCloudBtn.addEventListener("click", () => void syncTrainingToCloud());
exportBtn.addEventListener("click", exportDataset);
clearTrainingBtn.addEventListener("click", () => void clearTraining());

renderInstructionOptions();
renderLegend();
renderMatrix();
drawEmptyCanvas();
updateTrainingStatus();
void loadSavedNeuralModel();
void loadCloudTrainingSamples(true);
