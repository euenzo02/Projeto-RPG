
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';

export async function autenticar(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Acesso não autorizado. Faça login.'
            });
        }

        const token = authorization.split(' ')[1];

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Sessão inválida ou expirada.'
            });
        }

        req.usuario = data.user;

        console.log('USUÁRIO VALIDADO PELO SUPABASE:', data.user.id);

        // Cliente Supabase que executa consultas respeitando
        // as permissões RLS do usuário autenticado.
        req.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        next();

    } catch (error) {
        console.error('Erro na autenticação:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Erro interno ao verificar autenticação.'
        });
    }
}
