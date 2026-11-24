import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { supabase } from './config/supabase.js';
import authRoutes from './routes/authRoutes.js';
import campanhaRoutes from './routes/campanhaRoutes.js';
import recursoRoutes from './routes/recursoRoutes.js';
import sistemasRoutes from './routes/sistemasRoutes.js';
import participanteRoutes from './routes/participanteRoutes.js';
import perfilRoutes from './routes/perfilRoutes.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });
const app=express();
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:(process.env.FRONTEND_URL||'http://localhost:5500,http://127.0.0.1:5500').split(',').map(x=>x.trim())}));
app.use(express.json({limit:'3mb'}));
app.use('/api/auth',authRoutes);
app.use('/api/campanhas',campanhaRoutes);
app.use('/api/recursos',recursoRoutes);
app.use('/api/sistemas',sistemasRoutes);
app.use('/api/participantes',participanteRoutes);
app.use('/api/perfil',perfilRoutes);
app.get('/',(req,res)=>res.json({status:'success',message:'API do Projeto RPG está funcionando.'}));
app.get('/api/health',async(req,res)=>{
 try {
  const {error}=await supabase.from('sistemas').select('id').limit(1);
  if(error) throw error;
  res.json({status:'success',message:'Servidor e Supabase conectados!'});
 } catch(error) {
  console.error('Health check:',error.message);
  res.status(500).json({status:'error',message:'API ativa, mas não foi possível consultar o Supabase. Confira schema.sql, policies.sql e as credenciais.'});
 }
});
app.use((err,req,res,next)=>{
 console.error(err);
 res.status(500).json({message:'Erro interno do servidor.'});
});
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Servidor iniciado em http://localhost:${PORT}`));
