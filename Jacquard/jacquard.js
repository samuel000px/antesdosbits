const cols = document.querySelectorAll(".col");
const log = document.getElementById("log");

let pattern = [];

// clicar para perfurar
cols.forEach((col, index) => {

    col.addEventListener("click", () => {

        col.classList.toggle("active");

        pattern[index] = col.classList.contains("active") ? 1 : 0;

    });

});

// execução da máquina
document.getElementById("runBtn").addEventListener("click", () => {

    log.innerHTML = "";

    let actions = [];

    pattern.forEach((bit, i) => {

        setTimeout(() => {

            if(bit === 1){
                actions.push(`Coluna ${i+1}: LEVANTAR FIO`);
            } else {
                actions.push(`Coluna ${i+1}: SEM AÇÃO`);
            }

            log.innerHTML = actions.join("<br>");

        }, i * 600);

    });

});