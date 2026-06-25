const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");

if (new URLSearchParams(window.location.search).get("embedded") === "1") {
    document.body.classList.add("embedded-page");

    document.querySelectorAll('a[href$=".html"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");

            if (!href || href.includes("site-com-musica.html")) {
                return;
            }

            event.preventDefault();
            window.location.href = `${href}?embedded=1`;
        });
    });
}

if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });
}

if (!document.body.classList.contains("music-shell") && !document.body.classList.contains("embedded-page")) {
    const musicModeButton = document.createElement("a");
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    musicModeButton.className = "floating-music-button";
    musicModeButton.href = `site-com-musica.html?page=${encodeURIComponent(currentPage)}`;
    musicModeButton.textContent = "Musica continua";
    document.body.appendChild(musicModeButton);
}

const daysTogether = document.getElementById("daysTogether");
const relationshipStartDate = "2025-11-24";

function updateDaysTogether() {
    if (!daysTogether) {
        return;
    }

    const selected = new Date(`${relationshipStartDate}T00:00:00`);
    const today = new Date();
    const diff = today.setHours(0, 0, 0, 0) - selected.getTime();
    const days = Math.max(0, Math.floor(diff / 86400000));

    daysTogether.textContent = `${days} dias`;
}

updateDaysTogether();

const letterDialog = document.getElementById("letterDialog");
const letterText = document.getElementById("letterText");

document.querySelectorAll(".letter").forEach((letter) => {
    letter.addEventListener("click", () => {
        if (!letterDialog || !letterText) {
            return;
        }

        letterText.textContent = letter.dataset.letter;
        letterDialog.showModal();
    });
});

const closeDialog = document.querySelector(".dialog-close");

if (closeDialog && letterDialog) {
    closeDialog.addEventListener("click", () => {
        letterDialog.close();
    });
}

const availableSongs = [
    {
        title: "Jorge & Mateus - Seu Astral",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/jorge-mateus-seu-astral.mp3"
    },
    {
        title: "Gustavo Mioto - Last Goodbye",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/gustavo-mioto-last-goodbye.mp3"
    },
    {
        title: "Luan Santana - Amar nao e pecado",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/luan-santana-amar-nao-e-pecado.mp3"
    },
    {
        title: "Luan Santana - O Amor Coloriu",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/luan-santana-o-amor-coloriu.mp3"
    },
    {
        title: "Luan Santana - Te esperando",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/luan-santana-te-esperando.mp3"
    },
    {
        title: "Luan Santana - Te Vivo",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/luan-santana-te-vivo.mp3"
    },
    {
        title: "Matheus & Kauan - Que Sorte A Nossa",
        subtitle: "Musica ja adicionada ao site",
        file: "musica/matheus-kauan-que-sorte-a-nossa.mp3"
    }
];

const musicList = document.getElementById("musicList");
const musicPlayer = document.getElementById("musicPlayer");
const musicNow = document.getElementById("musicNow");
const musicStatus = document.getElementById("musicStatus");

function setMusicStatus(message) {
    if (musicStatus) {
        musicStatus.textContent = message;
    }
}

function selectSong(song, shouldPlay = true) {
    if (!musicPlayer || !musicNow) {
        return;
    }

    musicPlayer.pause();
    musicPlayer.removeAttribute("src");
    musicPlayer.innerHTML = `<source src="${song.file}" type="audio/mpeg">`;
    musicPlayer.load();
    musicNow.textContent = song.title;
    setMusicStatus(`Carregando: ${song.file}`);
    localStorage.setItem("samuelLarissaSong", song.file);

    document.querySelectorAll(".song-card").forEach((card) => {
        card.classList.toggle("active", card.dataset.file === song.file);
    });

    if (shouldPlay) {
        musicPlayer.play().then(() => {
            setMusicStatus("Tocando agora.");
        }).catch(() => {
            setMusicStatus("Musica carregada. Aperte o play no controle acima.");
        });
    }
}

if (musicList && musicPlayer && musicNow) {
    availableSongs.forEach((song) => {
        const button = document.createElement("button");
        const title = document.createElement("strong");
        const subtitle = document.createElement("span");

        button.type = "button";
        button.className = "song-card";
        button.dataset.file = song.file;
        title.textContent = song.title;
        subtitle.textContent = song.subtitle;

        button.appendChild(title);
        button.appendChild(subtitle);
        button.addEventListener("click", () => selectSong(song));

        musicList.appendChild(button);
    });

    const savedSong = availableSongs.find((song) => song.file === localStorage.getItem("samuelLarissaSong"));
    const initialSong = savedSong || availableSongs[0];

    musicPlayer.addEventListener("loadedmetadata", () => {
        const duration = Number.isFinite(musicPlayer.duration)
            ? `${Math.floor(musicPlayer.duration / 60)}:${String(Math.floor(musicPlayer.duration % 60)).padStart(2, "0")}`
            : "duracao indisponivel";

        setMusicStatus(`Pronta para tocar - ${duration}.`);
    });

    musicPlayer.addEventListener("error", () => {
        setMusicStatus("Nao consegui abrir essa musica pelo player. Tente recarregar a pagina ou abrir pelo modo com musica continua.");
    });

    if (initialSong) {
        selectSong(initialSong, false);
    }
}

