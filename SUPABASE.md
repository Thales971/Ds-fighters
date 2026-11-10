# Supabase no DS Fighters

## Batimento — o que rodar uma vez

O plano gratuito pausa o projeto depois de cerca de 7 dias sem atividade no banco. Bater só em `/auth/v1/settings` não conta. O keep-alive grava de verdade: a função `ds_fighters_touch()` soma 1 em `public.ds_fighters_keepalive` e devolve o horário.

A função **já foi criada** no projeto `ownxbuailthavxgfxtem` em 10/11/2026. Você não precisa colar o SQL de novo, a menos que recrie o projeto. O arquivo `supabase/migrations/20261110_ds_fighters_keepalive.sql` é a cópia: cole ele inteiro no [SQL Editor](https://supabase.com/dashboard/project/ownxbuailthavxgfxtem/sql/new) e aperte Run se um dia a função sumir. Sem essa função, o workflow e o cron falham de propósito.

Confirme na hora, trocando a chave pela publicável de `js/config/supabase-config.js` (não use `service_role`):

```bash
curl -sS -X POST \
  'https://ownxbuailthavxgfxtem.supabase.co/rest/v1/rpc/ds_fighters_touch' \
  -H 'apikey: SUA_CHAVE_PUBLICAVEL' \
  -H 'Authorization: Bearer SUA_CHAVE_PUBLICAVEL' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

A resposta é um horário ISO, por exemplo `"2026-11-10T12:15:00+00:00"`. Em seguida:

```bash
curl -sS \
  'https://ownxbuailthavxgfxtem.supabase.co/rest/v1/ds_fighters_keepalive?select=touched_at,hits' \
  -H 'apikey: SUA_CHAVE_PUBLICAVEL' \
  -H 'Authorization: Bearer SUA_CHAVE_PUBLICAVEL'
```

`hits` sobe a cada chamada. Se o projeto estiver pausado, o curl (e o workflow) falha com mensagem **PAUSADO** — restaure o projeto no painel e rode de novo.

### O que dispara sozinho depois do SQL

| Camada | Quando | Onde |
|---|---|---|
| GitHub Actions | todo dia 12:15 UTC, e quando você quiser | `.github/workflows/supabase-keepalive.yml` |
| Vercel Cron | todo dia 15:30 UTC | `vercel.json` → `GET /api/keepalive` |

O cron do GitHub só roda na branch padrão (`main`), depois que este PR estiver mergeado. Para testar antes: Actions → **Supabase keep-alive** → **Run workflow** (`workflow_dispatch`). O passo `node tools/supabase_keepalive.js` sai com código 1 se o banco não responder ou se o projeto estiver pausado.

Não precisa de segredo. A chave publicável já está em `js/config/supabase-config.js` e é a mesma que o navegador usa. Se um dia quiser apontar para outro projeto sem editar o arquivo, crie os secrets **`SUPABASE_URL`** e **`SUPABASE_PUBLISHABLE_KEY`** no repositório (Settings → Secrets and variables → Actions). Os dois juntos substituem o arquivo. Não coloque `service_role` em lugar nenhum.

No plano Hobby da Vercel o cron só pode ser diário. Por isso o agendamento é `30 15 * * *`, não a cada hora. As duas camadas são de propósito: se uma falhar, a outra ainda grava no mesmo dia.

O proprietário autorizou compartilhar e reativar **supabase-aero-ball**, ref. `ownxbuailthavxgfxtem`, em 01/11/2026. O projeto voltou a `ACTIVE_HEALTHY`. A migração cria somente objetos com prefixo `ds_fighters_`; as tabelas e dados anteriores não foram substituídos.

## Banco e segurança

`public.ds_fighters_profiles` armazena perfil, desbloqueios, mascotes, nome/avatar e estatísticas do próprio usuário. O UID autenticado é a chave primária. Acesso anônimo foi revogado; RLS permite SELECT/INSERT/UPDATE apenas quando `auth.uid()` é o proprietário da linha. O cliente não tem DELETE.

O trigger é `SECURITY INVOKER`, com `search_path` fechado, e não fornece RPC privilegiada. O relógio é do servidor. Atualizações mantêm a união dos desbloqueios e o máximo das estatísticas para impedir regressões entre dispositivos. Há limites de tamanho e validação. O armazenamento não é prova antitrapaça: os resultados ainda vêm do jogo local.

O frontend recebe somente a **chave publicável**. Nunca recebe `service_role`, segredo Google ou token de administração. SDK 2.118.0 local, com licença e hash em `js/vendor/`. Sessão e perfis locais têm nomes exclusivos do DS Fighters; sair usa escopo `local`, sem revogar as sessões de outros jogos.

**Alerta preexistente:** o catálogo apontou **20 tabelas antigas sem RLS**, incluindo `user`, `session`, `profiles` e `messages`. Elas não foram alteradas, pois habilitar RLS sem políticas compatíveis pode bloquear o aplicativo anterior. Devem ser revisadas separadamente antes de armazenar dados privados nesse sistema. Veja [como aplicar RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Não execute uma ativação geral sem planejar as políticas de cada tabela.

## Google: configuração ainda necessária

A API pública de configuração retornou `external.google = false`. O código de login e sincronização está integrado, mas **login real com Google não está ativado**. A chave Supabase não substitui as credenciais OAuth do Google.

No [Google Auth Platform — Clients](https://console.cloud.google.com/auth/clients), configure um cliente **Web** com escopos básicos `openid`, `userinfo.email` e `userinfo.profile`. Cadastre esta URI de callback:

```
https://ownxbuailthavxgfxtem.supabase.co/auth/v1/callback
```

Preencha Client ID e Client Secret somente no [provedor Google do Supabase](https://supabase.com/dashboard/project/ownxbuailthavxgfxtem/auth/providers?provider=Google), nunca no repositório.

Adicione a URL real do DS Fighters a Authentication → URL Configuration → **Redirect URLs**. Não substitua o Site URL nem remova redirects do Aero Ball. O cliente volta a `location.origin + location.pathname`; o retorno precisa estar autorizado. Não use curingas amplos nem uma URL temporária como publicação definitiva.

Enquanto Google estiver desativado, o cartão mostra **GOOGLE AGUARDANDO CONFIGURAÇÃO**. Se o host do projeto nem responder (projeto pausado, DNS ou `ERR_CONNECTION_CLOSED` em `ownxbuailthavxgfxtem.supabase.co`), o cartão mostra **NUVEM INDISPONÍVEL** e um botão **TENTAR DE NOVO**. O jogo continua salvando localmente nos dois casos. Reative o projeto no painel do Supabase antes de esperar o login funcionar. Para usar o Firebase opcional em vez do Supabase, defina `DS_SUPABASE_CONFIG = null`.

## Verificação

`node tools/supabase_cloud_test.js` testa merge de progresso, isolamento por conta/projeto, PKCE, Google desativado, autosave, escrita durante upload, sessão antiga descartada, callback sem deadlock e logout local. `node tools/profile_cloud_test.js` verifica que o perfil anterior/fallback não sofreu regressão.

A migração foi aplicada ao projeto real e as permissões/políticas são verificadas por consultas limitadas ao novo objeto. A API REST deve recusar leitura sem autenticação. Testes simulados não substituem um login Google real; este permanece pendente da configuração OAuth e da URL final do jogo.

## Fontes técnicas

[Google no Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) descreve os requisitos OAuth. [signInWithOAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) documenta o cliente. A [mudança dos grants](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) exige permissões explícitas nas tabelas novas, incluídas nesta migração.

## URL do jogo confirmada

O repositório indica **https://online-server-one.vercel.app**, e essa URL serviu o DS Fighters com 23 lutadores e 37 arenas em 01/11/2026. Autorize **`https://online-server-one.vercel.app/`** na lista de Redirect URLs do Supabase. No cliente Web do Google, a origem JavaScript é **`https://online-server-one.vercel.app`**; a URI OAuth continua sendo o callback Supabase acima. Não modifique as URLs do aplicativo anterior.

## Evidências finais

O banco real confirmou RLS habilitada, `anon SELECT = false`, permissões SELECT/INSERT/UPDATE autenticadas e `authenticated DELETE = false`. As três políticas usam igualdade entre `auth.uid()` e `user_id`. O trigger está habilitado, com `security_definer = false` e `search_path` fechado. A chamada REST anônima recebeu **HTTP 401**.

`python3 tools/supabase_check.py` passou com SDK real: configuração real/aviso Google, depois Auth/REST isoladamente simulados para merge, namespace, autosave, offline/retorno e logout. O teste Firebase (`cloud_check.py`), os dois runners VM de conta e `senai_check.py` também passaram. Nenhum usuário ou progresso fictício foi criado no banco real. Como não há usuários Supabase existentes e Google permanece desativado, persistência de um usuário autenticado real e execução do merge de banco em sua linha ficam pendentes do primeiro login.

## Decisão do proprietário

Em 01/11/2026, o proprietário escolheu **deixar o Google para depois**. Não solicitar novamente a criação/configuração OAuth nesta etapa. O Supabase continua ativo com tabela privada e cliente integrado; o provedor Google permanece desativado, e o jogo mantém o progresso local até um login real ser habilitado. Nenhuma alteração adicional nos provedores ou nas tabelas anteriores foi feita por causa desse adiamento.
