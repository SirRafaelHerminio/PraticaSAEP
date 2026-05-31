/**
 * app.js
 * SAEP — Gerador de Provas Práticas SENAI
 * Lógica principal da aplicação
 */

/* ── Estado da aplicação ──────────────────────────────────── */
const state = {
  selectedCourse: null,
  selectedDiff:   null,
  selectedFormat: null,
  assetsEnabled:  false,
  driveLink:      '',
  generatedText:  '',
  isLoading:      false,
};

/* ── Provedores de IA ─────────────────────────────────────── */
const PROVIDERS = {
  gemini: {
    name:        'Google Gemini',
    shortName:   'Gemini',
    free:        true,
    placeholder: 'AIza...',
    prefix:      'AIza',
    model:       'gemini-2.0-flash',
    docsUrl:     'https://aistudio.google.com/app/apikey',
    docsLabel:   'aistudio.google.com',
    hint:        'Gratuito. Obtenha em',
    storageKey:  'saep_gemini_key',
  },
  groq: {
    name:        'Groq',
    shortName:   'Groq',
    free:        true,
    placeholder: 'gsk_...',
    prefix:      'gsk_',
    model:       'llama-3.3-70b-versatile',
    docsUrl:     'https://console.groq.com/keys',
    docsLabel:   'console.groq.com',
    hint:        'Gratuito (com limites generosos). Obtenha em',
    storageKey:  'saep_groq_key',
  },
  openai: {
    name:        'OpenAI',
    shortName:   'OpenAI',
    free:        false,
    placeholder: 'sk-proj-...',
    prefix:      'sk-',
    model:       'gpt-4o-mini',
    docsUrl:     'https://platform.openai.com/api-keys',
    docsLabel:   'platform.openai.com',
    hint:        'Requer créditos. Obtenha em',
    storageKey:  'saep_openai_key',
  },
  anthropic: {
    name:        'Anthropic (Claude)',
    shortName:   'Claude',
    free:        false,
    placeholder: 'sk-ant-api03-...',
    prefix:      'sk-ant-',
    model:       'claude-sonnet-4-20250514',
    docsUrl:     'https://console.anthropic.com/settings/keys',
    docsLabel:   'console.anthropic.com',
    hint:        'Requer créditos. Obtenha em',
    storageKey:  'saep_anthropic_api_key',
  },
};

// Provedor selecionado atualmente no modal
let modalSelectedProvider = null;

function getActiveProvider() {
  return localStorage.getItem('saep_active_provider') || null;
}

function getKeyForProvider(providerId) {
  const p = PROVIDERS[providerId];
  return p ? localStorage.getItem(p.storageKey) || '' : '';
}

function getActiveKey() {
  const active = getActiveProvider();
  return active ? getKeyForProvider(active) : '';
}

/* ── Seleciona provedor no modal ──────────────────────────── */
function selectProvider(id) {
  modalSelectedProvider = id;
  const p = PROVIDERS[id];

  // Atualiza cards
  Object.keys(PROVIDERS).forEach(pid => {
    document.getElementById('prov-' + pid).classList.toggle('selected', pid === id);
  });

  // Info box
  const infoBox = document.getElementById('providerInfoBox');
  infoBox.innerHTML = `
    <div class="prov-info-content">
      <i class="ti ${p.free ? 'ti-star' : 'ti-credit-card'}" style="color:${p.free ? 'var(--green)' : 'var(--amber)'}"></i>
      <span>${p.free ? '✅ Plano gratuito disponível' : '💳 Requer conta com créditos'} — Modelo: <strong>${p.model}</strong></span>
    </div>`;
  infoBox.style.display = 'block';

  // Input
  const input  = document.getElementById('apiKeyInput');
  const label  = document.getElementById('apiKeyLabel');
  const hint   = document.getElementById('apiKeyHint');
  const btnSave= document.getElementById('btnSaveKey');

  input.placeholder = p.placeholder;
  input.disabled    = false;
  input.value       = getKeyForProvider(id);
  label.textContent = `Chave de API — ${p.name}`;
  hint.innerHTML    = `${p.hint} <a href="${p.docsUrl}" target="_blank" rel="noopener">${p.docsLabel} <i class="ti ti-external-link"></i></a>`;
  btnSave.disabled  = false;
}

