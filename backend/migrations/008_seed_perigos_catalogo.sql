-- Migration 008: Popular catálogo de perigos ergonômicos
-- Insere os 61 perigos ergonômicos conforme NR-17

-- Limpar tabela antes de popular (caso já tenha dados)
TRUNCATE TABLE perigos_catalogo CASCADE;

-- Biomecânicos (1-16)
INSERT INTO perigos_catalogo (numero, categoria, descricao) VALUES
(1, 'Biomecânicos', 'Postura de pé por longos períodos'),
(2, 'Biomecânicos', 'Postura sentada por longos períodos'),
(3, 'Biomecânicos', 'Frequente deslocamento a pé durante a jornada de trabalho'),
(4, 'Biomecânicos', 'Trabalho em posturas incômodas ou pouco confortável por longos períodos'),
(5, 'Biomecânicos', 'Compressão de partes do corpo por superfícies rígidas ou com quinas'),
(6, 'Biomecânicos', 'Exigência de elevação frequente de membros superiores'),
(7, 'Biomecânicos', 'Exigência de uso de força, preensão, pressão, torção dos segmentos corporais'),
(8, 'Biomecânicos', 'Exigência de flexões de coluna vertebral frequentes'),
(9, 'Biomecânicos', 'Exigência de vibração de corpo inteiro'),
(10, 'Biomecânicos', 'Exposição a vibrações localizadas (mão-braço)'),
(11, 'Biomecânicos', 'Levantamento e transporte manual de cargas ou volumes'),
(12, 'Biomecânicos', 'Frequente ação de puxar/empurrar cargas ou volumes'),
(13, 'Biomecânicos', 'Trabalho com esforço físico intenso'),
(14, 'Biomecânicos', 'Trabalho intensivo com teclado ou outros dispositivos de entrada de dados'),
(15, 'Biomecânicos', 'Frequente execução de movimentos repetitivos'),
(16, 'Biomecânicos', 'Necessidade de manter ritmos intensos de trabalho');

-- Mobiliário/equipamentos; máquinas e ferramentas manuais (17-33)
INSERT INTO perigos_catalogo (numero, categoria, descricao) VALUES
(17, 'Mobiliário/Equipamentos', 'Equipamentos ou mobiliários não adaptados à antropométrica do trabalhador'),
(18, 'Mobiliário/Equipamentos', 'Mobiliário ou equipamento sem espaço para movimentação de segmentos corporais'),
(19, 'Mobiliário/Equipamentos', 'Assento inadequado'),
(20, 'Mobiliário/Equipamentos', 'Encosto do assento inadequado ou ausente'),
(21, 'Mobiliário/Equipamentos', 'Equipamento e/ou máquinas sem meios de regulagem de ajuste ou sem condições de uso'),
(22, 'Mobiliário/Equipamentos', 'Mobiliário sem meios de regulagem e ajuste'),
(23, 'Mobiliário/Equipamentos', 'Monitores/notebook permitem mobilidade para ajuste da tela, de acordo com as características antropométricas do trabalhador'),
(24, 'Mobiliário/Equipamentos', 'Manuseio ou movimentação de cargas e volumes sem pega ou com "pega pobre"'),
(25, 'Mobiliário/Equipamentos', 'Manuseio de ferramentas e/ou objetos pesados por longos períodos'),
(26, 'Mobiliário/Equipamentos', 'Uso de ferramentas de difícil manuseio ou que a pega cause compressão na palma da mão'),
(27, 'Mobiliário/Equipamentos', 'Posto de trabalho não planejado/adaptado para a postura sentada'),
(28, 'Mobiliário/Equipamentos', 'Trabalho com necessidade de alcançar objetos, documentos, controles ou qualquer ponto além das zonas de alcance ideais para as características antropométricas do trabalhador'),
(29, 'Mobiliário/Equipamentos', 'Posto de trabalho improvisado'),
(30, 'Mobiliário/Equipamentos', 'Uso frequente de escadas'),
(31, 'Mobiliário/Equipamentos', 'Uso frequente de alavancas'),
(32, 'Mobiliário/Equipamentos', 'Uso frequente de pedais'),
(33, 'Mobiliário/Equipamentos', 'Cadência do trabalho imposta por um equipamento');

