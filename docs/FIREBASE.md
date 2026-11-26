# Login com Google e salvamento na nuvem

O DS Fighters continua funcionando 100% offline. A conta é opcional: quando a configuração está vazia, o cartão do menu mostra **LOGIN COM GOOGLE NÃO CONFIGURADO** e nenhum SDK externo é carregado. Com a configuração preenchida, o jogo usa Firebase Authentication (Google) e Cloud Firestore.

## 1. Criar o projeto gratuito

1. Abra o [Firebase Console](https://console.firebase.google.com/) e entre com sua conta Google.
2. Clique em **Adicionar projeto** e crie um projeto para o DS Fighters. O plano **Spark (gratuito)** é suficiente para este recurso.
3. O Google Analytics é opcional para este jogo; pode ser desativado durante a criação.

## 2. Registrar o aplicativo Web

1. Dentro do projeto, clique no ícone `</>` (**Adicionar app** / Web).
2. Dê um apelido, por exemplo `ds-fighters-web`. Não é necessário configurar hospedagem pelo Firebase.
3. Copie a configuração exibida. Ela tem este formato:

```js
{
  apiKey: 'AIza...',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  appId: '1:123456789:web:abcdef'
}
```

A configuração de um app Web pode ficar no código do site; a proteção vem das regras do Firestore e do Authentication. Não coloque chaves privadas ou credenciais de servidor no navegador.

## 3. Ativar Login com Google

1. No menu lateral, abra **Build → Authentication** e clique em **Começar**.
2. Na aba **Sign-in method**, selecione **Google**.
3. Ative o provedor, escolha um e-mail de suporte do projeto e salve.
4. Ainda em Authentication, abra **Settings → Authorized domains**. Adicione:
   - `localhost` (para testes locais);
   - o domínio principal publicado no Vercel, por exemplo `ds-fighters.seu-dominio.com`;
   - o domínio `*.vercel.app` específico do projeto, se o site também for acessado por ele (adicione o hostname exato que aparece na URL).

O login usa `signInWithPopup` no desktop e tenta `signInWithRedirect` em celulares ou quando o popup é bloqueado. Um domínio não autorizado produz uma mensagem em português no cartão da conta, sem impedir o jogo.

## 4. Criar o Firestore

1. Abra **Build → Firestore Database** e clique em **Criar banco de dados**.
2. Escolha uma região próxima dos jogadores. A região não pode ser alterada depois.
3. Selecione o modo de produção. Não deixe as regras abertas para o site publicado.
4. Abra a aba **Rules**, substitua o conteúdo pelo arquivo [`firestore.rules`](firestore.rules) deste projeto e clique em **Publicar**.

O jogo grava apenas um documento por usuário em `players/{uid}`. O documento contém `profile`, `updatedAt`, `name` e `photo`. As configurações de dispositivo `serverUrl` e `touch` nunca são enviadas para a nuvem. As regras permitem que cada usuário leia e escreva somente o próprio documento, limitam listas/campos e bloqueiam exclusão e consultas gerais.

## 5. Preencher a configuração no jogo

Edite [`js/config/firebase-config.js`](js/config/firebase-config.js), trocando `null` pela configuração do app Web:

```js
window.DS_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyEXEMPLO',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  appId: '1:123456789:web:abc123'
};
```

Neste checkout, [`js/config/firebase-config.js`](js/config/firebase-config.js) permanece deliberadamente como `null`: nenhuma credencial real foi fornecida e não há um projeto Firebase configurado para o DS Fighters. Portanto, o estado esperado atualmente é **LOGIN COM GOOGLE NÃO CONFIGURADO** e o jogo segue offline; não substitua `null` por valores inventados.

Publique o arquivo junto com o restante do site. Não adicione `databaseURL` ou credenciais de Admin: este recurso usa somente Authentication e Firestore pelo SDK modular oficial carregado sob demanda.

## 6. Como a sincronização funciona

Ao entrar, o perfil anônimo local é usado apenas na primeira sincronização de uma conta sem snapshot local. Depois disso, cada UID possui um snapshot local separado; trocar de conta nunca mescla o perfil da conta anterior com o novo usuário. Personagens desbloqueados são unidos; `fights`, `wins`, `bestArcade` e `maxCombo` usam o maior valor para evitar duplicação; nome e mascotes usam o perfil com carimbo de atualização mais recente; e as configurações locais permanecem neste dispositivo e não são substituídas pelo documento remoto. O resultado é salvo no localStorage e novamente no Firestore.

Depois de qualquer `Profile.save()`, o envio aguarda cerca de dois segundos. A fila também é descarregada em `visibilitychange`, `pagehide`, reconexão e antes do logout. Respostas de uma sessão antiga não podem aplicar dados nem atualizar o estado da conta nova. Falhas de rede, popup fechado, domínio não autorizado ou regras incorretas viram mensagens claras no cartão; o jogo continua utilizável e preserva o progresso local. As regras de atualização também impedem reduzir desbloqueios ou estatísticas já gravados.

## 7. Teste local

Na raiz do projeto, execute:

```bash
python3 -m http.server 8099
```

Abra `http://localhost:8099/`. Para testar os contratos sem credenciais, execute `node tools/profile_cloud_test.js`; ele usa mocks locais e cobre isolamento por UID, merge, corrida de sincronização e flush no logout. O teste automatizado [`tools/cloud_check.py`](tools/cloud_check.py) usa um mock do SDK e não realiza login Google real. Para testar o fluxo real, o `localhost` precisa estar em **Authorized domains**, a configuração precisa ser preenchida e o domínio precisa estar publicado/ autorizado no Firebase.
