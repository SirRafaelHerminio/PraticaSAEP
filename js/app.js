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

/* ══════════════════════════════════════════════════════════
   SISTEMA DE CHAVES — Modo Institucional + Modo Professor
   ══════════════════════════════════════════════════════════ */

const STORAGE = {
  ACTIVE_PROVIDER:   'saep_active_provider',
  INST_PROVIDER:     'saep_inst_provider',    // provedor institucional
  INST_KEY:          'saep_inst_key',         // chave institucional (criptografada simples)
  ADMIN_HASH:        'saep_admin_hash',        // hash da senha admin
  GEMINI_KEY:        'saep_gemini_key',
  GROQ_KEY:          'saep_groq_key',
  OPENAI_KEY:        'saep_openai_key',
  ANTHROPIC_KEY:     'saep_anthropic_api_key',
};

// Provedor selecionado atualmente no modal (modo professor)
let modalSelectedProvider  = null;
// Provedor selecionado no painel admin
let adminSelectedProvider  = null;
// Modo atual do modal: 'professor' | 'admin'
let currentModalMode = 'professor';
// Admin autenticado nesta sessão
let adminAuthenticated = false;

/* ── Chave de acesso ──────────────────────────────────────── */
function getActiveProvider() {
  // Institucional tem prioridade
  const inst = localStorage.getItem(STORAGE.INST_PROVIDER);
  const instKey = getInstitutionalKey();
  if (inst && instKey) return inst;
  return localStorage.getItem(STORAGE.ACTIVE_PROVIDER) || null;
}

function getKeyForProvider(providerId) {
  const p = PROVIDERS[providerId];
  if (!p) return '';
  // Verifica se há chave institucional para este provedor
  if (localStorage.getItem(STORAGE.INST_PROVIDER) === providerId) {
    const instKey = getInstitutionalKey();
    if (instKey) return instKey;
  }
  return localStorage.getItem(p.storageKey) || '';
}

function getActiveKey() {
  const active = getActiveProvider();
  return active ? getKeyForProvider(active) : '';
}

function hasInstitutionalKey() {
  return !!(localStorage.getItem(STORAGE.INST_PROVIDER) &&
            localStorage.getItem(STORAGE.INST_KEY));
}

function getInstitutionalKey() {
  const stored = localStorage.getItem(STORAGE.INST_KEY);
  if (!stored) return '';
  // XOR decode simples (ofuscação, não criptografia real)
  return xorCipher(atob(stored), 'saep_senai_2025');
}

function setInstitutionalKey(providerId, key) {
  const encoded = btoa(xorCipher(key, 'saep_senai_2025'));
  localStorage.setItem(STORAGE.INST_PROVIDER, providerId);
  localStorage.setItem(STORAGE.INST_KEY, encoded);
}

function clearInstitutionalKey() {
  localStorage.removeItem(STORAGE.INST_PROVIDER);
  localStorage.removeItem(STORAGE.INST_KEY);
}

