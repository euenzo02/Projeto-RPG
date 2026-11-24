import express from 'express';
import { autenticar } from '../middleware/autenticar.js';
const router=express.Router();

router.post('/entrar',autenticar,async(req,res)=>{
 const {codigo}=req.body||{};
 if(!codigo) return res.status(400).json({message:'Informe o código de convite.'});
 const {data,error}=await req.supabase.rpc('entrar_campanha',{p_codigo:codigo});
 if(error) return res.status(400).json({message:error.message});
 res.json({message:'Você entrou na campanha!',campanha_id:data});
});

router.get('/:campanhaId',autenticar,async(req,res)=>{
 const {data,error}=await req.supabase.from('participantes').select('id,usuario_id,papel,pode_gerenciar,entrou_em').eq('campanha_id',req.params.campanhaId);
 if(error) return res.status(400).json({message:error.message});
 const {data:campanha,error:campanhaError}=await req.supabase.from('campanhas').select('mestre_id').eq('id',req.params.campanhaId).single();
 if(campanhaError) return res.status(400).json({message:campanhaError.message});
 const ids=[campanha.mestre_id,...(data||[]).map(p=>p.usuario_id)];
 const {data:perfis,error:perfilError}=ids.length
  ? await req.supabase.from('perfis').select('usuario_id,nome_exibicao,avatar_url').in('usuario_id',ids)
  : {data:[],error:null};
 if(perfilError) return res.status(400).json({message:perfilError.message});
 const mapa=new Map((perfis||[]).map(p=>[p.usuario_id,p]));
 res.json({
  mestre:mapa.get(campanha.mestre_id)||null,
  participantes:(data||[]).map(p=>({...p,perfil:mapa.get(p.usuario_id)||null}))
 });
});
export default router;
