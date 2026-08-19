const apiBase = '/api/auditoria';

const filtroTexto = document.getElementById('filtroTexto');
const filtroEntidade = document.getElementById('filtroEntidade');
const filtroAcao = document.getElementById('filtroAcao');
const historicoList = document.getElementById('historicoList');
const historicoVazio = document.getElementById('historicoVazio');
const recarregarBtn = document.getElementById('recarregarBtn');

const rotulosAcao = {
  CRIACAO: 'Criação',
  EDICAO: 'Edição',
  EXCLUSAO: 'Exclusão'
};

const rotulosEntidade = {
  AREA: 'Área',
  ARVORE: 'Árvore',
  ESPECIE: 'Espécie',
  DOACAO: 'Doação',
  USUARIO: 'Usuário'
};

const coresAcao = {
  CRIACAO: 'acao-criacao',
  EDICAO: 'acao-edicao',
  EXCLUSAO: 'acao-exclusao'
};

let registros = [];

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

async function carregarHistorico() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) {
    historicoList.innerHTML = '<p class="historico-vazio">Não foi possível carregar o histórico.</p>';
    return;
  }
  registros = itens;
  renderizarLista(registros);
}

function renderizarLista(lista) {
  historicoList.innerHTML = '';
  const filtrados = aplicarFiltros(lista);

  historicoVazio.classList.toggle('hidden', filtrados.length > 0);

  filtrados.forEach((registro) => {
    const item = document.createElement('article');
    item.className = 'area-item historico-item';
    item.innerHTML = `
      <header>
        <h3>${rotulosEntidade[registro.entidade] || registro.entidade}
          ${registro.entidadeId ? `<span class="historico-id">#${registro.entidadeId}</span>` : ''}
          <span class="badge-acao ${coresAcao[registro.acao] || ''}">${rotulosAcao[registro.acao] || registro.acao}</span>
        </h3>
        <span>${formatarData(registro.dataHora)}</span>
      </header>
      <p>${registro.detalhe || 'Sem detalhes.'}</p>
      <p class="historico-usuario">${registro.usuarioEmail || 'Sistema'}</p>
    `;

    historicoList.appendChild(item);
  });
}

function aplicarFiltros(lista) {
  const texto = filtroTexto.value.trim().toLowerCase();
  const entidade = filtroEntidade.value;
  const acao = filtroAcao.value;

  return lista.filter((registro) => {
    if (entidade && registro.entidade !== entidade) {
      return false;
    }
    if (acao && registro.acao !== acao) {
      return false;
    }
    if (texto) {
      const alvo = `${registro.usuarioEmail || ''} ${registro.detalhe || ''} ${registro.entidade || ''}`.toLowerCase();
      if (!alvo.includes(texto)) {
        return false;
      }
    }
    return true;
  });
}

function formatarData(dataHora) {
  if (!dataHora) {
    return '';
  }
  const data = new Date(dataHora);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

filtroTexto.addEventListener('input', () => renderizarLista(registros));
filtroEntidade.addEventListener('change', () => renderizarLista(registros));
filtroAcao.addEventListener('change', () => renderizarLista(registros));
recarregarBtn.addEventListener('click', carregarHistorico);

carregarHistorico();