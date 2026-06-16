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

let personagemAtual = null;
let escolhasJogador = {
    idade: null,
    profissao: null,
    estadoCivil: null,
    sexo: null,
    nacionalidade: null,
    alfabetizacao: null
};

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

function processarCartao() {
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
        feedbackDiv.innerText = "Você acertou!";
        feedbackDiv.className = "sucesso";
        setTimeout(carregarNovoPersonagem, 3000);
    } else {
        feedbackDiv.innerText = "Erro. Tente novamente.";
        feedbackDiv.className = "erro";
    }
}

window.onload = function() {
    configurarCliquesDoCartao();
    carregarNovoPersonagem();
    document.getElementById("btn-Processar").addEventListener("click", processarCartao);
};