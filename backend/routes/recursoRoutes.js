import express from 'express';
import { autenticar } from '../middleware/autenticar.js';

const router = express.Router();
router.use(autenticar);

const tabelas = {
  personagens: 'personagens', mapas: 'mapas', missoes: 'missoes',
  sessoes: 'sessoes', itens: 'itens', anotacoes: 'anotacoes'
};
const camposPermitidos = {
  personagens: ['campanha_id','nome','conceito','classe','nivel','historia','hp_atual','hp_maximo','defesa','condicoes'],
  mapas: ['campanha_id','nome','descricao','imagem_url','tipo'],
  missoes: ['campanha_id','titulo','descricao','status','recompensa','prazo'],
  sessoes: ['campanha_id','titulo','resumo','data_sessao','numero'],
  itens: ['campanha_id','dono_id','nome','descricao','categoria','quantidade','equipado'],
  anotacoes: ['campanha_id','titulo','conteudo','privada']
};
const filtrar = (tipo, body) => Object.fromEntries(
  Object.entries(body || {}).filter(([k]) => camposPermitidos[tipo].includes(k))
);

// HP de outros personagens e devolvido como null pela funcao SQL conforme o papel do usuario.
router.get('/personagens-seguros/:campanhaId', async (req, res) => {
  const { data, error } = await req.supabase.rpc('listar_personagens_campanha', { p_campanha: req.params.campanhaId });
  if (error) return res.status(400).json({ message: error.message });
  res.json({ dados: data || [] });
});

router.get('/:tipo', async (req,res) => {
  const tipo=req.params.tipo, tabela=tabelas[tipo];
  if(!tabela) return res.status(404).json({message:'Módulo não encontrado.'});
  if(tipo==='personagens'){
    if(!req.query.campanha_id) return res.status(400).json({message:'Informe a campanha para listar personagens.'});
    const {data,error}=await req.supabase.rpc('listar_personagens_campanha',{p_campanha:req.query.campanha_id});
    if(error) return res.status(400).json({message:error.message});
    return res.json({dados:data||[]});
  }
  let q=req.supabase.from(tabela).select('*').order('criado_em',{ascending:false});
  if(req.query.campanha_id) q=q.eq('campanha_id',req.query.campanha_id);
  const {data,error}=await q;
  if(error) return res.status(400).json({message:error.message});
  res.json({dados:data || []});
});

router.post('/:tipo', async (req,res) => {
  const tipo=req.params.tipo, tabela=tabelas[tipo];
  if(!tabela) return res.status(404).json({message:'Módulo não encontrado.'});
  const dados=filtrar(tipo,req.body);
  if(!dados.campanha_id) return res.status(400).json({message:'Selecione uma campanha.'});
  if(tipo==='personagens' || tipo==='anotacoes') dados.usuario_id=req.usuario.id;
  if(tipo==='itens' && !dados.dono_id) dados.dono_id=req.usuario.id;
  const {data,error}=await req.supabase.from(tabela).insert(dados).select(tipo==='personagens'?'id,campanha_id,usuario_id,nome,conceito,classe,nivel,historia,criado_em':'*').single();
  if(error) return res.status(400).json({message:error.message});
  res.status(201).json({message:'Registro criado com sucesso.',registro:data});
});

router.put('/:tipo/:id', async (req,res) => {
  const tipo=req.params.tipo,tabela=tabelas[tipo];
  if(!tabela) return res.status(404).json({message:'Módulo não encontrado.'});
  const dados=filtrar(tipo,req.body);
  delete dados.campanha_id;
  delete dados.usuario_id;
  if(tipo==='itens' && !dados.dono_id) delete dados.dono_id;
  const {data,error}=await req.supabase.from(tabela).update(dados).eq('id',req.params.id).select(tipo==='personagens'?'id,campanha_id,usuario_id,nome,conceito,classe,nivel,historia,criado_em':'*').maybeSingle();
  if(error) return res.status(400).json({message:error.message});
  if(!data) return res.status(404).json({message:'Registro não encontrado ou sem permissão.'});
  res.json({message:'Registro atualizado.',registro:data});
});

router.delete('/:tipo/:id', async (req,res) => {
  const tipo=req.params.tipo,tabela=tabelas[tipo];
  if(!tabela) return res.status(404).json({message:'Módulo não encontrado.'});
  const {data,error}=await req.supabase.from(tabela).delete().eq('id',req.params.id).select(tipo==='personagens'?'id,campanha_id,usuario_id,nome':'*').maybeSingle();
  if(error) return res.status(400).json({message:error.message});
  if(!data) return res.status(404).json({message:'Registro não encontrado ou sem permissão.'});
  res.json({message:'Registro excluído.'});
});
export default router;
