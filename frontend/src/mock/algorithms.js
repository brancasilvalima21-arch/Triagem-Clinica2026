// Mock data — 50 algoritmos de triagem clínica (baseados no PDF fornecido)
// Cada algoritmo tem: id, name, category, icon, keywords, rationale, flow (grafo de decisão)

const LEVELS = {
  emergente: { key: 'emergente', label: 'Emergente', tone: 'red', time: 'Imediato', desc: 'Risco de vida iminente — ativar 112 / SU imediatamente.' },
  muito_urgente: { key: 'muito_urgente', label: 'Muito Urgente', tone: 'orange', time: '≤ 10 min', desc: 'Necessita observação médica muito urgente.' },
  urgente: { key: 'urgente', label: 'Urgente', tone: 'yellow', time: '≤ 60 min', desc: 'Necessita observação médica urgente.' },
  pouco_urgente: { key: 'pouco_urgente', label: 'Pouco Urgente', tone: 'green', time: '≤ 120 min', desc: 'Situação que necessita avaliação, sem urgência.' },
  nao_urgente: { key: 'nao_urgente', label: 'Não Urgente', tone: 'blue', time: '≤ 240 min', desc: 'Situação que pode aguardar ou ser avaliada em ambulatório.' },
};

export const TRIAGE_LEVELS = LEVELS;

// Helpers de construção
const outcome = (levelKey, recommendation) => ({ outcome: { ...LEVELS[levelKey], recommendation } });
const q = (id, question, options) => ({ id, question, options });

// Fluxos re-utilizáveis — perguntas de segurança comuns
const safetyEmergent = (nextId, extra = '') =>
  q('start', `Apresenta algum sinal de gravidade? (perda de consciência, dificuldade respiratória grave, dor torácica intensa, hemorragia ativa não controlada${extra ? ', ' + extra : ''})`, [
    { label: 'Sim', next: 'emergente' },
    { label: 'Não', next: nextId },
  ]);

