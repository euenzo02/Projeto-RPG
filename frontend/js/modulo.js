const DEFINICOES_MODULO = {
 personagens:{tabela:'personagens',titulo:'personagem',campos:[['nome','Nome','text',true],['conceito','Conceito / espécie','text'],['classe','Classe','text'],['nivel','Nível','number'],['historia','História','textarea']]},
 mapas:{tabela:'mapas',titulo:'local',campos:[['nome','Nome do local','text',true],['tipo','Tipo','text'],['descricao','Descrição','textarea'],['imagem_url','URL da imagem','url']]},
 missoes:{tabela:'missoes',titulo:'missão',campos:[['titulo','Título','text',true],['status','Status','select'],['descricao','Descrição','textarea'],['recompensa','Recompensa','text'],['prazo','Prazo','date']]},
 sessoes:{tabela:'sessoes',titulo:'sessão',campos:[['titulo','Título','text',true],['data_sessao','Data e horário','datetime-local'],['numero','Número','number'],['resumo','Resumo','textarea']]},
 inventario:{tabela:'itens',titulo:'item',campos:[['nome','Nome','text',true],['categoria','Categoria','text'],['quantidade','Quantidade','number'],['portador','Portador','text'],['descricao','Descrição','textarea']]},
 anotacoes:{tabela:'anotacoes',titulo:'anotação',campos:[['titulo','Título','text',true],['conteudo','Conteúdo','textarea']]}
};
let registros=[], registroEditando=null, definicaoAtual=null;
const $=id=>document.getElementById(id);
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function aviso(texto,tipo='error'){const el=$('avisoModulo');el.textContent=texto;el.className=`notice ${tipo}`;}
async function iniciarModulo(chave){
 if(!usuarioAutenticado()){location.href='login.html';return;}
 definicaoAtual=DEFINICOES_MODULO[chave];
 $('novoRegistroBtn').addEventListener('click',()=>abrirModal());
 $('cancelarModal').addEventListener('click',fecharModal);
 $('modalRegistro').addEventListener('click',e=>{if(e.target===$('modalRegistro'))fecharModal();});
 $('buscarRegistro').addEventListener('input',renderizarRegistros);
 $('campanhaSelect').addEventListener('change',carregarRegistros);
 $('registroForm').addEventListener('submit',salvarRegistro);
 try{
  const r=await apiRequest('/campanhas');
  const campanhas=r.campanhas||[];
  $('campanhaSelect').innerHTML='<option value="">Selecione uma campanha</option>'+campanhas.map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
  const ultima=sessionStorage.getItem('campanha_atual');
  if(ultima && campanhas.some(c=>c.id===ultima)) $('campanhaSelect').value=ultima;
  else if(campanhas.length===1) $('campanhaSelect').value=campanhas[0].id;
  if($('campanhaSelect').value) carregarRegistros();
  else if(!campanhas.length) $('listaRegistros').innerHTML='<div class="empty-state">Você ainda não participa de campanhas. Crie ou entre em uma campanha primeiro.</div>';
 }catch(e){aviso(e.message);}
}
async function carregarRegistros(){
 const campanhaId=$('campanhaSelect').value;
 if(!campanhaId){$('listaRegistros').innerHTML='<div class="empty-state">Selecione uma campanha.</div>';return;}
 sessionStorage.setItem('campanha_atual',campanhaId);
 $('listaRegistros').innerHTML='<div class="empty-state">Carregando registros...</div>';
 try{const r=await apiRequest(`/recursos/${definicaoAtual.tabela}?campanha_id=${encodeURIComponent(campanhaId)}`);registros=r.dados||[];renderizarRegistros();}
 catch(e){aviso(e.message);$('listaRegistros').innerHTML='<div class="empty-state">Não foi possível carregar os dados.</div>';}
}
function renderizarRegistros(){
 const termo=$('buscarRegistro').value.toLowerCase();
 const filtrados=registros.filter(r=>JSON.stringify(r).toLowerCase().includes(termo));
 if(!filtrados.length){$('listaRegistros').innerHTML='<div class="empty-state">Nenhum registro encontrado. Use “Novo registro” para adicionar o primeiro.</div>';return;}
 $('listaRegistros').innerHTML=filtrados.map(r=>{
  const titulo=r.nome||r.titulo||'Registro';
  const resumo=r.descricao||r.conceito||r.historia||r.resumo||r.conteudo||r.recompensa||r.tipo||'Sem descrição adicional.';
  const status=r.status?`<span class="badge badge-primary">${esc(r.status.replace('_',' '))}</span>`:'';
  const imagem=r.imagem_url?`<img src="${esc(r.imagem_url)}" alt="" style="width:100%;height:130px;object-fit:cover;border-radius:9px;margin-bottom:12px" onerror="this.remove()">`:'';
  return `<article class="record-card">${imagem}${status}<h3>${esc(titulo)}</h3><p>${esc(resumo)}</p><div class="record-actions"><button class="btn btn-secondary btn-small" data-edit="${esc(r.id)}">Editar</button><button class="btn btn-secondary btn-small" data-delete="${esc(r.id)}">Excluir</button></div></article>`;
 }).join('');
 $('listaRegistros').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>abrirModal(registros.find(r=>r.id===b.dataset.edit))));
 $('listaRegistros').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>excluirRegistro(b.dataset.delete)));
}
function abrirModal(registro=null){
 registroEditando=registro;
 $('tituloModal').textContent=registro?`Editar ${definicaoAtual.titulo}`:`Novo ${definicaoAtual.titulo}`;
 $('camposFormulario').innerHTML=definicaoAtual.campos.map(([key,label,type,required])=>{
  const value=registro?.[key]??(key==='nivel'?1:key==='quantidade'?1:key==='status'?'pendente':'');
  if(type==='textarea')return `<div class="form-group"><label for="f_${key}">${label}</label><textarea id="f_${key}" name="${key}">${esc(value)}</textarea></div>`;
  if(type==='select')return `<div class="form-group"><label for="f_${key}">${label}</label><select id="f_${key}" name="${key}"><option value="pendente" ${value==='pendente'?'selected':''}>Pendente</option><option value="em_andamento" ${value==='em_andamento'?'selected':''}>Em andamento</option><option value="concluida" ${value==='concluida'?'selected':''}>Concluída</option></select></div>`;
  return `<div class="form-group"><label for="f_${key}">${label}</label><input id="f_${key}" name="${key}" type="${type}" value="${esc(value)}" ${required?'required':''} ${type==='number'?'min="0"':''}></div>`;
 }).join('');
 $('modalRegistro').classList.add('open');
}
function fecharModal(){$('modalRegistro').classList.remove('open');registroEditando=null;}
async function salvarRegistro(e){
 e.preventDefault();const campanha_id=$('campanhaSelect').value;
 if(!campanha_id){aviso('Selecione uma campanha antes de salvar.');return;}
 const dados={campanha_id};
 definicaoAtual.campos.forEach(([key,,type])=>{const el=$(`f_${key}`);let v=el.value;if(type==='number')v=Number(v);if(type==='datetime-local'&&v)v=new Date(v).toISOString();dados[key]=v;});
 const botao=$('salvarRegistro');botao.disabled=true;botao.textContent='Salvando...';
 try{const url=registroEditando?`/recursos/${definicaoAtual.tabela}/${registroEditando.id}`:`/recursos/${definicaoAtual.tabela}`;
  await apiRequest(url,{method:registroEditando?'PUT':'POST',body:JSON.stringify(dados)});
  fecharModal();aviso('Registro salvo com sucesso.','success');await carregarRegistros();
 }catch(e){aviso(e.message);}finally{botao.disabled=false;botao.textContent='Salvar registro';}
}
async function excluirRegistro(id){if(!confirm('Deseja excluir este registro?'))return;try{await apiRequest(`/recursos/${definicaoAtual.tabela}/${id}`,{method:'DELETE'});aviso('Registro excluído.','success');await carregarRegistros();}catch(e){aviso(e.message);}}
window.iniciarModulo=iniciarModulo;
