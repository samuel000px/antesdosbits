async function carregarRanking() {

    const { data, error } =
    await supabase
    .from("ranking")
    .select("*")
    .order("pontos", {
        ascending: false
    })
    .limit(10);

    if(error){
        console.error(error);
        return;
    }

    const lista =
    document.getElementById("rankingList");

    lista.innerHTML = "";

    data.forEach((player, index) => {

        const li =
        document.createElement("li");

        li.textContent =
            `${index + 1}º - ${player.nome} (${player.pontos} pts)`;

        lista.appendChild(li);

    });

}

carregarRanking();

const phases = document.querySelectorAll(".phase");

const title = document.getElementById("detailTitle");
const description = document.getElementById("detailDescription");

let currentPage = "Jacquard/jacquard.html";

phases.forEach(phase => {

    function updateDetails() {

        title.textContent = phase.dataset.title;
        description.textContent = phase.dataset.desc;

        currentPage = phase.dataset.page;
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