function xorCipher(str, key) {
  return str.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

/* ── Hash simples para senha admin ────────────────────────── */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'saep_salt_2025');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password) {
  const storedHash = localStorage.getItem(STORAGE.ADMIN_HASH);
  if (!storedHash) {
    // Sem senha definida: qualquer input libera (primeira configuração)
    return password.length >= 6;
  }
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

/* ── Troca de modo no modal ───────────────────────────────── */
function switchMode(mode) {
  currentModalMode = mode;
  const isProfessor = mode === 'professor';

  document.getElementById('tabProfessor').classList.toggle('active', isProfessor);
  document.getElementById('tabAdmin').classList.toggle('active', !isProfessor);
  document.getElementById('modeProfessor').style.display = isProfessor ? 'block' : 'none';
  document.getElementById('modeAdmin').style.display     = isProfessor ? 'none'  : 'block';

  if (!isProfessor && !adminAuthenticated) {
    document.getElementById('adminStepAuth').style.display   = 'block';
    document.getElementById('adminStepConfig').style.display = 'none';
  }
  if (!isProfessor && adminAuthenticated) {
    document.getElementById('adminStepAuth').style.display   = 'none';
    document.getElementById('adminStepConfig').style.display = 'block';
    prefillAdminPanel();
  }

  document.getElementById('btnSaveKey').disabled = !isProfessor;
}

/* ── Autenticação admin ───────────────────────────────────── */
async function authenticateAdmin() {
  const pw = document.getElementById('adminPassword').value;
  if (!pw) { showToast('Informe a senha de administrador.', 'error'); return; }

  const ok = await verifyPassword(pw);
  if (!ok) {
    showToast('Senha incorreta.', 'error');
    document.getElementById('adminPassword').style.borderColor = '#e24b4a';
    return;
  }

  adminAuthenticated = true;
  document.getElementById('adminStepAuth').style.display   = 'none';
  document.getElementById('adminStepConfig').style.display = 'block';
  document.getElementById('btnSaveKey').disabled = false;
  prefillAdminPanel();
}

function prefillAdminPanel() {
  const instProv = localStorage.getItem(STORAGE.INST_PROVIDER);
  if (instProv) {
    selectAdminProvider(instProv);
    const key = getInstitutionalKey();
    if (key) document.getElementById('adminKeyInput').value = key;
  }
}

/* ── Seleção de provedor no painel admin ──────────────────── */
function selectAdminProvider(id) {
  adminSelectedProvider = id;
  const p = PROVIDERS[id];

  Object.keys(PROVIDERS).forEach(pid => {
    const el = document.getElementById('admin-prov-' + pid);
    if (el) el.classList.toggle('selected', pid === id);
  });

  const input = document.getElementById('adminKeyInput');
  input.placeholder = p.placeholder;
  input.disabled    = false;
  document.getElementById('adminKeyLabel').textContent = `Chave institucional — ${p.name}`;
  document.getElementById('adminKeyHint').innerHTML =
    `${p.hint} <a href="${p.docsUrl}" target="_blank" rel="noopener">${p.docsLabel} <i class="ti ti-external-link"></i></a>`;
}

/* ── Salva configuração (unificado) ───────────────────────── */
async function saveConfig() {
  if (currentModalMode === 'professor') {
    saveApiKey();
  } else {
    await saveAdminConfig();
  }
}

async function saveAdminConfig() {
  if (!adminAuthenticated) {
    showToast('Autentique-se como administrador primeiro.', 'error');
    return;
  }
  if (!adminSelectedProvider) {
    showToast('Selecione um provedor institucional.', 'error');
    return;
  }

  const key  = document.getElementById('adminKeyInput').value.trim();
  const p    = PROVIDERS[adminSelectedProvider];
  const newPw = document.getElementById('adminNewPassword').value.trim();

  if (!key) {
    showToast('Informe a chave institucional.', 'error');
    return;
  }
  if (!key.startsWith(p.prefix)) {
    showToast(`Chave inválida. Deve começar com "${p.prefix}".`, 'error');
    return;
  }

  // Salva chave institucional
  setInstitutionalKey(adminSelectedProvider, key);

  // Salva nova senha se informada
  if (newPw) {
    if (newPw.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    const hash = await hashPassword(newPw);
    localStorage.setItem(STORAGE.ADMIN_HASH, hash);
  } else if (!localStorage.getItem(STORAGE.ADMIN_HASH)) {
    // Primeira config sem senha: define hash vazio bloqueante
    const hash = await hashPassword('saep2025');
    localStorage.setItem(STORAGE.ADMIN_HASH, hash);
    showToast(`Configurado! Senha padrão: saep2025 — altere em seguida.`, 'info');
  }

  closeConfig();
  checkApiKey();
  updateProviderBadge();
  showToast(`Chave institucional (${p.name}) configurada com sucesso!`, 'success');
}

/* ── Salva chave do professor ─────────────────────────────── */
function saveApiKey() {
  if (!modalSelectedProvider) {
    showToast('Selecione um provedor de IA primeiro.', 'error');
    return;
  }
  const key = document.getElementById('apiKeyInput').value.trim();
  const p   = PROVIDERS[modalSelectedProvider];

  if (!key) { showValidation('Informe a chave de API antes de salvar.'); return; }
  if (!key.startsWith(p.prefix)) {
    showValidation(`A chave do ${p.name} deve começar com "${p.prefix}".`);
    return;
  }

  localStorage.setItem(p.storageKey, key);
  localStorage.setItem(STORAGE.ACTIVE_PROVIDER, modalSelectedProvider);
  closeConfig();
  updateProviderBadge();
  checkApiKey();
  showToast(`${p.name} configurado com sucesso!`, 'success');
}

/* ── Seleciona provedor (modo professor) ──────────────────── */
function selectProvider(id) {
  modalSelectedProvider = id;
  const p = PROVIDERS[id];

  Object.keys(PROVIDERS).forEach(pid => {
    document.getElementById('prov-' + pid).classList.toggle('selected', pid === id);
  });

  const infoBox = document.getElementById('providerInfoBox');
  infoBox.innerHTML = `
    <div class="prov-info-content">
      <i class="ti ${p.free ? 'ti-star' : 'ti-credit-card'}" style="color:${p.free ? '#16a34a' : '#d97706'}"></i>
      <span>${p.free ? '✅ Plano gratuito disponível' : '💳 Requer conta com créditos'} — Modelo: <strong>${p.model}</strong></span>
    </div>`;
  infoBox.classList.add('show');

  const input = document.getElementById('apiKeyInput');
  input.placeholder = p.placeholder;
  input.disabled    = false;
  input.value       = getKeyForProvider(id);
  document.getElementById('apiKeyLabel').textContent = `Chave de API — ${p.name}`;
  document.getElementById('apiKeyHint').innerHTML =
    `${p.hint} <a href="${p.docsUrl}" target="_blank" rel="noopener">${p.docsLabel} <i class="ti ti-external-link"></i></a>`;
  document.getElementById('btnSaveKey').disabled = false;
}

/* ── Atualiza badge no header ─────────────────────────────── */
function updateProviderBadge() {
  const active = getActiveProvider();
  const dot    = document.getElementById('providerDot');
  const label  = document.getElementById('btnConfigLabel');
  const isInst = hasInstitutionalKey();

  if (active && PROVIDERS[active]) {
    dot.classList.add('active');
    label.textContent = isInst
      ? PROVIDERS[active].shortName + ' · Institucional'
      : PROVIDERS[active].shortName + ' configurado';
  } else {
    dot.classList.remove('active');
    label.textContent = 'Configurar IA';
  }
}

/* ── Verifica configuração ao carregar ────────────────────── */
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
  currentModalMode   = 'professor';
  adminAuthenticated = false;

  // Mostra banner de chave institucional se existir
  const instBanner = document.getElementById('instBanner');
  const ownSection = document.getElementById('ownKeySection');
  if (hasInstitutionalKey()) {
    instBanner.style.display = 'flex';
    ownSection.style.display = 'none';
    document.getElementById('btnSaveKey').disabled = true;
  } else {
    instBanner.style.display = 'none';
    ownSection.style.display = 'block';
    document.getElementById('btnSaveKey').disabled = true;
    // Pré-seleciona provedor ativo
    const active = localStorage.getItem(STORAGE.ACTIVE_PROVIDER);
    if (active && PROVIDERS[active]) selectProvider(active);
    else selectProvider('gemini');
  }

  // Garante modo professor visível
  document.getElementById('modeProfessor').style.display = 'block';
  document.getElementById('modeAdmin').style.display     = 'none';
  document.getElementById('tabProfessor').classList.add('active');
  document.getElementById('tabAdmin').classList.remove('active');
}

function closeConfig() {
  document.getElementById('modalConfig').classList.remove('open');
  modalSelectedProvider = null;
  adminAuthenticated    = false;
}

/* ── Visibilidade de senha ────────────────────────────────── */
function toggleApiVis() {
  const input = document.getElementById('apiKeyInput');
  const icon  = document.getElementById('eyeIcon');
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.className = input.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}

function toggleAdminPassVis() {
  const input = document.getElementById('adminPassword');
  const icon  = document.getElementById('eyeAdminPass');
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.className = input.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}

function toggleAdminKeyVis() {
  const input = document.getElementById('adminKeyInput');
  const icon  = document.getElementById('eyeAdminKey');
  input.type  = input.type === 'password' ? 'text' : 'password';
  icon.className = input.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}


/* ── Chave institucional padrão (Groq) ────────────────────── */
// Configurada pelo administrador do sistema.
// Professores usam automaticamente sem precisar de conta própria.
// Para trocar: acesse Configurações → aba Admin no site.
(function initInstitutionalKey() {
  // Só injeta se ainda não houver chave institucional configurada
  if (localStorage.getItem('saep_inst_key')) return;
  const INST_ENCODED   = 'FBIOLzE5KlokK29IdgZSJiY/Rmw7NSImPhhWSVAGNTgVGBMnVCAjWh14WUZBAwAkADshEQMXAm4=';
  const INST_PROVIDER  = 'groq';
  localStorage.setItem('saep_inst_provider', INST_PROVIDER);
  localStorage.setItem('saep_inst_key',      INST_ENCODED);
})();

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
    showValidation(`A chave do ${p.name} deve começar com "${p.prefix}". Verifique se copiou corretamente.`);
    return;
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

INSTRUÇÃO PRINCIPAL — LEIA COM ATENÇÃO:
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
    if (res.status === 400 || res.status === 403) throw new Error('API_KEY_INVALID');
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

/* ── Tutorial / Onboarding (I6) ───────────────────────────── */
const ONBOARDING_KEY = 'saep_onboarding_done';

function initOnboarding() {
  if (!localStorage.getItem(ONBOARDING_KEY)) {
    document.getElementById('onboardingBanner').style.display = 'block';
  }
}

function dismissOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, '1');
  document.getElementById('onboardingBanner').style.display = 'none';
}

