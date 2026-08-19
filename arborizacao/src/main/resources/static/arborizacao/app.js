const mapStyle = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles'
    }
  ]
};

const apiBase = '/api/areas';
const areaForm = document.getElementById('areaForm');
const areaIdInput = document.getElementById('areaId');
const nomeInput = document.getElementById('nome');
const descricaoInput = document.getElementById('descricao');
const fotosContainer = document.getElementById('fotosContainer');
const addFotoBtn = document.getElementById('addFotoBtn');
const tipoInput = document.getElementById('tipo');
const statusInput = document.getElementById('status');
const drawModeInput = document.getElementById('drawMode');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const polygonManualEntry = document.getElementById('polygonManualEntry');
const vertexLatitudeInput = document.getElementById('vertexLatitude');
const vertexLongitudeInput = document.getElementById('vertexLongitude');
const addVertexBtn = document.getElementById('addVertexBtn');
const verticesList = document.getElementById('verticesList');
const areasList = document.getElementById('areasList');
const saveBtn = document.getElementById('saveBtn');
const clearVerticesBtn = document.getElementById('clearVerticesBtn');
const reloadBtn = document.getElementById('reloadBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const inspectModeBtn = document.getElementById('inspectModeBtn');
const formTitle = document.getElementById('formTitle');
const selectionInfo = document.getElementById('selectionInfo');
const totalAreas = document.getElementById('totalAreas');
const totalVertices = document.getElementById('totalVertices');
const areaItemTemplate = document.getElementById('areaItemTemplate');
const placeTitle = document.getElementById('placeTitle');
const placeDisplayName = document.getElementById('placeDisplayName');
const placeMeta = document.getElementById('placeMeta');
const placeAddress = document.getElementById('placeAddress');
const placePhoto = document.getElementById('placePhoto');
const placePhotoFallback = document.getElementById('placePhotoFallback');
const placeSourceLink = document.getElementById('placeSourceLink');
const placeWikiLink = document.getElementById('placeWikiLink');
const photoViewer = document.getElementById('photoViewer');
const closeViewerBtn = document.getElementById('closeViewerBtn');
const viewerPlaceName = document.getElementById('viewerPlaceName');
const viewerPlaceMeta = document.getElementById('viewerPlaceMeta');
const viewerSourceLink = document.getElementById('viewerSourceLink');
const viewerWikiLink = document.getElementById('viewerWikiLink');
const photoViewerStage = document.querySelector('.photo-viewer-stage');
const prevPhotoBtn = document.getElementById('prevPhotoBtn');
const nextPhotoBtn = document.getElementById('nextPhotoBtn');
const viewerCounter = document.getElementById('viewerCounter');

let areas = [];
let currentMode = 'point';
let currentPoint = null;
let polygonVertices = [];
let editingId = null;
let exploreMode = false;
let activePlace = null;
let fotos = [];
let viewerPhotoUrls = [];
let viewerPhotoIndex = 0;

const map = new maplibregl.Map({
  container: 'map',
  style: mapStyle,
  center: [-46.634, -23.551],
  zoom: 14
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

map.on('load', () => {
  ensureMapLayers();
  refreshMap();
});

map.on('click', (event) => {
  if (exploreMode) {
    loadPlaceDetails(event.lngLat.lat, event.lngLat.lng);
    return;
  }

  const { lng, lat } = event.lngLat;

  if (currentMode === 'point') {
    currentPoint = [lng, lat];
    polygonVertices = [];
    latitudeInput.value = lat.toFixed(6);
    longitudeInput.value = lng.toFixed(6);
    selectionInfo.textContent = `Ponto selecionado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } else {
    polygonVertices.push([lng, lat]);
    selectionInfo.textContent = `Polígono com ${polygonVertices.length} vértice(s)`;
    if (polygonVertices.length === 1) {
      latitudeInput.value = lat.toFixed(6);
      longitudeInput.value = lng.toFixed(6);
    }
    renderVerticesList();
  }

  refreshMap();
});

map.on('click', 'areas-fill', (event) => {
  const feature = event.features?.[0];
  if (feature?.properties?.id) {
    openAreaDetails(feature.properties.id);
  }
});

map.on('click', 'areas-circle', (event) => {
  const feature = event.features?.[0];
  if (feature?.properties?.id) {
    openAreaDetails(feature.properties.id);
  }
});

map.on('mouseenter', 'areas-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseenter', 'areas-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'areas-fill', () => { map.getCanvas().style.cursor = ''; });
map.on('mouseleave', 'areas-circle', () => { map.getCanvas().style.cursor = ''; });

drawModeInput.addEventListener('change', () => {
  currentMode = drawModeInput.value;
  polygonManualEntry.classList.toggle('hidden', currentMode !== 'polygon');
  if (currentMode === 'point') {
    polygonVertices = [];
    renderVerticesList();
    selectionInfo.textContent = currentPoint
      ? `Ponto selecionado: ${currentPoint[1].toFixed(6)}, ${currentPoint[0].toFixed(6)}`
      : 'Nenhum ponto selecionado';
  } else {
    currentPoint = null;
    latitudeInput.value = '';
    longitudeInput.value = '';
    selectionInfo.textContent = polygonVertices.length
      ? `Polígono com ${polygonVertices.length} vértice(s)`
      : 'Clique no mapa ou digite os pontos manualmente';
  }
  refreshMap();
});

// Permite digitar latitude/longitude direto no campo, sem precisar clicar no mapa.
[latitudeInput, longitudeInput].forEach((input) => {
  input.addEventListener('change', () => {
    if (currentMode !== 'point') return;
    const lat = parseFloat(latitudeInput.value);
    const lng = parseFloat(longitudeInput.value);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      currentPoint = [lng, lat];
      selectionInfo.textContent = `Ponto selecionado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      refreshMap();
    }
  });
});

// Adiciona um vértice do polígono digitando os valores, sem precisar clicar no mapa.
addVertexBtn.addEventListener('click', () => {
  const lat = parseFloat(vertexLatitudeInput.value);
  const lng = parseFloat(vertexLongitudeInput.value);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    alert('Digite latitude e longitude válidas para adicionar o ponto.');
    return;
  }

  polygonVertices.push([lng, lat]);
  vertexLatitudeInput.value = '';
  vertexLongitudeInput.value = '';
  vertexLatitudeInput.focus();

  if (polygonVertices.length === 1) {
    latitudeInput.value = lat.toFixed(6);
    longitudeInput.value = lng.toFixed(6);
  }

  selectionInfo.textContent = `Polígono com ${polygonVertices.length} vértice(s)`;
  renderVerticesList();
  refreshMap();
});

