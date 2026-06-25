const personagensOriginais = [
    {
        descricao: "José tem 42 anos. Ele tem um doutorado em Gravitação e Cosmologia Quântica, mas passa seus dias cuidando das plantações de algodão em Liverpool e se casou no ano passado.",
        respostasCorretas: { idade: "adulto", profissao: "agricultura", estadoCivil: "casado", sexo: "M", nacionalidade: "ingles", alfabetizacao: "sim" }
    },
    {
        descricao: "Alexandra acabou de entrar na faculdade de Ciência da Computação em Oxford. Ela tem 18 anos, mora sozinha e está focada apenas nos estudos, mas sempre que consegue liga para seus pais em Bucareste.",
        respostasCorretas: { idade: "adulto", profissao: "intelectual", estadoCivil: "solteiro", sexo: "F", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    },
    {
        descricao: "John, de 71 anos, trabalhou desde a infância em uma fábrica de tecidos operando teares mecânicos em Londres e encontrou o amor da sua vida recentemente.",
        respostasCorretas: { idade: "idoso", profissao: "industria", estadoCivil: "solteiro", sexo: "M", nacionalidade: "ingles", alfabetizacao: "nao" }
    },
    {
        descricao: "Christopher é um diretor de cinema bastante reconhecido e está fazendo uma adaptação de uma das maiores obras literárias da história.",
        respostasCorretas: { idade: "adulto", profissao: "artes", estadoCivil: "casado", sexo: "M", nacionalidade: "ingles", alfabetizacao: "sim" }
    },
    {
        descricao: "Albert descobriu que o tempo é relativo.",
        respostasCorretas: { idade: "idoso", profissao: "intelectual", estadoCivil: "solteiro", sexo: "M", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    },
    {
        descricao: "Alan é o pai da computação.",
        respostasCorretas: { idade: "adulto", profissao: "intelectual", estadoCivil: "solteiro", sexo: "M", nacionalidade: "ingles", alfabetizacao: "sim" }
    },
    {
        descricao: "Pablo adora pintar.",
        respostasCorretas: { idade: "idoso", profissao: "artes", estadoCivil: "casado", sexo: "M", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    }
];

let coins = Number(localStorage.getItem("coins")) || 0;
let streak = 0;
let poolPersonagens = [];
let personagemAtual = null;
let rodadaAtual = 0;
let moedasGanhas = 0;
let cartaoBloqueado = false;

const MAX_RODADAS = 4;
const MOEDAS_POR_ACERTO = 25;

let escolhasJogador = {
    idade: null,
    profissao: null,
    estadoCivil: null,
    sexo: null,
    nacionalidade: null,
    alfabetizacao: null
};

function updateCoins() {
    const display = document.getElementById("coinsDisplay");
    if (display) {
        display.textContent = coins + " moedas";
    }
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

function resetEscolhas() {
    escolhasJogador = {
        idade: null,
        profissao: null,
        estadoCivil: null,
        sexo: null,
        nacionalidade: null,
        alfabetizacao: null
    };

    document.querySelectorAll(".furo-circular").forEach(btn => btn.classList.remove("perfurado"));
}

function carregarNovoPersonagem() {
    if (rodadaAtual >= MAX_RODADAS || poolPersonagens.length === 0) {
        finalizarPartida();
        return;
    }

    rodadaAtual++;
    cartaoBloqueado = false;

    const indiceAleatorio = Math.floor(Math.random() * poolPersonagens.length);
    personagemAtual = poolPersonagens.splice(indiceAleatorio, 1)[0];

    document.getElementById("descricao-personagem").innerText =
        "[Cidadão " + rodadaAtual + "/" + MAX_RODADAS + "] — " + personagemAtual.descricao;
    document.getElementById("feedback").className = "oculto";
    document.getElementById("btn-Continuar").classList.add("oculto");
    document.getElementById("btn-Processar").classList.remove("oculto");

    resetEscolhas();
}

function iniciarJogo() {
    poolPersonagens = [...personagensOriginais];
    rodadaAtual = 0;
    moedasGanhas = 0;
    streak = 0;
    cartaoBloqueado = false;

    document.querySelector(".ficha-cidadao").classList.remove("oculto");
    document.querySelector(".cartao-perfurado").classList.remove("oculto");
    document.getElementById("btn-Processar").classList.remove("oculto");
    document.getElementById("btn-Continuar").classList.add("oculto");
    document.getElementById("tela-final").classList.add("oculto");
    document.getElementById("feedback").className = "oculto";

    carregarNovoPersonagem();
    updateCoins();
}

function finalizarPartida() {
    document.querySelector(".ficha-cidadao").classList.add("oculto");
    document.querySelector(".cartao-perfurado").classList.add("oculto");
    document.getElementById("btn-Processar").classList.add("oculto");
    document.getElementById("btn-Continuar").classList.add("oculto");
    document.getElementById("feedback").className = "oculto";

    document.getElementById("resultado-moedas").innerText =
        "Triagem concluída! Você tabulou os cartões e ganhou " + moedasGanhas + " moedas.";
    document.getElementById("tela-final").classList.remove("oculto");
}

function configurarCliquesDoCartao() {
    document.querySelectorAll(".coluna-dados").forEach(coluna => {
        const categoria = coluna.getAttribute("data-categoria");
        const botoes = coluna.querySelectorAll(".furo-circular");

        botoes.forEach(botao => {
            botao.addEventListener("click", () => {
                if (cartaoBloqueado) return;

                botoes.forEach(b => b.classList.remove("perfurado"));
                botao.classList.add("perfurado");
                escolhasJogador[categoria] = botao.getAttribute("data-value");
            });
        });
    });
}

function processarCartao() {
    if (!document.getElementById("tela-final").classList.contains("oculto")) return;

    if (!escolhasJogador.idade || !escolhasJogador.profissao || !escolhasJogador.estadoCivil || !escolhasJogador.sexo || !escolhasJogador.nacionalidade || !escolhasJogador.alfabetizacao) {
        alert("O sistema mecânico do Pantógrafo travou! Realize exatamente uma perfuração por coluna antes de puxar a alavanca.");
        return;
    }

    cartaoBloqueado = true;
    document.getElementById("btn-Processar").classList.add("oculto");

    const feedbackDiv = document.getElementById("feedback");
    const respostas = personagemAtual.respostasCorretas;

    const acertou =
        escolhasJogador.idade === respostas.idade &&
        escolhasJogador.profissao === respostas.profissao &&
        (escolhasJogador.estadoCivil === respostas.estadoCivil || respostas.estadoCivil === "qualquer") &&
        escolhasJogador.sexo === respostas.sexo &&
        escolhasJogador.nacionalidade === respostas.nacionalidade &&
        escolhasJogador.alfabetizacao === respostas.alfabetizacao;

    if (acertou) {
        streak++;
        const reward = MOEDAS_POR_ACERTO + Math.min(streak, 5) * 5;

        moedasGanhas += reward;
        coins += reward;
        localStorage.setItem("coins", coins);
        updateCoins();
        saveRanking();

        feedbackDiv.innerText = "Registro tabulado com sucesso! +" + reward + " moedas";
        feedbackDiv.className = "sucesso";
        setTimeout(carregarNovoPersonagem, 2000);
    } else {
        streak = 0;
        feedbackDiv.innerText = "Erro de tabulação! Dados inconsistentes com o prontuário.";
        feedbackDiv.className = "erro";
        document.getElementById("btn-Continuar").classList.remove("oculto");
    }
}

window.onload = function() {
    configurarCliquesDoCartao();
    iniciarJogo();

    document.getElementById("btn-Processar").addEventListener("click", processarCartao);
    document.getElementById("btn-Continuar").addEventListener("click", carregarNovoPersonagem);
    document.getElementById("btn-Reiniciar").addEventListener("click", iniciarJogo);
    document.getElementById("btn-Sair").addEventListener("click", () => {
        window.location.href = "../index.html";
    });
};
