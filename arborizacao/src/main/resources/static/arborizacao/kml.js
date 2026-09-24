/* kml.js — Export / Import KML */
(function () {
  var kmlFile = null;
  var kmlPlacemarks = [];
  var kmlSelectedIndices = [];

  window.exportarKml = function (tipo) {
    var url = '/api/kml/export/' + tipo;
    var a = document.createElement('a');
    a.href = url;
    a.download = tipo + '.kml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof showToast === 'function') {
      showToast('Download de ' + tipo + '.kml iniciado', 'success');
    }
  };

  window.previewKml = function (input) {
    if (!input.files || !input.files.length) return;
    kmlFile = input.files[0];
    kmlSelectedIndices = [];

    var formData = new FormData();
    formData.append('file', kmlFile);

    fetch('/api/kml/import/preview', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    })
    .then(function (r) {
      if (!r.ok) throw new Error('Erro ao ler KML');
      return r.json();
    })
    .then(function (data) {
      kmlPlacemarks = data;
      renderKmlPreview(data);
      document.getElementById('kmlModal').style.display = 'flex';
      loadAreaOptions();
      loadEspecieOptions();
      var has = data.length > 0;
      document.getElementById('kmlImportBtn').disabled = !has;
      updateSelectedHint();
    })
    .catch(function (err) {
      if (typeof showToast === 'function') {
        showToast('Erro: ' + err.message, 'error');
      }
    });

    input.value = '';
  };

  function updateSelectedHint() {
    var hint = document.getElementById('kmlSelectedHint');
    var btn = document.getElementById('kmlImportEditBtn');
    if (!hint) return;
    var n = kmlSelectedIndices.length;
    if (n > 0) {
      var nomes = kmlSelectedIndices.slice(0, 3).map(function (i) {
        return (kmlPlacemarks[i] && kmlPlacemarks[i].nome) || ('Ponto ' + (i + 1));
      });
      var extra = n > 3 ? ' +' + (n - 3) + ' outras' : '';
      hint.textContent = n + ' selecionada(s): ' + nomes.join(', ') + extra;
      if (btn) btn.disabled = false;
    } else {
      hint.textContent = 'Marque 1 ou mais pontos. Cada árvore abre com formulário próprio (sem misturar dados).';
      if (btn) btn.disabled = true;
    }
  }

  function renderKmlPreview(placemarks) {
    var preview = document.getElementById('kmlPreview');
    if (!placemarks.length) {
      preview.innerHTML = '<p style="color:var(--muted);">Nenhum ponto encontrado no KML.</p>';
      return;
    }

    var html = '<p style="margin:0 0 8px;font-size:0.85rem;color:var(--muted);">' + placemarks.length + ' ponto(s) — marque os que quer importar e editar:</p>';
    html += '<div style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">';
    html += '<thead><tr style="background:var(--bg);position:sticky;top:0;">' +
      '<th style="padding:8px;text-align:left;"><input type="checkbox" id="kmlCheckAll" title="Marcar todas" /></th>' +
      '<th style="padding:8px;text-align:left;">#</th>' +
      '<th style="padding:8px;text-align:left;">Nome</th>' +
      '<th style="padding:8px;text-align:left;">Latitude</th>' +
      '<th style="padding:8px;text-align:left;">Longitude</th></tr></thead>';
    html += '<tbody>';

    placemarks.forEach(function (pm, i) {
      html += '<tr class="kml-pm-row" data-index="' + i + '" style="border-top:1px solid var(--border);cursor:pointer;">';
      html += '<td style="padding:6px 8px;"><input type="checkbox" class="kml-pm-check" data-index="' + i + '" /></td>';
      html += '<td style="padding:6px 8px;">' + (i + 1) + '</td>';
      html += '<td style="padding:6px 8px;">' + (pm.nome || '—') + '</td>';
      html += '<td style="padding:6px 8px;font-family:monospace;">' + pm.latitude.toFixed(6) + '</td>';
      html += '<td style="padding:6px 8px;font-family:monospace;">' + pm.longitude.toFixed(6) + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    preview.innerHTML = html;

    function syncSelection() {
      kmlSelectedIndices = Array.prototype.map.call(
        preview.querySelectorAll('.kml-pm-check:checked'),
        function (c) { return parseInt(c.getAttribute('data-index'), 10); }
      ).sort(function (a, b) { return a - b; });
      preview.querySelectorAll('.kml-pm-row').forEach(function (row) {
        var idx = parseInt(row.getAttribute('data-index'), 10);
        var on = kmlSelectedIndices.indexOf(idx) !== -1;
        row.style.background = on ? 'rgba(47,111,237,0.18)' : '';
        row.style.outline = on ? '1px solid #2f6fed' : '';
      });
      var all = preview.querySelector('#kmlCheckAll');
      if (all) {
        all.checked = kmlSelectedIndices.length === placemarks.length && placemarks.length > 0;
      }
      updateSelectedHint();
    }

    preview.querySelectorAll('.kml-pm-check').forEach(function (chk) {
      chk.addEventListener('click', function (e) { e.stopPropagation(); syncSelection(); });
    });

    var checkAll = preview.querySelector('#kmlCheckAll');
    if (checkAll) {
      checkAll.addEventListener('click', function (e) {
        e.stopPropagation();
        var on = checkAll.checked;
        preview.querySelectorAll('.kml-pm-check').forEach(function (c) { c.checked = on; });
        syncSelection();
      });
    }

    preview.querySelectorAll('.kml-pm-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var chk = row.querySelector('.kml-pm-check');
        if (chk) {
          chk.checked = !chk.checked;
          syncSelection();
        }
      });
    });

    syncSelection();
  }

  function loadAreaOptions() {
    var select = document.getElementById('kmlAreaSelect');
    if (!select) return;
    fetch('/api/areas?page=0&size=500', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { value: [] }; })
      .then(function (data) {
        var areas = data.value || data || [];
        select.innerHTML = '<option value="">Sem área (somente coordenadas)</option>' +
          '<option value="auto">Automática (polígono que contém o ponto)</option>';
        areas.forEach(function (area) {
          var opt = document.createElement('option');
          opt.value = area.id;
          opt.textContent = area.nome;
          select.appendChild(opt);
        });
      })
      .catch(function () {});
  }

  function loadEspecieOptions() {
    var select = document.getElementById('kmlEspecieSelect');
    if (!select) return;
    fetch('/api/especies?page=0&size=500', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { value: [] }; })
      .then(function (data) {
        var especies = data.value || data || [];
        select.innerHTML = '<option value="">Não informada</option>';
        especies.forEach(function (esp) {
          var opt = document.createElement('option');
          opt.value = esp.id;
          opt.textContent = esp.nomeCientifico ? esp.nomePopular + ' (' + esp.nomeCientifico + ')' : esp.nomePopular;
          select.appendChild(opt);
        });
      })
      .catch(function () {});
  }

  function el(id) {
    return document.getElementById(id);
  }

  function val(id) {
    var node = el(id);
    if (!node) return null;
    var v = (node.value || '').trim();
    return v === '' ? null : v;
  }

  function num(id) {
    var v = val(id);
    if (v === null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function collectDefaults() {
    var defaults = {};

    var areaId = val('kmlAreaSelect');
    if (areaId) defaults.areaId = areaId;

    var especieId = val('kmlEspecieSelect');
    if (especieId) defaults.especieId = especieId;

    var map = {
      tipoArvore: 'kmlTipoArvore',
      origem: 'kmlOrigem',
      porte: 'kmlPorte',
      status: 'kmlStatus',
      dataPlantio: 'kmlDataPlantio',
      numeroProcesso: 'kmlNumeroProcesso',
      responsavelCadastro: 'kmlResponsavelCadastro',
      fotoUrl: 'kmlFotoUrl',
      descricao: 'kmlDescricao',
      cap: 'kmlCap',
      dap: 'kmlDap',
      alturaTotal: 'kmlAlturaTotal',
      alturaPrimeiraBifurcacao: 'kmlAlturaPrimeiraBifurcacao',
      diametroCopa: 'kmlDiametroCopa',
      condicaoFitossanitaria: 'kmlCondicaoFitossanitaria',
      pragas: 'kmlPragas',
      doencas: 'kmlDoencas',
      cavidades: 'kmlCavidades',
      fungos: 'kmlFungos',
      galhosSecos: 'kmlGalhosSecos',
      inclinacao: 'kmlInclinacao',
      danosTronco: 'kmlDanosTronco',
      raizesExpostas: 'kmlRaizesExpostas',
      sinaisApodrecimento: 'kmlSinaisApodrecimento',
      tipoManejo: 'kmlTipoManejo',
      prioridadeManejo: 'kmlPrioridadeManejo'
    };

    Object.keys(map).forEach(function (key) {
      var v = val(map[key]);
      if (v !== null) defaults[key] = v;
    });

    if (el('kmlCap')) {
      var dap = num('kmlCap');
      if (dap !== null) defaults.dap = Math.round((dap / Math.PI) * 100) / 100;
    }

    var conflitos = Array.prototype.map.call(
      document.querySelectorAll('input[name="kmlTipoConflito"]:checked'),
      function (c) { return c.value; }
    );
    defaults.tiposConflito = conflitos.length ? conflitos : ['SEM_CONFLITO'];

    return defaults;
  }

  function payloadDePonto(pm, defaults) {
    var d = defaults || {};
    var payload = {
      nome: pm.nome || null,
      areaId: d.areaId != null && d.areaId !== 'auto' ? Number(d.areaId) : null,
      especieId: d.especieId != null ? Number(d.especieId) : null,
      tipoArvore: d.tipoArvore || 'NATIVA',
      porte: d.porte || 'MEDIO',
      origem: d.origem || 'PLANTIO_PROPRIO',
      status: d.status || 'ATIVA',
      georreferenciada: true,
      latitude: pm.latitude,
      longitude: pm.longitude,
      dataPlantio: d.dataPlantio || null,
      numeroProcesso: d.numeroProcesso || null,
      fotoUrl: d.fotoUrl || null,
      descricao: d.descricao || pm.descricao || null,
      cap: d.cap != null ? Number(d.cap) : null,
      dap: d.dap != null ? Number(d.dap) : null,
      alturaTotal: d.alturaTotal != null ? Number(d.alturaTotal) : null,
      alturaPrimeiraBifurcacao: d.alturaPrimeiraBifurcacao != null ? Number(d.alturaPrimeiraBifurcacao) : null,
      diametroCopa: d.diametroCopa != null ? Number(d.diametroCopa) : null,
      condicaoFitossanitaria: d.condicaoFitossanitaria || null,
      pragas: d.pragas || null,
      doencas: d.doencas || null,
      cavidades: d.cavidades || null,
      fungos: d.fungos || null,
      galhosSecos: d.galhosSecos || null,
      inclinacao: d.inclinacao || null,
      danosTronco: d.danosTronco || null,
      raizesExpostas: d.raizesExpostas || null,
      sinaisApodrecimento: d.sinaisApodrecimento || null,
      tiposConflito: d.tiposConflito || ['SEM_CONFLITO'],
      tipoManejo: d.tipoManejo || 'NENHUM',
      prioridadeManejo: d.prioridadeManejo || null,
      responsavelCadastro: d.responsavelCadastro || null,
      fotos: d.fotoUrl ? [{ url: d.fotoUrl, descricao: 'Foto principal' }] : []
    };
    if (payload.cap && !payload.dap) {
      payload.dap = Math.round((payload.cap / Math.PI) * 100) / 100;
    }
    return payload;
  }

  function salvarRestantesKml(placemarks, defaults) {
    try {
      sessionStorage.setItem('kmlPontosRestantes', JSON.stringify(placemarks || []));
      sessionStorage.setItem('kmlDefaults', JSON.stringify(defaults || {}));
      sessionStorage.removeItem('kmlImportIds');
      sessionStorage.removeItem('kmlFilaAutoStart');
    } catch (e) {}
  }

  function limparRestantesKml() {
    try {
      sessionStorage.removeItem('kmlPontosRestantes');
      sessionStorage.removeItem('kmlDefaults');
    } catch (e) {}
  }

  window.obterPontosKmlRestantes = function () {
    try {
      return JSON.parse(sessionStorage.getItem('kmlPontosRestantes') || '[]');
    } catch (e) {
      return [];
    }
  };

  window.obterDefaultsKml = function () {
    try {
      return JSON.parse(sessionStorage.getItem('kmlDefaults') || '{}');
    } catch (e) {
      return {};
    }
  };

  window.limparFilaKml = function () {
    limparRestantesKml();
  };

  window.criarProximoPontoKml = function () {
    var restantes = obterPontosKmlRestantes();
    if (!restantes.length) {
      showToast('Não há mais pontos pendentes no KML.', 'sucesso');
      return Promise.resolve(null);
    }
    var defaults = obterDefaultsKml();
    var pm = restantes[0];
    var payload = payloadDePonto(pm, defaults);
    return fetch('/api/arvores', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (r) {
      if (!r.ok) throw new Error('Falha ao criar árvore do KML');
      return r.json();
    })
    .then(function (arvore) {
      var ainda = restantes.slice(1);
      salvarRestantesKml(ainda, defaults);
      return arvore;
    });
  };

  window.importarKmlSelecionadas = function () {
    if (!kmlFile || !kmlSelectedIndices.length) return;
    var defaults = collectDefaults();
    var indicesCsv = kmlSelectedIndices.join(',');

    var formData = new FormData();
    formData.append('file', kmlFile);
    var areaId = val('kmlAreaSelect');
    if (areaId && areaId !== 'auto') formData.append('areaId', areaId);
    formData.append('defaults', JSON.stringify(defaults));
    formData.append('indices', indicesCsv);

    var btn = document.getElementById('kmlImportEditBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Importando...'; }

    fetch('/api/kml/import/arvores', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.erro) throw new Error(data.erro);
      salvarRestantesKml([], defaults);
      if (Array.isArray(data.ids) && data.ids.length) {
        try {
          sessionStorage.setItem('kmlImportIds', JSON.stringify(data.ids));
          // Não auto-abre outra — ?editar=ID abre a primeira da seleção
          sessionStorage.setItem('kmlFilaAutoStart', '1');
        } catch (e) {}
      }
      if (typeof showToast === 'function') {
        showToast(data.mensagem + ' Abrindo a primeira para edição individual.', 'success');
      }
      fecharKmlModal();
      location.href = './arvores.html?editar=' + data.ids[0];
    })
    .catch(function (err) {
      if (typeof showToast === 'function') showToast('Erro: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Importar selecionadas e editar'; }
    });
  };

  // alias antigo
  window.importarKmlSelecionada = window.importarKmlSelecionadas;

  window.importarKml = function () {
    if (!kmlFile) return;

    var formData = new FormData();
    formData.append('file', kmlFile);

    var areaId = val('kmlAreaSelect');
    if (areaId && areaId !== 'auto') formData.append('areaId', areaId);

    var defaults = collectDefaults();
    formData.append('defaults', JSON.stringify(defaults));

    var btn = document.getElementById('kmlImportBtn');
    btn.disabled = true;
    btn.textContent = 'Importando...';

    fetch('/api/kml/import/arvores', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.erro) {
        if (typeof showToast === 'function') showToast('Erro: ' + data.erro, 'error');
      } else {
        if (typeof showToast === 'function') showToast(data.mensagem, 'success');
        limparRestantesKml();
        if (Array.isArray(data.ids) && data.ids.length) {
          try {
            sessionStorage.setItem('kmlImportIds', JSON.stringify(data.ids));
            sessionStorage.removeItem('kmlFilaAutoStart');
          } catch (e) {}
        }
        fecharKmlModal();
        if (document.getElementById('arvoresList')) {
          if (typeof carregarArvores === 'function') {
            setTimeout(function () { carregarArvores(); }, 300);
          }
        } else {
          setTimeout(function () { location.href = './arvores.html'; }, 1200);
        }
      }
    })
    .catch(function () {
      if (typeof showToast === 'function') showToast('Erro ao importar', 'error');
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = 'Importar todas';
    });
  };

  window.fecharKmlModal = function () {
    var modal = document.getElementById('kmlModal');
    if (modal) modal.style.display = 'none';
    kmlFile = null;
    kmlPlacemarks = [];
    kmlSelectedIndices = [];
  };
})();