function renderFotoInputs() {
  fotosContainer.innerHTML = '';
  if (!fotos.length) {
    fotos.push('');
  }

  fotos.forEach((url, index) => {
    const row = document.createElement('div');
    row.className = 'foto-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'https://drive.google.com/... ou https://...';
    input.value = url || '';
    input.addEventListener('input', () => {
      fotos[index] = input.value.trim();
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remover';
    removeBtn.className = 'ghost-button';
    removeBtn.addEventListener('click', () => {
      fotos.splice(index, 1);
      renderFotoInputs();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    fotosContainer.appendChild(row);
  });
}

addFotoBtn.addEventListener('click', () => {
  fotos.push('');
  renderFotoInputs();
});

function getFotosValidas() {
  return fotos.map((url) => url.trim()).filter(Boolean);
}

function renderVerticesList() {
  verticesList.innerHTML = '';
  polygonVertices.forEach(([lng, lat], index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${lat.toFixed(6)}, ${lng.toFixed(6)} `;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remover';
    removeBtn.className = 'ghost-button';
    removeBtn.style.marginLeft = '8px';
    removeBtn.addEventListener('click', () => {
      polygonVertices.splice(index, 1);
      selectionInfo.textContent = polygonVertices.length
        ? `Polígono com ${polygonVertices.length} vértice(s)`
        : 'Clique no mapa ou digite os pontos manualmente';
      renderVerticesList();
      refreshMap();
    });
    li.appendChild(removeBtn);
    verticesList.appendChild(li);
  });
}

inspectModeBtn.addEventListener('click', () => {
  exploreMode = !exploreMode;
  inspectModeBtn.textContent = exploreMode ? 'Sair do modo explorar' : 'Explorar local';
  selectionInfo.textContent = exploreMode
    ? 'Clique no mapa para buscar dados e fotos do local'
    : 'Nenhum ponto selecionado';
});

closeViewerBtn.addEventListener('click', closePhotoViewer);

prevPhotoBtn.addEventListener('click', () => {
  if (!viewerPhotoUrls.length) return;
  viewerPhotoIndex = (viewerPhotoIndex - 1 + viewerPhotoUrls.length) % viewerPhotoUrls.length;
  updateViewerPhoto();
});

nextPhotoBtn.addEventListener('click', () => {
  if (!viewerPhotoUrls.length) return;
  viewerPhotoIndex = (viewerPhotoIndex + 1) % viewerPhotoUrls.length;
  updateViewerPhoto();
});

photoViewer.addEventListener('click', (event) => {
  if (event.target === photoViewer || event.target.classList.contains('photo-viewer-backdrop')) {
    closePhotoViewer();
  }
});

photoViewerStage.addEventListener('pointermove', (event) => {
  const rect = photoViewerStage.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
  const frontCard = photoViewerStage.querySelector('.photo-viewer-card-front');
  if (frontCard) {
    frontCard.style.transform = `rotateY(${x * 6}deg) rotateX(${y * 4}deg)`;
  }
});

photoViewerStage.addEventListener('pointerleave', () => {
  const frontCard = photoViewerStage.querySelector('.photo-viewer-card-front');
  if (frontCard) {
    frontCard.style.transform = 'none';
  }
});

clearVerticesBtn.addEventListener('click', () => {
  polygonVertices = [];
  currentPoint = null;
  latitudeInput.value = '';
  longitudeInput.value = '';
  selectionInfo.textContent = 'Seleção limpa';
  renderVerticesList();
  refreshMap();
});

cancelEditBtn.addEventListener('click', () => resetForm());
reloadBtn.addEventListener('click', loadAreas);

const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const buscaResultado = document.getElementById('buscaResultado');

function normalizarTexto(texto) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

buscaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const termo = buscaTermoInput.value.trim();
  if (!termo) return;

  buscaResultado.innerHTML = '<p class="selection-text">Buscando...</p>';

  if (/^\d+$/.test(termo)) {
    const response = await fetch(`${apiBase}/${termo}`);
    if (!response.ok) {
      buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma área encontrada com o ID ${termo}.</div>`;
      return;
    }
    const area = await response.json();
    renderizarAreasEncontradas([area], buscaResultado);
    return;
  }

  const termoNorm = normalizarTexto(termo);
  const encontradas = areas.filter((area) => normalizarTexto(area.nome).includes(termoNorm));
  if (!encontradas.length) {
    buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma área encontrada com o nome "${termo}".</div>`;
    return;
  }
  renderizarAreasEncontradas(encontradas, buscaResultado);
});

function renderizarAreasEncontradas(lista, container) {
  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = '<p class="selection-text">Nenhuma área encontrada.</p>';
    return;
  }

  lista.forEach((area) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    const fotoHtml = getFotosDaArea(area).length
      ? `<div class="area-foto">${getFotosDaArea(area).map((url) => `<img src="${url}" alt="${area.nome || 'Foto da área'}" onerror="this.remove();" />`).join('')}</div>`
      : '';
    item.innerHTML = `
      <header>
        <h3>#${area.id} — ${area.nome}</h3>
        <span>${area.status}</span>
      </header>
      ${fotoHtml}
      <p class="area-description">Tipo: ${area.tipo} • ${area.pontos && area.pontos.length ? area.pontos.length + ' pontos de polígono' : 'ponto único'}</p>
      <p class="area-description">${area.descricao || ''}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar esta área</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => {
      loadAreaInForm(area);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(item);
  });
}

areaForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = buildPayload();
  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `${apiBase}/${editingId}` : apiBase;

  saveBtn.disabled = true;
  saveBtn.textContent = editingId ? 'Atualizando...' : 'Salvando...';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(erro.message || `Falha ao salvar área: ${response.status}`);
    }

    resetForm();
    await loadAreas();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Não foi possível salvar a área. Veja o console para detalhes.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar área';
  }
});

