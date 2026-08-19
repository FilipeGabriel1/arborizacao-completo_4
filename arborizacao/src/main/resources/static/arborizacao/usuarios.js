const apiBase = '/api/usuarios';

const form = document.getElementById('usuarioForm');
const usuarioIdInput = document.getElementById('usuarioId');
const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const senhaLabel = document.getElementById('senhaLabel');
const perfilInput = document.getElementById('perfil');
const usuariosList = document.getElementById('usuariosList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let editingId = null;

async function carregarUsuarios() {
  const res = await fetch(apiBase);
  if (!res.ok) {
    return;
  }
  const usuarios = await res.json();
  renderizarLista(usuarios);
}

function renderizarLista(usuarios) {
  usuariosList.innerHTML = '';

  usuarios.forEach((usuario) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>${usuario.nome}</h3>
        <span>${usuario.perfil === 'ADMIN' ? 'Administrador' : 'Funcionário'}</span>
      </header>
      <p>${usuario.email}</p>
      <p>${usuario.ativo ? 'Ativo' : 'Desativado'}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar</button>
        <button type="button" data-action="status">${usuario.ativo ? 'Desativar' : 'Ativar'}</button>
        <button type="button" data-action="remover">Remover</button>
      </div>
    `;

    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(usuario));
    item.querySelector('[data-action="status"]').addEventListener('click', () => alternarStatus(usuario));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(usuario));

    usuariosList.appendChild(item);
  });
}

function iniciarEdicao(usuario) {
  editingId = usuario.id;
  usuarioIdInput.value = usuario.id;
  nomeInput.value = usuario.nome;
  emailInput.value = usuario.email;
  perfilInput.value = usuario.perfil;
  senhaInput.value = '';
  senhaInput.required = false;
  formTitle.textContent = 'Editar usuário';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  usuarioIdInput.value = '';
  senhaInput.required = true;
  formTitle.textContent = 'Novo usuário';
  cancelEditBtn.classList.add('hidden');
}

async function alternarStatus(usuario) {
  await fetch(`${apiBase}/${usuario.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ativo: !usuario.ativo })
  });
  carregarUsuarios();
}

async function remover(usuario) {
  if (!confirm(`Remover o acesso de ${usuario.nome}?`)) {
    return;
  }
  await fetch(`${apiBase}/${usuario.id}`, { method: 'DELETE' });
  carregarUsuarios();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  if (editingId) {
    // Edição: só troca a senha se o campo foi preenchido.
    if (senhaInput.value) {
      await fetch(`${apiBase}/${editingId}/senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaInput.value })
      });
    }
    cancelarEdicao();
    carregarUsuarios();
    return;
  }

  const payload = {
    nome: nomeInput.value,
    email: emailInput.value,
    senha: senhaInput.value,
    perfil: perfilInput.value
  };

  const res = await fetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar o usuário.'}</div>`;
    return;
  }

  form.reset();
  carregarUsuarios();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

carregarUsuarios();
