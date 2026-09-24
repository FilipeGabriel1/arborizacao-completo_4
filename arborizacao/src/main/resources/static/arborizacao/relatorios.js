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

  renderPieChart('chartPorte', agrupar(a, 'porte'), CORES_PORTE, ROTULOS_PORTE);
  renderPieChart('chartOrigem', agrupar(a, 'origem'), CORES_ORIGEM, ROTULOS_ORIGEM);
  renderPieChart('chartCondicao', agrupar(a, 'condicaoFitossanitaria'), CORES_CONDICAO, ROTULOS_CONDICAO);
  renderPieChart('chartPlantios', agrupar(p, 'status'), CORES_PLANTIO, ROTULOS_PLANTIO);

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

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function fatiaPie(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.99) {
    return 'M ' + cx + ' ' + (cy - r) +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + r) +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy - r) + ' Z';
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return 'M ' + cx + ' ' + cy +
    ' L ' + start.x + ' ' + start.y +
    ' A ' + r + ' ' + r + ' 0 ' + large + ' 0 ' + end.x + ' ' + end.y +
    ' Z';
}

function renderPieChart(containerId, dados, cores, rotulos) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const itens = (dados || []).filter(([, valor]) => valor > 0);
  if (itens.length === 0) {
    el.innerHTML = '<p style="color:#6b7280;font-size:0.85rem;">Sem dados</p>';
    return;
  }
  const total = itens.reduce((s, [, v]) => s + v, 0);
  const cx = 100, cy = 100, r = 80;
  let paths = '';
  if (itens.length === 1) {
    const [chave, valor] = itens[0];
    const cor = cores[chave] || '#22c55e';
    const nome = (rotulos && rotulos[chave]) || chave;
    paths = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
      '" fill="' + cor + '" stroke="#0f172a" stroke-width="2">' +
      '<title>' + nome + ': ' + valor + '</title></circle>';
  } else {
    let angle = 0;
    itens.forEach(([chave, valor]) => {
      const slice = (valor / total) * 360;
      const cor = cores[chave] || '#22c55e';
      const nome = (rotulos && rotulos[chave]) || chave;
      paths += '<path d="' + fatiaPie(cx, cy, r, angle, angle + slice) +
        '" fill="' + cor + '" stroke="#0f172a" stroke-width="2">' +
        '<title>' + nome + ': ' + valor + '</title></path>';
      angle += slice;
    });
  }
  const legend = itens.map(([chave, valor]) => {
    const cor = cores[chave] || '#22c55e';
    const nome = (rotulos && rotulos[chave]) || chave;
    const pct = Math.round((valor / total) * 100);
    return '<span><i style="background:' + cor + ';"></i>' +
      nome + ' (' + valor + ' • ' + pct + '%)</span>';
  }).join('');
  el.innerHTML =
    '<div class="pie-wrap">' +
    '<svg viewBox="0 0 200 200" role="img" aria-label="Gráfico de pizza">' + paths + '</svg>' +
    '<div class="chart-legend">' + legend + '</div>' +
    '</div>';
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
      linhas: d.arvores.map(a => [a.id, a.nome || '', a.especieNomePopular || '', a.porte || '', a.origem || '', a.condicaoFitossanitaria || '', a.status || '', a.areaNome || '']),
      colWidths: { 0: { cellWidth: 10 }, 1: { cellWidth: 28 }, 2: { cellWidth: 28 } }
    },
    {
      titulo: 'Áreas Verdes (' + d.areas.length + ')',
      colunas: ['ID', 'Nome', 'Tipo', 'Bairro', 'Status'],
      linhas: d.areas.map(a => [a.id, a.nome || '', a.tipo || '', a.bairro || '', a.status || '']),
      colWidths: { 0: { cellWidth: 10 }, 1: { cellWidth: 45 } }
    },
    {
      titulo: 'Espécies (' + d.especies.length + ')',
      colunas: ['ID', 'Nome Popular', 'Nome Científico', 'Família'],
      linhas: d.especies.map(e => [e.id, e.nomePopular || '', e.nomeCientifico || '', e.familia || '']),
      colWidths: { 0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 2: { cellWidth: 55 } }
    },
    {
      titulo: 'Lotes Sementeira (' + d.lotes.length + ')',
      colunas: ['ID', 'Lote', 'Espécie', 'Produzida', 'Disponível', 'Doadas', 'Plantadas', 'Perdas', 'Data'],
      linhas: d.lotes.map(l => [l.id, l.numeroLote || '', l.especieNomePopular || '', l.quantidadeProduzida || 0, l.quantidadeDisponivel || 0, l.quantidadeDoadas || 0, l.quantidadePlantadas || 0, l.quantidadePerdas || 0, l.dataProducao || '']),
      colWidths: { 0: { cellWidth: 10 }, 1: { cellWidth: 28 }, 2: { cellWidth: 22 } }
    },
    {
      titulo: 'Plantios (' + d.plantios.length + ')',
      colunas: ['ID', 'Área', 'Espécie', 'Qtd Mudas', 'Data', 'Responsável', 'Status'],
      linhas: d.plantios.map(p => [p.id, p.areaNome || '', p.especieNomePopular || '', p.quantidadeMudas || 0, p.dataPlantio || '', p.responsavel || '', p.status || '']),
      colWidths: { 0: { cellWidth: 10 }, 1: { cellWidth: 35 }, 2: { cellWidth: 25 } }
    },
    {
      titulo: 'Ordens de Serviço (' + d.manutencoes.length + ')',
      colunas: ['ID', 'Tipo', 'Prioridade', 'Status', 'Data Solicitada', 'Responsável'],
      linhas: d.manutencoes.map(m => [m.id, m.tipo || '', m.prioridade || '', m.status || '', m.dataAgendada || '', m.responsavelExecucao || '']),
      colWidths: { 0: { cellWidth: 10 }, 1: { cellWidth: 32 }, 5: { cellWidth: 32 } }
    }
  ];
}

function exportarPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Biblioteca PDF não carregada. Verifique sua conexão com a internet e recarregue a página (Ctrl+Shift+R).');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const tabelas = montarTabelas();
  let y = 15;

  doc.setFillColor(34, 120, 62);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text('Relatório — Arborização Urbana', 14, 14);
  doc.setFontSize(9);
  doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), 14, 21);
  doc.setTextColor(0);
  y += 18;

  tabelas.forEach((t, idx) => {
    if (y > 260) { doc.addPage(); y = 15; }

    if (idx > 0) {
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(14, y, 196, y);
      y += 6;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(34, 120, 62);
    doc.text(t.titulo, 14, y);
    doc.setTextColor(0);
    y += 4;
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
      styles: { fontSize: 7.5, cellPadding: 3, lineColor: [180, 180, 180], lineWidth: 0.3, overflow: 'linebreak' },
      headStyles: { fillColor: [34, 120, 62], textColor: [255, 255, 255], lineColor: [34, 120, 62], lineWidth: 0.5, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      columnStyles: t.colWidths || {},
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        y = data.cursor.y + 4;
        const pg = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Arborização Urbana — Relatório', 14, 290);
        doc.text('Página ' + data.pageNumber + ' de ' + pg, 105, 290, { align: 'center' });
        doc.setTextColor(0);
      }
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  doc.save('relatorio-arborizacao-' + formatarData() + '.pdf');
}

function exportarExcel() {
  if (!window.XLSX) {
    alert('Biblioteca Excel não carregada. Verifique sua conexão com a internet e recarregue a página (Ctrl+Shift+R).');
    return;
  }
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
