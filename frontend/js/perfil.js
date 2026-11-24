
const el = id => document.getElementById(id);

function profileMsg(t, type = 'error') {
    const n = el('profileNotice');
    n.textContent = t;
    n.className = 'notice ' + type;
}

function drawProfile(p) {
    const name = p.nome_exibicao || 'Aventureiro';

    el('profileName').value = name;
    el('profileDisplayName').textContent = name;
    el('profileEmail').textContent = p.email || obterUsuario()?.email || '';

    el('profilePhoto').src =
        p.avatar_url || '../assets/images/avatar-placeholder.svg';

    el('profilePhoto').onerror = () => {
        el('profilePhoto').src =
            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2292%22 height=%2292%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 rx=%2246%22 fill=%22%237667f5%22/%3E%3Ctext x=%2250%25%22 y=%2258%25%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2238%22%3E' +
            encodeURIComponent(name.charAt(0).toUpperCase()) +
            '%3C/text%3E%3C/svg%3E';
    };
}

async function initProfile() {
    if (!usuarioAutenticado()) {
        location.href = 'login.html';
        return;
    }

    try {
        const [p, c] = await Promise.all([
            apiRequest('/api/perfil'),
            apiRequest('/api/campanhas')
        ]);

        drawProfile({ ...p.perfil, email: p.email });

        const rows = c.campanhas || [];
        const uid = obterUsuario()?.id;

        el('myCampaigns').innerHTML =
            rows.map(x => `
                <div class="member-row">
                    <div class="member-avatar">⚔</div>
                    <div style="min-width:0">
                        <strong>${x.nome.replace(/[&<>"']/g, c => ({
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            '"': '&quot;',
                            "'": '&#39;'
                        }[c]))}</strong>
                        <div class="character-meta">
                            ${x.mestre_id === uid ? 'Você é o mestre' : 'Você é jogador'} · ${x.status}
                        </div>
                    </div>
                    <a class="btn btn-secondary btn-small"
                       style="margin-left:auto"
                       href="campanha-detalhes.html?id=${encodeURIComponent(x.id)}">
                       Abrir
                    </a>
                </div>
            `).join('') ||
            '<div class="empty-state">Você ainda não participa de campanhas.</div>';

    } catch (e) {
        profileMsg(e.message);
    }
}

el('profileForm').addEventListener('submit', async e => {
    e.preventDefault();

    const btn = el('saveProfile');
    btn.disabled = true;

    try {
        const file = el('profileImage').files[0];
        let result;

        if (file) {
            if (file.size > 1_500_000) {
                throw Error('A imagem deve ter no máximo 1,5 MB.');
            }

            const base64 = await new Promise((resolve, reject) => {
                const r = new FileReader();

                r.onload = () =>
                    resolve(String(r.result).split(',')[1]);

                r.onerror = reject;
                r.readAsDataURL(file);
            });

            result = await apiRequest('/api/perfil/avatar', {
                method: 'POST',
                body: JSON.stringify({
                    base64,
                    mimeType: file.type,
                    nome_exibicao: el('profileName').value.trim()
                })
            });

        } else {
            result = await apiRequest('/api/perfil', {
                method: 'PUT',
                body: JSON.stringify({
                    nome_exibicao: el('profileName').value.trim(),
                    avatar_url: el('profilePhoto').src.includes('avatars/')
                        ? el('profilePhoto').src
                        : ''
                })
            });
        }

        const u = obterUsuario() || {};

        u.nome = el('profileName').value.trim();

        localStorage.setItem('usuario', JSON.stringify(u));

        drawProfile({
            ...result.perfil,
            email: u.email
        });

        profileMsg('Perfil atualizado com sucesso.', 'success');

        el('userName').textContent = u.nome;
        el('userAvatar').textContent = u.nome.charAt(0).toUpperCase();

    } catch (err) {
        profileMsg(err.message);

    } finally {
        btn.disabled = false;
    }
});

initProfile();
