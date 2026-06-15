document
.querySelector("form")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name =
    document.getElementById("name").value;

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    const confirmPassword =
    document.getElementById("confirm-password").value;

    // validação básica
    if (password !== confirmPassword) {

        alert("As senhas não coincidem!");
        return;
    }

    if (password.length < 6) {

        alert("A senha precisa ter pelo menos 6 caracteres!");
        return;
    }

    // cria conta no Supabase
    const { data, error } =
    await supabase.auth.signUp({

        email,
        password,

        options: {
            data: {
                name: name
            }
        }

    });

    if (error) {

        alert("Erro: " + error.message);
        return;
    }

    alert("Conta criada com sucesso!");

    // opcional: já salva usuário local
    localStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );

    // vai para login
    window.location.href = "login.html";
});
