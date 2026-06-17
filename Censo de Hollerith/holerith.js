const personagens = [
    {
        descricao: "José tem 42 anos. Ele tem um doutorado em Gravitação e Cosmologia Quântica, mas passa seus dias cuidando das plantações de algodão em Liverpool e se casou no ano passado. ",
        respostasCorretas: { idade: "adulto", profissao: "agricultura", estadoCivil: "casado", sexo: "M", nacionalidade: "ingles", alfabetizacao: "sim"}
    },
    {
        descricao: "Alexandra acabou de entrar na faculdade de Ciência da Computação em Oxford. Ela tem 18 anos, mora sozinha e está focada apenas nos estudos., mas sempre que consegue, tira um tempinho para ligar para seus pais em Bucareste.",
        respostasCorretas: { idade: "adulto", profissao: "intelectual", estadoCivil: "solteiro", sexo: "F", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    },
    {
        descricao: "John, de 71 anos, trabalhou a vida toda em uma fábrica de tecidos operando teares mecânicos e encontrou o amor da sua vida recentemente",
        respostasCorretas: { idade: "idoso", profissao: "industria", estadoCivil: "solteiro", sexo: "M", nacionalidade: "ingles", alfabetizacao: "nao" }
    },
    {
        descricao: "Christopher, está fazendo uma grande adaptação para o cinema de uma das maiores obras literárias da história.",
        respostasCorretas: { idade: "adulto", profissao: "artes", estadoCivil: "casado", sexo: "M", nacionalidade: "ingles", alfabetizacao: "sim" }
    }, 
    {
        descricao: "Thaís, a professora mais querida do CI.",
        respostasCorretas: { idade: "jovem", profissao: "intelectual", estadoCivil: "qualquer", sexo: "F", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    }
];

let coins = Number(localStorage.getItem("coins")) || 0;
let streak = 0;
let personagemAtual = null;
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

function carregarNovoPersonagem() {
    const indiceAleatorio = Math.floor(Math.random() * personagens.length);
    personagemAtual = personagens[indiceAleatorio];
    
    document.getElementById("descricao-personagem").innerText = personagemAtual.descricao;
    document.getElementById("feedback").className = "oculto";
    
    escolhasJogador = { idade: null, profissao: null, estadoCivil: null , sexo: null, nacionalidade: null, alfabetizacao: null};
    document.querySelectorAll(".furo-circular").forEach(btn => btn.classList.remove("perfurado"));
}

function configurarCliquesDoCartao() {
    document.querySelectorAll(".coluna-dados").forEach(coluna => {
        const categoria = coluna.getAttribute("data-categoria");
        const botoes = coluna.querySelectorAll(".furo-circular");

        botoes.forEach(botao => {
            botao.addEventListener("click", () => {
                botoes.forEach(b => b.classList.remove("perfurado"));
                botao.classList.add("perfurado");
                escolhasJogador[categoria] = botao.getAttribute("data-value");
            });
        });
    });
}

async function processarCartao() {
    if (!escolhasJogador.idade || !escolhasJogador.profissao || !escolhasJogador.estadoCivil || !escolhasJogador.sexo || !escolhasJogador.nacionalidade || !escolhasJogador.alfabetizacao) {
        alert("O sistema mecânico travou! Certifique-se de realizar uma perfuração por coluna.");
        return;
    }

    const feedbackDiv = document.getElementById("feedback");
    
    const acertouIdade = escolhasJogador.idade === personagemAtual.respostasCorretas.idade;
    const acertouProfissao = escolhasJogador.profissao === personagemAtual.respostasCorretas.profissao;
    const acertouEstadoCivil = escolhasJogador.estadoCivil === personagemAtual.respostasCorretas.estadoCivil || personagemAtual.respostasCorretas.estadoCivil === "qualquer";
    const acertouSexo = escolhasJogador.sexo === personagemAtual.respostasCorretas.sexo;
    const acertouNacionalidade = escolhasJogador.nacionalidade === personagemAtual.respostasCorretas.nacionalidade;
    const acertouAlfabetizacao = escolhasJogador.alfabetizacao === personagemAtual.respostasCorretas.alfabetizacao;

    if (acertouIdade && acertouProfissao && acertouEstadoCivil&& acertouSexo && acertouNacionalidade&&acertouAlfabetizacao) {
        streak++;
        const reward = 35 + Math.min(streak, 5) * 5;
        coins += reward;
        localStorage.setItem("coins", coins);
        updateCoins();
        saveRanking();

        feedbackDiv.innerText = "Você acertou! +" + reward + " moedas";
        feedbackDiv.className = "sucesso";
        setTimeout(carregarNovoPersonagem, 3000);
    } else {
        streak = 0;
        feedbackDiv.innerText = "Erro. Tente novamente.";
        feedbackDiv.className = "erro";
    }
}

window.onload = function() {
    updateCoins();
    configurarCliquesDoCartao();
    carregarNovoPersonagem();
    document.getElementById("btn-Processar").addEventListener("click", processarCartao);
};
