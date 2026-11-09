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
  renderizarGraficos(lotes);
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

  const wasEditing = !!editingId;
  cancelarEdicao();
  showToast(wasEditing ? 'Lote atualizado com sucesso!' : 'Lote criado com sucesso!', 'sucesso');
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
  let produzidas = 0, disponiveis = 0, doadas = 0, plantadas = 0, perdas = 0;
  lotes.forEach(l => {
    produzidas += l.quantidadeProduzida || 0;
    disponiveis += l.quantidadeDisponivel || 0;
    doadas += l.quantidadeDoadas || 0;
    plantadas += l.quantidadePlantadas || 0;
    perdas += l.quantidadePerdas || 0;
  });
  document.getElementById('kpiLotes').textContent = total;
  document.getElementById('kpiProduzidas').textContent = produzidas;
  document.getElementById('kpiDisponiveis').textContent = disponiveis;
  document.getElementById('kpiDoadas').textContent = doadas;
  document.getElementById('kpiPlantadas').textContent = plantadas;
  document.getElementById('kpiPerdas').textContent = perdas;
}

/* ===== GRÁFICOS ===== */
const CORES_DESTINO = {
  disponiveis: '#49a970',
  doadas: '#4da3ff',
  plantadas: '#2dd4bf',
  perdas: '#ef6b73'
};
const CORES_STATUS = {
  ATIVO: '#49a970',
  ENCERRADO: '#f5b83d',
  CANCELADO: '#ef6b73'
};

function escapar(texto) {
  return String(texto == null ? '' : texto).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function polarParaCartesiano(cx, cy, raio, angulo) {
  const a = (angulo - 90) * Math.PI / 180.0;
  return { x: cx + raio * Math.cos(a), y: cy + raio * Math.sin(a) };
}

function segmentoDonut(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return null;
  if (sweep >= 359.99) return { full: true, mid: (rOuter + rInner) / 2, thick: rOuter - rInner };
  const large = sweep > 180 ? 1 : 0;
  const o1 = polarParaCartesiano(cx, cy, rOuter, startAngle);
  const o2 = polarParaCartesiano(cx, cy, rOuter, endAngle);
  const i1 = polarParaCartesiano(cx, cy, rInner, endAngle);
  const i2 = polarParaCartesiano(cx, cy, rInner, startAngle);
  return {
    d: 'M ' + o1.x + ' ' + o1.y +
      ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + o2.x + ' ' + o2.y +
      ' L ' + i1.x + ' ' + i1.y +
      ' A ' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + i2.x + ' ' + i2.y +
      ' Z'
  };
}

function criarDonutChart(containerId, dados, cores, labelCentro) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const itens = (dados || []).filter(d => d.valor > 0);
  const total = itens.reduce((s, d) => s + d.valor, 0);
  if (total <= 0) {
    container.innerHTML = '<p class="empty-state">Sem dados</p>';
    return;
  }

  const cx = 100, cy = 100, rOuter = 90, rInner = 58;
  let paths = '';
  let angle = 0;

  itens.forEach(d => {
    const slice = (d.valor / total) * 360;
    const cor = cores[d.chave] || '#999';
    const seg = segmentoDonut(cx, cy, rOuter, rInner, angle, angle + slice);
    if (seg && seg.full) {
      paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + seg.mid +
        '" fill="none" stroke="' + cor + '" stroke-width="' + seg.thick +
        '"><title>' + escapar(d.rotulo) + ': ' + d.valor + '</title></circle>';
    } else if (seg && seg.d) {
      paths += '<path d="' + seg.d + '" fill="' + cor + '" stroke="#080e0b" stroke-width="1.5">' +
        '<title>' + escapar(d.rotulo) + ': ' + d.valor + '</title></path>';
    }
    angle += slice;
  });

  const breakdown = itens.map(d => {
    const cor = cores[d.chave] || '#999';
    const pct = Math.round((d.valor / total) * 100);
    return '<div class="donut-break-item">' +
      '<span class="donut-break-dot" style="background:' + cor + ';"></span>' +
      '<span class="donut-break-nome">' + escapar(d.rotulo) + '</span>' +
      '<span class="donut-break-valor">' + d.valor + ' • ' + pct + '%</span>' +
      '<span class="donut-break-bar"><i style="display:block;width:' + pct + '%;background:' + cor + ';"></i></span>' +
      '</div>';
  }).join('');

  container.innerHTML =
    '<div class="donut-wrap donut-row">' +
    '<div class="donut-svg-box">' +
    '<svg viewBox="0 0 200 200" role="img" aria-label="Gráfico de rosca">' + paths + '</svg>' +
    '<div class="donut-center">' +
    '<span class="donut-valor">' + total + '</span>' +
    '<span class="donut-label">' + escapar(labelCentro || 'Total') + '</span>' +
    '</div>' +
    '</div>' +
    '<div class="donut-breakdown">' + breakdown + '</div>' +
    '</div>';
}

