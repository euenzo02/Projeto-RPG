
import { supabase } from '../config/supabase.js';

// Cadastro de usuário
export async function cadastrar(req, res) {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                status: 'error',
                message: 'Preencha todos os campos.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'A senha deve ter pelo menos 8 caracteres.'
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password: senha,
            options: {
                data: {
                    nome: nome.trim()
                }
            }
        });

        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Cadastro realizado com sucesso!',
            usuario: {
                id: data.user.id,
                nome: data.user.user_metadata?.nome || nome,
                email: data.user.email
            },
            confirmacao_email_necessaria: !data.session
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Erro interno ao cadastrar usuário.'
        });
    }
}

// Login de usuário
export async function login(req, res) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                status: 'error',
                message: 'Informe seu e-mail e sua senha.'
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: senha
        });

        if (error) {
            return res.status(401).json({
                status: 'error',
                message: 'E-mail ou senha incorretos.'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Login realizado com sucesso!',
            usuario: {
                id: data.user.id,
                email: data.user.email,
                nome: data.user.user_metadata?.nome || data.user.email.split('@')[0]
            },
            sessao: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Erro interno ao realizar login.'
        });
    }
}
