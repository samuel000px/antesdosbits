const personagensOriginais = [
    {
        descricao: "José tem 42 anos. Ele tem um doutorado em Gravitação e Cosmologia Quântica, mas passa seus dias cuidando das plantações de algodão em Liverpool e se casou no ano passado. ",
        respostasCorretas: { idade: "adulto", profissao: "agricultura", estadoCivil: "casado", sexo: "M", nacionalidade: "ingles", alfabetizacao: "sim"}
    },
    {
        descricao: "Alexandra acabou de entrar na faculdade de Ciência da Computação em Oxford. Ela tem 18 anos, mora sozinha e está focada apenas nos estudos., mas sempre que consegue, tira um tempinho para ligar para seus pais em Bucareste.",
        respostasCorretas: { idade: "adulto", profissao: "intelectual", estadoCivil: "solteiro", sexo: "F", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    },
    {
        descricao: "John, de 71 anos, trabalhou desde a infância em uma fábrica de tecidos operando teares mecânicos em Londres e encontrou o amor da sua vida recentemente",
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
        descricao: "Pablo adora pintar",
        respostasCorretas: { idade: "idoso", profissao: "artes", estadoCivil: "casado", sexo: "M", nacionalidade: "estrangeiro", alfabetizacao: "sim" }
    }
];

// Variáveis de controle do estado do jogo
let poolPersonagens = [];
let personagemAtual = null;
let rodadaAtual = 0;
let moedasGanhas = 0;
const MAX_RODADAS = 4;
const MOEDAS_POR_ACERTO = 25; // Quantidade de moedas ganhas por acerto

let escolhasJogador = {
    idade: null,
    profissao: null,
    estadoCivil: null,
    sexo: null,
    nacionalidade: null,
    alfabetizacao: null
};


function carregarNovoPersonagem() {
    if (rodadaAtual >= MAX_RODADAS || poolPersonagens.length === 0) {
        finalizarPartida();
        return;
    }

    rodadaAtual++;
    
    // Sorteia e REMOVE o personagem da lista para evitar repetição
    const indiceAleatorio = Math.floor(Math.random() * poolPersonagens.length);
    personagemAtual = poolPersonagens.splice(indiceAleatorio, 1)[0];
    
    // Atualiza o prontuário na tela
    document.getElementById("descricao-personagem").innerText = `[Cidadão ${rodadaAtual}/${MAX_RODADAS}] — ${personagemAtual.descricao}`;
    document.getElementById("feedback").className = "oculto";
    
    // Reseta o cartão perfurado do jogador
    escolhasJogador = { idade: null, profissao: null, estadoCivil: null , sexo: null, nacionalidade: null, alfabetizacao: null};
    document.querySelectorAll(".furo-circular").forEach(btn => btn.classList.remove("perfurado"));
}

function iniciarJogo() {
    poolPersonagens = [...personagensOriginais];
    rodadaAtual = 0;
    moedasGanhas = 0;
    
    // Usando seletores mais seguros e garantindo que não quebrem
    const ficha = document.querySelector(".ficha-cidadao") || document.querySelector(".card");
    const cartao = document.querySelector(".cartao-perfurado");
    const btnProcessar = document.getElementById("btn-Processar");
    const telaFinal = document.getElementById("tela-final");
    const btnContinuar = document.getElementById("btn-Continuar");

    if (ficha) {
        ficha.style.display = "block"; // Força exibição padrão
        ficha.classList.remove("oculto");
    }
    if (cartao) {
        cartao.style.display = "block"; // Força exibição padrão
        cartao.classList.remove("oculto");
    }
    if (btnProcessar) {
        btnProcessar.style.display = "block";
        btnProcessar.classList.remove("oculto");
    }
    if (btnContinuar) btnContinuar.classList.add("oculto");
    if (telaFinal) telaFinal.classList.add("oculto");
    
    carregarNovoPersonagem();
}

function finalizarPartida() {
    const ficha = document.querySelector(".ficha-cidadao") || document.querySelector(".card");
    const cartao = document.querySelector(".cartao-perfurado");
    const btnProcessar = document.getElementById("btn-Processar");
    const btnContinuar = document.getElementById("btn-Continuar");
    const feedback = document.getElementById("feedback");
    
    // Adiciona classe oculto e esconde via display
    if (ficha) ficha.classList.add("oculto");
    if (cartao) cartao.classList.add("oculto");
    if (btnProcessar) btnProcessar.classList.add("oculto");
    if (btnContinuar) btnContinuar.classList.add("oculto");
    if (feedback) feedback.className = "oculto";
    
    const resultadoTexto = document.getElementById("resultado-moedas");
    if (resultadoTexto) {
        resultadoTexto.innerText = `Triagem concluída! Você tabulou os cartões e ganhou um total de: 🪙 ${moedasGanhas} moedas de ouro.`;
    }
    
    const telaFinal = document.getElementById("tela-final");
    if (telaFinal) {
        telaFinal.classList.remove("oculto");
    }
}



// Variável global para controlar se o cartão está bloqueado para cliques
let cartaoBloqueado = false;

function carregarNovoPersonagem() {
    if (rodadaAtual >= MAX_RODADAS || poolPersonagens.length === 0) {
        finalizarPartida();
        return;
    }

    rodadaAtual++;
    cartaoBloqueado = false; // Desbloqueia o cartão para a nova rodada
    
    const indiceAleatorio = Math.floor(Math.random() * poolPersonagens.length);
    personagemAtual = poolPersonagens.splice(indiceAleatorio, 1)[0];
    
    document.getElementById("descricao-personagem").innerText = `[Cidadão ${rodadaAtual}/${MAX_RODADAS}] — ${personagemAtual.descricao}`;
    
    // Esconde o feedback e o botão de continuar
    document.getElementById("feedback").className = "oculto";
    document.getElementById("btn-Continuar").classList.add("oculto");
    
    // Mostra novamente o botão de processar
    document.getElementById("btn-Processar").classList.remove("oculto");
    
    escolhasJogador = { idade: null, profissao: null, estadoCivil: null , sexo: null, nacionalidade: null, alfabetizacao: null};
    document.querySelectorAll(".furo-circular").forEach(btn => btn.classList.remove("perfurado"));
}

function configurarCliquesDoCartao() {
    document.querySelectorAll(".coluna-dados").forEach(coluna => {
        const categoria = coluna.getAttribute("data-categoria");
        const botoes = coluna.querySelectorAll(".furo-circular");

        botoes.forEach(botao => {
            botao.addEventListener("click", () => {
                // Se o cartão estiver bloqueado, ignora o clique do jogador
                if (cartaoBloqueado) return;

                botoes.forEach(b => b.classList.remove("perfurado"));
                botao.classList.add("perfurado");
                escolhasJogador[categoria] = botao.getAttribute("data-value");
            });
        });
    });
}

function processarCartao() {
    if (document.getElementById("tela-final").className.indexOf("oculto") === -1) return;

    if (!escolhasJogador.idade || !escolhasJogador.profissao || !escolhasJogador.estadoCivil || !escolhasJogador.sexo || !escolhasJogador.nacionalidade || !escolhasJogador.alfabetizacao) {
        alert("O sistema mecânico do Pantógrafo travou! Realize exatamente uma perfuração por coluna antes de puxar a alavanca.");
        return;
    }

    cartaoBloqueado = true; // Bloqueia o cartão para impedir correções!
    
    // Esconde o botão de processar (alavanca) para o jogador não clicar duas vezes
    document.getElementById("btn-Processar").classList.add("oculto");

    const feedbackDiv = document.getElementById("feedback");
    
    const acertouIdade = escolhasJogador.idade === personagemAtual.respostasCorretas.idade;
    const acertouProfissao = escolhasJogador.profissao === personagemAtual.respostasCorretas.profissao;
    const acertouEstadoCivil = escolhasJogador.estadoCivil === personagemAtual.respostasCorretas.estadoCivil || personagemAtual.respostasCorretas.estadoCivil === "qualquer";
    const acertouSexo = escolhasJogador.sexo === personagemAtual.respostasCorretas.sexo;
    const acertouNacionalidade = escolhasJogador.nacionalidade === personagemAtual.respostasCorretas.nacionalidade;
    const acertouAlfabetizacao = escolhasJogador.alfabetizacao === personagemAtual.respostasCorretas.alfabetizacao;

    if (acertouIdade && acertouProfissao && acertouEstadoCivil && acertouSexo && acertouNacionalidade && acertouAlfabetizacao) {
        feedbackDiv.innerText = "✓ Registro tabulado com sucesso pelo sistema mecânico!";
        feedbackDiv.className = "sucesso";
        moedasGanhas += MOEDAS_POR_ACERTO;
        
        // Se acertou, avança sozinho após 2 segundos (mantém o fluxo fluido)
        setTimeout(carregarNovoPersonagem, 2000);
    } else {
        feedbackDiv.innerText = "✕ Erro de tabulação! Dados inconsistentes com o prontuário.";
        feedbackDiv.className = "erro";
        
        // Se errou, exibe o botão de Continuar para o jogador avançar manualmente
        document.getElementById("btn-Continuar").classList.remove("oculto");
    }
}

function finalizarPartida() {
    document.querySelector(".ficha-cidadao").classList.add("oculto");
    document.querySelector(".cartao-perfurado").classList.add("oculto");
    document.getElementById("btn-Processar").classList.add("oculto");
    document.getElementById("btn-Continuar").classList.add("oculto"); // Garante que suma no fim
    document.getElementById("feedback").className = "oculto";
    
    const resultadoTexto = document.getElementById("resultado-moedas");
    resultadoTexto.innerText = `Triagem concluída! Você tabulou os cartões e ganhou um total de: 🪙 ${moedasGanhas} moedas de ouro.`;
    
    document.getElementById("tela-final").classList.remove("oculto");
}

window.onload = function() {
    configurarCliquesDoCartao();
    iniciarJogo();
    
    document.getElementById("btn-Processar").addEventListener("click", processarCartao);
    
    // Adiciona o evento de clique para o novo botão de Continuar
    document.getElementById("btn-Continuar").addEventListener("click", carregarNovoPersonagem);
    
    document.getElementById("btn-Reiniciar").addEventListener("click", iniciarJogo);
    document.getElementById("btn-Sair").addEventListener("click", () => {
        alert("Retornando ao menu principal do jogo...");
    });
};