function renderBarChart(containerId, itens) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const validos = (itens || []).filter(i => i.valor > 0);
  if (validos.length === 0) {
    container.innerHTML = '<p class="empty-state">Sem dados</p>';
    return;
  }
  const max = validos.reduce((m, i) => Math.max(m, i.valor), 0);
  container.innerHTML = validos.map(i => {
    const pct = Math.max(4, Math.round((i.valor / max) * 100));
    return '<div class="bar-row">' +
      '<span class="bar-label" title="' + escapar(i.rotulo) + '">' + escapar(i.rotulo) + '</span>' +
      '<span class="bar-track"><i class="bar-fill" style="display:block;width:' + pct + '%;"></i></span>' +
      '<span class="bar-value">' + i.valor + '</span>' +
      '</div>';
  }).join('');
}

function renderizarGraficos(lotes) {
  let disponiveis = 0, doadas = 0, plantadas = 0, perdas = 0;
  const porEspecie = {};
  const porMes = {};
  const porStatus = { ATIVO: 0, ENCERRADO: 0, CANCELADO: 0 };

  lotes.forEach(l => {
    disponiveis += l.quantidadeDisponivel || 0;
    doadas += l.quantidadeDoadas || 0;
    plantadas += l.quantidadePlantadas || 0;
    perdas += l.quantidadePerdas || 0;

    const st = porStatus[l.status] !== undefined ? l.status : 'ATIVO';
    porStatus[st] += 1;

    const esp = l.especieNomePopular || 'Sem espécie';
    porEspecie[esp] = (porEspecie[esp] || 0) + (l.quantidadeProduzida || 0);

    if (l.dataProducao) {
      const m = /^(\d{4})-(\d{2})/.exec(String(l.dataProducao));
      if (m) {
        const chave = m[1] + '-' + m[2];
        porMes[chave] = (porMes[chave] || 0) + (l.quantidadeProduzida || 0);
      }
    }
  });

  criarDonutChart('chartDestino', [
    { chave: 'disponiveis', rotulo: 'Disponíveis', valor: disponiveis },
    { chave: 'doadas', rotulo: 'Doadas', valor: doadas },
    { chave: 'plantadas', rotulo: 'Plantadas', valor: plantadas },
    { chave: 'perdas', rotulo: 'Perdas', valor: perdas }
  ], CORES_DESTINO, 'mudas');

  criarDonutChart('chartStatus', [
    { chave: 'ATIVO', rotulo: 'Ativos', valor: porStatus.ATIVO },
    { chave: 'ENCERRADO', rotulo: 'Encerrados', valor: porStatus.ENCERRADO },
    { chave: 'CANCELADO', rotulo: 'Cancelados', valor: porStatus.CANCELADO }
  ], CORES_STATUS, 'lotes');

  renderBarChart('chartEspecies',
    Object.keys(porEspecie)
      .map(k => ({ rotulo: k, valor: porEspecie[k] }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6));

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  renderBarChart('chartMeses',
    Object.keys(porMes)
      .sort()
      .reverse()
      .slice(0, 6)
      .map(k => {
        const partes = k.split('-');
        return { rotulo: MESES[Number(partes[1]) - 1] + '/' + partes[0].slice(2), valor: porMes[k] };
      }));
}

carregarSelects().then(carregarLotes);