/* ── Salva chave ──────────────────────────────────────────── */
function saveApiKey() {
  if (!modalSelectedProvider) {
    showToast('Selecione um provedor de IA primeiro.', 'error');
    return;
  }
  const key = document.getElementById('apiKeyInput').value.trim();
  const p   = PROVIDERS[modalSelectedProvider];

  if (!key) {
    showValidation('Informe a chave de API antes de salvar.');
    return;
  }
  if (!key.startsWith(p.prefix)) {
    showValidation(`A chave do ${p.name} deve começar com "${p.prefix}". Verifique se copiou corretamente (sem espaços extras).`);
    return;
  }

  // Aviso específico para Gemini: restrição obrigatória a partir de 19/06/2026
  if (modalSelectedProvider === 'gemini') {
    const deadline = new Date('2026-06-19');
    const today    = new Date();
    if (today < deadline) {
      const dias = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      showToast(`⚠️ A partir de 19/06/2026 (em ${dias} dias), chaves Gemini precisarão ter restrição de API configurada no Google Cloud Console. Acesse aistudio.google.com para ajustar.`, 'info');
    }
  }

  localStorage.setItem(p.storageKey, key);
  localStorage.setItem('saep_active_provider', modalSelectedProvider);
  closeConfig();
  updateProviderBadge();
  checkApiKey();
  showToast(`${p.name} configurado com sucesso!`, 'success');
}

/* ── Atualiza badge no header ─────────────────────────────── */
function updateProviderBadge() {
  const active = getActiveProvider();
  const dot    = document.getElementById('providerDot');
  const label  = document.getElementById('btnConfigLabel');
  if (active && PROVIDERS[active]) {
    dot.classList.add('active');
    label.textContent = PROVIDERS[active].shortName + ' configurado';
  } else {
    dot.classList.remove('active');
    label.textContent = 'Configurar IA';
  }
}

/* ── Verifica se há chave configurada ─────────────────────── */
function checkApiKey() {
  const warning = document.getElementById('apiWarning');
  const active  = getActiveProvider();
  const hasKey  = active && getKeyForProvider(active);
  warning.style.display = hasKey ? 'none' : 'block';
  updateProviderBadge();
}

/* ── Abre modal ───────────────────────────────────────────── */
function openConfig() {
  const modal = document.getElementById('modalConfig');
  modal.classList.add('open');

  // Pré-seleciona o provedor ativo (se houver)
  const active = getActiveProvider();
  if (active && PROVIDERS[active]) {
    selectProvider(active);
  } else {
    // Pré-seleciona Gemini por padrão (gratuito)
    selectProvider('gemini');
  }
}

function closeConfig() {
  document.getElementById('modalConfig').classList.remove('open');
  modalSelectedProvider = null;
}



function toggleApiVis() {
  const input   = document.getElementById('apiKeyInput');
  const icon    = document.getElementById('eyeIcon');
  const isPass  = input.type === 'password';
  input.type    = isPass ? 'text' : 'password';
  icon.className = isPass ? 'ti ti-eye-off' : 'ti ti-eye';
}

/* ── Renderiza cursos ─────────────────────────────────────── */
function renderCourses(list) {
  const grid = document.getElementById('coursesGrid');
  if (list.length === 0) {
    grid.innerHTML = '<p style="color:var(--gray-400);font-size:13px;grid-column:1/-1;padding:.5rem 0">Nenhum curso encontrado.</p>';
    return;
  }
  grid.innerHTML = list.map(c => `
    <div
      class="course-item${state.selectedCourse && state.selectedCourse.id === c.id ? ' selected' : ''}"
      onclick="selectCourse('${c.id}')"
      role="option"
      aria-selected="${state.selectedCourse && state.selectedCourse.id === c.id}"
      tabindex="0"
      onkeydown="if(event.key==='Enter'||event.key===' ')selectCourse('${c.id}')"
    >
      <i class="ti ${c.icon}" aria-hidden="true"></i>
      <div>
        <div class="c-name">${c.name}</div>
        <div class="c-area">${c.area}</div>
      </div>
    </div>
  `).join('');
}

function filterCourses() {
  const q = document.getElementById('courseSearch').value.toLowerCase().trim();
  if (!q) { renderCourses(COURSES); return; }
  renderCourses(COURSES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.area.toLowerCase().includes(q)
  ));
}

