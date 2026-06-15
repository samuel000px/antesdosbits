document
.querySelector("form")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    const { data, error } =
    await supabase.auth.signInWithPassword({

        email,
        password

    });

    if (error) {

        alert("Erro: " + error.message);

        return;
    }

    alert("Login realizado com sucesso!");

    // salva sessão local (opcional mas útil)
    localStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );

    // vai para o jogo
    window.location.href = "index.html";
});

