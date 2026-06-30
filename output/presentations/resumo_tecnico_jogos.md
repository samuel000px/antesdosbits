# Resumo técnico dos jogos

## Arquitetura geral

O projeto é um site estático em HTML, CSS e JavaScript publicado no GitHub Pages. O estado local usa `localStorage` para moedas, progresso e dados de treino. O Supabase aparece em duas funções: salvar ranking e, na Computação Moderna, sincronizar salas multiplayer por broadcast realtime.

## Jacquard

O cartão tem 3 linhas por 5 colunas. Cada furo ativo vira um fio levantado. A execução lê as linhas do cartão, cria novas linhas em `fabricMatrix` e calcula métricas: densidade, regularidade, definição do desenho, qualidade e custo. O pedido é aceito quando essas métricas batem os limites do cliente.

## Censo de Hollerith

Cada personagem tem respostas corretas por categoria. O jogador marca uma perfuração por coluna no cartão. Ao acionar a alavanca, o código compara `escolhasJogador` com `respostasCorretas`. Acertos dão moedas e bônus de sequência.

## IBM

O jogador monta um fluxo de máquinas. `runWorkflow()` executa operações como verificar, ordenar, colar arquivo mestre, reproduzir campos, selecionar, tabular e imprimir. O relatório impresso precisa bater o relatório esperado e não pode ter erros de pipeline.

## FORTRAN

O jogador monta uma pilha de cartões de programa. Cada missão tem cartões, armadilhas, uma função `execute()`, uma saída esperada e uma ordem correta. O programa passa se a ordem e a saída estiverem certas.

## Caça ao Erro

O código sorteia um cartão com erro usando `bugIndex`. Cada clique calcula a distância Manhattan até o erro e mostra uma pista quente, morna ou fria. Ao acertar, chama `triggerBugScare()`, que anima o besouro saindo do cartão.

## Computação Moderna

É multiplayer com Supabase Realtime. O host cria o estado da sala, recebe submissões e resolve rodadas. O jogador memoriza padrões 5x12 e marca furos no cartão. A IA é simulada: ela pega o gabarito e usa `mutatePattern()` para remover ou adicionar furos aleatórios.

## Machine Learning de Cartões

O scanner usa canvas, câmera e leitura geométrica dos furos. Primeiro detecta se há um cartão claro dentro da moldura. Depois classifica o padrão por comparação de matriz. Se houver fotos rotuladas, treina um modelo TensorFlow.js por 30 épocas e salva em IndexedDB.
