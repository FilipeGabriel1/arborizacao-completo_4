const apiBase = '/api/doacoes';

const form = document.getElementById('doacaoForm');
const arvoreIdInput = document.getElementById('arvoreId');
const solicitanteInput = document.getElementById('solicitante');
const dataDoacaoInput = document.getElementById('dataDoacao');
const destinacaoInput = document.getElementById('destinacao');
const quantidadeInput = document.getElementById('quantidade');
const cpfInput = document.getElementById('cpf');
const rgInput = document.getElementById('rg');
const descricaoInput = document.getElementById('descricao');
const doacoesList = document.getElementById('doacoesList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const dataDeInput = document.getElementById('dataDe');
const dataAteInput = document.getElementById('dataAte');
const filtroEspecieInput = document.getElementById('filtroEspecie');
const especiesLista = document.getElementById('especiesLista');
const limparFiltrosBtn = document.getElementById('limparFiltrosBtn');
const recarregarBtn = document.getElementById('recarregarBtn');
const extratoResumo = document.getElementById('extratoResumo');
const doacoesVazio = document.getElementById('doacoesVazio');

let editingId = null;
let doacoes = [];
let especies = [];

function normalizarTexto(texto) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatarData(data) {
  if (!data) return '—';
  const [ano, mes, dia] = String(data).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function mascararCpf(cpf) {
  const c = String(cpf).replace(/[^\d]/g, '');
  if (c.length === 11) {
    return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
  }
  return cpf;
}

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

async function carregarArvoresSelect() {
  const arvores = await buscarTudo('/api/arvores');
  (arvores ?? []).forEach((arvore) => {
    const option = document.createElement('option');
    option.value = arvore.id;
    option.textContent = arvore.nome || `Árvore #${arvore.id}`;
    arvoreIdInput.appendChild(option);
  });
}

async function carregarEspecies() {
  const itens = await buscarTudo('/api/especies');
  especies = itens ?? [];
  especiesLista.innerHTML = '';
  especies.forEach((especie) => {
    const option = document.createElement('option');
    option.value = especie.nomePopular || '';
    especiesLista.appendChild(option);
  });
}

function aplicarFiltros() {
  const termo = buscaTermoInput.value.trim();
  const dataDe = dataDeInput.value;
  const dataAte = dataAteInput.value;
  const especie = normalizarTexto(filtroEspecieInput.value.trim());
  const termoNorm = normalizarTexto(termo);

  return doacoes.filter((doacao) => {
    if (termo) {
      const alvo = normalizarTexto(
        `${doacao.solicitante || ''} ${doacao.cpf || ''} ${doacao.id || ''}`
      );
      if (!alvo.includes(termoNorm)) return false;
    }

    if (dataDe && (!doacao.dataDoacao || doacao.dataDoacao < dataDe)) return false;
    if (dataAte && (!doacao.dataDoacao || doacao.dataDoacao > dataAte)) return false;

    if (especie && !normalizarTexto(doacao.arvoreEspecie || '').includes(especie)) return false;

    return true;
  });
}

function renderizarResumo(filtrados) {
  const totalQuantidade = filtrados.reduce((acc, d) => acc + (d.quantidade || 0), 0);
  const datadas = filtrados.filter((d) => d.dataDoacao);
  const datas = datadas.map((d) => d.dataDoacao).sort();

  extratoResumo.innerHTML = `
    <div>
      <span>${filtrados.length}</span>
      <small>doações</small>
    </div>
    <div>
      <span>${totalQuantidade}</span>
      <small>mudas doadas</small>
    </div>
    <div>
      <span>${datas.length ? formatarData(datas[0]) : '—'}</span>
      <small>primeira doação</small>
    </div>
    <div>
      <span>${datas.length ? formatarData(datas[datas.length - 1]) : '—'}</span>
      <small>última doação</small>
    </div>`;
  extratoResumo.classList.remove('hidden');
}

function renderizar(filtrados) {
  doacoesList.innerHTML = '';
  doacoesVazio.classList.toggle('hidden', filtrados.length > 0);
  renderizarResumo(filtrados);

  let saldo = 0;
  filtrados.forEach((doacao) => {
    const quantidade = doacao.quantidade || 0;
    saldo += quantidade;
    const tr = document.createElement('tr');
    const descricao = [
      doacao.arvoreNome || `Árvore #${doacao.arvoreId}`,
      doacao.destinacao,
      doacao.descricao
    ].filter(Boolean).join(' • ');
    const identificacao = [doacao.solicitante, doacao.cpf ? mascararCpf(doacao.cpf) : '']
      .filter(Boolean).join(' • ') || 'Doador não informado';

    tr.innerHTML = `
      <td class="extrato-data">${formatarData(doacao.dataDoacao)}</td>
      <td>${identificacao}</td>
      <td>${descricao}</td>
      <td>${doacao.arvoreEspecie || '—'}</td>
      <td class="extrato-qtd">${quantidade}</td>
      <td class="extrato-saldo">${saldo}</td>
      <td>
        <div class="item-actions">
          <button type="button" data-action="editar">Editar</button>
          <button type="button" data-action="remover">Remover</button>
        </div>
      </td>
    `;
    tr.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(doacao));
    tr.querySelector('[data-action="remover"]').addEventListener('click', () => remover(doacao));
    doacoesList.appendChild(tr);
  });
}

async function carregarDoacoes() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) {
    doacoesList.innerHTML = '<tr><td colspan="7">Não foi possível carregar as doações.</td></tr>';
    return;
  }
  doacoes = itens;
  renderizar(aplicarFiltros());
}

