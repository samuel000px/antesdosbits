

document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.querySelector("#formCadastro");

    if (!formCadastro) {
        console.error("Formulario de cadastro nao encontrado.");
        return;
    }

    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (password !== confirmPassword) {
            alert("As senhas nao coincidem!");
            return;
        }

        if (password.length < 6) {
            alert("A senha precisa ter pelo menos 6 caracteres!");
            return;
        }

        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    nome: name
                }
            }
        });

        if (error) {
            alert("Erro: " + error.message);
            return;
        }

        if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("playerName", name);
            await criarEntradaInicialRanking(data.user.id, name);
        }

        alert("Conta criada com sucesso!");
        window.location.href = "login.html";
    });
});

async function criarEntradaInicialRanking(userId, nome) {
    const registroComUsuario = {
        user_id: userId,
        nome,
        pontos: 0
    };

    const { error } = await window.supabaseClient
        .from("ranking")
        .upsert(registroComUsuario, {
            onConflict: "user_id"
        });

    if (!error) {
        return;
    }

    const { error: fallbackError } = await window.supabaseClient
        .from("ranking")
        .insert({
            nome,
            pontos: 0
        });

    if (fallbackError) {
        console.warn("Nao foi possivel criar entrada inicial no ranking:", fallbackError.message);
    }
}
