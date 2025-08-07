//public\js\user\dashboard.js

// Variables globales para manejar los productos
let allProducts = [];
let filteredProducts = [];

// public/js/user/dashboard.js
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  const name  = localStorage.getItem('name');

  if (!token || role !== 'usuario') {
    localStorage.clear();
    return window.location.href = '/login';
  }
  
  showNotification(`¡Bienvenido, ${name}!`);
});


// Función para cargar productos desde la API
async function loadProductsFromAPI() {
  const container = document.getElementById('productsContainer');
  const resultsCount = document.getElementById('resultsCount');

  try {
    // Mostrar loading
    container.innerHTML = `
      <div class="col-12">
        <div class="loading-state">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-muted mt-3 mb-0">Cargando productos...</p>
        </div>
      </div>
    `;

    const response = await fetch((`${CONFIG.API_URL}/products`));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    allProducts = data.products || data || [];
    filteredProducts = [...allProducts];

    // Poblar categorías dinámicamente
    populateCategories();
    renderProducts(filteredProducts);

  } catch (error) {
    console.error('Error al cargar productos:', error);
    container.innerHTML = `
      <div class="col-12">
        <div class="error-state">
          <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
          <h5>Error al cargar productos</h5>
          <p class="mb-3">No se pudieron cargar los productos. Verifica tu conexión.</p>
          <button class="btn-retry" onclick="loadProductsFromAPI()">
            <i class="fas fa-redo me-2"></i>Reintentar
          </button>
        </div>
      </div>
    `;
    resultsCount.textContent = '0 productos encontrados';
  }
}

// Función para poblar el select de categorías dinámicamente
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = [...new Set(allProducts.map(product => product.category))];

  // Limpiar opciones existentes (excepto "Todas las categorías")
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';

  // Agregar categorías dinámicamente
  categories.forEach(category => {
    if (category) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categoryFilter.appendChild(option);
    }
  });
}

// Función para renderizar productos
function renderProducts(products) {
  const container = document.getElementById('productsContainer');
  const resultsCount = document.getElementById('resultsCount');

  resultsCount.textContent = `${products.length} productos encontrados`;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-search fa-4x"></i>
          <h5>No se encontraron productos</h5>
          <p>Intenta con otros filtros de búsqueda</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="col-12 col-sm-12 col-md-5 col-lg-4 col-xl-3">
      <div class="product-card" onclick="viewDetail(${product.id_product})">
        <div class="product-image-container">
          <img src="${product.images_url || '/img/image-placeholder.webp'}" 
              class="product-image" 
              alt="${product.name}"
              onerror="this.src='/img/image-placeholder.webp'"
              loading="lazy">
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description || 'Sin descripción disponible'}</p>
          <div class="product-footer">
            <div class="product-price">
              S/ ${parseFloat(product.price_end || 0).toFixed(2)}
            </div>
            <button class="add-to-cart-btn" data-product='${encodeURIComponent(JSON.stringify(product))}' onclick="handleAddToCart(this); event.stopPropagation();">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

}

// Función para filtrar productos
function filterProducts() {
  // Obtener términos de búsqueda de ambos inputs
  const searchTerm1 = document.getElementById('searchInput').value.toLowerCase();
  const searchTerm2 = document.getElementById('searchInputNavar').value.toLowerCase();
  
  // Combinar los términos de búsqueda
  const searchTerm = searchTerm1 || searchTerm2;
  const categoryFilter = document.getElementById('categoryFilter').value;
  const priceFilter = document.getElementById('priceFilter').value;

  filteredProducts = allProducts.filter(product => {
    // Filtro de búsqueda
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      (product.category && product.category.toLowerCase().includes(searchTerm));

    // Filtro de categoría
    const matchesCategory = !categoryFilter || (product.category && product.category === categoryFilter);

    // Filtro de precio
    let matchesPrice = true;
    const price = parseFloat(product.price_end || product.price || 0);
    if (priceFilter === 'low') {
      matchesPrice = price < 50;
    } else if (priceFilter === 'medium') {
      matchesPrice = price >= 50 && price <= 150;
    } else if (priceFilter === 'high') {
      matchesPrice = price > 150;
    }

    return matchesSearch && matchesCategory && matchesPrice;
  });

  renderProducts(filteredProducts);
}

// Funciones para los botones
function viewDetail(productId) {
  console.log('Ver detalle del producto:', productId);
  // Redirigir a la página de detalle del producto
  window.location.href = `/vista.html?id=${productId}`;
}

//Funcion para añadr al carrito
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.id_product === product.id_product);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showNotification('Producto agregado al carrito');
}

function handleAddToCart(button) {
  const productData = decodeURIComponent(button.getAttribute('data-product'));
  const product = JSON.parse(productData);
  addToCart(product);
}


// Función para mostrar notificaciones (opcional)
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Cargar productos desde la API
  loadProductsFromAPI();

  // Configurar filtros con debounce para la búsqueda
  let searchTimeout;
  
  // Escuchar el primer input de búsqueda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterProducts, 300);
    });
  }

  // Escuchar el segundo input de búsqueda (navbar)
  const searchInputNavar = document.getElementById('searchInputNavar');
  if (searchInputNavar) {
    searchInputNavar.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterProducts, 300);
    });
  }
  
  // Escuchar cambios en los filtros de categoría y precio
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterProducts);
  }

  const priceFilter = document.getElementById('priceFilter');
  if (priceFilter) {
    priceFilter.addEventListener('change', filterProducts);
  }

});

// Toggle navbar
const navToggler = document.querySelector('.navbar-toggler');
const navTogglerIcon = document.getElementById('navTogglerIcon');

if (navToggler && navTogglerIcon) {
  navToggler.addEventListener('click', () => {
    navTogglerIcon.classList.toggle('fa-bars');
    navTogglerIcon.classList.toggle('fa-times');
  });
}