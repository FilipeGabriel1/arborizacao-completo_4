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

const COLORS = ['#22c55e','#facc15','#ef4444','#3b82f6','#a855f7','#f97316','#06b6d4','#ec4899','#84cc16','#64748b'];

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

  // KPIs
  document.getElementById('kpiArvores').textContent = a.length;
  document.getElementById('kpiAreas').textContent = ar.length;
  document.getElementById('kpiEspecies').textContent = e.length;
  let totalMudas = 0; l.forEach(lote => { totalMudas += lote.quantidadeProduzida || 0; });
  document.getElementById('kpiMudas').textContent = totalMudas;
  document.getElementById('kpiPlantios').textContent = p.length;
  document.getElementById('kpiManutencoes').textContent = m.length;

  // Charts
  renderDonut('chartPorte', 'chartPorteLegend', agrupar(a, 'porte'));
  renderDonut('chartOrigem', 'chartOrigemLegend', agrupar(a, 'origem'));
  renderDonut('chartCondicao', 'chartCondicaoLegend', agrupar(a, 'condicaoFitossanitaria'));
  renderDonut('chartPlantios', 'chartPlantiosLegend', agrupar(p, 'status'));

  // Top Espécies
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

function renderDonut(svgId, legendId, dados) {
  const svg = document.getElementById(svgId);
  const legend = document.getElementById(legendId);
  svg.innerHTML = '';
  legend.innerHTML = '';

  if (dados.length === 0) {
    svg.innerHTML = '<text x="100" y="105" text-anchor="middle" fill="var(--muted)" font-size="11">Sem dados</text>';
    return;
  }

  const total = dados.reduce((s, d) => s + d[1], 0);
  const cx = 100, cy = 100, r = 70;
  let angle = -Math.PI / 2;

  dados.forEach((d, i) => {
    const fatia = d[1] / total;
    const fim = angle + fatia * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(fim);
    const y2 = cy + r * Math.sin(fim);
    const large = fatia > 0.5 ? 1 : 0;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`);
    path.setAttribute('fill', COLORS[i % COLORS.length]);
    path.setAttribute('stroke', '#1e293b');
    path.setAttribute('stroke-width', '1');
    svg.appendChild(path);
    angle = fim;

    legend.innerHTML += `<div class="chart-legend-item"><span class="chart-legend-color" style="background:${COLORS[i % COLORS.length]};"></span>${d[0]}: ${d[1]}</div>`;
  });

  // Centro
  const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  center.setAttribute('cx', cx);
  center.setAttribute('cy', cy);
  center.setAttribute('r', 40);
  center.setAttribute('fill', '#1e293b');
  svg.appendChild(center);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', cx);
  text.setAttribute('y', cy + 4);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', '#f8fafc');
  text.setAttribute('font-size', '14');
  text.setAttribute('font-weight', '700');
  text.textContent = total;
  svg.appendChild(text);
}

function renderTopEspecies(arvores, especies) {
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

  ordenado.forEach((d, i) => {
    const pct = (d[1] / max * 100).toFixed(0);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;';
    row.innerHTML = `
      <span style="min-width:24px;text-align:right;font-size:0.78rem;color:var(--muted);">${i + 1}º</span>
      <span style="min-width:150px;font-size:0.85rem;">${d[0]}</span>
      <div style="flex:1;height:20px;background:rgba(34,197,94,0.1);border-radius:10px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--green);border-radius:10px;"></div>
      </div>
      <span style="min-width:30px;text-align:right;font-size:0.82rem;font-weight:600;">${d[1]}</span>
    `;
    container.appendChild(row);
  });
}

carregarDados();
