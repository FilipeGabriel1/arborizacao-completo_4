const apiBase = '/api/sementeira';

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

const form = document.getElementById('loteForm');
const lotesList = document.getElementById('lotesList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaTermo = document.getElementById('buscaTermo');

let editingId = null;
let lotes = [];

const fields = [
  'numeroLote', 'especieId', 'quantidadeProduzida', 'quantidadeDisponivel',
  'quantidadeDoadas', 'quantidadePlantadas', 'quantidadePerdas',
  'dataProducao', 'origemSementes', 'observacoes', 'status'
];
const inputs = {};
fields.forEach(f => { inputs[f] = document.getElementById(f); });

async function carregarSelects() {
  const especies = await buscarTudo('/api/especies');
  const select = inputs.especieId;
  (especies ?? []).forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = e.nomePopular;
    select.appendChild(opt);
  });
}

async function carregarLotes() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) return;
  lotes = itens;
  renderizar(lotes);
  atualizarKPIs(lotes);
  animarEntrada(lotesList);
}

function renderizar(lotes) {
  lotesList.innerHTML = '';
  if (lotes.length === 0) {
    lotesList.innerHTML = '<p class="empty-state">Nenhum lote encontrado.</p>';
    return;
  }
  lotes.forEach(lote => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>${lote.numeroLote}</h3>
      </header>
      <p class="area-description">
        ${lote.especieNomePopular ? 'Espécie: ' + lote.especieNomePopular : 'Sem espécie'}<br />
        Produzidas: <strong>${lote.quantidadeProduzida || 0}</strong> •
        Disponíveis: <strong>${lote.quantidadeDisponivel || 0}</strong> •
        Doadas: ${lote.quantidadeDoadas || 0} •
        Plantadas: ${lote.quantidadePlantadas || 0} •
        Perdas: ${lote.quantidadePerdas || 0}
      </p>
      <p class="area-description" style="font-size:0.78rem;color:var(--muted);">
        ${lote.dataProducao ? 'Produção: ' + new Date(lote.dataProducao).toLocaleDateString('pt-BR') : ''}
        ${lote.origemSementes ? ' • Origem: ' + lote.origemSementes : ''}
      </p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar</button>
        <button type="button" data-action="remover">Remover</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(lote));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(lote));
    lotesList.appendChild(item);
  });
}

function iniciarEdicao(lote) {
  editingId = lote.id;
  inputs.numeroLote.value = lote.numeroLote || '';
  inputs.especieId.value = lote.especieId || '';
  inputs.quantidadeProduzida.value = lote.quantidadeProduzida ?? '';
  inputs.quantidadeDisponivel.value = lote.quantidadeDisponivel ?? '';
  inputs.quantidadeDoadas.value = lote.quantidadeDoadas ?? '';
  inputs.quantidadePlantadas.value = lote.quantidadePlantadas ?? '';
  inputs.quantidadePerdas.value = lote.quantidadePerdas ?? '';
  inputs.dataProducao.value = lote.dataProducao || '';
  inputs.origemSementes.value = lote.origemSementes || '';
  inputs.observacoes.value = lote.observacoes || '';
  inputs.status.value = lote.status || 'ATIVO';
  formTitle.textContent = 'Editar Lote';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  inputs.status.value = 'ATIVO';
  formTitle.textContent = 'Novo Lote';
  cancelEditBtn.classList.add('hidden');
}

async function remover(lote) {
  if (!confirm(`Remover o lote "${lote.numeroLote}"?`)) return;
  await fetch(`${apiBase}/${lote.id}`, { method: 'DELETE' });
  showToast('Lote removido com sucesso!', 'sucesso');
  carregarLotes();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  if (!form.reportValidity()) return;

  const payload = {
    numeroLote: inputs.numeroLote.value,
    especieId: inputs.especieId.value ? Number(inputs.especieId.value) : null,
    quantidadeProduzida: Number(inputs.quantidadeProduzida.value),
    quantidadeDisponivel: inputs.quantidadeDisponivel.value ? Number(inputs.quantidadeDisponivel.value) : null,
    quantidadeDoadas: inputs.quantidadeDoadas.value ? Number(inputs.quantidadeDoadas.value) : null,
    quantidadePlantadas: inputs.quantidadePlantadas.value ? Number(inputs.quantidadePlantadas.value) : null,
    quantidadePerdas: inputs.quantidadePerdas.value ? Number(inputs.quantidadePerdas.value) : null,
    dataProducao: inputs.dataProducao.value || null,
    origemSementes: inputs.origemSementes.value || null,
    observacoes: inputs.observacoes.value || null,
    status: inputs.status.value
  };

  const url = editingId ? `${apiBase}/${editingId}` : apiBase;
  const method = editingId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar o lote.'}</div>`;
    return;
  }

  cancelarEdicao();
  showToast(editingId ? 'Lote atualizado com sucesso!' : 'Lote criado com sucesso!', 'sucesso');
  carregarLotes();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

buscaTermo.addEventListener('input', () => {
  const termo = buscaTermo.value.toLowerCase().trim();
  if (!termo) { renderizar(lotes); return; }
  const filtrados = lotes.filter(l =>
    l.numeroLote.toLowerCase().includes(termo) ||
    (l.especieNomePopular && l.especieNomePopular.toLowerCase().includes(termo)) ||
    (l.origemSementes && l.origemSementes.toLowerCase().includes(termo))
  );
  renderizar(filtrados);
});

function atualizarKPIs(lotes) {
  const total = lotes.length;
  let produzidas = 0, disponiveis = 0, doadas = 0, plantadas = 0;
  lotes.forEach(l => {
    produzidas += l.quantidadeProduzida || 0;
    disponiveis += l.quantidadeDisponivel || 0;
    doadas += l.quantidadeDoadas || 0;
    plantadas += l.quantidadePlantadas || 0;
  });
  document.getElementById('kpiLotes').textContent = total;
  document.getElementById('kpiProduzidas').textContent = produzidas;
  document.getElementById('kpiDisponiveis').textContent = disponiveis;
  document.getElementById('kpiDoadas').textContent = doadas;
  document.getElementById('kpiPlantadas').textContent = plantadas;
}

carregarSelects().then(carregarLotes);