const shellSongSelect = document.getElementById("shellSongSelect");
const shellMusicPlayer = document.getElementById("shellMusicPlayer");
const shellMusicNow = document.getElementById("shellMusicNow");
const shellMusicStatus = document.getElementById("shellMusicStatus");
const shellPrevSong = document.getElementById("shellPrevSong");
const shellNextSong = document.getElementById("shellNextSong");
const persistentPlayer = document.getElementById("persistentPlayer");
const hidePlayerButton = document.getElementById("hidePlayerButton");
const showPlayerButton = document.getElementById("showPlayerButton");
const shellFrame = document.getElementById("siteFrame");
const shellPageLinks = document.querySelectorAll("[data-shell-page]");
const shellPages = [
    "index.html",
    "historia.html",
    "galeria.html",
    "musicas.html",
    "larissa.html",
    "cartas.html",
    "quiz.html",
    "futuro.html",
    "texto-samuel.html"
];

let shellSongIndex = 0;

function normalizeShellPage(page) {
    const cleanPage = (page || "index.html").split("?")[0].split("#")[0];
    return shellPages.includes(cleanPage) ? cleanPage : "index.html";
}

function markShellPage(page) {
    shellPageLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === page);
    });
}

function loadShellPage(page) {
    if (!shellFrame) {
        return;
    }

    const safePage = normalizeShellPage(page);
    shellFrame.src = `${safePage}?embedded=1`;
    markShellPage(safePage);

    if (window.history?.replaceState) {
        window.history.replaceState(null, "", `site-com-musica.html?page=${encodeURIComponent(safePage)}`);
    }
}

if (shellFrame) {
    shellPageLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            loadShellPage(link.getAttribute("href"));
            navLinks?.classList.remove("open");
            menuButton?.setAttribute("aria-expanded", "false");
        });
    });

    loadShellPage(new URLSearchParams(window.location.search).get("page"));
}

function setShellStatus(message) {
    if (shellMusicStatus) {
        shellMusicStatus.textContent = message;
    }
}

function loadShellSong(index, shouldPlay = true) {
    if (!shellMusicPlayer || !shellMusicNow || !availableSongs.length) {
        return;
    }

    shellSongIndex = (index + availableSongs.length) % availableSongs.length;
    const song = availableSongs[shellSongIndex];

    shellMusicPlayer.pause();
    shellMusicPlayer.removeAttribute("src");
    shellMusicPlayer.innerHTML = `<source src="${song.file}" type="audio/mpeg">`;
    shellMusicPlayer.load();
    shellMusicNow.textContent = song.title;
    setShellStatus(`Carregando: ${song.file}`);
    localStorage.setItem("samuelLarissaShellSong", song.file);

    if (shellSongSelect) {
        shellSongSelect.value = String(shellSongIndex);
    }

    if (shouldPlay) {
        shellMusicPlayer.play().then(() => {
            setShellStatus("Tocando agora. A proxima entra automaticamente.");
        }).catch(() => {
            setShellStatus("Musica carregada. Aperte play no controle.");
        });
    }
}

function playNextShellSong() {
    loadShellSong(shellSongIndex + 1, true);
}

function playPreviousShellSong() {
    loadShellSong(shellSongIndex - 1, true);
}

if (shellSongSelect && shellMusicPlayer && shellMusicNow) {
    availableSongs.forEach((song, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = song.title;
        shellSongSelect.appendChild(option);
    });

    const savedShellSong = availableSongs.findIndex((song) => song.file === localStorage.getItem("samuelLarissaShellSong"));
    loadShellSong(savedShellSong >= 0 ? savedShellSong : 0, false);

    shellSongSelect.addEventListener("change", () => {
        loadShellSong(Number(shellSongSelect.value), true);
    });

    shellMusicPlayer.addEventListener("ended", playNextShellSong);
    shellNextSong?.addEventListener("click", playNextShellSong);
    shellPrevSong?.addEventListener("click", playPreviousShellSong);

    shellMusicPlayer.addEventListener("loadedmetadata", () => {
        const duration = Number.isFinite(shellMusicPlayer.duration)
            ? `${Math.floor(shellMusicPlayer.duration / 60)}:${String(Math.floor(shellMusicPlayer.duration % 60)).padStart(2, "0")}`
            : "duracao indisponivel";

        setShellStatus(`Pronta para tocar - ${duration}.`);
    });

    shellMusicPlayer.addEventListener("error", () => {
        setShellStatus("Nao consegui abrir esse MP3 aqui. Tente abrir no navegador normal ou Live Server.");
    });
}

