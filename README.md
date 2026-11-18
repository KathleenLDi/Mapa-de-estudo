# Painel de Estudos

Site estático para GitHub Pages com Supabase Auth e tabelas `materias`, `atividades` e `sessoes_estudo`.

## Arquivos
- `index.html`: página
- `css/style.css`: estilos
- `js/config.js`: conexão Supabase, estado e funções compartilhadas
- `js/auth.js`: cadastro e login
- `js/materias.js`: abas e cores
- `js/cronograma.js`: atividades
- `js/cronometro.js`: sessões
- `js/historico.js`: histórico e exclusão
- `js/grafico.js`: evolução
- `js/app.js`: inicialização

## Publicação
Envie os arquivos e pastas para a raiz do repositório GitHub Pages. Não abra `index.html` pelo protocolo `file://`; use o endereço do GitHub Pages ou um servidor local.

## Banco de dados
A aplicação requer que as tabelas estejam expostas na Data API do Supabase e tenham permissões RLS que isolem cada usuário. A chave `publishable` é pública; nunca use a chave `service_role` no navegador. O histórico antigo guardado só no localStorage não é importado automaticamente.
