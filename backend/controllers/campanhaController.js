
export async function criarCampanha(req, res) {
    try {
        const { nome, descricao, sistema_id } = req.body;

        // Verifica se o nome foi informado
        if (!nome || !nome.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'O nome da campanha é obrigatório.'
            });
        }

        // Diagnóstico do usuário autenticado
        console.log('DADOS DE AUTENTICAÇÃO:', {
            idUsuario: req.usuario?.id,
            email: req.usuario?.email,
            tokenRecebido: !!req.headers.authorization
        });

        // Verifica a identidade reconhecida pelo Supabase
        const {
            data: diagnostico,
            error: erroDiagnostico
        } = await req.supabase.rpc('diagnosticar_autenticacao');

        console.log('IDENTIDADE RECONHECIDA PELO BANCO:', {
            diagnostico,
            erro: erroDiagnostico
        });

        // Impede a criação se não houver usuário autenticado
        if (!req.usuario?.id) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuário não autenticado.'
            });
        }

        // Cria a campanha
        const { data, error } = await req.supabase
            .from('campanhas')
            .insert({
                nome: nome.trim(),
                descricao: descricao || '',
                sistema_id: sistema_id || null,
                mestre_id: req.usuario.id
            })
            .select()
            .single();

        if (error) throw error;

        console.log('CAMPANHA CRIADA:', data);

        return res.status(201).json({
            status: 'success',
            message: 'Campanha criada com sucesso!',
            campanha: data
        });

    } catch (error) {
        console.error('Erro ao criar campanha:', {
            code: error.code,
            details: error.details,
            hint: error.hint,
            message: error.message
        });

        return res.status(500).json({
            status: 'error',
            message: 'Não foi possível criar a campanha.',
            detalhes: error.message
        });
    }
}


export async function listarCampanhas(req, res) {
    try {
        const { data, error } = await req.supabase
            .from('campanhas')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        return res.status(200).json({
            status: 'success',
            total: data.length,
            campanhas: data
        });

    } catch (error) {
        console.error('Erro ao listar campanhas:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Não foi possível listar as campanhas.'
        });
    }
}


export async function buscarCampanha(req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await req.supabase
            .from('campanhas')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Campanha não encontrada.'
            });
        }

        return res.status(200).json({
            status: 'success',
            campanha: data
        });

    } catch (error) {
        console.error('Erro ao buscar campanha:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Não foi possível buscar a campanha.'
        });
    }
}


export async function atualizarCampanha(req, res) {
    try {
        const { id } = req.params;
        const { nome, descricao, sistema_id, status } = req.body;

        const atualizacao = {};

        if (nome !== undefined) atualizacao.nome = nome.trim();
        if (descricao !== undefined) atualizacao.descricao = descricao;
        if (sistema_id !== undefined) atualizacao.sistema_id = sistema_id;
        if (status !== undefined) atualizacao.status = status;

        if (Object.keys(atualizacao).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Nenhum dado foi enviado para atualização.'
            });
        }

        const { data, error } = await req.supabase
            .from('campanhas')
            .update(atualizacao)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Campanha não encontrada ou sem permissão para atualizar.'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Campanha atualizada com sucesso!',
            campanha: data
        });

    } catch (error) {
        console.error('Erro ao atualizar campanha:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Não foi possível atualizar a campanha.'
        });
    }
}


export async function excluirCampanha(req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await req.supabase
            .from('campanhas')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Campanha não encontrada ou sem permissão para excluir.'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Campanha excluída com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao excluir campanha:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Não foi possível excluir a campanha.'
        });
    }
}
