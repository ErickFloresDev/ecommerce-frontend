(function () {
  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);

    if (response.status === 401 || response.status === 403) {
      // Token vencido o acceso prohibido
      localStorage.clear();             // Limpia token, rol, etc.
      window.location.href = '/login';  // Redirige automáticamente
      // Opcional: lanzar un error para romper la cadena de promesas
      throw new Error('Unauthorized: redirigiendo a login');
    }

    return response;
  };
})();


window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');

  if (!token || role !== 'administrador') {
    localStorage.clear();
    return window.location.href = '/login';
  }

  showNotification(`¡Bienvenido, ${name}!`);
});


// Función para mostrar notificaciones (opcional)
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #000000;
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    z-index: 9999;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);



}

// Función para mostrar notificaciones (opcional)
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #000000;
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    z-index: 9999;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);

}

// Toggle navbar
const navToggler = document.querySelector('.navbar-toggler');
const navTogglerIcon = document.getElementById('navTogglerIcon');

if (navToggler && navTogglerIcon) {
  navToggler.addEventListener('click', () => {
    navTogglerIcon.classList.toggle('fa-bars');
    navTogglerIcon.classList.toggle('fa-times');
  });
}