function selectCourse(id) {
  state.selectedCourse = COURSES.find(c => c.id === id) || null;
  filterCourses();
  const info = document.getElementById('selectedCourseInfo');
  if (state.selectedCourse) {
    document.getElementById('selectedCourseName').textContent = state.selectedCourse.name;
    info.style.display = 'block';
  } else {
    info.style.display = 'none';
  }
  updateStepIndicators();
}

/* ── Dificuldade ──────────────────────────────────────────── */
function selectDiff(d) {
  state.selectedDiff = d;
  ['easy', 'med', 'hard'].forEach(x => {
    const el = document.getElementById('diff-' + x);
    el.className = 'diff-item diff-' + x + (x === d ? ' sel-' + d : '');
    el.setAttribute('aria-pressed', x === d ? 'true' : 'false');
  });
  updateStepIndicators();
}

/* ── Formato ──────────────────────────────────────────────── */
function selectFormat(f) {
  state.selectedFormat = f;
  ['pdf', 'docx'].forEach(x => {
    document.getElementById('fmt-' + x).className = 'fmt-item' + (x === f ? ' selected' : '');
  });
  updateStepIndicators();
}

/* ── Assets toggle ────────────────────────────────────────── */
function toggleAssets() {
  state.assetsEnabled = !state.assetsEnabled;
  document.getElementById('assetsToggle').className = 'toggle-sw' + (state.assetsEnabled ? ' on' : '');
  document.getElementById('driveInput').className  = 'drive-field' + (state.assetsEnabled ? ' show' : '');
  document.getElementById('assetsToggleRow').setAttribute('aria-checked', state.assetsEnabled);
}

/* ── Indicadores de passo ─────────────────────────────────── */
function updateStepIndicators() {
  const done = [
    !!state.selectedCourse,
    !!state.selectedDiff,
    !!state.selectedFormat,
    false,
  ];
  done.forEach((isDone, i) => {
    const num   = document.getElementById('sn' + (i + 1));
    const label = document.getElementById('pl' + (i + 1));
    if (isDone) {
      num.className = 'prog-num done';
      num.innerHTML = '<i class="ti ti-check" style="font-size:10px"></i>';
    } else if (i === 0 || done[i - 1]) {
      num.className = 'prog-num active';
      num.textContent = i + 1;
    } else {
      num.className = 'prog-num';
      num.textContent = i + 1;
    }
    if (label) label.className = 'prog-label' + (isDone || (i === 0 || done[i-1]) ? ' active' : '');
  });
}

/* ── Validação ────────────────────────────────────────────── */
function showValidation(msg) {
  const el = document.getElementById('valMsg');
  document.getElementById('valText').textContent = msg;
  el.className = 'validation-msg show';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { el.className = 'validation-msg'; }, 5000);
}

/* ── Loading ──────────────────────────────────────────────── */
const LOADING_STEPS = [
  ['Lendo o Projeto Pedagógico do Curso...', 'Identificando competências e unidades curriculares'],
  ['Mapeando habilidades e saberes técnicos...', 'Cruzando com o banco de competências SENAI'],
  ['Construindo a Situação-Problema...', 'Criando contexto real de mercado de trabalho'],
  ['Definindo entregas e critérios avaliativos...', 'Estruturando no padrão SAEP'],
  ['Elaborando especificações técnicas...', 'Ajustando ao nível de dificuldade selecionado'],
  ['Finalizando o caderno de prova...', 'Revisando orientações e completude das entregas'],
];

let loadIdx = 0;
let loadTimer = null;