function ensureMapLayers() {
  if (!map.getSource('selected-point')) {
    map.addSource('selected-point', {
      type: 'geojson',
      data: emptyFeatureCollection()
    });
    map.addLayer({
      id: 'selected-point-layer',
      type: 'circle',
      source: 'selected-point',
      paint: {
        'circle-radius': 8,
        'circle-color': '#69c18f',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#eafff3'
      }
    });
  }

  if (!map.getSource('draft-polygon')) {
    map.addSource('draft-polygon', {
      type: 'geojson',
      data: emptyFeatureCollection()
    });
    map.addLayer({
      id: 'draft-polygon-fill',
      type: 'fill',
      source: 'draft-polygon',
      paint: {
        'fill-color': '#69c18f',
        'fill-opacity': 0.18
      }
    });
    map.addLayer({
      id: 'draft-polygon-line',
      type: 'line',
      source: 'draft-polygon',
      paint: {
        'line-color': '#7ad9a0',
        'line-width': 3
      }
    });
  }

  if (!map.getSource('areas')) {
    map.addSource('areas', {
      type: 'geojson',
      data: emptyFeatureCollection()
    });
    map.addLayer({
      id: 'areas-fill',
      type: 'fill',
      source: 'areas',
      paint: {
        'fill-color': '#49a970',
        'fill-opacity': 0.24
      },
      filter: ['==', ['geometry-type'], 'Polygon']
    });
    map.addLayer({
      id: 'areas-line',
      type: 'line',
      source: 'areas',
      paint: {
        'line-color': '#dfffea',
        'line-width': 2
      },
      filter: ['==', ['geometry-type'], 'Polygon']
    });
    map.addLayer({
      id: 'areas-circle',
      type: 'circle',
      source: 'areas',
      paint: {
        'circle-radius': 7,
        'circle-color': '#49a970',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#dfffea'
      },
      filter: ['==', ['geometry-type'], 'Point']
    });
  }
}

