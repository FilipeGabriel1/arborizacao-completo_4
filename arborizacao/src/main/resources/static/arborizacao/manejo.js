const apiBase = '/api/manutencoes';

async function buscarTudo(url, pageSize = 200) {
  const todos = [];
  let pagina = 0;
  for (;;) {
    const res = await fetch(`${url}?page=${pagina}&size=${pageSize}`);
    if (!res.ok) return null;
    const data = await res.json();
    const itens = Array.isArray(data) ? data : (data.value ?? []);
    todos.push(...itens);
    if (Array.isArray(data) || itens.length < pageSize) return todos;
    pagina++;
  }
}

const form = document.getElementById('manutencaoForm');
const manutencoesList = document.getElementById('manutencoesList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaTermo = document.getElementById('buscaTermo');

let editingId = null;
let manutencoes = [];

const inputs = {
  endereco: document.getElementById('endereco'),
  tipo: document.getElementById('tipo'),
  prioridade: document.getElementById('prioridade'),
  dataAgendada: document.getElementById('dataAgendada'),
  responsavelExecucao: document.getElementById('responsavelExecucao'),
  observacoes: document.getElementById('observacoes'),
  status: document.getElementById('status')
};

// Sync radio buttons with hidden inputs
document.querySelectorAll('input[name="tipoRadio"]').forEach(r => {
  r.addEventListener('change', () => { inputs.tipo.value = r.value; });
});
document.querySelectorAll('input[name="prioRadio"]').forEach(r => {
  r.addEventListener('change', () => { inputs.prioridade.value = r.value; });
});
document.querySelectorAll('input[name="statusRadio"]').forEach(r => {
  r.addEventListener('change', () => { inputs.status.value = r.value; });
});

// Set initial values
inputs.tipo.value = 'PODA_LIMPEZA';
inputs.prioridade.value = 'MEDIA';
inputs.status.value = 'PENDENTE';

async function carregarManutencoes() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) return;
  manutencoes = itens;
  renderizar(manutencoes);
  atualizarKPIs(manutencoes);
  animarEntrada(manutencoesList);
}

const tipoIcons = {
  PODA_LIMPEZA: '<img class="ico" src="./img/icones/scissors.png" alt="">', PODA_FORMACAO: '<img class="ico" src="./img/icones/tree.png" alt="">', PODA_RENOVACAO: '<img class="ico" src="./img/icones/refresh.png" alt="">',
  MONITORAMENTO: '<img class="ico" src="./img/icones/eye.png" alt="">', COMBATE_PRAGAS: '<img class="ico" src="./img/icones/pill.png" alt="">', TRANSPLANTE: '<img class="ico" src="./img/icones/plant-2.png" alt="">',
  EXTRACAO: '<img class="ico" src="./img/icones/axe.png" alt="">', REPOUSO: '<img class="ico" src="./img/icones/zzz.png" alt="">'
};
const tipoLabels = {
  PODA_LIMPEZA: 'Poda Limpeza', PODA_FORMACAO: 'Poda Formação', PODA_RENOVACAO: 'Poda Renovação',
  MONITORAMENTO: 'Monitoramento', COMBATE_PRAGAS: 'Combate a Pragas', TRANSPLANTE: 'Transplante',
  EXTRACAO: 'Extração', REPOUSO: 'Reposo'
};

