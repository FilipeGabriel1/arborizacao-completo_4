const apiBase = '/api/especies';

const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const especiesList = document.getElementById('especiesList');
const especiesVazio = document.getElementById('especiesVazio');
const totalEspeciesEl = document.getElementById('totalEspecies');
const carouselImg = document.getElementById('carouselImg');
const carouselVazio = document.getElementById('carouselVazio');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const carouselNome = document.getElementById('carouselNome');
const carouselInfo = document.getElementById('carouselInfo');

let especies = [];
let selecionadaId = null;
let carouselFotos = [];
let carouselIndex = 0;
let filtroPorte = null;

function normalizarTexto(texto) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w800';
}

const rotulosPorte = {
  PEQUENO: 'Pequeno',
  MEDIO: 'Médio',
  GRANDE: 'Grande'
};

function montarListaFotos(especie) {
  const fotos = [];
  if (especie.fotoUrl) {
    fotos.push({ url: especie.fotoUrl, descricao: 'Foto principal' });
  }
  (especie.fotos || []).forEach((f) => {
    if (f.url) fotos.push({ url: f.url, descricao: f.descricao || null });
  });
  return fotos;
}

function selecionarEspecie(especie) {
  selecionadaId = especie ? especie.id : null;
  carouselFotos = especie ? montarListaFotos(especie) : [];
  carouselIndex = 0;
  renderizarCarrossel(especie);
}

function renderizarCarrossel(especie) {
  const temFotos = carouselFotos.length > 0;
  const foto = carouselFotos[carouselIndex];

  carouselImg.style.display = temFotos ? 'block' : 'none';
  carouselImg.src = temFotos ? obterUrlImagem(foto.url) : '';
  carouselImg.alt = especie ? `${especie.nomePopular} — foto` : 'Foto da espécie';
  carouselVazio.classList.toggle('hidden', temFotos);
  carouselPrev.disabled = !temFotos || carouselIndex === 0;
  carouselNext.disabled = !temFotos || carouselIndex === carouselFotos.length - 1;

  carouselNome.textContent = especie ? especie.nomePopular : '';

  const detalhesEl = document.getElementById('carouselDetalhes');
  if (!especie) {
    detalhesEl.innerHTML = '';
  } else {
    const itens = [
      { rotulo: 'Nome científico', valor: especie.nomeCientifico ? `<em>${especie.nomeCientifico}</em>` : 'Não informado' },
      { rotulo: 'Família', valor: especie.familia || 'Não informada' },
      { rotulo: 'Porte', valor: rotulosPorte[especie.portePadrao] || especie.portePadrao || 'Não informado' },
      { rotulo: 'Descrição', valor: especie.observacoes || 'Nenhuma descrição cadastrada.' },
      { rotulo: 'Indicação para plantio', valor: especie.indicacaoPlantio || 'Não informada.' }
    ];
    detalhesEl.innerHTML = itens.map((i) => `
      <div class="detalhe-item">
        <small>${i.rotulo}</small>
        <p>${i.valor}</p>
      </div>
    `).join('');
  }

  if (!temFotos) {
    carouselInfo.textContent = 'Nenhuma foto cadastrada para esta espécie.';
    return;
  }

  const legenda = foto.descricao ? ` — ${foto.descricao}` : '';
  carouselInfo.textContent = `Foto ${carouselIndex + 1} de ${carouselFotos.length}${legenda}`;
}

function navegarCarrossel(delta) {
  if (!carouselFotos.length) return;
  const novoIndice = carouselIndex + delta;
  if (novoIndice < 0 || novoIndice >= carouselFotos.length) return;
  carouselIndex = novoIndice;
  const especie = especies.find((e) => e.id === selecionadaId) || null;
  renderizarCarrossel(especie);
}

carouselPrev.addEventListener('click', () => navegarCarrossel(-1));
carouselNext.addEventListener('click', () => navegarCarrossel(1));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (!carouselFotos.length) return;
  navegarCarrossel(event.key === 'ArrowLeft' ? -1 : 1);
});

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

async function carregar() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) {
    especiesList.innerHTML = '<p class="historico-vazio">Não foi possível carregar as espécies.</p>';
    return;
  }
  especies = itens;
  totalEspeciesEl.textContent = especies.length;
  renderizar(especies);
  manterSelecao(especies);
  renderizarFiltrosPorte();
}

