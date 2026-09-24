(function () {
  'use strict';

  const COLORS = {
    porte: { PEQUENO: '#49a970', MEDIO: '#2f9e5b', GRANDE: '#1a7a3e' },
    origem: { NATIVA: '#49a970', EXOTICA: '#6aa7dc' },
    status: { ATIVA: '#49a970', INATIVA: '#dc963c', EM_MANUTENCAO: '#79c0ff', REMOVIDA: '#ffa198' }
  };

  let map = null;
  let areasData = [];
  let arvoresData = [];
  let especiesData = [];
  let placarData = null;
  let sementeiraData = [];
  let usuariosData = [];
  let manutencoesData = [];

  function formatarNumero(n) {
    return Number(n).toLocaleString('pt-BR');
  }

  function formatarData(data) {
    if (!data) return '—';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatarDataHora(data) {
    if (!data) return '—';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function animarValor(el, alvo) {
    const duracao = 900;
    const inicio = performance.now();
    const inicial = parseInt(el.textContent.replace(/\D/g, '')) || 0;

    function frame(now) {
      const progresso = Math.min((now - inicio) / duracao, 1);
      const ease = 1 - Math.pow(1 - progresso, 3);
      const atual = Math.round(inicial + (alvo - inicial) * ease);
      el.textContent = formatarNumero(atual);
      if (progresso < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function buscarTudo(url, pageSize) {
    pageSize = pageSize || 500;
    return fetch(url + (url.includes('?') ? '&' : '?') + 'page=0&size=' + pageSize, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { value: [] }; })
      .then(function (data) { return data.value || data || []; })
      .catch(function () { return []; });
  }

  function carregarDados() {
    return Promise.all([
      buscarTudo('/api/areas'),
      buscarTudo('/api/arvores'),
      buscarTudo('/api/especies'),
      fetch('/api/placar', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      buscarTudo('/api/sementeira'),
      fetch('/api/usuarios', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      buscarTudo('/api/manutencoes')
    ]).then(function (results) {
      areasData = results[0];
      arvoresData = results[1];
      especiesData = results[2];
      placarData = results[3];
      sementeiraData = results[4] || [];
      usuariosData = Array.isArray(results[5]) ? results[5] : [];
      manutencoesData = results[6] || [];
      return { areas: areasData, arvores: arvoresData, especies: especiesData, placar: placarData };
    });
  }

  function isEncerrada(m) {
    var s = (m.status || '').toUpperCase();
    return s === 'CONCLUIDA' || s === 'CANCELADA';
  }

  function contarPendentes() {
    return manutencoesData.filter(function (m) { return !isEncerrada(m); }).length;
  }

  function renderKPIs() {
    var totalArvores = arvoresData.length;
    var totalAreas = areasData.length;
    var totalEspecies = especiesData.length;

    animarValor(document.getElementById('kpiIndividuos'), totalArvores);
    animarValor(document.getElementById('kpiAreas'), totalAreas);
    animarValor(document.getElementById('kpiEspecies'), totalEspecies);

    document.getElementById('kpiManejo').textContent = formatarNumero(contarPendentes());

    var mDisponiveisKpi = sementeiraData.reduce(function (s, l) { return s + (l.quantidadeDisponivel || 0); }, 0);
    document.getElementById('kpiMudas').textContent = formatarNumero(mDisponiveisKpi);

    if (placarData) {
      document.getElementById('summaryDoacoes').textContent = formatarNumero(placarData.totalDoacoes || 0);
      document.getElementById('summaryMudasDoadas').textContent = formatarNumero(placarData.totalMudasDoadas || 0);
    }

    document.getElementById('summaryUsuarios').textContent = formatarNumero(usuariosData.length);

    var mProduzidas = sementeiraData.reduce(function (s, l) { return s + (l.quantidadeProduzida || 0); }, 0);
    var mDisponiveis = sementeiraData.reduce(function (s, l) { return s + (l.quantidadeDisponivel || 0); }, 0);
    var mDoadas = sementeiraData.reduce(function (s, l) { return s + (l.quantidadeDoadas || 0); }, 0);
    var mPlantadas = sementeiraData.reduce(function (s, l) { return s + (l.quantidadePlantadas || l.quantidadeDestinadas || 0); }, 0);
    var mPerdas = sementeiraData.reduce(function (s, l) { return s + (l.quantidadePerdas || 0); }, 0);

    document.getElementById('nurseryProduzidas').textContent = formatarNumero(mProduzidas);
    document.getElementById('nurseryDisponiveis').textContent = formatarNumero(mDisponiveis);
    document.getElementById('nurseryDoadas').textContent = formatarNumero(mDoadas);
    document.getElementById('nurseryPlantadas').textContent = formatarNumero(mPlantadas);
    document.getElementById('nurseryPerdas').textContent = formatarNumero(mPerdas);
  }

  function renderTasks() {
    var criticas = arvoresData.filter(function (a) {
      var c = a.condicaoFitossanitaria;
      return c === 'RUIM' || c === 'CRITICO';
    }).length;

    var areasAndamento = areasData.filter(function (ar) {
      var s = ar.situacaoInventario;
      return s === 'EM_ANDAMENTO' || s === 'EM_ATUALIZACAO';
    }).length;

    var pManejos = document.getElementById('taskManejos');
    if (pManejos) pManejos.textContent = formatarNumero(contarPendentes());
    var pCriticas = document.getElementById('taskCriticas');
    if (pCriticas) pCriticas.textContent = formatarNumero(criticas);
    var pInventario = document.getElementById('taskInventario');
    if (pInventario) pInventario.textContent = formatarNumero(areasAndamento);
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    var a = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    var a = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function donutSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
    var sweep = endAngle - startAngle;
    if (sweep <= 0) return '';
    if (sweep >= 359.99) {
      return { full: true, mid: (rOuter + rInner) / 2, thick: rOuter - rInner };
    }
    var large = sweep > 180 ? 1 : 0;
    var o1 = polarToCartesian(cx, cy, rOuter, startAngle);
    var o2 = polarToCartesian(cx, cy, rOuter, endAngle);
    var i1 = polarToCartesian(cx, cy, rInner, endAngle);
    var i2 = polarToCartesian(cx, cy, rInner, startAngle);
    return {
      d: 'M ' + o1.x + ' ' + o1.y +
        ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + o2.x + ' ' + o2.y +
        ' L ' + i1.x + ' ' + i1.y +
        ' A ' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + i2.x + ' ' + i2.y +
        ' Z'
    };
  }

  function criarDonutChart(containerId, dados, cores) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var itens = (dados || []).filter(function (d) { return d.valor > 0; });
    if (itens.length === 0) {
      container.innerHTML = '<p style="color:#6b7280;font-size:0.85rem;">Sem dados</p>';
      return;
    }

    var total = itens.reduce(function (s, d) { return s + d.valor; }, 0);
    if (total <= 0) {
      container.innerHTML = '<p style="color:#6b7280;font-size:0.85rem;">Sem dados</p>';
      return;
    }

    var cx = 100, cy = 100, rOuter = 90, rInner = 58;
    var paths = '';
    var angle = 0;

    itens.forEach(function (d, idx) {
      var slice = (d.valor / total) * 360;
      var cor = cores[d.chave] || '#999';
      var seg = donutSegment(cx, cy, rOuter, rInner, angle, angle + slice);
      if (seg && seg.full) {
        paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + seg.mid +
          '" fill="none" stroke="' + cor + '" stroke-width="' + seg.thick +
          '"><title>' + d.rotulo + ': ' + d.valor + '</title></circle>';
      } else if (seg && seg.d) {
        paths += '<path d="' + seg.d + '" fill="' + cor + '" stroke="#080e0b" stroke-width="1.5">' +
          '<title>' + d.rotulo + ': ' + d.valor + '</title></path>';
      }
      angle += slice;
    });

    var legend = itens.map(function (d) {
      var cor = cores[d.chave] || '#999';
      var pct = Math.round((d.valor / total) * 100);
      return '<span><i style="background:' + cor + ';"></i>' +
        d.rotulo + ' (' + d.valor + ' • ' + pct + '%)</span>';
    }).join('');

    container.innerHTML =
      '<div class="donut-wrap">' +
      '<div class="donut-svg-box">' +
      '<svg viewBox="0 0 200 200" role="img" aria-label="Gráfico de rosca">' + paths + '</svg>' +
      '<div class="donut-center">' +
      '<span class="donut-valor">' + total + '</span>' +
      '<span class="donut-label">Total</span>' +
      '</div>' +
      '</div>' +
      '<div class="chart-legend">' + legend + '</div>' +
      '</div>';
  }

  function renderCharts() {
    var porPorte = {};
    var porOrigem = {};

    arvoresData.forEach(function (a) {
      var p = a.porte || 'MEDIO';
      porPorte[p] = (porPorte[p] || 0) + 1;

      var nativas = a.tipoArvore === 'NATIVA' ? 'NATIVA' : 'EXOTICA';
      porOrigem[nativas] = (porOrigem[nativas] || 0) + 1;
    });

    criarDonutChart('chartPorte', [
      { chave: 'PEQUENO', rotulo: 'Pequeno', valor: porPorte.PEQUENO || 0 },
      { chave: 'MEDIO', rotulo: 'Médio', valor: porPorte.MEDIO || 0 },
      { chave: 'GRANDE', rotulo: 'Grande', valor: porPorte.GRANDE || 0 }
    ], COLORS.porte);

    criarDonutChart('chartOrigem', [
      { chave: 'NATIVA', rotulo: 'Nativas', valor: porOrigem.NATIVA || 0 },
      { chave: 'EXOTICA', rotulo: 'Exóticas', valor: porOrigem.EXOTICA || 0 }
    ], COLORS.origem);
  }

  function initMap() {
    if (typeof maplibregl === 'undefined') return;

    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [-35.291, -8.119],
      zoom: 13
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', function () {
      map.addSource('arvores', {
        type: 'geojson',
        data: emptyFC(),
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50
      });

      map.addSource('areas', {
        type: 'geojson',
        data: emptyFC()
      });

      map.addLayer({
        id: 'areas-fill',
        type: 'fill',
        source: 'areas',
        paint: {
          'fill-color': 'rgba(69, 176, 109, 0.2)',
          'fill-outline-color': 'rgba(69, 176, 109, 0.6)'
        }
      });

      map.addLayer({
        id: 'areas-border',
        type: 'line',
        source: 'areas',
        paint: {
          'line-color': 'rgba(69, 176, 109, 0.6)',
          'line-width': 2
        }
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'arvores',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            'rgba(69, 176, 109, 0.6)',
            10, 'rgba(69, 176, 109, 0.7)',
            30, 'rgba(47, 158, 91, 0.8)',
            60, 'rgba(26, 122, 62, 0.9)'
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            16, 10, 22, 30, 28, 60, 34
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: 'arvores',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#49a970',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      refreshMap();

      map.on('click', 'areas-fill', function (e) {
        if (!e.features || !e.features.length) return;
        var p = e.features[0].properties;
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML('<strong>' + p.nome + '</strong><br/>Tipo: ' + p.tipo + '<br/>Status: ' + (p.status || '—'))
          .addTo(map);
      });

      map.on('click', 'areas-border', function (e) {
        if (!e.features || !e.features.length) return;
        var p = e.features[0].properties;
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML('<strong>' + p.nome + '</strong><br/>Tipo: ' + p.tipo + '<br/>Status: ' + (p.status || '—'))
          .addTo(map);
      });

      map.on('click', 'unclustered', function (e) {
        if (!e.features || !e.features.length) return;
        var p = e.features[0].properties;
        function abrir(arvore) {
          if (window.abrirTelaArvore) abrirTelaArvore(arvore, p);
          else if (window.montarPainelArvore) montarPainelArvore(arvore, p);
        }
        fetch('/api/arvores/' + p.id, { credentials: 'same-origin' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(abrir)
          .catch(function () { abrir(null); });
      });

      map.on('click', 'clusters', function (e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features || !features.length) return;
        var clusterId = features[0].properties.cluster_id;
        var source = map.getSource('arvores');
        source.getClusterExpansionZoom(clusterId, function (err, zoom) {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
        });
      });

      map.on('mouseenter', 'clusters', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', function () { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'unclustered', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered', function () { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'areas-fill', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'areas-fill', function () { map.getCanvas().style.cursor = ''; });

      document.getElementById('camadaArvores').addEventListener('change', function (e) {
        var vis = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('clusters', 'visibility', vis);
        map.setLayoutProperty('unclustered', 'visibility', vis);
      });

      document.getElementById('camadaAreas').addEventListener('change', function (e) {
        var vis = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('areas-fill', 'visibility', vis);
        map.setLayoutProperty('areas-border', 'visibility', vis);
      });
    });
  }

  function emptyFC() {
    return { type: 'FeatureCollection', features: [] };
  }

  function areaToFeatures(areas) {
    var features = [];
    areas.forEach(function (area) {
      if (area.pontos && area.pontos.length > 0) {
        if (area.pontos.length === 1) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [area.pontos[0].longitude, area.pontos[0].latitude] },
            properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
          });
        } else {
          var coords = area.pontos.map(function (p) { return [p.longitude, p.latitude]; });
          if (coords.length > 2) coords.push(coords[0]);
          features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
          });
        }
      } else if (area.latitude && area.longitude) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [area.longitude, area.latitude] },
          properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
        });
      }
    });
    return { type: 'FeatureCollection', features: features };
  }

  function arvoreToFeatures(arvores) {
    var features = [];
    arvores.forEach(function (a) {
      if (a.latitude && a.longitude) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
          properties: {
            id: a.id,
            nome: a.nome || 'Árvore #' + a.id,
            especie: a.especieNomePopular || 'Não informada',
            porte: a.porte,
            fotoUrl: a.fotoUrl || ''
          }
        });
      }
    });
    return { type: 'FeatureCollection', features: features };
  }

  function refreshMap() {
    if (!map) return;
    var src = map.getSource('arvores');
    var srcA = map.getSource('areas');
    if (!src || !srcA) return;
    var arvoreFeatures = arvoreToFeatures(arvoresData);
    var areaFeatures = areaToFeatures(areasData);
    src.setData(arvoreFeatures);
    srcA.setData(areaFeatures);
    console.log('[MAP] Areas raw:', areasData.length, 'Arvores raw:', arvoresData.length);
    console.log('[MAP] Area features:', areaFeatures.features.length, 'Arvore features:', arvoreFeatures.features.length);
    if (areaFeatures.features.length > 0) console.log('[MAP] First area feature:', JSON.stringify(areaFeatures.features[0].geometry));
    else if (areasData.length > 0) console.log('[MAP] First area data:', JSON.stringify(areasData[0]));
  }

  function renderRecentTrees() {
    var tbody = document.getElementById('recentTreesBody');
    if (!tbody) return;

    var recentes = arvoresData.slice().sort(function (a, b) {
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    }).slice(0, 5);

    tbody.innerHTML = recentes.map(function (a) {
      var especie = a.especieNomePopular || 'Não informada';
      var area = a.areaNome || '—';
      return '<tr>' +
        '<td><span class="tree-id">ARB-' + String(a.id).padStart(6, '0') + '</span></td>' +
        '<td>' + especie + '</td>' +
        '<td>' + area + '</td>' +
        '<td>' + formatarData(a.criadoEm) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderActivityFeed() {
    var feed = document.getElementById('activityFeed');
    if (!feed) return;

    var items = [];

    arvoresData.slice().sort(function (a, b) {
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    }).slice(0, 4).forEach(function (a) {
      items.push({
        tipo: 'tree',
        titulo: 'Cadastro de árvore: ' + (a.nome || 'ARB-' + String(a.id).padStart(6, '0')),
        detalhe: formatarDataHora(a.criadoEm),
        icone: '🌱'
      });
    });

    areasData.slice().sort(function (a, b) {
      return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
    }).slice(0, 3).forEach(function (a) {
      items.push({
        tipo: 'create',
        titulo: 'Cadastro de nova área: ' + a.nome,
        detalhe: formatarDataHora(a.criadoEm),
        icone: '🏞️'
      });
    });

    items.sort(function (a, b) {
      return new Date(b.detalhe) - new Date(a.detalhe);
    });

    feed.innerHTML = items.slice(0, 6).map(function (item) {
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + item.tipo + '">' + item.icone + '</div>' +
        '<div class="activity-body">' +
        '<strong>' + item.titulo + '</strong>' +
        '<p>' + item.detalhe + '</p>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function initSearch() {
    var input = document.getElementById('globalSearch');
    if (!input) return;

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var termo = input.value.trim().toLowerCase();
        if (!termo) return;

        var arvoreMatch = arvoresData.find(function (a) {
          return (a.nome && a.nome.toLowerCase().includes(termo)) ||
                 String(a.id).includes(termo) ||
                 (a.especieNomePopular && a.especieNomePopular.toLowerCase().includes(termo));
        });

        if (arvoreMatch) {
          window.location.href = './arvores.html?search=' + encodeURIComponent(termo);
          return;
        }

        var areaMatch = areasData.find(function (a) {
          return (a.nome && a.nome.toLowerCase().includes(termo)) ||
                 String(a.id).includes(termo);
        });

        if (areaMatch) {
          window.location.href = './cadastro-areas.html?search=' + encodeURIComponent(termo);
          return;
        }

        var especieMatch = especiesData.find(function (e) {
          return (e.nomePopular && e.nomePopular.toLowerCase().includes(termo)) ||
                 (e.nomeCientifico && e.nomeCientifico.toLowerCase().includes(termo));
        });

        if (especieMatch) {
          window.location.href = './especies.html?search=' + encodeURIComponent(termo);
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    carregarDados().then(function () {
      renderKPIs();
      renderTasks();
      renderCharts();
      renderRecentTrees();
      renderActivityFeed();
      initMap();
      initSearch();
      animarEntrada(document.querySelector('.dashboard-grid'));
    });
  });
})();