function openHelp() {
  document.getElementById('modalHelp').classList.add('open');
  dismissOnboarding();
}

function closeHelp() {
  document.getElementById('modalHelp').classList.remove('open');
}

function toggleFaq(el) {
  el.classList.toggle('open');
}


let editMode = false;

function toggleEdit() {
  editMode = !editMode;
  const body     = document.getElementById('resultBody');
  const editor   = document.getElementById('resultEditor');
  const textarea = document.getElementById('editorTextarea');
  const btn      = document.getElementById('btnToggleEdit');

  if (editMode) {
    textarea.value = state.generatedText;
    body.style.display   = 'none';
    editor.style.display = 'block';
    btn.innerHTML = '<i class="ti ti-eye"></i> Visualizar';
    btn.classList.add('active');
  } else {
    // Sincroniza edições e re-renderiza
    state.generatedText = textarea.value;
    body.style.display   = 'block';
    editor.style.display = 'none';
    btn.innerHTML = '<i class="ti ti-pencil"></i> Editar';
    btn.classList.remove('active');
    renderResult(state.generatedText);
  }
}

function syncEditToState() {
  state.generatedText = document.getElementById('editorTextarea').value;
}


function downloadPDF() {
  if (!state.generatedText) return;

  const btn = document.getElementById('btnDownloadPDF');
  btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Gerando...';
  btn.disabled = true;

  // Pequeno delay para o browser renderizar o botão antes de bloquear
  setTimeout(() => {
    try {
      exportPDF(state.generatedText, {
        course:      state.selectedCourse.name,
        diff:        state.selectedDiff,
        itinerario:  '{{itinerario}}',
        date:        new Date().toLocaleString('pt-BR'),
      });
      showToast('PDF gerado com sucesso!', 'success');
    } catch(e) {
      showToast('Erro ao gerar PDF: ' + e.message, 'error');
      console.error(e);
    }
    btn.innerHTML = '<i class="ti ti-file-type-pdf"></i> Baixar PDF';
    btn.disabled = false;
  }, 80);
}