-- Organização do trabalho, cognitivo e psicossociais (34-52)
INSERT INTO perigos_catalogo (numero, categoria, descricao) VALUES
(34, 'Organização/Cognitivo/Psicossocial', 'Excesso de situações de estresse'),
(35, 'Organização/Cognitivo/Psicossocial', 'Situações de sobrecarga de trabalho mental'),
(36, 'Organização/Cognitivo/Psicossocial', 'Exigência de alto nível de concentração, atenção e memória'),
(37, 'Organização/Cognitivo/Psicossocial', 'Trabalho em condições de difícil comunicação'),
(38, 'Organização/Cognitivo/Psicossocial', 'Excesso de conflitos hierárquicos no trabalho'),
(39, 'Organização/Cognitivo/Psicossocial', 'Excesso de demandas emocionais/afetivas no trabalho'),
(40, 'Organização/Cognitivo/Psicossocial', 'Assédio de qualquer natureza no trabalho'),
(41, 'Organização/Cognitivo/Psicossocial', 'Trabalho com utilização rigorosa de metas de produção'),
(42, 'Organização/Cognitivo/Psicossocial', 'Trabalho com demandas divergentes (ordens divergente, metas incompatíveis entre si, exigência de qualidade x quantidade, entre outras)'),
(43, 'Organização/Cognitivo/Psicossocial', 'Exigência de múltiplas tarefas com alta demanda cognitiva'),
(44, 'Organização/Cognitivo/Psicossocial', 'Insatisfação no trabalho'),
(45, 'Organização/Cognitivo/Psicossocial', 'Desequilíbrio entre tempo de trabalho e tempo de repouso'),
(46, 'Organização/Cognitivo/Psicossocial', 'Insuficiência de capacitação para execução da tarefa'),
(47, 'Organização/Cognitivo/Psicossocial', 'Monotonia'),
(48, 'Organização/Cognitivo/Psicossocial', 'Trabalho com necessidade de variação de turnos'),
(49, 'Organização/Cognitivo/Psicossocial', 'Trabalho noturno'),
(50, 'Organização/Cognitivo/Psicossocial', 'Trabalho realizado sem pausas pré-definidas para descanso'),
(51, 'Organização/Cognitivo/Psicossocial', 'Trabalho remunerado por produção'),
(52, 'Organização/Cognitivo/Psicossocial', 'Falta de autonomia');

-- Condições físico/ambientais (53-61)
INSERT INTO perigos_catalogo (numero, categoria, descricao) VALUES
(53, 'Condições Físicas/Ambientais', 'Condições de trabalho com iluminação diurna inadequada'),
(54, 'Condições Físicas/Ambientais', 'Condições de trabalho com iluminação noturna inadequada'),
(55, 'Condições Físicas/Ambientais', 'Condições de trabalho com índice de temperatura efetiva fora dos parâmetros de conforto'),
(56, 'Condições Físicas/Ambientais', 'Condições de trabalho com níveis de pressão sonora fora dos parâmetros de conforto'),
(57, 'Condições Físicas/Ambientais', 'Condições de trabalho com umidade do ar fora dos parâmetros de conforto'),
(58, 'Condições Físicas/Ambientais', 'Condições de trabalho com velocidade do ar fora dos parâmetros de conforto'),
(59, 'Condições Físicas/Ambientais', 'Presença de reflexos em telas, painéis, vidros, monitores ou qualquer superfície que causem desconforto ou prejudiquem a visualização'),
(60, 'Condições Físicas/Ambientais', 'Piso escorregadio e/ou irregular'),
(61, 'Organização/Cognitivo/Psicossocial', 'Trabalho em condições de difícil comunicação');
