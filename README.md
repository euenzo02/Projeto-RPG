# Projeto RPG

Aplicação web para organizar campanhas de RPG de mesa com Node.js, Express e Supabase.

## O que há nesta versão
- Campanhas individuais com página própria e abas internas.
- Personagens por campanha, com PV atual/máximo, defesa, classe, nível e história.
- Jogadores veem as fichas de todos, mas o banco oculta os PV/defesa/condições dos personagens alheios.
- Inventário individual: cada jogador vê/edita os próprios itens; mestre e auxiliares gerenciam todos.
- Anotações privadas por usuário, inclusive as do mestre.
- Sessões, mapas, missões e lista de participantes.
- Perfil com nome de exibição e upload de avatar.

## Requisitos
- Node.js 20 ou superior recomendado.
- Projeto Supabase.
- Live Server (VS Code) para abrir o frontend localmente.

## Configuração limpa do Supabase
**ATENÇÃO: `database/schema.sql` apaga e recria as tabelas do aplicativo. Todos os registros antigos dessas tabelas serão perdidos.** Isso não exclui contas do Supabase Auth. Confirme que está no projeto correto e faça backup se quiser preservar dados.

1. Abra Supabase > SQL Editor > New query.
2. Cole e execute todo o conteúdo de `database/schema.sql`.
3. Crie outra query, cole e execute `database/policies.sql` (cria o bucket público `avatars` e as políticas de upload).
4. Confirme que não houve erro.

## Configurar o backend
1. Copie `backend/.env.example` para `backend/.env`.
2. Preencha:
   - `SUPABASE_URL`: Project URL / API URL.
   - `SUPABASE_ANON_KEY`: Publishable key (`sb_publishable_...`).
   - `PORT=3000`.
3. Nunca publique `backend/.env` no GitHub.

No terminal, na raiz do projeto:
```bash
npm install
npm run dev
```
Teste `http://localhost:3000/api/health`.

## Abrir o frontend
Abra `frontend/index.html` com Live Server. O navegador será direcionado para `pages/login.html`.
O endereço esperado do Live Server é `http://localhost:5500`. Se usar outra porta, ajuste a origem em `backend/server.js` ou defina `FRONTEND_URL` no `backend/.env`.

## Observações de segurança
- O navegador nunca recebe service_role key.
- A visibilidade de HP de terceiros é protegida por privilégios de coluna e pela função `listar_personagens_campanha`.
- As regras de acesso também são aplicadas pelo RLS do Supabase.
