import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

const caminhoEnv = fileURLToPath(
    new URL('../.env', import.meta.url)
);

dotenv.config({ path: caminhoEnv });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error(
        'Credenciais do Supabase não configuradas. Verifique backend/.env'
    );
}

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

console.log('Conexão com as credenciais do Supabase configurada!');