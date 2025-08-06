
// public/js/auth.js
// auth.js: manejo de login y registro, almacenamiento de JWT
const API_BASE = 'http://localhost:3000/api/auth';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error en la petición');
  return data;
}

// Registro
document.getElementById('register-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('name').value;
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const address  = document.getElementById('address').value;
  const phone    = document.getElementById('phone').value;

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name, email, password, address, phone })
    });
    const data = await handleResponse(res);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('name', data.name);
    if (data.role === 'administrador') window.location.href = '/admin/dashboard';
    else window.location.href = '/user/dashboard';
  } catch (err) {
    alert(err.message);
  }
});

// Login
document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('name', data.name);
    if (data.role === 'administrador') window.location.href = '/admin/dashboard';
    else window.location.href = '/user/dashboard';
  } catch (err) {
    alert(err.message);
  }
});