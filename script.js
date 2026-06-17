function agruparRanking(jogadores) {
    const grupos = new Map();

    jogadores.forEach((player) => {
        const chave = player.user_id || player.nome || player.email;
        const pontos = Number(player.pontos) || 0;

        if (!chave) {
            return;
        }

        const atual = grupos.get(chave);

        if (!atual || pontos > atual.pontos) {
            grupos.set(chave, {
                nome: player.nome || player.email || "Anonimo",
                pontos
            });
        }
    });

    return [...grupos.values()]
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, 10);
}

async function carregarRanking() {
    const lista =
    document.getElementById("rankingList");

    if (!window.supabaseClient) {
        lista.innerHTML = '<li class="ranking-empty">Conexao com o Supabase nao carregou.</li>';
        return;
    }

    const { data, error } =
    await window.supabaseClient
    .from("ranking")
    .select("*")
    .order("pontos", {
        ascending: false
    })
    .limit(100);

    if(error){
        console.error(error);
        lista.innerHTML =
            `<li class="ranking-empty">Nao foi possivel carregar o ranking: ${error.message}</li>`;
        return;
    }

    lista.innerHTML = "";

    const ranking = agruparRanking(data);

    if (!ranking.length) {
        lista.innerHTML = '<li class="ranking-empty">Nenhum jogador no ranking ainda.</li>';
        return;
    }

    ranking.forEach((player, index) => {
        const li = document.createElement("li");
        const posicao = document.createElement("span");
        const nome = document.createElement("strong");
        const pontos = document.createElement("span");

        li.className = "ranking-item";
        posicao.className = "ranking-position";
        nome.className = "ranking-name";
        pontos.className = "ranking-points";

        posicao.textContent = `${index + 1}`;
        nome.textContent = player.nome;
        pontos.textContent = `${player.pontos} pts`;

        li.appendChild(posicao);
        li.appendChild(nome);
        li.appendChild(pontos);
        lista.appendChild(li);

    });

}

async function atualizarAreaLogin() {
    const authArea = document.getElementById("authArea");

    if (!authArea) {
        return;
    }

    const { data } = await window.supabaseClient.auth.getUser();
    const user = data.user;

    if (!user) {
        authArea.innerHTML = `
            <a href="login.html">Entrar</a>
            <a href="cadastro.html">Cadastrar</a>
        `;
        localStorage.removeItem("user");
        return;
    }

    const nome =
        user.user_metadata?.name ||
        user.user_metadata?.nome ||
        localStorage.getItem("playerName") ||
        user.email;

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("playerName", nome);

    authArea.innerHTML = `
        <span>Ola, ${nome}</span>
        <button type="button" id="logoutButton">Sair</button>
    `;

    document.getElementById("logoutButton").addEventListener("click", async () => {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem("user");
        localStorage.removeItem("playerName");
        window.location.reload();
    });
}

async function sincronizarRankingLocal() {
    const moedas = Number(localStorage.getItem("coins")) || 0;

    if (!moedas || !window.supabaseClient) {
        return;
    }

    const { data } = await window.supabaseClient.auth.getUser();
    const user = data.user;

    if (!user) {
        return;
    }

    const nome =
        user.user_metadata?.name ||
        user.user_metadata?.nome ||
        localStorage.getItem("playerName") ||
        user.email;

    await salvarPontuacaoRanking(nome, moedas, user.id);
}

async function salvarPontuacaoRanking(nome, pontos, userId) {
    const buscaPorUsuario = await window.supabaseClient
        .from("ranking")
        .select("*")
        .eq("user_id", userId)
        .order("pontos", { ascending: false })
        .limit(1);

    if (!buscaPorUsuario.error && buscaPorUsuario.data.length) {
        const registro = buscaPorUsuario.data[0];
        const novaPontuacao = Math.max(Number(registro.pontos) || 0, pontos);

        if (registro.id) {
            return window.supabaseClient
                .from("ranking")
                .update({ nome, pontos: novaPontuacao, user_id: userId })
                .eq("id", registro.id);
        }
    }

    const buscaPorNome = await window.supabaseClient
        .from("ranking")
        .select("*")
        .eq("nome", nome)
        .order("pontos", { ascending: false })
        .limit(1);

    if (!buscaPorNome.error && buscaPorNome.data.length) {
        const registro = buscaPorNome.data[0];
        const novaPontuacao = Math.max(Number(registro.pontos) || 0, pontos);

        if (registro.id) {
            return window.supabaseClient
                .from("ranking")
                .update({ nome, pontos: novaPontuacao, user_id: userId })
                .eq("id", registro.id);
        }
    }

    const insertComUsuario = await window.supabaseClient
        .from("ranking")
        .insert([{ user_id: userId, nome, pontos }]);

    if (!insertComUsuario.error) {
        return insertComUsuario;
    }

    return window.supabaseClient
        .from("ranking")
        .insert([{ nome, pontos }]);
}

async function iniciarIndex() {
    await atualizarAreaLogin();
    await sincronizarRankingLocal();
    await carregarRanking();
}

iniciarIndex();

const phases = document.querySelectorAll(".phase");

const title = document.getElementById("detailTitle");
const description = document.getElementById("detailDescription");

let currentPage = "Jacquard/jacquard.html";

phases.forEach(phase => {

    function updateDetails() {

        title.textContent = phase.dataset.title;
        description.textContent = phase.dataset.desc;

        currentPage = phase.dataset.page || currentPage;
    }

    phase.addEventListener("mouseenter", updateDetails);
    phase.addEventListener("click", updateDetails);
    phase.addEventListener("touchstart", updateDetails);

});

document.getElementById("playButton")
.addEventListener("click", () => {

    console.log(currentPage);

    window.location.href = currentPage;

});
