
/**
 * Sistema de autenticação do Projeto RPG
 */

// Realizar login
async function loginUsuario(email, senha) {
    try {
        const resposta = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });

        // Salvar os dados da sessão
        localStorage.setItem(
            'access_token',
            resposta.sessao.access_token
        );

        localStorage.setItem(
            'refresh_token',
            resposta.sessao.refresh_token
        );

        localStorage.setItem(
            'usuario',
            JSON.stringify(resposta.usuario)
        );

        return resposta;

    } catch (error) {
        console.error('Erro ao realizar login:', error);
        throw error;
    }
}

// Realizar cadastro
async function cadastrarUsuario(nome, email, senha) {
    try {
        const resposta = await apiRequest('/api/auth/cadastro', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha })
        });

        return resposta;

    } catch (error) {
        console.error('Erro ao realizar cadastro:', error);
        throw error;
    }
}

// Verificar se existe uma sessão salva
function usuarioAutenticado() {
    return Boolean(localStorage.getItem('access_token'));
}

// Recuperar os dados do usuário
function obterUsuario() {
    const usuario = localStorage.getItem('usuario');

    return usuario ? JSON.parse(usuario) : null;
}

// Encerrar sessão
function sairDaConta() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');

    window.location.href = 'login.html';
}

// Disponibilizar funções para outros arquivos
window.loginUsuario = loginUsuario;
window.cadastrarUsuario = cadastrarUsuario;
window.usuarioAutenticado = usuarioAutenticado;
window.obterUsuario = obterUsuario;
window.sairDaConta = sairDaConta;
