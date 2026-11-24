import express from 'express';
import { autenticar } from '../middleware/autenticar.js';
const router = express.Router();
router.use(autenticar);

router.get('/', async (req,res) => {
  const {data,error}=await req.supabase.from('perfis').select('*').eq('usuario_id',req.usuario.id).maybeSingle();
  if(error) return res.status(400).json({message:error.message});
  res.json({perfil:data || {usuario_id:req.usuario.id,nome_exibicao:req.usuario.user_metadata?.nome || 'Aventureiro',avatar_url:''},email:req.usuario.email});
});

router.put('/', async (req,res) => {
  const nome=String(req.body.nome_exibicao || '').trim();
  const avatar=String(req.body.avatar_url || '').trim();
  if(!nome) return res.status(400).json({message:'Informe seu nome de exibição.'});
  if(nome.length>80) return res.status(400).json({message:'O nome deve ter no máximo 80 caracteres.'});
  const {data,error}=await req.supabase.from('perfis').upsert({
    usuario_id:req.usuario.id,nome_exibicao:nome,avatar_url:avatar,atualizado_em:new Date().toISOString()
  },{onConflict:'usuario_id'}).select().single();
  if(error) return res.status(400).json({message:error.message});
  res.json({message:'Perfil atualizado com sucesso.',perfil:data});
});

router.post('/avatar', async (req,res) => {
  try {
    const { base64, mimeType } = req.body || {};
    if (!base64 || !['image/png','image/jpeg','image/webp'].includes(mimeType)) {
      return res.status(400).json({message:'Envie uma imagem PNG, JPG ou WEBP.'});
    }
    const buffer=Buffer.from(base64,'base64');
    if(buffer.length>1_500_000) return res.status(413).json({message:'A imagem deve ter no máximo 1,5 MB.'});
    const ext=mimeType==='image/png'?'png':mimeType==='image/webp'?'webp':'jpg';
    const path=`${req.usuario.id}/avatar.${ext}`;
    const {error:uploadError}=await req.supabase.storage.from('avatars').upload(path,buffer,{contentType:mimeType,upsert:true});
    if(uploadError) return res.status(400).json({message:uploadError.message});
    const {data:publicData}=req.supabase.storage.from('avatars').getPublicUrl(path);
    const {data,error}=await req.supabase.from('perfis').upsert({
      usuario_id:req.usuario.id,
      nome_exibicao:req.body.nome_exibicao || req.usuario.user_metadata?.nome || 'Aventureiro',
      avatar_url:publicData.publicUrl,
      atualizado_em:new Date().toISOString()
    },{onConflict:'usuario_id'}).select().single();
    if(error) return res.status(400).json({message:error.message});
    res.json({message:'Foto de perfil atualizada.',perfil:data});
  } catch(e) { res.status(500).json({message:'Não foi possível enviar a imagem.'}); }
});

export default router;
