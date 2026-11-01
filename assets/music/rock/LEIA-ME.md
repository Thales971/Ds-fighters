# Seus rocks pesados

1. Coloque aqui os arquivos de música (`.mp3` ou `.ogg`).
2. Edite `assets/music/playlist.json` e adicione cada faixa em `tracks`:

```json
"tracks": [
  { "title": "Nome da Música", "file": "assets/music/rock/nome-da-musica.mp3" }
]
```

A cada batalha o jogo sorteia uma faixa diferente da anterior. Se a lista estiver vazia (ou o arquivo não existir), toca a trilha original do jogo.
Use apenas músicas que você tem direito de publicar.
