document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.querySelector("form");

    if (!formLogin) {
        console.error("Formulario de login nao encontrado.");
        return;
    }

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert("Erro: " + error.message);
            return;
        }

        const nome = data.user.user_metadata?.name || data.user.user_metadata?.nome || email;

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("playerName", nome);

        alert("Login realizado com sucesso!");
        window.location.href = "index.html";
    });
});

