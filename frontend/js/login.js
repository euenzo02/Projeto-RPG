
const loginForm = document.getElementById('loginForm');
const authError = document.getElementById('authError');
const authSuccess = document.getElementById('authSuccess');
const loginButton = document.getElementById('loginButton');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Limpar mensagens anteriores
    authError.style.display = 'none';
    authSuccess.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';

    try {
        await loginUsuario(email, senha);

        authSuccess.textContent = 'Login realizado com sucesso!';
        authSuccess.style.display = 'block';

        // Ir para o painel principal
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);

    } catch (error) {
        authError.textContent = error.message;
        authError.style.display = 'block';

        loginButton.disabled = false;
        loginButton.textContent = 'Entrar na minha conta';
    }
});
