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

let dadosExport = { arvores: [], areas: [], especies: [], lotes: [], plantios: [], manutencoes: [] };

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

  dadosExport = { arvores: a, areas: ar, especies: e, lotes: l, plantios: p, manutencoes: m };

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

function formatarData() {
  return new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
}

function montarTabelas() {
  const d = dadosExport;
  return [
    {
      titulo: 'Árvores (' + d.arvores.length + ')',
      colunas: ['ID', 'Nome', 'Espécie', 'Porte', 'Origem', 'Condição', 'Status', 'Área'],
      linhas: d.arvores.map(a => [a.id, a.nome || '', a.especieNomePopular || '', a.porte || '', a.origem || '', a.condicaoFitossanitaria || '', a.status || '', a.areaNome || ''])
    },
    {
      titulo: 'Áreas Verdes (' + d.areas.length + ')',
      colunas: ['ID', 'Nome', 'Tipo', 'Bairro', 'Status'],
      linhas: d.areas.map(a => [a.id, a.nome || '', a.tipo || '', a.bairro || '', a.status || ''])
    },
    {
      titulo: 'Espécies (' + d.especies.length + ')',
      colunas: ['ID', 'Nome Popular', 'Nome Científico', 'Família'],
      linhas: d.especies.map(e => [e.id, e.nomePopular || '', e.nomeCientifico || '', e.familia || ''])
    },
    {
      titulo: 'Lotes Sementeira (' + d.lotes.length + ')',
      colunas: ['ID', 'Lote', 'Espécie', 'Produzida', 'Disponível', 'Doadas', 'Plantadas', 'Perdas', 'Data'],
      linhas: d.lotes.map(l => [l.id, l.numeroLote || '', l.especieNomePopular || '', l.quantidadeProduzida || 0, l.quantidadeDisponivel || 0, l.quantidadeDoadas || 0, l.quantidadePlantadas || 0, l.quantidadePerdas || 0, l.dataProducao || ''])
    },
    {
      titulo: 'Plantios (' + d.plantios.length + ')',
      colunas: ['ID', 'Área', 'Espécie', 'Qtd Mudas', 'Data', 'Responsável', 'Status'],
      linhas: d.plantios.map(p => [p.id, p.areaNome || '', p.especieNomePopular || '', p.quantidadeMudas || 0, p.dataPlantio || '', p.responsavel || '', p.status || ''])
    },
    {
      titulo: 'Ordens de Serviço (' + d.manutencoes.length + ')',
      colunas: ['ID', 'Tipo', 'Prioridade', 'Status', 'Data Solicitada', 'Responsável'],
      linhas: d.manutencoes.map(m => [m.id, m.tipo || '', m.prioridade || '', m.status || '', m.dataAgendada || '', m.responsavel || ''])
    }
  ];
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const tabelas = montarTabelas();
  let y = 15;

  doc.setFontSize(16);
  doc.text('Relatório — Arborização Urbana', 14, y);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), 14, y + 6);
  doc.setTextColor(0);
  y += 14;

  tabelas.forEach(t => {
    if (y > 260) { doc.addPage(); y = 15; }
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(t.titulo, 14, y);
    y += 2;
    doc.setFont(undefined, 'normal');

    if (t.linhas.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('Sem dados.', 14, y + 5);
      doc.setTextColor(0);
      y += 10;
      return;
    }

    doc.autoTable({
      startY: y,
      head: [t.colunas],
      body: t.linhas,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [34, 120, 62] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => { y = data.cursor.y + 4; }
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  doc.save('relatorio-arborizacao-' + formatarData() + '.pdf');
}

function exportarExcel() {
  const tabelas = montarTabelas();
  const wb = XLSX.utils.book_new();

  tabelas.forEach(t => {
    const wsData = [t.colunas, ...t.linhas];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = t.colunas.map(() => ({ wch: 18 }));
    const nome = t.titulo.split('(')[0].trim().substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, nome);
  });

  XLSX.writeFile(wb, 'relatorio-arborizacao-' + formatarData() + '.xlsx');
}

function exportarCSV() {
  const tabelas = montarTabelas();
  const d = dadosExport;
  const csvRows = [];

  tabelas.forEach(t => {
    csvRows.push('--- ' + t.titulo + ' ---');
    csvRows.push(t.colunas.join(';'));
    t.linhas.forEach(l => {
      csvRows.push(l.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';'));
    });
    csvRows.push('');
  });

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio-arborizacao-' + formatarData() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}
