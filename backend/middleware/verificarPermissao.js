
export function verificarPermissao(permissao) {
    return async (req, res, next) => {
        try {
            if (!req.usuario || !req.supabase) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Usuário não autenticado.'
                });
            }

            const { campanhaId } = req.params;

            if (!campanhaId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID da campanha não informado.'
                });
            }

            // Verifica se o usuário é o mestre da campanha.
            const { data: campanha, error } = await req.supabase
                .from('campanhas')
                .select('mestre_id')
                .eq('id', campanhaId)
                .maybeSingle();

            if (error) throw error;

            if (!campanha) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Campanha não encontrada.'
                });
            }

            if (campanha.mestre_id === req.usuario.id) {
                return next();
            }

            // Verifica se o usuário possui a permissão delegada.
            const { data: participante, error: erroParticipante } =
                await req.supabase
                    .from('participantes')
                    .select(permissao)
                    .eq('campanha_id', campanhaId)
                    .eq('usuario_id', req.usuario.id)
                    .maybeSingle();

            if (erroParticipante) throw erroParticipante;

            if (!participante || participante[permissao] !== true) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Você não possui permissão para realizar esta ação.'
                });
            }

            next();

        } catch (error) {
            console.error('Erro ao verificar permissão:', error);

            return res.status(500).json({
                status: 'error',
                message: 'Erro ao verificar permissões.'
            });
        }
    };
}