/* ── Exportar DOCX ────────────────────────────────────────── */
function downloadDOCX() {
  if (!state.generatedText) return;
  try {
    exportDOCX(state.generatedText, {
      course: state.selectedCourse.name,
      diff:   state.selectedDiff,
      date:   new Date().toLocaleString('pt-BR'),
    });
    showToast('Arquivo DOCX gerado!', 'success');
  } catch(e) {
    showToast('Erro ao gerar DOCX: ' + e.message, 'error');
  }
}

/* ── Imprimir (fallback) ──────────────────────────────────── */
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
  document.getElementById('resultBody').style.display   = 'block';
  document.getElementById('resultEditor').style.display = 'none';
  editMode = false;

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
  initOnboarding();

  document.getElementById('btnConfig').addEventListener('click', openConfig);
  document.getElementById('btnHelp').addEventListener('click', openHelp);
  document.getElementById('modalHelp').addEventListener('click', function(e) {
    if (e.target === this) closeHelp();
  });
});

/* ── Prova de exemplo (I5) ────────────────────────────────── */
const EXAMPLE_PROVA = {
  course: { id: 'iot', name: 'Internet das Coisas (IoT)', area: 'Tecnologia da Informação' },
  diff:   'hard',
  format: 'pdf',
  text: `CADERNO DE PROVA DO ESTUDANTE

Curso: Internet das Coisas (IoT)
Versão do Itinerário Formativo: {{itinerario}}
Estudante: {{nome}}
CPF: {{cpf}}
UF: {{uf}}

---
ORIENTAÇÕES GERAIS

- Desligue e guarde o seu telefone celular.
- Antes de iniciar a prova, leia atentamente as instruções contidas neste caderno e esclareça as dúvidas com o avaliador, caso necessário. Para isso você terá os 30 minutos iniciais de ambientação para ler a prova na íntegra e reconhecer o posto de trabalho.
- Aguarde o avaliador sinalizar o fim da ambientação ou informe a ele que você quer iniciar a prova. A partir desse momento contará o tempo de 03 horas para que você realize as atividades.
- Para a execução desta prova, estão disponíveis no seu posto de trabalho: dispositivos IoT, equipamentos de rede, computador com software de programação, instrumentos de medição e toda a documentação técnica necessária para realização das atividades.
- Durante a prova lembre-se de cumprir todas as exigências referentes às normas de saúde, segurança do trabalho e de meio ambiente.
- Ao final da avaliação, este caderno e demais itens disponibilizados devem ser devolvidos ao Avaliador.
- Para registrar o final da sua prova, você deverá assinar o canhoto da prova junto com o seu avaliador.
- O avaliador está à disposição para dirimir qualquer dúvida, desde que não seja referente à resolução da prova.

---
SITUAÇÃO-PROBLEMA

Implementação de sistema IoT para monitoramento remoto de tanques industriais em indústria química de Camaçari — BA.

---
CONTEXTUALIZAÇÃO

A ChemBrasil Ltda., indústria química situada em Camaçari (BA), opera quatro tanques de armazenamento de solventes com capacidade total de 80.000 litros. O sistema de monitoramento atual é inteiramente analógico, com leituras manuais realizadas a cada 4 horas por operadores. Essa abordagem tem gerado riscos operacionais significativos: nos últimos 6 meses, dois incidentes de transbordamento causaram perdas estimadas em R$ 90.000 e autuações ambientais.

A diretoria aprovou a implementação de uma solução IoT para monitoramento contínuo e remoto dos parâmetros críticos de cada tanque: nível (%), temperatura (°C) e pressão interna (kPa). Os dados devem ser acessíveis em tempo real via dashboard web e aplicativo móvel, com geração automática de alertas por e-mail e SMS quando qualquer parâmetro ultrapassar os limites operacionais definidos pela NR-20 e pelas fichas de dados de segurança (FISPQ) dos produtos armazenados.

Você foi contratado como técnico em IoT responsável pela implementação completa do sistema, desde a instalação dos sensores até a disponibilização do dashboard ao supervisor de operações.

---
DESAFIO

No papel de técnico em Internet das Coisas da empresa ChemTech Soluções, você deverá projetar, configurar e comissionar o sistema de monitoramento IoT dos quatro tanques industriais. A solução deve utilizar microcontroladores ESP32 com sensores de nível ultrassônico (JSN-SR04T), temperatura (DS18B20) e pressão (BMP280), comunicação via protocolo MQTT com broker na nuvem, e dashboard desenvolvido em Node-RED com persistência de dados em banco InfluxDB.

Para realizar as atividades, estão disponíveis no posto de trabalho: 4 módulos ESP32 DevKit, sensores conforme especificados, fonte de alimentação 12V/5V, cabo UTP Cat6, access point Wi-Fi configurado (SSID: ChemBrasil_IoT | Senha: Chem@2025), notebook com Arduino IDE, Node-RED e InfluxDB instalados, e toda a documentação técnica (datasheets, manual de instalação, FISPQ dos produtos).

---
RESULTADOS E ENTREGAS ESPERADOS

Entrega 1 — Diagrama de Arquitetura do Sistema (Tempo estimado: 30 min)
Elabore o diagrama completo da arquitetura IoT, contendo: topologia de rede (ESP32 → Wi-Fi → Broker MQTT → Node-RED → InfluxDB → Dashboard), endereçamento IP de cada dispositivo, identificação dos tópicos MQTT para cada sensor/tanque, e legenda com os protocolos utilizados em cada camada.

Entrega 2 — Programação dos Dispositivos ESP32 (Tempo estimado: 70 min)
Desenvolva e grave o firmware nos 4 módulos ESP32. O código deve: realizar leitura dos 3 sensores a cada 30 segundos; publicar os dados no broker MQTT em formato JSON com timestamp; implementar reconexão automática ao Wi-Fi e ao broker em caso de queda; acender LED vermelho quando qualquer parâmetro ultrapassar os limites configurados; e exibir status da conexão via Serial Monitor para fins de diagnóstico.

Entrega 3 — Configuração do Broker e Fluxos Node-RED (Tempo estimado: 50 min)
Configure o broker MQTT (Mosquitto) e desenvolva os fluxos Node-RED para: receber e decodificar os payloads JSON de todos os tanques; persistir os dados no InfluxDB com tags de identificação (tanque, sensor, unidade); gerar alertas automáticos por e-mail (configurar nó smtp) quando nível > 90% ou temperatura > 60°C ou pressão > 150 kPa; e exportar os fluxos em arquivo flows.json para entrega.

Entrega 4 — Dashboard de Monitoramento (Tempo estimado: 40 min)
Construa o dashboard no Node-RED Dashboard (node-red-dashboard) contendo: 4 gauges de nível (um por tanque, escala 0-100%); gráfico de linha histórico de temperatura das últimas 2 horas; tabela de alertas com timestamp, tanque, parâmetro e valor; e indicador de status de conectividade de cada ESP32 (online/offline). O dashboard deve ser responsivo e acessível pelo endereço IP local da rede ChemBrasil_IoT.

Entrega 5 — Relatório de Comissionamento e Plano de Testes (Tempo estimado: 30 min)
Preencha o relatório de comissionamento com: resultado dos testes de cada sensor (valor medido vs. valor de referência); latência medida entre leitura do sensor e exibição no dashboard; procedimento de teste de falha simulada (desconexão de um ESP32) e comportamento observado; e checklist de conformidade com a NR-20 para instalação em área classificada.

---
ESPECIFICAÇÕES TÉCNICAS DAS ENTREGAS

Entrega 1 — Diagrama de Arquitetura
**Requisitos técnicos:** Utilizar notação padronizada (blocos com identificação); representar todas as camadas da arquitetura IoT (percepção, rede, processamento, aplicação); indicar os protocolos em cada enlace (IEEE 802.11n, TCP/IP, MQTT 3.1.1, HTTP). Ferramentas aceitas: draw.io, Lucidchart ou papel milimetrado.
**Critérios de aceitação:** Diagrama legível, sem erros de topologia, com todos os 4 tanques representados e tópicos MQTT nomeados no formato tanque/[01-04]/[nivel|temperatura|pressao].

Entrega 2 — Firmware ESP32
**Requisitos técnicos:** Linguagem C++ (Arduino framework); biblioteca PubSubClient para MQTT; ArduinoJson para serialização; OneWire + DallasTemperature para DS18B20; payload JSON mínimo: {"tanque":"01","nivel":72.5,"temp":38.2,"pressao":102.1,"ts":1716800000}. QoS MQTT nível 1. Watchdog timer habilitado.
**Critérios de aceitação:** Firmware compila sem erros; dados chegam ao broker a cada 30s ±5s; reconexão funciona após simular queda de Wi-Fi; LED de alerta acende corretamente nos limites definidos. Referência: ESP-IDF Programming Guide, datasheet JSN-SR04T.

Entrega 3 — Broker e Node-RED
**Requisitos técnicos:** Broker Mosquitto configurado com autenticação (usuário: saep / senha: Saep@2025); tópicos com retenção habilitada (retain=true); flows Node-RED com tratamento de erro em todos os nós críticos; dados gravados no InfluxDB measurement "tanques" com campo "valor" e tags "tanque", "sensor".
**Critérios de aceitação:** Todos os payloads chegam ao InfluxDB sem perda; alerta de e-mail disparado em até 60s após ultrapassar limite; arquivo flows.json exportado e funcional em reimportação.

Entrega 4 — Dashboard
**Requisitos técnicos:** Tema escuro (dark theme); atualização automática dos gauges sem refresh manual; histórico de 120 pontos mínimos no gráfico; tabela de alertas com no mínimo os 20 últimos registros.
**Critérios de aceitação:** Dashboard acessível em http://[IP-local]:1880/ui; todos os 4 tanques exibidos simultaneamente; indicador offline muda em até 35s após desconexão do ESP32.

Entrega 5 — Relatório de Comissionamento
**Requisitos técnicos:** Preencher o formulário físico disponível no posto de trabalho; mínimo 3 testes documentados por sensor; latência medida com cronômetro (tempo entre publicação MQTT e atualização visual no dashboard).
**Critérios de aceitação:** Todos os campos preenchidos; desvio de medição dos sensores dentro da tolerância do datasheet (±3% para nível, ±0.5°C para temperatura, ±1 kPa para pressão); procedimento de falha testado e documentado.

---
NOTA AO PROFESSOR — CRITÉRIOS DE AVALIAÇÃO

**Entrega 1:** Verifique se o diagrama contempla todas as camadas e se os tópicos MQTT seguem a nomenclatura hierárquica correta. Erros comuns: omitir o broker como elemento central, não identificar protocolos.

**Entrega 2:** Teste o firmware compilando na IDE e simulando a queda de rede (desabilitar SSID temporariamente). Observe se o LED de alerta funciona. Penalize firmwares sem tratamento de reconexão.

**Entrega 3:** Importe o flows.json em uma instalação limpa do Node-RED para validar. Verifique os dados no InfluxDB via comando: influx query 'from(bucket:"saep") |> range(start:-1h)'.

**Entrega 4:** Acesse o dashboard pelo IP local. Simule ultrapassagem de limite alterando o valor publicado via cliente MQTT (ex: MQTT Explorer). Verifique se o alerta aparece na tabela.

**Entrega 5:** Compare os valores registrados com os valores de referência calibrados previamente pelo professor. Desvios acima da tolerância do datasheet devem ser investigados (mau contato, fonte ruidosa).

**Diferencial satisfatório vs. insatisfatório:** Aluno satisfatório entrega sistema funcional end-to-end com dados chegando ao dashboard. Insatisfatório: sistema com lacunas (ex: dashboard sem dados reais, firmware sem reconexão, relatório incompleto).`
};

function loadExample() {
  // Preenche o estado com o exemplo
  state.selectedCourse  = EXAMPLE_PROVA.course;
  state.selectedDiff    = EXAMPLE_PROVA.diff;
  state.selectedFormat  = EXAMPLE_PROVA.format;
  state.generatedText   = EXAMPLE_PROVA.text;
  editMode = false;

  // Marca visualmente os campos
  selectDiff(EXAMPLE_PROVA.diff);
  selectFormat(EXAMPLE_PROVA.format);

  const sc = COURSES.find(c => c.id === EXAMPLE_PROVA.course.id);
  if (sc) {
    state.selectedCourse = sc;
    filterCourses();
    document.getElementById('selectedCourseName').textContent = sc.name;
    document.getElementById('selectedCourseInfo').style.display = 'block';
  }

  updateStepIndicators();
  renderResult(EXAMPLE_PROVA.text);
  document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
  showToast('Prova de exemplo carregada!', 'success');
}