function renderizar(manutencoes) {
  manutencoesList.innerHTML = '';
  if (manutencoes.length === 0) {
    manutencoesList.innerHTML = '<p class="empty-state">Nenhuma ordem de serviço encontrada.</p>';
    return;
  }
  manutencoes.forEach(m => {
    const item = document.createElement('article');
    item.className = 'os-card';
    const idLabel = 'OS-' + String(m.id).padStart(5, '0');
    const icon = tipoIcons[m.tipo] || '<img class="ico" src="./img/icones/tool.png" alt="">';
    const tipoLabel = tipoLabels[m.tipo] || m.tipo || '—';
    const prioClass = m.prioridade === 'URGENTE' ? 'urgente' : m.prioridade === 'ALTA' ? 'alta' : m.prioridade === 'MEDIA' ? 'media' : 'baixa';
    const statusClass = m.status === 'CONCLUIDA' ? 'concluida' : m.status === 'EM_EXECUCAO' ? 'execucao' : m.status === 'CANCELADA' ? 'cancelada' : 'pendente';
    const statusLabels = { PENDENTE: 'Pendente', EM_EXECUCAO: 'Em Execução', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' };
    item.innerHTML = `
      <div class="os-card-header">
        <span class="os-card-id">${idLabel}</span>
        <span class="os-card-prio ${prioClass}">${m.prioridade || '—'}</span>
      </div>
      <div class="os-card-body">
        <div class="os-card-tree">${icon} ${m.endereco || 'Endereço não informado'}</div>
        <div class="os-card-tipo">${tipoLabel}</div>
        <div class="os-card-meta">
          ${m.dataAgendada ? '<img class="ico" src="./img/icones/calendar.png" alt=""> ' + new Date(m.dataAgendada).toLocaleDateString('pt-BR') : ''}
          ${m.responsavelExecucao ? ' • <img class="ico" src="./img/icones/user.png" alt=""> ' + m.responsavelExecucao : ''}
        </div>
      </div>
      <div class="os-card-footer">
        <span class="os-card-status ${statusClass}">${statusLabels[m.status] || m.status}</span>
        <div class="os-card-actions">
          <button type="button" data-action="editar" class="os-card-btn">Editar</button>
          <button type="button" data-action="remover" class="os-card-btn danger">Remover</button>
        </div>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(m));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(m));
    manutencoesList.appendChild(item);
  });
}

function iniciarEdicao(m) {
  editingId = m.id;
  inputs.endereco.value = m.endereco || '';
  inputs.tipo.value = m.tipo || 'PODA_LIMPEZA';
  inputs.prioridade.value = m.prioridade || 'MEDIA';
  inputs.dataAgendada.value = m.dataAgendada || '';
  inputs.responsavelExecucao.value = m.responsavelExecucao || '';
  inputs.observacoes.value = m.observacoes || '';
  inputs.status.value = m.status || 'PENDENTE';
  // Sync radios
  document.querySelector(`input[name="tipoRadio"][value="${m.tipo || 'PODA_LIMPEZA'}"]`).checked = true;
  document.querySelector(`input[name="prioRadio"][value="${m.prioridade || 'MEDIA'}"]`).checked = true;
  document.querySelector(`input[name="statusRadio"][value="${m.status || 'PENDENTE'}"]`).checked = true;
  formTitle.textContent = 'Editar OS';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  inputs.tipo.value = 'PODA_LIMPEZA';
  inputs.prioridade.value = 'MEDIA';
  inputs.status.value = 'PENDENTE';
  document.querySelector('input[name="tipoRadio"][value="PODA_LIMPEZA"]').checked = true;
  document.querySelector('input[name="prioRadio"][value="MEDIA"]').checked = true;
  document.querySelector('input[name="statusRadio"][value="PENDENTE"]').checked = true;
  formTitle.textContent = 'Nova Ordem de Serviço';
  cancelEditBtn.classList.add('hidden');
}

async function remover(m) {
  if (!confirm(`Remover a OS-${String(m.id).padStart(5, '0')}?`)) return;
  await fetch(`${apiBase}/${m.id}`, { method: 'DELETE' });
  showToast('OS removida com sucesso!', 'sucesso');
  carregarManutencoes();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  if (!form.reportValidity()) return;

  try {
    const payload = {
      endereco: inputs.endereco.value || null,
      tipo: inputs.tipo.value,
      prioridade: inputs.prioridade.value,
      dataAgendada: inputs.dataAgendada.value || null,
      dataExecucao: null,
      responsavelExecucao: inputs.responsavelExecucao.value || null,
      observacoes: inputs.observacoes.value || null,
      status: inputs.status.value
    };

    console.log('Enviando payload:', JSON.stringify(payload));

    const url = editingId ? `${apiBase}/${editingId}` : apiBase;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Resposta:', res.status);

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      console.error('Erro ao salvar OS:', res.status, erro);
      formMessage.innerHTML = `<div class="login-message erro">${erro.message || erro.error || 'Não foi possível salvar a OS. Status: ' + res.status}</div>`;
      return;
    }

    const wasEditing = editingId !== null;
    cancelarEdicao();
    showToast(wasEditing ? 'OS atualizada com sucesso!' : 'OS criada com sucesso!', 'sucesso');
    await carregarManutencoes();
  } catch (err) {
    console.error('Exceção ao salvar OS:', err);
    formMessage.innerHTML = `<div class="login-message erro">Erro interno: ${err.message}</div>`;
  }
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

buscaTermo.addEventListener('input', () => {
  const termo = buscaTermo.value.toLowerCase().trim();
  if (!termo) { renderizar(manutencoes); return; }
  const filtrados = manutencoes.filter(m =>
    (m.endereco && m.endereco.toLowerCase().includes(termo)) ||
    (m.tipo && m.tipo.toLowerCase().includes(termo)) ||
    (m.responsavelExecucao && m.responsavelExecucao.toLowerCase().includes(termo)) ||
    (m.status && m.status.toLowerCase().includes(termo))
  );
  renderizar(filtrados);
});

function atualizarKPIs(manutencoes) {
  let total = 0, pendentes = 0, execucao = 0, concluidas = 0, urgentes = 0;
  manutencoes.forEach(m => {
    total++;
    if (m.status === 'PENDENTE') pendentes++;
    if (m.status === 'EM_EXECUCAO') execucao++;
    if (m.status === 'CONCLUIDA') concluidas++;
    if (m.prioridade === 'URGENTE') urgentes++;
  });
  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiPendentes').textContent = pendentes;
  document.getElementById('kpiExecucao').textContent = execucao;
  document.getElementById('kpiConcluidas').textContent = concluidas;
  document.getElementById('kpiUrgentes').textContent = urgentes;
}

carregarManutencoes();
