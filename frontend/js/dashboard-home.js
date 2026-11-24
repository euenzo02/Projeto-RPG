document.addEventListener('DOMContentLoaded',async()=>{
 if(!usuarioAutenticado()){location.href='login.html';return;}
 try{
  const [c,p,m,s]=await Promise.all([
   apiRequest('/campanhas'),
   apiRequest('/recursos/personagens'),
   apiRequest('/recursos/missoes'),
   apiRequest('/recursos/sessoes')
  ]);
  const campanhas=c.campanhas||[];
  document.getElementById('totalCampanhas').textContent=campanhas.length;
  document.getElementById('totalPersonagens').textContent=(p.dados||[]).length;
  document.getElementById('totalMissoes').textContent=(m.dados||[]).length;
  document.getElementById('totalSessoes').textContent=(s.dados||[]).length;
  const el=document.getElementById('campanhasRecentes');
  el.innerHTML=campanhas.slice(0,3).map(x=>`<article class="record-card"><span class="badge badge-primary">${x.status||'ativa'}</span><h3>${escapeText(x.nome)}</h3><p>${escapeText(x.descricao||'Uma nova aventura aguarda.')}</p><div class="record-actions"><a class="btn btn-secondary btn-small" href="campanhas.html">Abrir campanhas</a></div></article>`).join('')||'<div class="empty-state">Nenhuma campanha por enquanto. Crie sua primeira aventura!</div>';
 }catch(e){console.warn('Dashboard:',e.message);}
});
function escapeText(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