function startLoading() {
  loadIdx = 0;
  state.isLoading = true;
  document.getElementById('loadingArea').className = 'loading-area show';
  document.getElementById('resultArea').className = 'result-area';
  document.getElementById('genBtn').disabled = true;
  updateLoadText();
  loadTimer = setInterval(() => {
    loadIdx = (loadIdx + 1) % LOADING_STEPS.length;
    updateLoadText();
  }, 2000);
  document.getElementById('loadingArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateLoadText() {
  document.getElementById('loadingText').textContent = LOADING_STEPS[loadIdx][0];
  document.getElementById('loadingSub').textContent  = LOADING_STEPS[loadIdx][1];
}

function stopLoading() {
  clearInterval(loadTimer);
  loadTimer = null;
  state.isLoading = false;
  document.getElementById('loadingArea').className = 'loading-area';
  document.getElementById('genBtn').disabled = false;
}

/* ── Monta o prompt para a IA ─────────────────────────────── */
function buildPrompt() {
  const { selectedCourse: course, selectedDiff: diff, selectedFormat: fmt, assetsEnabled, driveLink } = state;

  const diffConfig = {
    easy: {
      label:        'FÁCIL — Diagnóstica de entrada',
      entregas:     '1 a 2 entregas simples',
      tempo:        '1 hora e 30 minutos',
      ucs:          '1 Unidade Curricular (a primeira ou mais fundamental do curso)',
      complexidade: `
- Teste apenas os conceitos mais básicos e fundamentais da UC escolhida
- Atividades de identificação, nomeação de componentes/ferramentas, procedimentos simples com passo a passo guiado
- O aluno NÃO precisa integrar saberes de múltiplas UCs
- Linguagem simples nas instruções, sem pressuposição de prática anterior
- Adequado para quem acabou de iniciar o curso ou está nas primeiras semanas`,
    },
    med: {
      label:        'MÉDIO — Diagnóstica intermediária',
      entregas:     '3 a 4 entregas',
      tempo:        '2 horas',
      ucs:          '2 a 3 Unidades Curriculares integradas',
      complexidade: `
- Exige aplicação prática real, não apenas identificação
- O aluno precisa integrar saberes de pelo menos 2 UCs do curso
- Inclua tomada de decisão técnica simples (ex: escolher o componente correto, interpretar um resultado de medição)
- Mencione normas técnicas e equipamentos específicos do curso
- Adequado para alunos no meio do itinerário formativo`,
    },
    hard: {
      label:        'DIFÍCIL — Padrão SAEP completo',
      entregas:     '4 a 5 entregas encadeadas',
      tempo:        '3 horas',
      ucs:          'Todas as Unidades Curriculares do curso integradas',
      complexidade: `
- Integra competências de todo o itinerário formativo
- Exige planejamento, execução, documentação técnica e verificação
- Situação-problema complexa com múltiplas variáveis e decisões técnicas
- As entregas devem ser encadeadas (o resultado de uma alimenta a próxima)
- Mencione normas técnicas obrigatórias, EPIs quando aplicável, e critérios de qualidade
- Deve ser indistinguível de uma prova SAEP real aplicada pelo SENAI
- Adequado para alunos que concluíram ou estão concluindo o curso`,
    },
  }[diff];

  const contextLine = course.context
    ? `\nCONTEXTO ESPECÍFICO DO CURSO — LEIA ANTES DE GERAR:\n${course.context}\n`
    : '';

  const driveLine = (assetsEnabled && driveLink)
    ? `\nO professor disponibilizou materiais e assets externos em: ${driveLink} — inclua esse link na seção ANEXOS.`
    : '';

  const fmtLine = fmt === 'pdf'
    ? 'Formato de entrega: PDF. Formatação limpa, sem tabelas complexas.'
    : 'Formato de entrega: DOCX (Word). Use títulos e seções bem definidos.';

  return `Você é um especialista sênior em educação profissional do SENAI com profundo conhecimento dos Projetos Pedagógicos de Curso (PPCs), Itinerários Formativos e do Sistema de Avaliação da Educação Profissional (SAEP).

Sua tarefa é criar uma prova prática diagnóstica COMPLETA e AUTÊNTICA para o curso abaixo.

═══════════════════════════════════════════
CURSO: ${course.name}
ÁREA: ${course.area}
NÍVEL: ${diffConfig.label}
ESCOPO DE UCs: ${diffConfig.ucs}
NÚMERO DE ENTREGAS: ${diffConfig.entregas}
TEMPO TOTAL: ${diffConfig.tempo}
${fmtLine}
${driveLine}
═══════════════════════════════════════════

${contextLine}INSTRUÇÃO PRINCIPAL — LEIA COM ATENÇÃO:
Você conhece o currículo oficial do SENAI para o curso de ${course.name}. Use esse conhecimento para:
1. Identificar as Unidades Curriculares reais desse curso e suas competências
2. Selecionar as UCs adequadas para o nível ${diffConfig.label}
3. Criar uma situação-problema que exija exatamente as competências dessas UCs
4. Usar a terminologia técnica correta do campo profissional desse curso
5. Citar normas técnicas, equipamentos, softwares e ferramentas que são realmente usados nessa área

PERFIL DE COMPLEXIDADE PARA ESTE NÍVEL:
${diffConfig.complexidade}

REGRAS DE AUTENTICIDADE:
- A empresa fictícia deve ser de um setor que REALMENTE contrata técnicos em ${course.name}
- Os problemas técnicos devem ser REAIS e frequentes no mercado de trabalho dessa área
- As entregas devem ser EXECUTÁVEIS em ambiente de laboratório/oficina do SENAI
- NÃO invente normas, equipamentos ou procedimentos que não existem
- NÃO use situações genéricas como "uma empresa qualquer precisou de ajuda"

ESTRUTURA OBRIGATÓRIA — use EXATAMENTE estes separadores e títulos:

---
CADERNO DE PROVA DO ESTUDANTE

Curso: ${course.name}
Versão do Itinerário Formativo: {{itinerario}}
Estudante: {{nome}}
CPF: {{cpf}}
UF: {{uf}}

---
ORIENTAÇÕES GERAIS

Liste 7 orientações no padrão SENAI. Inclua obrigatoriamente: guardar celular, 30 minutos de ambientação para leitura, tempo de ${diffConfig.tempo} para execução, uso de EPIs conforme a atividade, devolver caderno ao avaliador, assinar canhoto ao final, dúvidas somente com o avaliador.

---
SITUAÇÃO-PROBLEMA

Título objetivo de 1 linha resumindo o desafio técnico.

---
CONTEXTUALIZAÇÃO

3 parágrafos descrevendo: (1) a empresa fictícia com nome, cidade, setor e porte; (2) o processo ou sistema onde o problema ocorre, com detalhes técnicos reais do curso ${course.name}; (3) por que um técnico em ${course.name} foi chamado e o que está em jogo.

---
DESAFIO

2 parágrafos: (1) o que o estudante — no papel de técnico em ${course.name} — deverá fazer, com linguagem técnica precisa; (2) quais recursos estarão disponíveis no posto de trabalho.

---
RESULTADOS E ENTREGAS ESPERADOS

Para cada entrega use este formato exato:
Entrega [N] — [Nome da Entrega] (Tempo estimado: XX min)
[Descrição objetiva do que deve ser entregue ou executado]

Total: ${diffConfig.entregas}.

---
ESPECIFICAÇÕES TÉCNICAS DAS ENTREGAS

Para cada entrega, uma subseção com:
• Requisitos técnicos detalhados
• Critérios de aceitação mensuráveis
• Normas ou referências técnicas aplicáveis
• Ferramentas/equipamentos/softwares necessários

${assetsEnabled && driveLink ? `---
ANEXOS

Link dos materiais: ${driveLink}
Liste quais materiais o professor deve disponibilizar nesse link (esquemas, datasheets, arquivos de projeto, imagens de referência, etc.) com base no desafio proposto.

` : ''}---
NOTA AO PROFESSOR — CRITÉRIOS DE AVALIAÇÃO

Para cada entrega: o que observar, o que pontuar, erros comuns esperados e como diferenciar um desempenho satisfatório de um insatisfatório. Tom direto, como um guia de avaliação real.

---

Gere a prova completa agora. Seja técnico, específico e autêntico — como se fosse uma prova real do SENAI:`;
}

/* ── Dispatcher multi-provedor ────────────────────────────── */
async function callAI(prompt) {
  const providerId = getActiveProvider();
  if (!providerId) throw new Error('API_KEY_MISSING');

  const key = getKeyForProvider(providerId);
  if (!key)  throw new Error('API_KEY_MISSING');

  switch (providerId) {
    case 'gemini':    return callGemini(prompt, key);
    case 'groq':      return callGroq(prompt, key);
    case 'openai':    return callOpenAI(prompt, key);
    case 'anthropic': return callAnthropic(prompt, key);
    default: throw new Error('Provedor desconhecido: ' + providerId);
  }
}

/* ── Google Gemini ────────────────────────────────────────── */
async function callGemini(prompt, key) {
  const model = PROVIDERS.gemini.model;
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
    if (res.status === 429) throw new Error('API_RATE_LIMIT');
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n')
    || 'Nenhum conteúdo retornado pelo Gemini.';
}

/* ── Groq ─────────────────────────────────────────────────── */
async function callGroq(prompt, key) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model:      PROVIDERS.groq.model,
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('API_KEY_INVALID');
    if (res.status === 429) throw new Error('API_RATE_LIMIT');
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Nenhum conteúdo retornado pelo Groq.';
}