function refreshMap() {
  if (!map.isStyleLoaded()) {
    return;
  }

  const pointFeature = currentPoint
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: currentPoint
            },
            properties: { id: 'selected-point' }
          }
        ]
      }
    : emptyFeatureCollection();

  const polygonFeature = polygonVertices.length
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: polygonVertices.length >= 3
              ? {
                  type: 'Polygon',
                  coordinates: [[...polygonVertices, polygonVertices[0]]]
                }
              : {
                  type: 'LineString',
                  coordinates: polygonVertices
                },
            properties: {}
          }
        ]
      }
    : emptyFeatureCollection();

  const features = [];
  areas.forEach((area) => {
    const areaFeature = areaToFeature(area);
    if (areaFeature && Array.isArray(areaFeature.features)) {
      features.push(...areaFeature.features);
    }
  });

  map.getSource('selected-point')?.setData(pointFeature);
  map.getSource('draft-polygon')?.setData(polygonFeature);
  map.getSource('areas')?.setData({ type: 'FeatureCollection', features });
}

function areaToFeature(area) {
  if (Array.isArray(area.pontos) && area.pontos.length >= 3) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[...area.pontos.map((point) => [point.longitude, point.latitude]), [area.pontos[0].longitude, area.pontos[0].latitude]]]
          },
          properties: {
            id: area.id,
            nome: area.nome,
            status: area.status
          }
        }
      ]
    };
  }

  if (area.latitude != null && area.longitude != null) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [area.longitude, area.latitude]
          },
          properties: {
            id: area.id,
            nome: area.nome,
            status: area.status
          }
        }
      ]
    };
  }

  return null;
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

function buildPayload() {
  const fotosValidas = getFotosValidas().map(obterUrlImagem);
  const base = {
    nome: nomeInput.value.trim(),
    descricao: descricaoInput.value.trim(),
    fotoUrl: fotosValidas[0] || null,
    fotos: fotosValidas.map((url) => ({ url, descricao: null })),
    tipo: tipoInput.value,
    status: statusInput.value
  };

  if (currentMode === 'polygon') {
    return {
      ...base,
      latitude: null,
      longitude: null,
      pontos: polygonVertices.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
    };
  }

  if (!currentPoint) {
    throw new Error('Selecione um ponto no mapa antes de salvar.');
  }

  return {
    ...base,
    latitude: currentPoint[1],
    longitude: currentPoint[0],
    pontos: []
  };
}

async function loadAreas() {
  try {
    const response = await fetch(apiBase);
    if (!response.ok) {
      throw new Error(`Falha ao carregar áreas: ${response.status}`);
    }

    const data = await response.json();
    areas = Array.isArray(data) ? data : (data.value ?? []);
    renderAreaList();
    updateCounters();
    refreshMap();
  } catch (error) {
    console.error(error);
    areasList.innerHTML = '<p class="selection-text">Não foi possível carregar as áreas.</p>';
  }
}

