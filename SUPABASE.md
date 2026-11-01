# Supabase no DS Fighters

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

Enquanto Google estiver desativado, o cartão mostra **GOOGLE AGUARDANDO CONFIGURAÇÃO**. O jogo continua salvando localmente. Para usar o Firebase opcional em vez do Supabase, defina `DS_SUPABASE_CONFIG = null`.

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