/* ── OpenAI ───────────────────────────────────────────────── */
async function callOpenAI(prompt, key) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model:      PROVIDERS.openai.model,
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('API_KEY_INVALID');
    if (res.status === 429) throw new Error('API_RATE_LIMIT');
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Nenhum conteúdo retornado pela OpenAI.';
}

/* ── Anthropic (Claude) ───────────────────────────────────── */
async function callAnthropic(prompt, key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      PROVIDERS.anthropic.model,
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('API_KEY_INVALID');
    if (res.status === 429) throw new Error('API_RATE_LIMIT');
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.content.map(b => b.text || '').join('\n');
}


/* ── Gera a prova ─────────────────────────────────────────── */
async function generateProva() {
  if (!state.selectedCourse) {
    showValidation('Selecione um curso técnico para continuar.');
    document.getElementById('cardCurso').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!state.selectedDiff) {
    showValidation('Escolha o nível de dificuldade da prova.');
    document.getElementById('cardDiff').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!state.selectedFormat) {
    showValidation('Escolha o formato de entrega (PDF ou DOCX).');
    document.getElementById('cardFormato').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const active = getActiveProvider();
  if (!active || !getKeyForProvider(active)) {
    showValidation('Configure seu provedor de IA antes de gerar a prova.');
    openConfig();
    return;
  }

  document.getElementById('valMsg').className = 'validation-msg';
  state.driveLink = document.getElementById('driveLink').value.trim();

  startLoading();

  try {
    const prompt = buildPrompt();
    const text   = await callAI(prompt);
    state.generatedText = text;
    stopLoading();
    renderResult(text);
  } catch (err) {
    stopLoading();
    const provName = PROVIDERS[getActiveProvider()]?.name || 'IA';
    if (err.message === 'API_KEY_MISSING') {
      showValidation('Chave de API não configurada. Configure nas Configurações.');
      openConfig();
    } else if (err.message === 'API_KEY_INVALID') {
      showValidation(`Chave do ${provName} inválida ou expirada. Verifique nas Configurações.`);
      openConfig();
    } else if (err.message === 'API_RATE_LIMIT') {
      showValidation(`Limite de requisições do ${provName} atingido. Aguarde e tente novamente.`);
    } else {
      showValidation(`Erro ao conectar com ${provName}: ${err.message}`);
    }
  }
}


/* ── Renderiza o resultado ────────────────────────────────── */
function renderResult(text) {
  const diffLabel = { easy: 'Fácil', med: 'Médio', hard: 'Difícil' }[state.selectedDiff];
  const now       = new Date().toLocaleString('pt-BR');

  // Metadados no topo
  document.getElementById('resultMeta').innerHTML = `
    <div class="meta-item"><span class="meta-key">Curso</span><span class="meta-val">${state.selectedCourse.name}</span></div>
    <div class="meta-item"><span class="meta-key">Nível</span><span class="meta-val">${diffLabel}</span></div>
    <div class="meta-item"><span class="meta-key">Formato</span><span class="meta-val">${state.selectedFormat.toUpperCase()}</span></div>
    <div class="meta-item"><span class="meta-key">Gerado em</span><span class="meta-val">${now}</span></div>
  `;

  let html = ``;

  // Processa o texto gerado pela IA em seções
  const lines    = text.split('\n');
  let inSection  = false;
  let sectionBuf = '';

  const SECTION_PATTERNS = [
    /^---+$/,
    /^#{1,3}\s/,
    /^[A-ZÁÉÍÓÚÂÊÔÀÃÕÇ\s]{10,}$/,
    /^(ORIENTAÇÕES|SITUAÇÃO|CONTEXTUALIZ|DESAFIO|RESULTADOS|ENTREGAS|ESPECIFICAÇÕES|ANEXOS|NOTA AO)/i,
  ];

  function flushSection(title, content) {
    if (!title && !content.trim()) return '';
    return `
      <div class="section-block">
        ${title ? `<div class="section-bar"><span class="section-bar-title">${title}</span><div class="section-bar-line"></div></div>` : ''}
        <div class="section-content">${formatContent(content)}</div>
      </div>
    `;
  }

  function formatContent(raw) {
    return raw.trim().split('\n').map(line => {
      const l = line.trim();
      if (!l) return '';
      if (l.match(/^[-•*]\s/)) {
        return `<ul><li>${l.replace(/^[-•*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</li></ul>`;
      }
      if (l.match(/^\d+\.\s/)) {
        return `<ul style="list-style:decimal"><li>${l.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</li></ul>`;
      }
      return `<p>${l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code>$1</code>')}</p>`;
    }).join('');
  }

  let currentTitle   = '';
  let currentContent = '';

  lines.forEach(line => {
    const l = line.trim();

    const isSectionHeader =
      l.match(/^---+$/) ||
      (l === l.toUpperCase() && l.length > 5 && l.length < 80 && !l.match(/^[-•*\d]/) && l.match(/[A-Z]/)) ||
      l.match(/^#{1,3}\s/);

    if (isSectionHeader) {
      if (currentContent.trim()) {
        html += flushSection(currentTitle, currentContent);
      }
      currentTitle   = l.replace(/^---+$/, '').replace(/^#{1,3}\s*/, '').trim();
      currentContent = '';
    } else {
      currentContent += line + '\n';
    }
  });

  // Última seção
  if (currentContent.trim()) {
    html += flushSection(currentTitle, currentContent);
  }

  document.getElementById('resultBody').innerHTML = html;
  document.getElementById('resultArea').className = 'result-area show';
  document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Copiar prova ─────────────────────────────────────────── */
function copyProva() {
  if (!state.generatedText) return;
  navigator.clipboard.writeText(state.generatedText).then(() => {
    showToast('Texto copiado para a área de transferência!', 'success');
    const btn = document.getElementById('copyBtn');
    btn.innerHTML = '<i class="ti ti-check"></i> Copiado!';
    setTimeout(() => { btn.innerHTML = '<i class="ti ti-copy"></i> Copiar texto'; }, 2500);
  }).catch(() => {
    showToast('Não foi possível copiar. Tente manualmente.', 'error');
  });
}

/* ── Imprimir / Salvar como PDF ───────────────────────────── */
function printProva() {
  window.print();
}

/* ── Toast notification ───────────────────────────────────── */
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toastEl');
  if (existing) existing.remove();

  const iconMap = { success: 'ti-check-circle', error: 'ti-alert-circle', info: 'ti-info-circle' };
  const toast   = document.createElement('div');
  toast.id        = 'toastEl';
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `<i class="ti ${iconMap[type]}"></i>${msg}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 320);
  }, 3500);
}

/* ── Reset do formulário ──────────────────────────────────── */
function resetForm() {
  state.selectedCourse  = null;
  state.selectedDiff    = null;
  state.selectedFormat  = null;
  state.assetsEnabled   = false;
  state.driveLink       = '';
  state.generatedText   = '';

  document.getElementById('courseSearch').value    = '';
  document.getElementById('selectedCourseInfo').style.display = 'none';
  document.getElementById('driveInput').className  = 'drive-field';
  document.getElementById('driveLink').value        = '';
  document.getElementById('assetsToggle').className = 'toggle-sw';
  document.getElementById('assetsToggleRow').setAttribute('aria-checked', 'false');
  document.getElementById('resultArea').className   = 'result-area';
  document.getElementById('valMsg').className       = 'validation-msg';

  ['easy', 'med', 'hard'].forEach(x => {
    document.getElementById('diff-' + x).className = 'diff-item diff-' + x;
    document.getElementById('diff-' + x).setAttribute('aria-pressed', 'false');
  });
  ['pdf', 'docx'].forEach(x => {
    document.getElementById('fmt-' + x).className = 'fmt-item';
  });

  ['sn1','sn2','sn3','sn4'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.className  = i === 0 ? 's-num' : 's-num inactive';
    el.textContent = i + 1;
  });

  renderCourses(COURSES);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Fecha modal ao clicar fora ──────────────────────────── */
document.getElementById('modalConfig').addEventListener('click', function(e) {
  if (e.target === this) closeConfig();
});

/* ── Atalho de teclado: Escape fecha modal ────────────────── */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeConfig();
});

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderCourses(COURSES);
  checkApiKey();
  updateProviderBadge();

  document.getElementById('btnConfig').addEventListener('click', openConfig);
});