function renderizar(lista) {
  especiesList.innerHTML = '';
  especiesVazio.classList.toggle('hidden', lista.length > 0);

  lista.forEach((especie) => {
    const item = document.createElement('article');
    item.className = 'area-item especie-card';
    const fotoHtml = especie.fotoUrl
      ? `<div class="area-foto"><img src="${obterUrlImagem(especie.fotoUrl)}" alt="${especie.nomePopular || 'Foto da espécie'}" onerror="this.remove();" loading="lazy" /></div>`
      : '';
    item.innerHTML = `
      ${fotoHtml}
      <header>
        <h3>${especie.nomePopular}</h3>
        <span class="pill">${rotulosPorte[especie.portePadrao] || especie.portePadrao || ''}</span>
      </header>
      <p class="area-description"><em>${especie.nomeCientifico || 'Nome científico não informado'}</em>${especie.familia ? ' • Família: ' + especie.familia : ''}</p>
      ${especie.observacoes ? `<p class="area-description">${especie.observacoes}</p>` : ''}
      ${especie.indicacaoPlantio ? `<p class="area-description"><strong>Indicação para plantio:</strong> ${especie.indicacaoPlantio}</p>` : ''}
    `;
    if (especie.id === selecionadaId) {
      item.classList.add('selecionada');
    }
    item.addEventListener('click', () => {
      selecionarEspecie(especie);
      renderizar(lista);
    });
    especiesList.appendChild(item);
  });
}

function manterSelecao(lista) {
  if (!lista.some((e) => e.id === selecionadaId)) {
    selecionarEspecie(lista[0] || null);
  }
}

function filtrarLista() {
  const termoNorm = normalizarTexto(buscaTermoInput.value.trim());
  return especies.filter((especie) => {
    if (filtroPorte && (especie.portePadrao || '') !== filtroPorte) return false;
    if (!termoNorm) return true;
    return normalizarTexto(especie.nomePopular).includes(termoNorm)
      || normalizarTexto(especie.nomeCientifico).includes(termoNorm);
  });
}

function renderizarFiltrosPorte() {
  const container = document.getElementById('filtrosPorte');
  const ordem = ['PEQUENO', 'MEDIO', 'GRANDE'];
  const contagens = {};
  especies.forEach((especie) => {
    const porte = especie.portePadrao || '';
    contagens[porte] = (contagens[porte] || 0) + 1;
  });

  container.innerHTML = '';

  const criarChip = (porte, rotulo, total) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-porte' + (filtroPorte === porte ? ' ativo' : '');
    chip.innerHTML = `${rotulo} <span>${total}</span>`;
    chip.addEventListener('click', () => {
      filtroPorte = filtroPorte === porte ? null : porte;
      const lista = filtrarLista();
      renderizar(lista);
      manterSelecao(lista);
      renderizarFiltrosPorte();
    });
    container.appendChild(chip);
  };

  criarChip(null, 'Todos', especies.length);
  ordem.forEach((porte) => {
    if (contagens[porte]) {
      criarChip(porte, rotulosPorte[porte], contagens[porte]);
    }
  });
}

const curiosidades = [
  'Uma árvore adulta pode liberar em um dia o oxigênio que até 10 pessoas precisam para respirar.',
  'As árvores urbanas podem reduzir a temperatura das ruas em até 5 °C, criando ilhas de frescor na cidade.',
  'A copa de uma árvore retém poeira e poluentes, funcionando como um filtro natural do ar.',
  'Cada árvore plantada ajuda a reduzir o ruído das vias, absorvendo parte do som do tráfego.',
  'As raízes das árvores ajudam a absorver a água da chuva, diminuindo o risco de enchentes.',
  'Muitas espécies nativas da Mata Atlântica, bioma original da região de Vitória de Santo Antão, são excelentes para arborização urbana.',
  'Um quilômetro de rua arborizada pode abrigar dezenas de espécies de pássaros e insetos benéficos.'
];

function mostrarCuriosidade() {
  const textoEl = document.getElementById('curiosidadeTexto');
  const atual = textoEl.dataset.indice ? Number(textoEl.dataset.indice) : -1;
  let indice = Math.floor(Math.random() * curiosidades.length);
  if (indice === atual) {
    indice = (indice + 1) % curiosidades.length;
  }
  textoEl.dataset.indice = indice;
  textoEl.textContent = curiosidades[indice];
}

document.getElementById('curiosidadeNova').addEventListener('click', mostrarCuriosidade);
mostrarCuriosidade();

buscaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const encontradas = filtrarLista();
  renderizar(encontradas);
  manterSelecao(encontradas);
});

buscaTermoInput.addEventListener('input', () => {
  const encontradas = filtrarLista();
  renderizar(encontradas);
  manterSelecao(encontradas);
});

carregar();