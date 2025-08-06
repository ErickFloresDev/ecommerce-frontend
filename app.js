const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Página principal (home)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Páginas públicas
app.get('/login',    (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'detail.html'));
});

app.get('/vista', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vista.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Catch-all de rutas de usuario (incluye /user y /user/lo-que-sea)
app.get(/^\/user(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'dashboard.html'));
});

app.get(/^\/user-cart(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'cart.html'));
});

app.get(/^\/user-order(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'order.html'));
});

// Catch-all de rutas de admin (incluye /admin y /admin/lo-que-sea)
app.get(/^\/admin(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.get(/^\/products(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'));
});

app.get(/^\/users(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'users.html'));
});

app.get(/^\/order(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'order.html'));
});


// Al final de todas tus rutas:
app.use((req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor frontend arrancado en http://localhost:${PORT}`);
});
