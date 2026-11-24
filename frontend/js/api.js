
/**
 * Comunicação com o backend
 */

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Envia o token quando o usuário estiver autenticado
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(
            `${window.APP_CONFIG.API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Erro ao comunicar com o servidor.'
            );
        }

        return data;

    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// Disponibiliza a função para os outros arquivos
window.apiRequest = apiRequest;
