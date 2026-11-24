const byId=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function msg(t,type='error'){const e=byId('avisoCampanhas');e.textContent=t;e.className='notice '+type;}
async function carregarCampanhas(){
 try{
  const r=await apiRequest('/campanhas');const lista=r.campanhas||[];const uid=obterUsuario()?.id;
  const minhas=lista.filter(c=>c.mestre_id===uid);
  byId('totalMinhasCampanhas').textContent=minhas.length;byId('totalParticipando').textContent=lista.length-minhas.length;
  byId('listaCampanhas').innerHTML=lista.map(c=>`<article class="record-card"><span class="badge badge-primary">${c.mestre_id===uid?'Mestre':'Jogador'}</span><h3 style="margin-top:12px">${safe(c.nome)}</h3><p>${safe(c.descricao||'Sem descrição cadastrada.')}</p><p style="margin-top:12px"><strong>Código de convite:</strong> <code>${safe(c.codigo_convite||'')}</code></p><div class="record-actions"><button class="btn btn-secondary btn-small" data-copy="${safe(c.codigo_convite||'')}">Copiar convite</button><button class="btn btn-secondary btn-small" data-use="${safe(c.id)}">Abrir campanha</button>${c.mestre_id===uid?`<button class="btn btn-secondary btn-small" data-del="${safe(c.id)}">Excluir</button>`:''}</div></article>`).join('')||'<div class="empty-state">Você ainda não tem campanhas. Crie uma ou entre usando um código de convite.</div>';
  byId('listaCampanhas').querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.copy);msg('Código copiado!','success');});
  byId('listaCampanhas').querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('campanha_atual',b.dataset.use);location.href='campanha-detalhes.html?id='+encodeURIComponent(b.dataset.use);});
  byId('listaCampanhas').querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir esta campanha e todos os dados associados?')){try{await apiRequest('/campanhas/'+b.dataset.del,{method:'DELETE'});carregarCampanhas();}catch(e){msg(e.message);}}});
 }catch(e){byId('listaCampanhas').innerHTML='<div class="empty-state">Não foi possível carregar as campanhas.</div>';msg(e.message);}
}
async function abrirNova(){
 byId('modalCampanha').classList.add('open');
 try{const r=await apiRequest('/sistemas');byId('sistemaCampanha').innerHTML='<option value="">Selecione um sistema (opcional)</option>'+(r.sistemas||[]).map(s=>`<option value="${s.id}">${safe(s.nome)}</option>`).join('');}catch(e){msg(e.message);}
}
document.addEventListener('DOMContentLoaded',()=>{
 if(!usuarioAutenticado()){location.href='login.html';return;}
 carregarCampanhas();
 byId('novaCampanhaBtn').onclick=abrirNova;
 byId('cancelarCampanha').onclick=()=>byId('modalCampanha').classList.remove('open');
 byId('modalCampanha').onclick=e=>{if(e.target===byId('modalCampanha'))byId('modalCampanha').classList.remove('open');};
 byId('campanhaForm').onsubmit=async e=>{e.preventDefault();const b=byId('salvarCampanha');b.disabled=true;b.textContent='Criando...';try{await apiRequest('/campanhas',{method:'POST',body:JSON.stringify({nome:byId('nomeCampanha').value.trim(),descricao:byId('descricaoCampanha').value.trim(),sistema_id:byId('sistemaCampanha').value||null})});byId('modalCampanha').classList.remove('open');byId('campanhaForm').reset();msg('Campanha criada com sucesso!','success');carregarCampanhas();}catch(err){msg(err.message);}finally{b.disabled=false;b.textContent='Criar campanha';}};
 byId('entrarCampanhaBtn').onclick=async()=>{const codigo=byId('codigoConvite').value.trim();if(!codigo){msg('Digite o código de convite.');return;}try{const r=await apiRequest('/participantes/entrar',{method:'POST',body:JSON.stringify({codigo})});msg(r.message,'success');byId('codigoConvite').value='';carregarCampanhas();}catch(e){msg(e.message);}};
});
