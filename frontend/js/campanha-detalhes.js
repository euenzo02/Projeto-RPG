const $ = id => document.getElementById(id);
const campaignId = new URLSearchParams(location.search).get('id');
const me = obterUsuario() || {};
let campaign=null, isGM=false, members=[], characterRows=[], currentForm=null;

function safe(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function notice(message,type='error'){const n=$('campaignNotice');n.textContent=message;n.className='notice '+type;}
function fmtDate(v){return v?new Date(v).toLocaleDateString('pt-BR'):'Sem data';}
function setTab(tab){
 document.querySelectorAll('.campaign-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+tab));
 if(tab==='personagens') loadCharacters();
 if(tab==='inventario') loadInventory();
 if(tab==='anotacoes') loadNotes();
 if(tab==='sessoes') loadResource('sessoes','sessionsGrid');
 if(tab==='mapas') loadResource('mapas','mapsGrid');
 if(tab==='missoes') loadResource('missoes','missionsGrid');
 if(tab==='jogadores') loadPlayers();
}
async function loadCampaign(){
 if(!usuarioAutenticado()){location.href='login.html';return;}
 if(!campaignId){location.href='campanhas.html';return;}
 try{
  const r=await apiRequest('/campanhas/'+campaignId); campaign=r.campanha;
  isGM=campaign.mestre_id===me.id;
  $('campaignName').textContent=campaign.nome;$('topCampaignName').textContent=campaign.nome;
  $('campaignDescription').textContent=campaign.descricao||'Uma nova aventura começa aqui.';
  $('campaignRole').textContent=isGM?'Você é o mestre desta campanha.':'Você participa como jogador.';
  $('userRole').textContent=isGM?'Mestre':'Jogador';
  $('inviteCode').textContent=isGM?(campaign.codigo_convite||'—'):'Código disponível apenas para o mestre';
  $('copyInvite').style.display=isGM?'inline-flex':'none';
  $('inviteHelp').textContent=isGM?'Compartilhe este código com seus jogadores.':'O código de convite é visível apenas para o mestre.';
  document.querySelectorAll('.gm-only').forEach(b=>b.style.display=isGM?'inline-flex':'none');
  $('newCharacter').style.display='inline-flex';
  const sr=await apiRequest('/sistemas');
  const system=(sr.sistemas||[]).find(s=>String(s.id)===String(campaign.sistema_id));
  $('campaignSystem').textContent=system?.nome||'Sistema não definido';
  const pr=await apiRequest('/participantes/'+campaignId);members=pr.participantes||[];
  isGM=isGM || members.some(m=>m.usuario_id===me.id && m.pode_gerenciar===true);
  $('campaignRole').textContent=isGM?'Você pode gerenciar esta campanha.':'Você participa como jogador.';
  $('userRole').textContent=isGM?'Mestre':'Jogador';
  document.querySelectorAll('.gm-only').forEach(b=>b.style.display=isGM?'inline-flex':'none');
  $('statPlayers').textContent=members.length+1;
  const [chars,sessions,missions]=await Promise.all([
    apiRequest('/recursos/personagens-seguros/'+campaignId),
    apiRequest('/recursos/sessoes?campanha_id='+campaignId),
    apiRequest('/recursos/missoes?campanha_id='+campaignId)
  ]);
  $('statCharacters').textContent=(chars.dados||[]).length;
  $('statSessions').textContent=(sessions.dados||[]).length;
  $('statMissions').textContent=(missions.dados||[]).length;
  setTab('visao');
 }catch(e){notice(e.message);}
}
async function loadCharacters(){
 try{
  const r=await apiRequest('/recursos/personagens-seguros/'+campaignId);characterRows=r.dados||[];
  $('charactersGrid').innerHTML=characterRows.map(p=>{
   const showHP=p.hp_atual!==null && p.hp_maximo!==null;
   const pct=showHP?Math.max(0,Math.min(100,p.hp_atual/p.hp_maximo*100)):0;
   const canEdit=isGM||p.eh_meu;
   return `<article class="character-card"><div class="character-top"><div><h3>${safe(p.nome)}</h3><p class="character-meta">${safe(p.conceito||'Personagem')} · ${safe(p.classe||'Sem classe')} · Nível ${p.nivel}</p></div>${p.eh_meu?'<span class="badge badge-primary">Seu personagem</span>':''}</div>
   ${showHP?`<div style="margin-top:18px"><div class="inline-controls" style="justify-content:space-between"><strong>Vida</strong><span class="character-meta">${p.hp_atual} / ${p.hp_maximo} PV</span></div><div class="hp-track"><div class="hp-fill ${pct<30?'low':''}" style="width:${pct}%"></div></div>${canEdit?`<div class="inline-controls"><label class="character-meta">PV atual <input type="number" min="0" max="${p.hp_maximo}" id="hp-${p.id}" value="${p.hp_atual}"></label><button class="btn btn-secondary btn-small" data-hp="${p.id}">Atualizar vida</button></div>`:''}</div>`:'<p class="muted-note" style="margin-top:18px">Pontos de vida ocultos para os demais jogadores.</p>'}
   ${p.historia?`<p style="margin-top:12px">${safe(p.historia)}</p>`:''}
   ${canEdit?`<div class="record-actions"><button class="btn btn-secondary btn-small" data-edit-char="${p.id}">Editar ficha</button>${isGM?`<button class="btn btn-secondary btn-small" data-del-char="${p.id}">Excluir</button>`:''}</div>`:''}</article>`;
  }).join('')||'<div class="empty-state">Nenhum personagem cadastrado. Crie o primeiro!</div>';
  document.querySelectorAll('[data-hp]').forEach(b=>b.onclick=()=>updateHP(b.dataset.hp));
  document.querySelectorAll('[data-edit-char]').forEach(b=>b.onclick=()=>characterForm(characterRows.find(p=>p.id===b.dataset.editChar)));
  document.querySelectorAll('[data-del-char]').forEach(b=>b.onclick=()=>deleteRecord('personagens',b.dataset.delChar,loadCharacters));
 }catch(e){notice(e.message);}
}
async function updateHP(id){
 const p=characterRows.find(x=>x.id===id);const value=Number($('hp-'+id).value);
 if(!Number.isInteger(value)||value<0||value>p.hp_maximo){notice('Informe um valor de vida entre 0 e '+p.hp_maximo+'.');return;}
 try{await apiRequest('/recursos/personagens/'+id,{method:'PUT',body:JSON.stringify({hp_atual:value})});notice('Pontos de vida atualizados.','success');loadCharacters();}
 catch(e){notice(e.message);}
}
function openForm(title,fields,submit){
 currentForm=submit;$('modalTitle').textContent=title;
 $('recordFields').innerHTML=fields.map(f=>{
  const value=f.value??'';
  if(f.type==='textarea')return `<div class="form-group"><label>${f.label}</label><textarea name="${f.name}" ${f.required?'required':''}>${safe(value)}</textarea></div>`;
  if(f.type==='select')return `<div class="form-group"><label>${f.label}</label><select name="${f.name}">${f.options.map(o=>`<option value="${safe(o[0])}" ${String(value)===String(o[0])?'selected':''}>${safe(o[1])}</option>`).join('')}</select></div>`;
  return `<div class="form-group"><label>${f.label}</label><input name="${f.name}" type="${f.type||'text'}" value="${safe(value)}" ${f.required?'required':''} ${f.min!==undefined?`min="${f.min}"`:''} ${f.max!==undefined?`max="${f.max}"`:''}></div>`;
 }).join('');
 $('recordModal').classList.add('open');
}
function closeForm(){$('recordModal').classList.remove('open');currentForm=null;}
$('cancelRecord').onclick=closeForm;
$('recordModal').onclick=e=>{if(e.target===$('recordModal'))closeForm();};
$('recordForm').onsubmit=async e=>{
 e.preventDefault();if(!currentForm)return;
 const fd=new FormData(e.target),data=Object.fromEntries(fd.entries());
 try{await currentForm(data);closeForm();}
 catch(err){notice(err.message);}
};
function characterForm(p=null){
 openForm(p?'Editar personagem':'Criar personagem',[
  {name:'nome',label:'Nome do personagem',required:true,value:p?.nome},
  {name:'conceito',label:'Conceito / espécie',value:p?.conceito},
  {name:'classe',label:'Classe',value:p?.classe},
  {name:'nivel',label:'Nível',type:'number',min:1,value:p?.nivel||1},
  {name:'hp_maximo',label:'Vida máxima (PV)',type:'number',min:1,value:p?.hp_maximo??10},
  {name:'hp_atual',label:'Vida atual (PV)',type:'number',min:0,value:p?.hp_atual??10},
  {name:'defesa',label:'Defesa',type:'number',value:p?.defesa??10},
  {name:'historia',label:'História / descrição',type:'textarea',value:p?.historia}
 ],async d=>{
  d.nivel=Number(d.nivel);d.hp_maximo=Number(d.hp_maximo);d.hp_atual=Number(d.hp_atual);d.defesa=Number(d.defesa);
  if(d.hp_atual>d.hp_maximo)throw Error('A vida atual não pode superar a vida máxima.');
  const url=p?'/recursos/personagens/'+p.id:'/recursos/personagens';
  await apiRequest(url,{method:p?'PUT':'POST',body:JSON.stringify({...d,campanha_id:campaignId})});
  notice('Ficha salva com sucesso.','success');await loadCharacters();
 });
}
$('newCharacter').onclick=()=>characterForm();
async function deleteRecord(type,id,refresh){if(!confirm('Excluir este registro?'))return;try{await apiRequest('/recursos/'+type+'/'+id,{method:'DELETE'});notice('Registro excluído.','success');await refresh();}catch(e){notice(e.message);}}

async function loadInventory(){
 try{
  const [r,profiles]=await Promise.all([
   apiRequest('/recursos/itens?campanha_id='+campaignId),
   apiRequest('/participantes/'+campaignId)
  ]);
  const owners=new Map((profiles.participantes||[]).map(m=>[m.usuario_id,m.perfil?.nome_exibicao||'Jogador']));
  $('inventoryGrid').innerHTML=(r.dados||[]).map(i=>`<article class="record-card"><span class="badge badge-primary">${safe(i.categoria||'Geral')}</span><h3 style="margin-top:10px">${safe(i.nome)}</h3><p>${safe(i.descricao||'Sem descrição.')}</p><p class="character-meta">Quantidade: ${i.quantidade} · ${i.equipado?'Equipado':'Guardado'}</p><p class="character-meta">Portador: ${safe(owners.get(i.dono_id)|| (i.dono_id===me.id?'Você':'Integrante'))}</p><div class="record-actions"><button class="btn btn-secondary btn-small" data-edit-item="${i.id}">Editar</button><button class="btn btn-secondary btn-small" data-del-item="${i.id}">Excluir</button></div></article>`).join('')||'<div class="empty-state">Seu inventário ainda está vazio.</div>';
  document.querySelectorAll('[data-edit-item]').forEach(b=>b.onclick=()=>itemForm((r.dados||[]).find(i=>i.id===b.dataset.editItem)));
  document.querySelectorAll('[data-del-item]').forEach(b=>b.onclick=()=>deleteRecord('itens',b.dataset.delItem,loadInventory));
 }catch(e){notice(e.message);}
}
function itemForm(item=null){
 const ownerOptions=isGM
  ? Array.from(new Map([[campaign.mestre_id,'Mestre'],[me.id,'Meu inventário'],...members.map(m=>[m.usuario_id,m.perfil?.nome_exibicao||'Jogador'])]).entries()).map(([id,nome])=>[id,nome])
  : [[me.id,'Meu inventário']];
 openForm(item?'Editar item':'Adicionar item',[
  {name:'nome',label:'Nome do item',required:true,value:item?.nome},
  {name:'categoria',label:'Categoria',value:item?.categoria||'Geral'},
  {name:'quantidade',label:'Quantidade',type:'number',min:0,value:item?.quantidade??1},
  {name:'dono_id',label:'Pertence a',type:'select',value:item?.dono_id||me.id,options:ownerOptions},
  {name:'equipado',label:'Estado',type:'select',value:String(item?.equipado??false),options:[['false','Guardado'],['true','Equipado']]},
  {name:'descricao',label:'Descrição',type:'textarea',value:item?.descricao}
 ],async d=>{
  d.quantidade=Number(d.quantidade);d.equipado=d.equipado==='true';
  if(!isGM)d.dono_id=me.id;
  await apiRequest(item?'/recursos/itens/'+item.id:'/recursos/itens',{method:item?'PUT':'POST',body:JSON.stringify({...d,campanha_id:campaignId})});
  notice('Inventário atualizado.','success');await loadInventory();
 });
}
$('newItem').onclick=()=>itemForm();

async function loadNotes(){
 try{
  const r=await apiRequest('/recursos/anotacoes?campanha_id='+campaignId);
  $('notesGrid').innerHTML=(r.dados||[]).map(n=>`<article class="record-card"><span class="badge badge-primary">Privada</span><h3 style="margin-top:10px">${safe(n.titulo)}</h3><p>${safe(n.conteudo)}</p><div class="record-actions"><button class="btn btn-secondary btn-small" data-edit-note="${n.id}">Editar</button><button class="btn btn-secondary btn-small" data-del-note="${n.id}">Excluir</button></div></article>`).join('')||'<div class="empty-state">Nenhuma anotação. Suas anotações são privadas.</div>';
  document.querySelectorAll('[data-edit-note]').forEach(b=>b.onclick=()=>noteForm((r.dados||[]).find(n=>n.id===b.dataset.editNote)));
  document.querySelectorAll('[data-del-note]').forEach(b=>b.onclick=()=>deleteRecord('anotacoes',b.dataset.delNote,loadNotes));
 }catch(e){notice(e.message);}
}
function noteForm(n=null){openForm(n?'Editar anotação':'Nova anotação',[
 {name:'titulo',label:'Título',required:true,value:n?.titulo},
 {name:'conteudo',label:'Anotação',type:'textarea',value:n?.conteudo}
 ],async d=>{await apiRequest(n?'/recursos/anotacoes/'+n.id:'/recursos/anotacoes',{method:n?'PUT':'POST',body:JSON.stringify({...d,campanha_id:campaignId,privada:true})});notice('Anotação salva.','success');await loadNotes();});}
$('newNote').onclick=()=>noteForm();

const resourceMeta={
 sessoes:{grid:'sessionsGrid',title:'sessão',fields:p=>[{name:'titulo',label:'Título',required:true,value:p?.titulo},{name:'numero',label:'Número',type:'number',value:p?.numero},{name:'data_sessao',label:'Data e horário',type:'datetime-local',value:p?.data_sessao?new Date(p.data_sessao).toISOString().slice(0,16):''},{name:'resumo',label:'Resumo da sessão',type:'textarea',value:p?.resumo}]},
 mapas:{grid:'mapsGrid',title:'local',fields:p=>[{name:'nome',label:'Nome do local',required:true,value:p?.nome},{name:'tipo',label:'Tipo',value:p?.tipo||'Local'},{name:'imagem_url',label:'URL da imagem',type:'url',value:p?.imagem_url},{name:'descricao',label:'Descrição',type:'textarea',value:p?.descricao}]},
 missoes:{grid:'missionsGrid',title:'missão',fields:p=>[{name:'titulo',label:'Título',required:true,value:p?.titulo},{name:'status',label:'Status',type:'select',value:p?.status||'pendente',options:[['pendente','Pendente'],['em_andamento','Em andamento'],['concluida','Concluída']]},{name:'prazo',label:'Prazo',type:'date',value:p?.prazo},{name:'recompensa',label:'Recompensa',value:p?.recompensa},{name:'descricao',label:'Descrição',type:'textarea',value:p?.descricao}]}
};
async function loadResource(type,grid){
 try{
  const r=await apiRequest('/recursos/'+type+'?campanha_id='+campaignId),rows=r.dados||[],meta=resourceMeta[type];
  $(grid).innerHTML=rows.map(x=>`<article class="record-card"><h3>${safe(x.titulo||x.nome)}</h3>${type==='missoes'?`<span class="badge badge-primary">${safe(x.status)}</span>`:''}<p style="margin-top:9px">${safe(x.resumo||x.descricao||x.recompensa||'')}</p>${x.data_sessao?`<p class="character-meta">${fmtDate(x.data_sessao)}</p>`:''}${isGM?`<div class="record-actions"><button class="btn btn-secondary btn-small" data-edit-resource="${x.id}">Editar</button><button class="btn btn-secondary btn-small" data-del-resource="${x.id}">Excluir</button></div>`:''}</article>`).join('')||'<div class="empty-state">Nenhum registro por aqui ainda.</div>';
  document.querySelectorAll('[data-edit-resource]').forEach(b=>b.onclick=()=>resourceForm(type,rows.find(x=>x.id===b.dataset.editResource)));
  document.querySelectorAll('[data-del-resource]').forEach(b=>b.onclick=()=>deleteRecord(type,b.dataset.delResource,()=>loadResource(type,grid)));
 }catch(e){notice(e.message);}
}
function resourceForm(type,row=null){const meta=resourceMeta[type];openForm(row?'Editar '+meta.title:'Novo '+meta.title,meta.fields(row),async d=>{
 if(d.numero)d.numero=Number(d.numero);if(d.data_sessao)d.data_sessao=new Date(d.data_sessao).toISOString();
 await apiRequest(row?'/recursos/'+type+'/'+row.id:'/recursos/'+type,{method:row?'PUT':'POST',body:JSON.stringify({...d,campanha_id:campaignId})});
 notice('Registro salvo.','success');await loadResource(type,meta.grid);
 });}
$('newSession').onclick=()=>resourceForm('sessoes');
$('newMap').onclick=()=>resourceForm('mapas');
$('newMission').onclick=()=>resourceForm('missoes');

async function loadPlayers(){
 try{
  const r=await apiRequest('/participantes/'+campaignId);
  const rows=r.participantes||[];
  const master=r.mestre;
  $('playersList').innerHTML=`<div class="member-row"><div class="member-avatar">${master?.avatar_url?`<img src="${safe(master.avatar_url)}" alt="">`:safe((master?.nome_exibicao||'M').charAt(0).toUpperCase())}</div><div><strong>${safe(master?.nome_exibicao||'Mestre da campanha')}</strong><div class="character-meta">Criador da mesa</div></div><span class="badge badge-primary" style="margin-left:auto">Mestre</span></div>`+rows.map(p=>`<div class="member-row"><div class="member-avatar">${p.perfil?.avatar_url?`<img src="${safe(p.perfil.avatar_url)}" alt="">`:safe((p.perfil?.nome_exibicao||'J').charAt(0).toUpperCase())}</div><div><strong>${safe(p.perfil?.nome_exibicao||'Aventureiro')}</strong><div class="character-meta">${safe(p.papel==='mestre_auxiliar'?'Mestre auxiliar':'Jogador')}</div></div>${p.usuario_id===me.id?'<span class="badge badge-primary" style="margin-left:auto">Você</span>':''}</div>`).join('');
 }catch(e){notice(e.message);}
}
document.querySelectorAll('.campaign-tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
$('copyInvite').onclick=async()=>{try{await navigator.clipboard.writeText(campaign.codigo_convite);notice('Código de convite copiado!','success');}catch{notice('Não foi possível copiar o código.');}};
$('logoutBtn').onclick=()=>{if(confirm('Deseja sair da conta?'))sairDaConta();};
loadCampaign();
