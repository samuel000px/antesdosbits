async function carregarRanking() {

    const { data, error } =
    await window.supabaseClient
    .from("ranking")
    .select("*")
    .order("pontos", {
        ascending: false
    })
    .limit(10);

    if(error){
        console.error(error);
        document.getElementById("rankingList").innerHTML =
            "<li>Nao foi possivel carregar o ranking.</li>";
        return;
    }

    const lista =
    document.getElementById("rankingList");

    lista.innerHTML = "";

    if (!data.length) {
        lista.innerHTML = "<li>Nenhum jogador no ranking ainda.</li>";
        return;
    }

    data.forEach((player, index) => {

        const li =
        document.createElement("li");

        li.textContent =
            `${index + 1}º - ${player.nome} (${player.pontos} pts)`;

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

carregarRanking();
atualizarAreaLogin();

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
