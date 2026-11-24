
/**
 * Controle inicial do Dashboard
 */

// Verificar autenticação
if (!usuarioAutenticado()) {
    window.location.href = 'login.html';
}

// Recuperar usuário salvo
const usuario = obterUsuario();

// Exibir nome e avatar
if (usuario) {
    const nomeUsuario = usuario.nome || 'Aventureiro';

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) {
        userName.textContent = nomeUsuario;
    }

    if (userAvatar) {
        userAvatar.textContent = nomeUsuario
            .charAt(0)
            .toUpperCase();
    }
}

// Configurar botão de logout
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        const confirmar = window.confirm(
            'Deseja realmente sair da sua conta?'
        );

        if (confirmar) {
            sairDaConta();
        }
    });
}
