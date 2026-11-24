
const cadastroForm = document.getElementById('cadastroForm');
const authError = document.getElementById('authError');
const authSuccess = document.getElementById('authSuccess');
const cadastroButton = document.getElementById('cadastroButton');

cadastroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    authError.style.display = 'none';
    authSuccess.style.display = 'none';

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    // Verificar se as senhas são iguais
    if (senha !== confirmarSenha) {
        authError.textContent = 'As senhas não coincidem.';
        authError.style.display = 'block';
        return;
    }

    if (senha.length < 8) {
        authError.textContent = 'A senha precisa ter pelo menos 8 caracteres.';
        authError.style.display = 'block';
        return;
    }

    cadastroButton.disabled = true;
    cadastroButton.textContent = 'Criando conta...';

    try {
        const resposta = await cadastrarUsuario(nome, email, senha);

        authSuccess.textContent = resposta.confirmacao_email_necessaria
            ? 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
            : 'Conta criada com sucesso! Você já pode fazer login.';

        authSuccess.style.display = 'block';

        cadastroForm.reset();

        cadastroButton.textContent = 'Cadastro concluído';

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (error) {
        authError.textContent = error.message;
        authError.style.display = 'block';

        cadastroButton.disabled = false;
        cadastroButton.textContent = 'Criar minha conta';
    }
});
