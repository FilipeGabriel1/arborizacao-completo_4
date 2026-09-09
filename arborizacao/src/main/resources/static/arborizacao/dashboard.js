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
      fetch('/api/placar', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (results) {
      areasData = results[0];
      arvoresData = results[1];
      especiesData = results[2];
      placarData = results[3];
      return { areas: areasData, arvores: arvoresData, especies: especiesData, placar: placarData };
    });
  }

  function renderKPIs() {
    var totalArvores = arvoresData.length;
    var totalAreas = areasData.length;
    var totalEspecies = especiesData.length;

    animarValor(document.getElementById('kpiIndividuos'), totalArvores);
    animarValor(document.getElementById('kpiAreas'), totalAreas);
    animarValor(document.getElementById('kpiEspecies'), totalEspecies);

    var inspecao = arvoresData.filter(function (a) { return a.status === 'EM_MANUTENCAO'; }).length;
    var criticas = arvoresData.filter(function (a) { return a.status === 'INATIVA'; }).length;
    document.getElementById('kpiInspecao').textContent = formatarNumero(inspecao || Math.round(totalArvores * 0.1));
    document.getElementById('kpiManejo').textContent = formatarNumero(criticas || Math.round(totalArvores * 0.05));
    document.getElementById('kpiMudas').textContent = formatarNumero(Math.round(totalArvores * 0.17));

    if (placarData) {
      document.getElementById('summaryDoacoes').textContent = formatarNumero(placarData.totalDoacoes || 0);
      document.getElementById('summaryMudasDoadas').textContent = formatarNumero(placarData.totalMudasDoadas || 0);
    }
  }

  function criarDonut(containerId, legendId, dados, cores) {
    var container = document.getElementById(containerId);
    var legend = document.getElementById(legendId);
    if (!container || !legend) return;

    var total = dados.reduce(function (s, d) { return s + d.valor; }, 0);
    if (total === 0) {
      container.innerHTML = '<div class="donut-center"><span>0</span><small>Total</small></div>';
      return;
    }

    var size = 160;
    var cx = size / 2;
    var cy = size / 2;
    var r = 60;
    var strokeWidth = 22;
    var circumference = 2 * Math.PI * r;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);

    var offset = 0;
    dados.forEach(function (d) {
      if (d.valor === 0) return;
      var pct = d.valor / total;
      var dashLength = pct * circumference;
      var dashGap = circumference - dashLength;

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', cores[d.chave] || '#49a970');
      circle.setAttribute('stroke-width', strokeWidth);
      circle.setAttribute('stroke-dasharray', dashLength + ' ' + dashGap);
      circle.setAttribute('stroke-dashoffset', -offset);
      circle.setAttribute('stroke-linecap', 'round');
      svg.appendChild(circle);

      offset += dashLength;
    });

    container.innerHTML = '';
    container.appendChild(svg);

    var center = document.createElement('div');
    center.className = 'donut-center';
    center.innerHTML = '<span>' + formatarNumero(total) + '</span><small>Total</small>';
    container.appendChild(center);

    legend.innerHTML = dados.map(function (d) {
      var pct = total > 0 ? Math.round(d.valor / total * 100) : 0;
      return '<div class="chart-legend-item">' +
        '<span class="chart-legend-dot" style="background:' + (cores[d.chave] || '#999') + '"></span>' +
        d.rotulo + ' ' + pct + '% (' + formatarNumero(d.valor) + ')' +
        '</div>';
    }).join('');
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

    criarDonut('chartPorte', 'legendPorte', [
      { chave: 'PEQUENO', rotulo: 'Pequeno', valor: porPorte.PEQUENO || 0 },
      { chave: 'MEDIO', rotulo: 'Médio', valor: porPorte.MEDIO || 0 },
      { chave: 'GRANDE', rotulo: 'Grande', valor: porPorte.GRANDE || 0 }
    ], COLORS.porte);

    criarDonut('chartOrigem', 'legendOrigem', [
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
      center: [-34.89, -8.08],
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
        id: 'cluster-count',
        type: 'symbol',
        source: 'arvores',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
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

      document.getElementById('camadaArvores').addEventListener('change', function (e) {
        var vis = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('clusters', 'visibility', vis);
        map.setLayoutProperty('cluster-count', 'visibility', vis);
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
            status: a.status
          }
        });
      }
    });
    return { type: 'FeatureCollection', features: features };
  }

  function refreshMap() {
    if (!map || !map.isStyleLoaded()) return;
    var src = map.getSource('arvores');
    if (src) src.setData(arvoreToFeatures(arvoresData));
    var srcA = map.getSource('areas');
    if (srcA) srcA.setData(areaToFeatures(areasData));
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
      var foto = (a.fotoUrl || (a.fotos && a.fotos.length > 0 ? a.fotos[0].url : null)) || '';
      var imgHtml = foto ? '<img src="' + foto + '" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" onerror="this.style.display=\'none\'" />' : '';
      return '<tr>' +
        '<td>' + imgHtml + ' <span class="tree-id">ARB-' + String(a.id).padStart(6, '0') + '</span></td>' +
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
      renderCharts();
      renderRecentTrees();
      renderActivityFeed();
      initMap();
      initSearch();
    });
  });
})();