if (persistentPlayer && hidePlayerButton && showPlayerButton) {
    function setPlayerHidden(isHidden) {
        document.body.classList.toggle("player-hidden", isHidden);
        localStorage.setItem("samuelLarissaPlayerHidden", String(isHidden));

        if (isHidden && shellMusicPlayer) {
            shellMusicPlayer.pause();
        }
    }

    hidePlayerButton.addEventListener("click", () => {
        setPlayerHidden(true);
    });

    showPlayerButton.addEventListener("click", () => {
        setPlayerHidden(false);
    });

    setPlayerHidden(localStorage.getItem("samuelLarissaPlayerHidden") === "true");
}

const questions = [
    {
        text: "Onde Samuel e Larissa se conheceram?",
        options: ["Na Forneria de Origem", "No Motiva Miramar", "Em Camboinha"],
        answer: 1
    },
    {
        text: "Qual foi a pergunta meio doida que Samuel fez no Instagram?",
        options: ["Se ela gostava de arquitetura", "Se ela sabia fisica", "Se ela era da turma A"],
        answer: 2
    },
    {
        text: "Qual aula Samuel tentou dar para Larissa?",
        options: ["Fisica", "Matematica", "Quimica"],
        answer: 0
    },
    {
        text: "Quando Larissa disse que realmente gostou dele?",
        options: ["Quando ele pediu pizza de pera", "Quando ele ofereceu para deixar ela em casa", "Quando ele pegou o casaco dela"],
        answer: 1
    },
    {
        text: "Onde foi o primeiro encontro?",
        options: ["Igreja", "Forneria de Origem", "Busto de Tamandare"],
        answer: 1
    },
    {
        text: "Que pizza Samuel fingiu gostar porque Larissa gostava?",
        options: ["Pizza de alho", "Pizza de banana", "Pizza de pera"],
        answer: 2
    },
    {
        text: "Onde Samuel pediu Larissa em namoro?",
        options: ["No Motiva Miramar", "Em Camboinha", "No Busto de Tamandare"],
        answer: 2
    },
    {
        text: "Qual e a data do pedido de namoro?",
        options: ["24 de dezembro de 2025", "24 de novembro de 2025", "7 de junho de 2026"],
        answer: 1
    },
    {
        text: "Qual faculdade Larissa comecou?",
        options: ["Medicina", "Arquitetura", "Direito"],
        answer: 1
    },
    {
        text: "Qual sonho de viagem tem a ver com luzes subindo no ceu?",
        options: ["Italia", "Japao", "Tailandia"],
        answer: 2
    },
    {
        text: "Qual foi o primeiro dia que te dei um oi, td bem? (sem ver o print)",
        options: ["30 de setembro", "27 de setembro", "24 de setembro"],
        answer: 2
    },
    {
        text: "O anel caiu no copo?",
        options: ["Sim", "Sim, caiu no copo", "Sim kkkkk"],
        answer: 1
    }
];

const quizBox = document.getElementById("quizBox");
const quizProgress = document.getElementById("quizProgress");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizResult = document.getElementById("quizResult");

let questionIndex = 0;
let score = 0;

function renderQuestion() {
    if (!quizBox || !quizProgress || !quizQuestion || !quizOptions || !quizResult) {
        return;
    }

    if (questionIndex >= questions.length) {
        quizProgress.textContent = "Resultado";
        quizQuestion.textContent = `Voce fez ${score} de ${questions.length} pontos`;
        quizOptions.innerHTML = "";
        quizResult.textContent = score === questions.length
            ? "Gabaritou. Pode casar com a memoria tranquila."
            : "Errou algumas, mas ganhou pontos por existir nessa historia.";
        return;
    }

    const current = questions[questionIndex];
    quizProgress.textContent = `Pergunta ${questionIndex + 1} de ${questions.length}`;
    quizQuestion.textContent = current.text;
    quizResult.textContent = "";
    quizOptions.innerHTML = "";

    current.options.forEach((option, optionIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option;
        button.addEventListener("click", () => {
            if (optionIndex === current.answer) {
                score += 1;
            }

            questionIndex += 1;
            renderQuestion();
        });

        quizOptions.appendChild(button);
    });
}

renderQuestion();