function renderAreaList() {
  areasList.innerHTML = '';

  if (!areas.length) {
    areasList.innerHTML = '<p class="selection-text">Nenhuma área cadastrada ainda.</p>';
    return;
  }

  areas.forEach((area) => {
    const fragment = areaItemTemplate.content.cloneNode(true);
const item = fragment.querySelector('.area-item');
    const title = fragment.querySelector('h3');
    const meta = fragment.querySelector('.area-meta');
    const description = fragment.querySelector('.area-description');
    const fotoBlock = fragment.querySelector('.area-foto');
    const pill = fragment.querySelector('.pill');
    const viewBtn = fragment.querySelector('.view-btn');
    const editBtn = fragment.querySelector('.edit-btn');
    const deleteBtn = fragment.querySelector('.delete-btn');

    title.textContent = area.nome;
    meta.textContent = area.latitude != null
      ? `Ponto: ${area.latitude.toFixed(6)}, ${area.longitude.toFixed(6)}`
      : `${area.pontos?.length ?? 0} vértices`;
    description.textContent = area.descricao || 'Sem descrição.';
    pill.textContent = area.status;

    if (getFotosDaArea(area).length) {
      fotoBlock.innerHTML = getFotosDaArea(area)
        .map((url) => `<img src="${url}" alt="${area.nome || 'Foto da área'}" onerror="this.remove();" />`)
        .join('');
    }

    viewBtn.addEventListener('click', () => openAreaDetails(area.id));
    editBtn.addEventListener('click', () => loadAreaInForm(area));
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Excluir a área "${area.nome}"?`)) {
        return;
      }

      await fetch(`${apiBase}/${area.id}`, { method: 'DELETE' });
      await loadAreas();
    });

    item.dataset.id = area.id;
    areasList.appendChild(fragment);
  });
}

function updateCounters() {
  totalAreas.textContent = String(areas.length);
  totalVertices.textContent = String(areas.reduce((acc, area) => acc + (area.pontos?.length ?? 0), 0));
}

function focusArea(area) {
  if (area.latitude != null && area.longitude != null) {
    map.flyTo({ center: [area.longitude, area.latitude], zoom: 16 });
    selectionInfo.textContent = `Foco em ${area.nome}`;
    return;
  }

  if (Array.isArray(area.pontos) && area.pontos.length) {
    map.fitBounds(
      area.pontos.reduce((bounds, point) => bounds.extend([point.longitude, point.latitude]), new maplibregl.LngLatBounds(
        [area.pontos[0].longitude, area.pontos[0].latitude],
        [area.pontos[0].longitude, area.pontos[0].latitude]
      )),
      { padding: 60, maxZoom: 17 }
    );
    selectionInfo.textContent = `Foco no polígono ${area.nome}`;
  }
}

async function openAreaDetails(areaId) {
  const area = areas.find((item) => String(item.id) === String(areaId));
  if (!area) {
    return;
  }

  focusArea(area);
  const coordinates = getAreaCenter(area);
  if (!coordinates) {
    return;
  }

  const place = await loadPlaceDetails(coordinates[1], coordinates[0], area.nome);
  const savedPhotos = getFotosDaArea(area);
  const placeWithSavedPhoto = savedPhotos.length ? mergeSavedPhoto(place, savedPhotos, area) : place;

  if (placeWithSavedPhoto) {
    openPhotoViewer(placeWithSavedPhoto);
  }
}

function obterUrlImagem(url) {
  const texto = (url || '').toString().trim();
  if (!texto || !/drive\.google\.com/.test(texto)) {
    return texto;
  }

  const matchFile = texto.match(/\/file\/d\/([^/?#]+)/);
  const matchId = texto.match(/[?&]id=([^&#]+)/);
  const id = (matchFile && matchFile[1]) || (matchId && matchId[1]);
  if (!id) {
    return texto;
  }

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id);
}

function getFotosDaArea(area) {
  let urls = [];
  if (Array.isArray(area.fotos) && area.fotos.length) {
    urls = area.fotos.map((foto) => (typeof foto === 'string' ? foto : foto.url)).filter(Boolean);
  } else if (area.fotoUrl) {
    urls = [area.fotoUrl];
  }
  return urls.map(obterUrlImagem);
}

function mergeSavedPhoto(place, savedPhotos, area) {
  const gallery = Array.isArray(place?.galleryUrls)
    ? place.galleryUrls.filter((url) => typeof url === 'string' && !url.startsWith('data:'))
    : [];

  return {
    ...(place || {}),
    title: place?.title || area.nome,
    displayName: place?.displayName || area.nome,
    photoUrl: savedPhotos[0],
    galleryUrls: [...savedPhotos, ...gallery.filter((url) => !savedPhotos.includes(url))]
  };
}

function getAreaCenter(area) {
  if (area.latitude != null && area.longitude != null) {
    return [area.longitude, area.latitude];
  }

  if (Array.isArray(area.pontos) && area.pontos.length) {
    const totals = area.pontos.reduce((accumulator, point) => ({
      latitude: accumulator.latitude + point.latitude,
      longitude: accumulator.longitude + point.longitude
    }), { latitude: 0, longitude: 0 });

    return [totals.longitude / area.pontos.length, totals.latitude / area.pontos.length];
  }

  return null;
}

async function loadPlaceDetails(latitude, longitude, fallbackTitle = 'Local selecionado') {
  placeTitle.textContent = 'Carregando detalhes...';
  placeDisplayName.textContent = `Buscando informações para ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  placeMeta.textContent = '';
  placeAddress.textContent = '';
  placePhoto.classList.add('hidden');
  placePhoto.src = '';
  placePhotoFallback.classList.remove('hidden');
  placePhotoFallback.textContent = 'Carregando foto...';
  disableLink(placeSourceLink);
  disableLink(placeWikiLink);

  try {
    const response = await fetch(`/api/places/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);
    if (!response.ok) {
      throw new Error(`Falha ao carregar detalhes do local: ${response.status}`);
    }

    const place = await response.json();
    renderPlaceDetails(place, fallbackTitle);
    return place;
  } catch (error) {
    console.error(error);
    placeTitle.textContent = fallbackTitle;
    placeDisplayName.textContent = 'Não foi possível carregar os detalhes do local agora.';
    placePhotoFallback.textContent = 'Detalhes indisponíveis';
    return null;
  }
}

function renderPlaceDetails(place, fallbackTitle) {
  activePlace = place;
  placeTitle.textContent = place.title || fallbackTitle;
  placeDisplayName.textContent = place.displayName || fallbackTitle;

  const meta = [place.category, place.type].filter(Boolean).join(' • ');
  placeMeta.textContent = meta || 'Sem categoria informada';

  const addressLines = Object.values(place.address || {});
  placeAddress.textContent = addressLines.length ? addressLines.join(', ') : 'Endereço não informado';

  if (place.photoUrl) {
    placePhoto.src = place.photoUrl;
    placePhoto.alt = place.displayName || place.title || 'Foto do local';
    placePhoto.classList.remove('hidden');
    placePhotoFallback.classList.add('hidden');
  } else {
    placePhoto.classList.add('hidden');
    placePhotoFallback.classList.remove('hidden');
    placePhotoFallback.textContent = 'Sem foto disponível para este local';
  }

  enableLink(placeSourceLink, place.sourceUrl, 'Abrir no OSM');
  enableLink(placeWikiLink, place.wikiUrl, 'Fonte adicional');
}

function openPhotoViewer(place) {
  viewerPlaceName.textContent = place.title || place.displayName || 'Local selecionado';
  viewerPlaceMeta.textContent = [place.category, place.type, place.photoCredit, `${place.galleryUrls?.length ?? 0} imagem(ns)`].filter(Boolean).join(' • ') || 'Visualização em 3D';

  renderGallery3D(place);

  enableLink(viewerSourceLink, place.sourceUrl, 'Abrir fonte');
  enableLink(viewerWikiLink, place.wikiUrl, 'Abrir detalhes');
  photoViewer.classList.remove('hidden');
  photoViewer.setAttribute('aria-hidden', 'false');
}

function renderGallery3D(place) {
  const galleryUrls = Array.isArray(place.galleryUrls) && place.galleryUrls.length
    ? place.galleryUrls
    : place.photoUrl
      ? [place.photoUrl]
      : [];

  const normalizedUrls = galleryUrls.length ? galleryUrls : [createFallbackDataUrl('Sem fotos públicas')];

  viewerPhotoUrls = normalizedUrls;
  viewerPhotoIndex = 0;

  photoViewerStage.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'photo-viewer-card photo-viewer-card-front';

  const img = document.createElement('img');
  img.alt = place.displayName || place.title || 'Foto imersiva do local';
  card.appendChild(img);

  photoViewerStage.appendChild(card);

  updateViewerPhoto();
}

function updateViewerPhoto() {
  if (!viewerPhotoUrls.length) {
    return;
  }

  const url = obterUrlImagem(viewerPhotoUrls[viewerPhotoIndex]);
  const frontCard = photoViewerStage.querySelector('.photo-viewer-card-front');
  const frontImg = frontCard?.querySelector('img');
  if (frontImg) {
    frontImg.src = url;
    frontImg.alt = viewerPlaceName.textContent || 'Foto imersiva do local';
  }

  const hasMultiple = viewerPhotoUrls.length > 1;
  prevPhotoBtn.classList.toggle('hidden', !hasMultiple);
  nextPhotoBtn.classList.toggle('hidden', !hasMultiple);
  viewerCounter.classList.toggle('hidden', !hasMultiple);
  viewerCounter.textContent = `${viewerPhotoIndex + 1} / ${viewerPhotoUrls.length}`;
}

function createFallbackDataUrl(title) {
  const safeTitle = title.replace(/'/g, "&#39;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1b4d34" />
          <stop offset="100%" stop-color="#070d09" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#g)" />
      <circle cx="930" cy="180" r="120" fill="#69c18f" fill-opacity="0.16" />
      <path d="M170 650 C290 500, 330 420, 360 280 C400 420, 450 500, 560 650 Z" fill="#49a970" fill-opacity="0.42" />
      <path d="M620 670 C720 520, 760 430, 800 280 C860 430, 920 520, 1010 670 Z" fill="#69c18f" fill-opacity="0.34" />
      <text x="70" y="110" fill="#e7f5ee" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="700">${safeTitle}</text>
      <text x="70" y="165" fill="#94b2a4" font-family="Inter, Arial, sans-serif" font-size="24">Sem fotos públicas disponíveis para este local.</text>
      <text x="70" y="740" fill="#94b2a4" font-family="Inter, Arial, sans-serif" font-size="18">Arborização</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function closePhotoViewer() {
  photoViewer.classList.add('hidden');
  photoViewer.setAttribute('aria-hidden', 'true');
}

function disableLink(link) {
  link.href = '#';
  link.classList.add('disabled-link');
  link.setAttribute('aria-disabled', 'true');
}

function enableLink(link, href, label) {
  if (!href) {
    disableLink(link);
    link.textContent = label;
    return;
  }

  link.href = href;
  link.classList.remove('disabled-link');
  link.removeAttribute('aria-disabled');
  link.textContent = label;
}

function loadAreaInForm(area) {
  editingId = area.id;
  areaIdInput.value = area.id;
  formTitle.textContent = `Editando: ${area.nome}`;
  cancelEditBtn.classList.remove('hidden');
  nomeInput.value = area.nome || '';
  descricaoInput.value = area.descricao || '';
  fotos = getFotosDaArea(area);
  renderFotoInputs();
  tipoInput.value = area.tipo || 'OUTRA';
  statusInput.value = area.status || 'ATIVA';

  if (area.latitude != null && area.longitude != null) {
    drawModeInput.value = 'point';
    currentMode = 'point';
    currentPoint = [area.longitude, area.latitude];
    latitudeInput.value = area.latitude;
    longitudeInput.value = area.longitude;
    polygonVertices = [];
    polygonManualEntry.classList.add('hidden');
    selectionInfo.textContent = `Editando ponto: ${area.latitude}, ${area.longitude}`;
  } else {
    drawModeInput.value = 'polygon';
    currentMode = 'polygon';
    polygonVertices = (area.pontos || []).map((point) => [point.longitude, point.latitude]);
    currentPoint = null;
    latitudeInput.value = polygonVertices[0]?.[1] ?? '';
    longitudeInput.value = polygonVertices[0]?.[0] ?? '';
    polygonManualEntry.classList.remove('hidden');
    selectionInfo.textContent = `Editando polígono com ${polygonVertices.length} vértice(s)`;
  }

  renderVerticesList();
  refreshMap();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  areaIdInput.value = '';
  areaForm.reset();
  fotos = [];
  renderFotoInputs();
  drawModeInput.value = 'point';
  currentMode = 'point';
  currentPoint = null;
  polygonVertices = [];
  latitudeInput.value = '';
  longitudeInput.value = '';
  polygonManualEntry.classList.add('hidden');
  formTitle.textContent = 'Nova área';
  cancelEditBtn.classList.add('hidden');
  selectionInfo.textContent = 'Nenhum ponto selecionado';
  renderVerticesList();
  refreshMap();
}

renderFotoInputs();
loadAreas();