export const ALGORITHMS = [
  {
    id: 'dor-abdominal', name: 'Dor Abdominal', category: 'Digestivo', icon: 'Stethoscope',
    keywords: ['dor abdominal', 'cólica', 'epigastralgia', 'apendicite', 'peritonite', 'vómitos', 'melena', 'hematémese'],
    rationale: 'A dor abdominal resulta de reação da parede intestinal, tensão em órgãos sólidos, irritação peritoneal ou isquemia mesentérica. Deve ser caracterizada quanto a localização, tipo, intensidade, duração e sintomas associados.',
    flow: {
      start: safetyEmergent('q1', 'sinais de choque'),
      emergente: outcome('emergente', 'Encaminhar de imediato para SU. Monitorizar sinais vitais.'),
      q1: q('q1', 'Dor abdominal intensa (>7/10), início súbito ou associada a rigidez abdominal / vómitos com sangue / melenas?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de abdómen agudo (apendicite, perfuração, hemorragia digestiva). SU muito urgente.'),
      q2: q('q2', 'Dor moderada com febre, icterícia, sinais de desidratação ou dor localizada no quadrante inferior direito?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente para exclusão de causa infeciosa/inflamatória (colecistite, pielonefrite, apendicite não complicada).'),
      q3: q('q3', 'Dor ligeira, tipo cólica, associada a alterações do trânsito intestinal, sem sinais de alarme?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Provável causa funcional/gastroenterite. Hidratação, dieta leve, reavaliação em 24-48h.'),
      nao_urgente: outcome('nao_urgente', 'Sem sinais de alarme. Vigilância domiciliária, medidas dietéticas e reavaliação se agravar.'),
    },
  },
  {
    id: 'cefaleia', name: 'Cefaleia', category: 'Neurológico', icon: 'Brain',
    keywords: ['cefaleia', 'dor de cabeça', 'enxaqueca', 'meningite', 'AVC', 'fotofobia', 'vómitos'],
    rationale: 'A cefaleia é um dos problemas mais comuns. Pode ser crónica/recidivante ou aguda. A alteração de padrão ou intensidade pode indicar patologia grave (HSA, AVC, meningite).',
    flow: {
      start: safetyEmergent('q1', 'convulsão, défice neurológico focal, rigidez da nuca'),
      emergente: outcome('emergente', 'Suspeita de HSA/AVC/meningite. Ativar 112 imediatamente.'),
      q1: q('q1', '"Pior cefaleia da vida", início súbito (thunderclap) ou associada a vómitos, febre alta ou alterações da consciência?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de hemorragia subaracnoideia, meningite ou HTA grave. SU muito urgente.'),
      q2: q('q2', 'Cefaleia com fotofobia, náuseas, alteração visual ou pico hipertensivo?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente. Excluir enxaqueca complicada e crise hipertensiva.'),
      q3: q('q3', 'Cefaleia tensional ou enxaqueca conhecida, sem sinais de alarme?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Analgesia habitual, repouso, ambiente calmo. Vigiar evolução.'),
      nao_urgente: outcome('nao_urgente', 'Cefaleia ligeira. Hidratação e vigilância.'),
    },
  },
  {
    id: 'dor-toracica', name: 'Dor Torácica', category: 'Cardiovascular', icon: 'HeartPulse',
    keywords: ['dor torácica', 'precordialgia', 'angina', 'enfarte', 'SCA', 'irradiação braço'],
    rationale: 'Desconforto contínuo/intermitente na região torácica. Pode irradiar à mandíbula, pescoço, ombro ou braços. Deve ser sempre excluída origem coronária.',
    flow: {
      start: safetyEmergent('q1'),
      emergente: outcome('emergente', 'Suspeita de SCA/EAM. Ativar 112. AAS 300mg se disponível e sem contra-indicações.'),
      q1: q('q1', 'Dor opressiva/tipo aperto com irradiação para braço esquerdo, mandíbula, associada a sudorese ou dispneia?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q2' },
      ]),
      q2: q('q2', 'Dor torácica pleurítica, súbita, com falta de ar ou hemoptises?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q3' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de TEP ou pneumotórax. SU muito urgente.'),
      q3: q('q3', 'Dor relacionada com movimentos respiratórios ou palpação da parede torácica?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'urgente' },
      ]),
      urgente: outcome('urgente', 'Origem indeterminada. Necessita ECG e avaliação médica urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Provável dor musculo-esquelética. Analgesia e reavaliação.'),
    },
  },
  {
    id: 'problema-ocular', name: 'Problema Ocular', category: 'Oftalmológico', icon: 'Eye',
    keywords: ['visão', 'olho', 'trauma ocular', 'glaucoma', 'diplopia', 'olho vermelho'],
    rationale: 'Situações oculares agrupadas em: alterações da visão, dor ocular, alterações macroscópicas e secreção anormal. Critérios de urgência: trauma penetrante/químico, glaucoma agudo, celulite orbitária.',
    flow: {
      start: q('start', 'Traumatismo ocular penetrante, contacto com produto químico ou perda súbita da visão?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Urgência Oftalmológica imediata. Lavar abundantemente com soro/água se causa química.'),
      q1: q('q1', 'Dor ocular intensa com olho vermelho e cefaleia, ou tumefação periocular com febre?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de glaucoma agudo ou celulite orbitária. Urgência Oftalmológica.'),
      q2: q('q2', 'Diplopia, escotomas ou alterações visuais progressivas?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Avaliação oftalmológica urgente.'),
      q3: q('q3', 'Olho vermelho com secreção, sem alterações da visão?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Provável conjuntivite. Higiene ocular e consulta em 24-48h.'),
      nao_urgente: outcome('nao_urgente', 'Sintomas ligeiros. Consulta programada.'),
    },
  },
  {
    id: 'tensao-arterial', name: 'Problema de Tensão Arterial', category: 'Cardiovascular', icon: 'Activity',
    keywords: ['hipertensão', 'HTA', 'pré-eclâmpsia', 'crise hipertensiva', 'hipotensão'],
    rationale: 'HTA: TA sistólica ≥140 e/ou diastólica ≥90 em duas medições. Crise hipertensiva pode manifestar-se com sintomas neurológicos, cardíacos ou visuais.',
    flow: {
      start: q('start', 'TA sistólica >180 ou diastólica >120 com sintomas (cefaleia intensa, dor torácica, dispneia, alteração neurológica)?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência hipertensiva. Ativar 112.'),
      q1: q('q1', 'Grávida com TA elevada, cefaleia, epigastralgia ou edemas?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de pré-eclâmpsia. SU Obstetrícia muito urgente.'),
      q2: q('q2', 'TA elevada assintomática (sistólica 160-180 / diastólica 100-120)?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Urgência hipertensiva sem lesão de órgão. Reavaliação e ajuste terapêutico.'),
      q3: q('q3', 'Hipotensão sintomática (tonturas, palidez, sudorese)?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      nao_urgente: outcome('nao_urgente', 'Valores tensionais alterados sem sintomas. Consulta programada.'),
    },
  },
  {
    id: 'problema-urinario', name: 'Problema Urinário', category: 'Genito-Urinário', icon: 'Droplet',
    keywords: ['infeção urinária', 'hematúria', 'pielonefrite', 'litíase renal', 'disúria', 'retenção urinária'],
    rationale: 'Problemas mais frequentes: infeção urinária, insuficiência renal, doença prostática e litíase renal.',
    flow: {
      start: safetyEmergent('q1', 'anúria total, sépsis'),
      emergente: outcome('emergente', 'Situação grave — SU imediato.'),
      q1: q('q1', 'Dor lombar intensa (cólica renal) com febre alta ou vómitos incoercíveis?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de pielonefrite obstrutiva. SU muito urgente.'),
      q2: q('q2', 'Hematúria macroscópica ou retenção urinária aguda?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente (algaliação/investigação).'),
      q3: q('q3', 'Disúria, polaquiúria, urgência miccional sem febre?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Cistite não complicada. Hidratação, análise urina, ATB conforme prescrição.'),
      nao_urgente: outcome('nao_urgente', 'Sintomas ligeiros — consulta programada.'),
    },
  },
  {
    id: 'saude-homem', name: 'Problema de Saúde do Homem', category: 'Genito-Urinário', icon: 'User',
    keywords: ['torção testicular', 'priapismo', 'balanite', 'IST', 'parafimose', 'Fournier'],
    rationale: 'Foco em situações de risco masculinas: aparelho reprodutor, disfunção sexual, IST.',
    flow: {
      start: q('start', 'Dor testicular súbita e intensa (< 6 h) OU priapismo > 4 h OU sinais de gangrena/Fournier?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência urológica (torção testicular / Fournier / priapismo). SU imediato.'),
      q1: q('q1', 'Traumatismo genital, hemorragia ativa ou parafimose?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação urológica muito urgente.'),
      q2: q('q2', 'Corrimento uretral, úlcera genital ou febre com dor testicular?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Suspeita de IST/epididimite. Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Sintomas ligeiros — consulta de urologia.'),
    },
  },
  {
    id: 'amamentacao', name: 'Problema na Amamentação', category: 'Materno-Infantil', icon: 'Baby',
    keywords: ['amamentação', 'mastite', 'galactorreia', 'lesão mamária'],
    rationale: 'O aleitamento materno exclusivo satisfaz as necessidades nutricionais nos primeiros 6 meses. Problemas na estrutura, produção ou qualidade do leite geram dificuldades.',
    flow: {
      start: q('start', 'Febre elevada com mama tumefacta, quente e dolorosa? Mau estado geral?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de mastite/abcesso mamário. Avaliação urgente.'),
      q1: q('q1', 'Mama vermelha, dor localizada ou fissura mamilar com dor?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Ingurgitamento/fissura. Avaliação em 24h.'),
      q2: q('q2', 'Dúvidas sobre produção de leite ou pega do bebé?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Consulta de enfermagem/aconselhamento em aleitamento.'),
      nao_urgente: outcome('nao_urgente', 'Sem sinais de alarme. Reforço da amamentação exclusiva.'),
    },
  },
  {
    id: 'crianca-chora', name: 'Criança que Chora (0-1 ano)', category: 'Materno-Infantil', icon: 'Baby',
    keywords: ['choro', 'febre lactente', 'irritabilidade', 'dentição'],
    rationale: 'O bebé comunica desconforto pelo choro. Doenças em crianças podem agravar rapidamente. Identificar sinais precocemente.',
    flow: {
      start: q('start', 'Bebé com prostração, cianose, dificuldade respiratória, febre >38ºC (<3 meses) ou choro inconsolável >2h?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Situação de risco — SU Pediátrico imediato.'),
      q1: q('q1', 'Febre, vómitos persistentes, exantema ou recusa alimentar >12h?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'SU pediátrica muito urgente.'),
      q2: q('q2', 'Choro persistente com sinais de desconforto (cólicas, dentição)?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Cólicas/dentição. Conforto, colo, reavaliação em 24h.'),
      nao_urgente: outcome('nao_urgente', 'Sem sinais de alarme.'),
    },
  },
  {
    id: 'problema-face', name: 'Problema na Face', category: 'Cabeça e Pescoço', icon: 'Smile',
    keywords: ['sinusite', 'trauma facial', 'rash facial', 'dor de dentes', 'herpes zoster'],
    rationale: 'Lesões, contusões, feridas ou alterações da integridade cutânea da face podem afetar funções fisiológicas e sociais.',
    flow: {
      start: safetyEmergent('q1', 'obstrução via aérea, hemorragia facial ativa'),
      emergente: outcome('emergente', 'Situação de risco vital.'),
      q1: q('q1', 'Traumatismo facial com fratura evidente, epistáxis abundante ou queimadura extensa?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação muito urgente (Cirurgia Maxilo/Otorrino).'),
      q2: q('q2', 'Dor intensa (dente, sinusite) com febre ou tumefação facial?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente para exclusão de infeção.'),
      q3: q('q3', 'Lesões cutâneas ligeiras, acne, ferida superficial?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Cuidados locais. Consulta em 24-48h.'),
      nao_urgente: outcome('nao_urgente', 'Sem gravidade.'),
    },
  },
  {
    id: 'obstipacao', name: 'Obstipação', category: 'Digestivo', icon: 'Stethoscope',
    keywords: ['obstipação', 'prisão de ventre', 'hemorragia retal', 'hemorróidas'],
    rationale: 'Alterações do trânsito intestinal podem indicar problemas graves ou serem funcionais.',
    flow: {
      start: q('start', 'Dor abdominal intensa com distensão, vómitos e ausência de emissão de gases/fezes?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de oclusão intestinal. SU muito urgente.'),
      q1: q('q1', 'Hemorragia retal significativa, dor anal intensa ou massa palpável?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente para exclusão de causa orgânica.'),
      q2: q('q2', 'Obstipação com desconforto abdominal, sem sinais de alarme?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Medidas dietéticas, hidratação e mobilização. Laxante suave se necessário.'),
      nao_urgente: outcome('nao_urgente', 'Situação ligeira.'),
    },
  },
  {
    id: 'geriatrico', name: 'Problemas Geriátricos', category: 'Geriatria', icon: 'UserPlus',
    keywords: ['idoso', 'queda', 'confusão', 'demência', 'incontinência'],
    rationale: 'O envelhecimento acarreta défice físico, mental e funcional. Importa avaliar de forma global e adequada.',
    flow: {
      start: safetyEmergent('q1', 'AVC, síncope'),
      emergente: outcome('emergente', 'Situação de emergência.'),
      q1: q('q1', 'Alteração súbita do estado de consciência, quedas repetidas ou trauma craniano?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação muito urgente.'),
      q2: q('q2', 'Febre, desidratação, agravamento de doença crónica?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Reforço de cuidados domiciliários e reavaliação.'),
    },
  },
  {
    id: 'integridade-cutanea', name: 'Integridade Cutânea', category: 'Dermatológico', icon: 'Bandage',
    keywords: ['ferida', 'lesão da pele', 'corpo estranho', 'contusão', 'urticária'],
    rationale: 'A manutenção da integridade cutânea é fundamental para a defesa do organismo.',
    flow: {
      start: q('start', 'Ferida com hemorragia ativa, ferida penetrante profunda ou amputação?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Ativar 112 / SU imediato.'),
      q1: q('q1', 'Ferida extensa, sinais de infeção (rubor, calor, pus) ou corpo estranho retido?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente para sutura/desbridamento.'),
      q2: q('q2', 'Escoriação superficial, contusão sem sinais de infeção?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Limpeza, penso e vacina antitetânica se indicado.'),
      nao_urgente: outcome('nao_urgente', 'Cuidados domiciliários.'),
    },
  },
  {
    id: 'queimaduras', name: 'Queimaduras', category: 'Dermatológico', icon: 'Flame',
    keywords: ['queimadura térmica', 'queimadura química', 'queimadura elétrica', 'escaldão'],
    rationale: 'Lesão da pele por calor, químicos, eletricidade ou frio. Extensão e profundidade determinam a gravidade.',
    flow: {
      start: q('start', 'Queimadura extensa (>10% SC), face, mãos, genitais, via aérea OU queimadura elétrica/química grave?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Queimadura major. Ativar 112. Arrefecer com água durante 20min.'),
      q1: q('q1', 'Queimadura de 2º grau extensa OU 3º grau localizada?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação muito urgente.'),
      q2: q('q2', 'Queimadura de 2º grau limitada (flictenas) sem sinais de infeção?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente para tratamento local.'),
      pouco_urgente: outcome('pouco_urgente', 'Queimadura ligeira (1º grau). Água fria, hidratação, analgesia.'),
    },
  },
  {
    id: 'diabetes', name: 'Diabetes', category: 'Endocrinologia', icon: 'Droplet',
    keywords: ['hipoglicemia', 'hiperglicemia', 'cetoacidose', 'pé diabético'],
    rationale: 'Doença crónica metabólica com risco de descompensação aguda (hipo/hiperglicemia).',
    flow: {
      start: q('start', 'Alteração do estado de consciência, convulsão, glicemia <60 ou >400 mg/dL?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência metabólica. Se hipoglicemia consciente: açúcar oral. Ativar 112.'),
      q1: q('q1', 'Vómitos incoercíveis, dor abdominal, respiração de Kussmaul ou hálito cetónico?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de cetoacidose diabética. SU muito urgente.'),
      q2: q('q2', 'Ferida no pé com sinais de infeção, ou hiperglicemia persistente sintomática?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Descompensação ligeira. Ajuste terapêutico e reavaliação.'),
    },
  },
  {
    id: 'inespecifico', name: 'Problemas Inespecíficos', category: 'Outros', icon: 'HelpCircle',
    keywords: ['sintoma inespecífico', 'informação', 'MSRM'],
    rationale: 'Orientação para situações sem algoritmo específico.',
    flow: {
      start: q('start', 'A situação envolve risco imediato para a pessoa ou terceiros?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Encaminhar para SU ou linha de emergência apropriada.'),
      q1: q('q1', 'Necessita de informação sobre medicação ou orientação clínica?', [
        { label: 'Sim', next: 'nao_urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Consulta programada.'),
      nao_urgente: outcome('nao_urgente', 'Orientação/aconselhamento clínico.'),
    },
  },
  {
    id: 'alergias', name: 'Alergias', category: 'Imunoalergologia', icon: 'AlertTriangle',
    keywords: ['alergia', 'anafilaxia', 'urticária', 'picada de inseto', 'reação medicamentosa'],
    rationale: 'Resposta imunológica exagerada. Anafilaxia é emergência.',
    flow: {
      start: q('start', 'Dificuldade respiratória, edema da face/lábios/língua, hipotensão ou perda de consciência?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Anafilaxia. Adrenalina IM (auto-injetor) e ativar 112.'),
      q1: q('q1', 'Urticária generalizada, angioedema sem compromisso respiratório?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação muito urgente. Anti-histamínico/corticoide.'),
      q2: q('q2', 'Urticária localizada, prurido ou dermatite de contacto?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Anti-histamínico oral. Reavaliação em 24h.'),
      nao_urgente: outcome('nao_urgente', 'Reação ligeira. Evicção do alérgeno.'),
    },
  },
  {
    id: 'corpo-estranho', name: 'Corpo Estranho (Inalação/Aspiração)', category: 'Respiratório', icon: 'AlertOctagon',
    keywords: ['engasgamento', 'aspiração', 'asfixia', 'obstrução via aérea'],
    rationale: 'Ingestão/aspiração comum em pediatria. Pode causar obstrução da via aérea.',
    flow: {
      start: q('start', 'Obstrução completa da via aérea (não consegue falar/tossir), cianose, perda de consciência?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência. Manobra de Heimlich / SBV. Ativar 112.'),
      q1: q('q1', 'Tosse persistente, estridor, dispneia?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de obstrução parcial. SU muito urgente.'),
      q2: q('q2', 'Sem sintomas mas suspeita de ingestão?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente com Rx.'),
      nao_urgente: outcome('nao_urgente', 'Sem sinais de alarme. Vigiar.'),
    },
  },
  {
    id: 'intoxicacao', name: 'Ingestão de Substâncias Tóxicas', category: 'Outros', icon: 'FlaskConical',
    keywords: ['intoxicação', 'overdose', 'veneno', 'CIAV'],
    rationale: 'Efeito nocivo por ingestão, inalação ou contacto. Contactar CIAV: 808 250 143.',
    flow: {
      start: q('start', 'Inconsciência, convulsões, dificuldade respiratória ou instabilidade hemodinâmica?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência tóxica. Ativar 112. Contactar CIAV 808 250 143.'),
      q1: q('q1', 'Ingestão intencional, dose desconhecida ou substância cáustica/pesticida?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'SU muito urgente. Contactar CIAV.'),
      q2: q('q2', 'Sintomas ligeiros (náuseas, tonturas) após exposição a produto pouco tóxico?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Contactar CIAV e vigiar.'),
    },
  },
  {
    id: 'cabeca-pescoco', name: 'Cabeça e Pescoço (Traumatismo)', category: 'Trauma', icon: 'HardHat',
    keywords: ['TCE', 'traumatismo craniano', 'cervical', 'queda'],
    rationale: 'TCE e traumatismo cervical são causas major de morte/incapacidade <45 anos.',
    flow: {
      start: q('start', 'Perda de consciência, vómitos, convulsão, défice neurológico ou suspeita de lesão cervical?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Imobilização cervical, não mobilizar. Ativar 112.'),
      q1: q('q1', 'Cefaleia progressiva, sonolência, amnésia do evento?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação muito urgente com TC.'),
      q2: q('q2', 'Traumatismo ligeiro sem perda de consciência?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Vigilância nas 24h.'),
    },
  },
];

// Algoritmos musculo-esqueléticos partilham lógica semelhante — fábrica
const mskAlgorithm = (id, name, region, keywords) => ({
  id, name, category: 'Músculo-Esquelético', icon: 'Bone', keywords,
  rationale: `As alterações do sistema músculo-esquelético (${region}) são causa frequente de dor e incapacidade. Tratamento habitual: repouso, frio/calor, analgesia, imobilização.`,
  flow: {
    start: q('start', `Deformidade evidente, ferida exposta, hemorragia significativa ou perda de sensibilidade/motilidade em ${region}?`, [
      { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
    ]),
    muito_urgente: outcome('muito_urgente', 'Suspeita de fratura/lesão neurovascular. SU muito urgente.'),
    q1: q('q1', 'Traumatismo com dor intensa, edema significativo ou incapacidade funcional?', [
      { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
    ]),
    urgente: outcome('urgente', 'Avaliação urgente com Rx.'),
    q2: q('q2', 'Dor moderada com mobilidade preservada?', [
      { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
    ]),
    pouco_urgente: outcome('pouco_urgente', 'Repouso, gelo, elevação, analgesia. Reavaliação em 48-72h.'),
    nao_urgente: outcome('nao_urgente', 'Sem gravidade.'),
  },
});

ALGORITHMS.push(
  mskAlgorithm('msk-ombro', 'Ombro / Clavícula / Braço', 'ombro/clavícula/braço', ['ombro', 'clavícula', 'braço', 'fratura', 'hematoma']),
  mskAlgorithm('msk-cotovelo', 'Cotovelo', 'cotovelo', ['cotovelo', 'fratura', 'traumatismo']),
  mskAlgorithm('msk-punho-mao', 'Punho / Mão', 'punho/mão', ['punho', 'mão', 'túnel cárpico', 'fratura']),
  mskAlgorithm('msk-anca', 'Anca', 'anca/fémur', ['anca', 'fémur', 'ciatalgia']),
  mskAlgorithm('msk-joelho', 'Joelho', 'joelho', ['joelho', 'fratura', 'ligamento']),
  mskAlgorithm('msk-tornozelo-pe', 'Tornozelo / Pé', 'tornozelo/pé', ['tornozelo', 'pé', 'entorse', 'luxação']),
  mskAlgorithm('msk-dedos', 'Dedos', 'dedos', ['dedo', 'fratura', 'frieiras']),
);

ALGORITHMS.push(
  {
    id: 'depressao', name: 'Depressão', category: 'Saúde Mental', icon: 'CloudRain',
    keywords: ['depressão', 'tristeza', 'ideação suicida', 'anedonia'],
    rationale: 'Tristeza intensa persistente. Mais frequente 35-44 anos e em mulheres. Avaliar risco suicida.',
    flow: {
      start: q('start', 'Ideação suicida ativa com plano OU tentativa recente?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Risco de suicídio. Não deixar sozinho. Ativar 112.'),
      q1: q('q1', 'Ideação suicida passiva, sintomas graves há semanas?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação psiquiátrica muito urgente.'),
      q2: q('q2', 'Sintomas depressivos com impacto funcional (>2 semanas)?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Referenciação urgente para consulta.'),
      pouco_urgente: outcome('pouco_urgente', 'Consulta programada de saúde mental.'),
    },
  },
  {
    id: 'ansiedade', name: 'Ansiedade', category: 'Saúde Mental', icon: 'Wind',
    keywords: ['ansiedade', 'pânico', 'palpitações', 'medo'],
    rationale: 'Resposta a ameaça/stress. Quando desproporcional pode ser doença.',
    flow: {
      start: q('start', 'Ideação suicida, alucinações ou delírio?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência psiquiátrica.'),
      q1: q('q1', 'Crise de pânico com dor torácica/dispneia — dúvida de causa orgânica?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Excluir causa orgânica primeiro.'),
      q2: q('q2', 'Ansiedade com impacto funcional importante?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação em 24-48h.'),
      pouco_urgente: outcome('pouco_urgente', 'Consulta programada.'),
    },
  },
  {
    id: 'vacinacao', name: 'Reação a Vacinação', category: 'Preventiva', icon: 'Syringe',
    keywords: ['vacina', 'reação vacinal', 'febre', 'BCG', 'DTPa', 'VASPR'],
    rationale: 'Reações adversas às vacinas do PNV. Maioria ligeira e autolimitada.',
    flow: {
      start: q('start', 'Reação anafilática (edema, dispneia, choque) após vacina?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Anafilaxia. Adrenalina + 112.'),
      q1: q('q1', 'Febre >39ºC persistente >48h ou convulsão febril?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      q2: q('q2', 'Dor local, tumefação ou febre ligeira?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Reação esperada. Frio local, paracetamol.'),
      nao_urgente: outcome('nao_urgente', 'Sem reação relevante.'),
    },
  },
  {
    id: 'tonturas', name: 'Tonturas / Vertigem', category: 'Neurológico', icon: 'Rotate3d',
    keywords: ['vertigem', 'tontura', 'labirintite', 'AVC', 'síncope'],
    rationale: 'Sintoma subjetivo com múltiplas causas. Avaliar duração, fatores desencadeantes, sintomas associados.',
    flow: {
      start: q('start', 'Vertigem associada a défice neurológico, cefaleia intensa ou dor torácica?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Suspeita de AVC/causa cardiovascular. Ativar 112.'),
      q1: q('q1', 'Vertigem intensa com vómitos incoercíveis ou perda de audição súbita?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação ORL/Neurologia muito urgente.'),
      q2: q('q2', 'Vertigem posicional recorrente sem sinais de alarme?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'VPPB. Manobras de reposição, anti-vertiginoso.'),
    },
  },
  {
    id: 'lombalgia', name: 'Lombalgia', category: 'Músculo-Esquelético', icon: 'Bone',
    keywords: ['lombalgia', 'ciática', 'hérnia discal', 'coluna'],
    rationale: 'Dor lombar aguda (<4 sem), subaguda (4-12 sem), crónica (>12 sem). Vigiar red flags.',
    flow: {
      start: q('start', 'Incontinência esfincteriana, anestesia em sela, défice motor progressivo?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Suspeita de síndrome da cauda equina. SU imediato.'),
      q1: q('q1', 'Febre, trauma major, história oncológica ou dor noturna intensa?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Red flag — avaliação muito urgente.'),
      q2: q('q2', 'Dor com irradiação para MI, sem défice neurológico?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Ciatalgia. Avaliação e analgesia.'),
      pouco_urgente: outcome('pouco_urgente', 'Lombalgia mecânica. Analgesia, mobilização precoce.'),
    },
  },
  {
    id: 'desmaio', name: 'Desmaio / Lipotímia', category: 'Cardiovascular', icon: 'Activity',
    keywords: ['síncope', 'lipotímia', 'desmaio'],
    rationale: 'Perda súbita e transitória da consciência com recuperação espontânea.',
    flow: {
      start: q('start', 'Síncope com dor torácica, palpitações, esforço, ou trauma associado?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Síncope cardiogénica suspeita. SU muito urgente.'),
      q1: q('q1', 'Contexto vasovagal claro (calor, ortostatismo, jejum, emoção)?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'urgente' },
      ]),
      urgente: outcome('urgente', 'Síncope de causa indeterminada — avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Síncope vasovagal. Hidratação, decúbito, reavaliação.'),
    },
  },
  {
    id: 'cor-fezes', name: 'Alteração da Cor das Fezes', category: 'Digestivo', icon: 'Stethoscope',
    keywords: ['melenas', 'fezes brancas', 'sangue nas fezes', 'hemorroidas'],
    rationale: 'Alterações da cor podem indicar patologia hepatobiliar ou hemorragia digestiva.',
    flow: {
      start: q('start', 'Melenas abundantes ou hematoquézias com instabilidade hemodinâmica?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Hemorragia digestiva grave. Ativar 112.'),
      q1: q('q1', 'Fezes brancas/acólicas com icterícia?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita de obstrução biliar.'),
      q2: q('q2', 'Sangue vivo ligeiro, sem sinais sistémicos (provável hemorroidas)?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Consulta programada de gastro/proctologia.'),
    },
  },
  {
    id: 'crise-adaptacao', name: 'Adaptação em Situação de Crise', category: 'Saúde Mental', icon: 'ShieldAlert',
    keywords: ['luto', 'catástrofe', 'incêndio', 'crise', 'trauma psicológico'],
    rationale: 'Situações de crise/exceção podem provocar reações de aflição, medo ou perturbação de adaptação (>3 meses).',
    flow: {
      start: q('start', 'Ideação suicida ou risco para si/terceiros?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência psiquiátrica.'),
      q1: q('q1', 'Crise de pânico intensa, dissociação ou incapacidade de funcionar?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação psiquiátrica muito urgente.'),
      q2: q('q2', 'Sintomas persistem >3 meses após evento?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Perturbação de adaptação. Referenciar.'),
      pouco_urgente: outcome('pouco_urgente', 'Suporte psicossocial.'),
    },
  },
  {
    id: 'respiratorio-agudo', name: 'Problema Respiratório Agudo', category: 'Respiratório', icon: 'Wind',
    keywords: ['dispneia', 'tosse', 'asma', 'gripe', 'covid'],
    rationale: 'Sintomas mais frequentes: tosse, dispneia, sibilos, febre, estridor, hemoptises.',
    flow: {
      start: q('start', 'Dificuldade respiratória grave, cianose, incapaz de completar frases?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Insuficiência respiratória. Ativar 112.'),
      q1: q('q1', 'Sibilos importantes, tiragem, saturação <92% (se disponível)?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Crise asmática/broncospasmo. SU muito urgente.'),
      q2: q('q2', 'Febre alta com dispneia moderada e tosse produtiva?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q3' },
      ]),
      urgente: outcome('urgente', 'Suspeita pneumonia. Avaliação urgente.'),
      q3: q('q3', 'Sintomas gripais (tosse, febre baixa, mialgias) sem dispneia?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Vírus respiratório. Sintomático.'),
      nao_urgente: outcome('nao_urgente', 'Sem sinais de alarme.'),
    },
  },
  {
    id: 'nauseas-vomitos', name: 'Náuseas e Vómitos (Adulto)', category: 'Digestivo', icon: 'Stethoscope',
    keywords: ['náuseas', 'vómitos', 'hematémese', 'desidratação'],
    rationale: 'Sintomas comuns com múltiplas causas. Vigiar sinais de gravidade.',
    flow: {
      start: q('start', 'Vómitos com sangue (hematémese), desidratação grave ou sinais neurológicos?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Hemorragia digestiva alta ou causa neurológica. Ativar 112.'),
      q1: q('q1', 'Vómitos persistentes >24h, dor abdominal intensa, febre alta?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente para exclusão de causa cirúrgica.'),
      q2: q('q2', 'Vómitos ligeiros com boa tolerância oral?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Antieméticos, hidratação oral.'),
      nao_urgente: outcome('nao_urgente', 'Sem gravidade.'),
    },
  },
  {
    id: 'diarreia', name: 'Diarreia (Adulto)', category: 'Digestivo', icon: 'Stethoscope',
    keywords: ['diarreia', 'gastroenterite', 'melenas', 'desidratação'],
    rationale: 'Fezes moles/líquidas >3x/dia. Habitualmente autolimitada em 1-2 dias.',
    flow: {
      start: q('start', 'Diarreia com sangue, desidratação grave ou febre alta persistente?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'SU muito urgente.'),
      q1: q('q1', 'Diarreia >72h, viajante, imunossupressão ou toma recente de antibiótico?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      q2: q('q2', 'Diarreia ligeira sem sinais de alarme?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Hidratação, dieta leve. Reavaliação se persistir.'),
      nao_urgente: outcome('nao_urgente', 'Vigilância.'),
    },
  },
  {
    id: 'rash', name: 'Rash (Adulto)', category: 'Dermatológico', icon: 'Bandage',
    keywords: ['exantema', 'rash', 'petéquias', 'urticária', 'stevens-johnson'],
    rationale: 'Manchas/pápulas na pele em contexto agudo. Pode indicar infeção sistémica.',
    flow: {
      start: q('start', 'Petéquias/púrpura com febre, sinais meníngeos, hipotensão ou descolamento epidérmico?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Suspeita meningococcemia/Stevens-Johnson. Ativar 112.'),
      q1: q('q1', 'Rash com febre alta, atingimento mucoso ou mau estado geral?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação muito urgente.'),
      q2: q('q2', 'Rash pruriginoso com contexto claro (medicamento, alimento)?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Provável reação alérgica.'),
      pouco_urgente: outcome('pouco_urgente', 'Emoliente e vigilância.'),
    },
  },
  {
    id: 'sarampo', name: 'Suspeita de Sarampo', category: 'Infeciologia', icon: 'AlertTriangle',
    keywords: ['sarampo', 'exantema', 'Koplik', 'contacto'],
    rationale: 'Emergência de saúde pública. Contagioso 4 dias antes até 4 dias após exantema. Isolamento e notificação.',
    flow: {
      start: q('start', 'Sinais de gravidade (dispneia, alteração da consciência, convulsão)?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Isolar. Ativar 112. Notificar DGS.'),
      q1: q('q1', 'Febre + rash maculopapular + tosse OU rinite OU conjuntivite?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Caso possível. Isolamento e notificação imediata.'),
      q2: q('q2', 'Contacto com caso confirmado nos últimos 23 dias?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      urgente: outcome('urgente', 'Vigilância epidemiológica.'),
      nao_urgente: outcome('nao_urgente', 'Sem critérios.'),
    },
  },
  {
    id: 'orofaringe', name: 'Orofaringe (Adulto)', category: 'Cabeça e Pescoço', icon: 'Mic',
    keywords: ['dor de garganta', 'amigdalite', 'faringite', 'odinofagia', 'disfagia'],
    rationale: 'Excluir sequencialmente: dificuldade respiratória, odinofagia grave, disfagia, disfonia.',
    flow: {
      start: q('start', 'Dificuldade respiratória, estridor, sialorreia, incapacidade de engolir saliva?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Suspeita epiglotite/abcesso. Ativar 112 sem examinar orofaringe.'),
      q1: q('q1', 'Febre alta, tumefação cervical ou abscesso visível?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Avaliação ORL urgente.'),
      q2: q('q2', 'Dor de garganta com placas/exsudado e febre?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Suspeita amigdalite bacteriana.'),
      pouco_urgente: outcome('pouco_urgente', 'Provável faringite viral. Sintomático.'),
    },
  },
  {
    id: 'gravidez', name: 'Problema na Gravidez', category: 'Materno-Infantil', icon: 'Baby',
    keywords: ['gravidez', 'pré-eclâmpsia', 'hemorragia vaginal', 'trabalho de parto'],
    rationale: 'Mulher 12-65a grávida ou com possibilidade de gravidez (atraso >7 dias).',
    flow: {
      start: q('start', 'Hemorragia vaginal abundante, dor abdominal intensa, contrações regulares, convulsão ou perda de consciência?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Urgência obstétrica. Ativar 112.'),
      q1: q('q1', 'Cefaleia intensa, epigastralgia, alterações visuais, edemas?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita pré-eclâmpsia. SU obstetrícia.'),
      q2: q('q2', 'Hiperemese, febre, corrimento anormal, prurido intenso?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação obstétrica urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Sintomas comuns da gravidez.'),
    },
  },
  {
    id: 'ginecologico-12mais', name: 'Ginecológico/Mamário (≥12 anos)', category: 'Ginecológico', icon: 'Heart',
    keywords: ['dor genital', 'infeção ginecológica', 'mastite', 'agressão sexual'],
    rationale: 'Mulher ≥12 anos com queixas ginecológicas ou mamárias.',
    flow: {
      start: q('start', 'Agressão sexual, hemorragia abundante, dor pélvica intensa?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'SU Ginecologia imediato.'),
      q1: q('q1', 'Febre com dor pélvica ou mastite com sinais sistémicos?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      q2: q('q2', 'Corrimento, prurido ou dor genital ligeira?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Consulta programada.'),
      nao_urgente: outcome('nao_urgente', 'Sem urgência.'),
    },
  },
  {
    id: 'saude-mulher', name: 'Saúde da Mulher (≥12 anos, não grávida)', category: 'Ginecológico', icon: 'Heart',
    keywords: ['hemorragia genital', 'dor genital', 'infeção mamária'],
    rationale: 'Mulher ≥12 anos não grávida e sem cirurgia recente.',
    flow: {
      start: q('start', 'Hemorragia intensa, dor pélvica súbita ou febre alta?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'SU Ginecologia muito urgente.'),
      q1: q('q1', 'Dor moderada, corrimento anormal, dispareunia?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Consulta programada.'),
    },
  },
  {
    id: 'pos-cirurgia-gin', name: 'Após Cirurgia Ginecológica/Mamária', category: 'Ginecológico', icon: 'Scissors',
    keywords: ['pós-operatório', 'infeção cicatriz', 'hemorragia', 'cirurgia mamária'],
    rationale: 'Mulher com cirurgia gineco/mamária nas últimas 6 semanas.',
    flow: {
      start: q('start', 'Hemorragia abundante, dispneia súbita, febre >38.5ºC?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Complicação major — SU do hospital operador.'),
      q1: q('q1', 'Cicatriz com sinais de infeção (rubor, exsudado, deiscência)?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      q2: q('q2', 'Dor controlada com analgesia, sem sinais de alarme?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Reavaliação em 24-48h.'),
      nao_urgente: outcome('nao_urgente', 'Sem complicações.'),
    },
  },
  {
    id: 'puerperio', name: 'Puerpério / Pós-Abortamento', category: 'Materno-Infantil', icon: 'Baby',
    keywords: ['puerpério', 'hemorragia pós-parto', 'mastite', 'pré-eclâmpsia tardia'],
    rationale: 'Mulher 12-65a com parto/abortamento <6 semanas.',
    flow: {
      start: q('start', 'Hemorragia abundante, dispneia, cefaleia intensa, convulsão?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência puerperal. Ativar 112.'),
      q1: q('q1', 'Febre, dor pélvica, lóquios fétidos ou mastite?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'Suspeita infeção puerperal.'),
      q2: q('q2', 'Cicatriz cirúrgica com sinais inflamatórios?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'pouco_urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Reavaliação de rotina.'),
    },
  },
  {
    id: 'ouvido', name: 'Problema do Ouvido', category: 'Cabeça e Pescoço', icon: 'Ear',
    keywords: ['otalgia', 'otite', 'acufenos', 'surdez súbita', 'otorreia'],
    rationale: 'Ouvido externo/médio/interno. Otites, traumatismos, alterações auditivas.',
    flow: {
      start: q('start', 'Surdez súbita, otorragia após TCE, vertigem intensa com sintomas neurológicos?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q1' },
      ]),
      muito_urgente: outcome('muito_urgente', 'ORL muito urgente.'),
      q1: q('q1', 'Otalgia intensa com febre, otorreia purulenta ou tumefação retro-auricular?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Suspeita otite complicada.'),
      q2: q('q2', 'Otalgia ligeira, ouvido tapado, cerúmen?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Analgesia, consulta programada.'),
      nao_urgente: outcome('nao_urgente', 'Sem gravidade.'),
    },
  },
  {
    id: 'ginecologico-menor12', name: 'Ginecológico/Mamário (<12 anos)', category: 'Ginecológico', icon: 'Heart',
    keywords: ['patologia vulvar pediátrica', 'trauma genital criança', 'agressão sexual'],
    rationale: 'Mulher <12 anos com queixas ginecológicas/mamárias. Alta suspeição para maus tratos.',
    flow: {
      start: q('start', 'Suspeita de agressão sexual ou maus tratos?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'SU pediatria/ginecologia imediato. Ativar proteção infantil.'),
      q1: q('q1', 'Hemorragia vaginal, trauma, dor intensa?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'SU muito urgente.'),
      q2: q('q2', 'Sintomas ligeiros (prurido, corrimento)?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Consulta pediatria.'),
      nao_urgente: outcome('nao_urgente', 'Sem urgência.'),
    },
  },
  {
    id: 'temperatura', name: 'Alteração da Temperatura (Adulto)', category: 'Infeciologia', icon: 'Thermometer',
    keywords: ['febre', 'hipertermia', 'hipotermia', 'golpe de calor'],
    rationale: 'Febre: ≥1ºC acima da média individual. Hipotermia: perda de calor > produção.',
    flow: {
      start: q('start', 'T>40ºC OU <35ºC com alteração da consciência, convulsão ou sinais meníngeos?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Emergência térmica. Ativar 112.'),
      q1: q('q1', 'Febre alta persistente >72h, arrepios ou sinais de sépsis?', [
        { label: 'Sim', next: 'muito_urgente' }, { label: 'Não', next: 'q2' },
      ]),
      muito_urgente: outcome('muito_urgente', 'SU muito urgente.'),
      q2: q('q2', 'Febre com sintomas gripais controláveis?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'urgente' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente.'),
      pouco_urgente: outcome('pouco_urgente', 'Antipirético, hidratação.'),
    },
  },
  {
    id: 'exposicao-solar', name: 'Exposição Solar / Calor', category: 'Ambiental', icon: 'Sun',
    keywords: ['golpe de calor', 'insolação', 'escaldão solar', 'desidratação'],
    rationale: 'Síndromes térmicas sistémicas e lesões cutâneas por exposição solar/calor.',
    flow: {
      start: q('start', 'Alteração da consciência, T>40ºC, convulsão em contexto de calor?', [
        { label: 'Sim', next: 'emergente' }, { label: 'Não', next: 'q1' },
      ]),
      emergente: outcome('emergente', 'Golpe de calor. Arrefecer + ativar 112.'),
      q1: q('q1', 'Exaustão pelo calor (fraqueza, tonturas, sudorese profusa)?', [
        { label: 'Sim', next: 'urgente' }, { label: 'Não', next: 'q2' },
      ]),
      urgente: outcome('urgente', 'Avaliação urgente. Reidratação.'),
      q2: q('q2', 'Queimadura solar (1º grau) ou desidratação ligeira?', [
        { label: 'Sim', next: 'pouco_urgente' }, { label: 'Não', next: 'nao_urgente' },
      ]),
      pouco_urgente: outcome('pouco_urgente', 'Hidratação, ambiente fresco, hidratante cutâneo.'),
      nao_urgente: outcome('nao_urgente', 'Sem gravidade.'),
    },
  },
);

export const ALGORITHM_CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'Cardiovascular', label: 'Cardiovascular' },
  { key: 'Neurológico', label: 'Neurológico' },
  { key: 'Respiratório', label: 'Respiratório' },
  { key: 'Digestivo', label: 'Digestivo' },
  { key: 'Genito-Urinário', label: 'Genito-Urinário' },
  { key: 'Ginecológico', label: 'Ginecológico' },
  { key: 'Materno-Infantil', label: 'Materno-Infantil' },
  { key: 'Cabeça e Pescoço', label: 'Cabeça e Pescoço' },
  { key: 'Oftalmológico', label: 'Oftalmológico' },
  { key: 'Dermatológico', label: 'Dermatológico' },
  { key: 'Músculo-Esquelético', label: 'Músculo-Esquelético' },
  { key: 'Trauma', label: 'Trauma' },
  { key: 'Saúde Mental', label: 'Saúde Mental' },
  { key: 'Endocrinologia', label: 'Endocrinologia' },
  { key: 'Imunoalergologia', label: 'Imunoalergologia' },
  { key: 'Infeciologia', label: 'Infeciologia' },
  { key: 'Geriatria', label: 'Geriatria' },
  { key: 'Preventiva', label: 'Preventiva' },
  { key: 'Ambiental', label: 'Ambiental' },
  { key: 'Outros', label: 'Outros' },
];

export const QUICK_EXAMPLES = [
  'Doente com dor forte na barriga do lado direito em baixo, com vómitos e febre desde ontem.',
  'Aperto no peito que vai para o braço esquerdo, suores frios e falta de ar.',
  'Dor de cabeça muito forte de repente, a pior de sempre, com vómitos e pescoço tenso.',
  'Bebé de 2 meses com febre 38.5ºC, prostrado e recusa alimentar.',
  'Queda de cadeirão há 1h, sem perda de consciência, dor no punho e edema.',
];