function iniciarEdicao(doacao) {
  editingId = doacao.id;
  arvoreIdInput.value = doacao.arvoreId;
  solicitanteInput.value = doacao.solicitante || '';
  dataDoacaoInput.value = doacao.dataDoacao || '';
  destinacaoInput.value = doacao.destinacao || '';
  quantidadeInput.value = doacao.quantidade ?? '';
  cpfInput.value = doacao.cpf || '';
  rgInput.value = doacao.rg || '';
  descricaoInput.value = doacao.descricao || '';
  formTitle.textContent = 'Editar doação';
  cancelEditBtn.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Nova doação';
  cancelEditBtn.classList.add('hidden');
}

async function remover(doacao) {
  if (!confirm('Remover este registro de doação?')) return;
  await fetch(`${apiBase}/${doacao.id}`, { method: 'DELETE' });
  carregarDoacoes();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  const payload = {
    arvoreId: arvoreIdInput.value,
    solicitante: solicitanteInput.value || null,
    dataDoacao: dataDoacaoInput.value || null,
    destinacao: destinacaoInput.value || null,
    quantidade: quantidadeInput.value ? Number(quantidadeInput.value) : null,
    cpf: cpfInput.value || null,
    rg: rgInput.value || null,
    descricao: descricaoInput.value || null
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
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar a doação.'}</div>`;
    return;
  }

  cancelarEdicao();
  carregarDoacoes();
});

buscaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderizar(aplicarFiltros());
});

limparFiltrosBtn.addEventListener('click', () => {
  buscaForm.reset();
  renderizar(aplicarFiltros());
});

buscaTermoInput.addEventListener('input', () => renderizar(aplicarFiltros()));
dataDeInput.addEventListener('change', () => renderizar(aplicarFiltros()));
dataAteInput.addEventListener('change', () => renderizar(aplicarFiltros()));
filtroEspecieInput.addEventListener('input', () => renderizar(aplicarFiltros()));
cancelEditBtn.addEventListener('click', cancelarEdicao);
recarregarBtn.addEventListener('click', carregarDoacoes);

carregarArvoresSelect();
carregarEspecies().then(carregarDoacoes);