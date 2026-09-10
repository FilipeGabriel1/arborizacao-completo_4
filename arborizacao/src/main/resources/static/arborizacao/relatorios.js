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

const CORES_PORTE = { PEQUENO: '#22c55e', MEDIO: '#16a34a', GRANDE: '#4ade80' };
const ROTULOS_PORTE = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' };
const CORES_ORIGEM = { DOACAO: '#1e40af', OBRIGACAO_LEGAL: '#3b82f6', PLANTIO_PROPRIO: '#60a5fa', OUTRA: '#93c5fd' };
const ROTULOS_ORIGEM = { DOACAO: 'Doação', OBRIGACAO_LEGAL: 'Obrigação legal', PLANTIO_PROPRIO: 'Plantio próprio', OUTRA: 'Outra' };
const CORES_CONDICAO = { BOM: '#22c55e', REGULAR: '#eab308', RUIM: '#f97316', CRITICO: '#ef4444' };
const ROTULOS_CONDICAO = { BOM: 'Bom', REGULAR: 'Regular', RUIM: 'Ruim', CRITICO: 'Crítico' };
const CORES_PLANTIO = { PLANEJADO: '#3b82f6', EM_EXECUCAO: '#eab308', CONCLUIDO: '#22c55e', CANCELADO: '#ef4444' };
const ROTULOS_PLANTIO = { PLANEJADO: 'Planejado', EM_EXECUCAO: 'Em execução', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };

async function carregarDados() {
  const [arvores, areas, especies, lotes, plantios, manutencoes] = await Promise.all([
    buscarTudo('/api/arvores'),
    buscarTudo('/api/areas'),
    buscarTudo('/api/especies'),
    buscarTudo('/api/sementeira'),
    buscarTudo('/api/plantios'),
    buscarTudo('/api/manutencoes')
  ]);

  const a = arvores ?? [];
  const ar = areas ?? [];
  const e = especies ?? [];
  const l = lotes ?? [];
  const p = plantios ?? [];
  const m = manutencoes ?? [];

  document.getElementById('kpiArvores').textContent = a.length;
  document.getElementById('kpiAreas').textContent = ar.length;
  document.getElementById('kpiEspecies').textContent = e.length;
  let totalMudas = 0; l.forEach(lote => { totalMudas += lote.quantidadeProduzida || 0; });
  document.getElementById('kpiMudas').textContent = totalMudas;
  document.getElementById('kpiPlantios').textContent = p.length;
  document.getElementById('kpiManutencoes').textContent = m.length;

  animarEntrada(document.querySelector('.dashboard-grid'));

  renderDonut('chartPorte', 'chartPorteLegend', 'chartPorteTotal', agrupar(a, 'porte'), CORES_PORTE, ROTULOS_PORTE);
  renderDonut('chartOrigem', 'chartOrigemLegend', 'chartOrigemTotal', agrupar(a, 'origem'), CORES_ORIGEM, ROTULOS_ORIGEM);
  renderDonut('chartCondicao', 'chartCondicaoLegend', 'chartCondicaoTotal', agrupar(a, 'condicaoFitossanitaria'), CORES_CONDICAO, ROTULOS_CONDICAO);
  renderDonut('chartPlantios', 'chartPlantiosLegend', 'chartPlantiosTotal', agrupar(p, 'status'), CORES_PLANTIO, ROTULOS_PLANTIO);

  renderTopEspecies(a, e);
}

function agrupar(items, campo) {
  const contagem = {};
  items.forEach(item => {
    const chave = item[campo] || 'Não informado';
    contagem[chave] = (contagem[chave] || 0) + 1;
  });
  return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
}

function renderDonut(svgId, legendId, totalId, dados, cores, rotulos) {
  const svg = document.getElementById(svgId);
  const legend = document.getElementById(legendId);
  const totalEl = document.getElementById(totalId);
  svg.innerHTML = '';
  legend.innerHTML = '';

  const total = dados.reduce((s, d) => s + d[1], 0);
  if (totalEl) totalEl.textContent = total;

  if (dados.length === 0) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '40');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#374151');
    circle.setAttribute('stroke-width', '15');
    svg.appendChild(circle);
    legend.innerHTML = '<span style="color:#6b7280;">Sem dados</span>';
    return;
  }

  const circunferencia = 2 * Math.PI * 40;
  let offset = 0;

  dados.forEach(([chave, valor]) => {
    const percentual = valor / total;
    const dash = percentual * circunferencia;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '40');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', cores[chave] || '#999');
    circle.setAttribute('stroke-width', '15');
    circle.setAttribute('stroke-dasharray', `${dash} ${circunferencia - dash}`);
    circle.setAttribute('stroke-dashoffset', `${-offset}`);
    svg.appendChild(circle);
    offset += dash;
  });

  const pctFmt = (v) => ((v / total) * 100).toFixed(0);
  legend.innerHTML = dados.map(([chave, valor]) => {
    const cor = cores[chave] || '#999';
    const label = rotulos[chave] || chave;
    return `<span><i style="background:${cor}"></i> ${label} ${pctFmt(valor)}%</span>`;
  }).join('');
}

function renderTopEspecies(arvores) {
  const container = document.getElementById('topEspecies');
  container.innerHTML = '';

  const contagem = {};
  arvores.forEach(a => {
    if (a.especieNomePopular) {
      contagem[a.especieNomePopular] = (contagem[a.especieNomePopular] || 0) + 1;
    }
  });

  const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max = ordenado.length > 0 ? ordenado[0][1] : 1;

  if (ordenado.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma árvore com espécie informada.</p>';
    return;
  }

  ordenado.forEach(([nome, qtd], i) => {
    const pct = (qtd / max * 100).toFixed(0);
    const row = document.createElement('div');
    row.className = 'placar-barras-linha';
    row.style.animationDelay = `${i * 90}ms`;
    row.innerHTML = `
      <div class="placar-barras-topo">
        <span>${nome}</span>
        <strong>${qtd}</strong>
      </div>
      <div class="placar-barra">
        <div class="placar-barra-fill" style="width:0%;"></div>
      </div>
    `;
    container.appendChild(row);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.placar-barra-fill').style.width = `${pct}%`;
      });
    });
  });
}

carregarDados();
