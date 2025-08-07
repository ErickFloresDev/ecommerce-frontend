// Variables globales
let currentProduct = null;

// Elementos del DOM (cacheados)
const elements = {
  get quantity() { return document.getElementById('quantity'); },
  get productName() { return document.getElementById('productName'); },
  get loadingState() { return document.getElementById('loadingState'); },
  get errorState() { return document.getElementById('errorState'); },
  get productContent() { return document.querySelector('.row.g-5'); },
  get stockIndicator() { return document.getElementById('stockIndicator'); },
  get stockMessage() { return document.getElementById('stockMessage'); }
};

// Configuración
const CONFIG = {
  MAX_QUANTITY: 99,
  MIN_QUANTITY: 1,
  API_URL: 'https://ecommerce-backend-kohl-mu.vercel.app/api/products',
  PLACEHOLDER_IMG: '/img/image-placeholder.webp'
};

// Estados de stock
const STOCK_STATES = {
  disponible: { class: 'stock-available', text: 'Disponible' },
  'en stock': { class: 'stock-available', text: 'Disponible' },
  agotado: { class: 'stock-unavailable', text: 'Agotado' },
  'sin stock': { class: 'stock-unavailable', text: 'Agotado' },
  limitado: { class: 'stock-limited', text: 'Stock limitado' },
  'pocas unidades': { class: 'stock-limited', text: 'Stock limitado' },
  'próximamente': { class: 'stock-coming', text: 'Próximamente' },
  pronto: { class: 'stock-coming', text: 'Próximamente' }
};

// Funciones para manejar cantidad
function increaseQuantity() {
  const input = elements.quantity;
  const value = parseInt(input.value);
  if (value < CONFIG.MAX_QUANTITY) input.value = value + 1;
}

function decreaseQuantity() {
  const input = elements.quantity;
  const value = parseInt(input.value);
  if (value > CONFIG.MIN_QUANTITY) input.value = value - 1;
}

//Funcion para añadr al carrito
function addToCart(product, quantity = 1) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.id_product === product.id_product);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showNotification(`Se agregó ${quantity} unidad(es) al carrito`);
}


function viewProductList() {
  window.location.href = '/cart';
}

// Mostrar notificación
function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Estados de carga
function toggleStates(show, hide1, hide2) {
  if (show) show.style.display = 'flex';
  if (hide1) hide1.style.display = 'none';
  if (hide2) hide2.style.display = 'none';
}

function showLoadingState() {
  toggleStates(elements.loadingState, elements.productContent, elements.errorState);
  
}

function showProductContent() {
  toggleStates(elements.productContent, elements.loadingState, elements.errorState);
}

function showErrorState() {
  toggleStates(elements.errorState, elements.loadingState, elements.productContent);
}

// Actualizar estado del stock
function updateStockStatus(stockMessage) {
  const { stockIndicator, stockMessage: msgElement } = elements;
  if (!stockIndicator || !msgElement) return;
  
  stockIndicator.className = 'fas fa-circle stock-indicator';
  
  const normalized = (stockMessage || '').toLowerCase().trim();
  const state = Object.entries(STOCK_STATES).find(([key]) => normalized.includes(key));
  
  if (state) {
    const { class: className, text } = state[1];
    stockIndicator.classList.add(className);
    msgElement.textContent = text;
    msgElement.className = `stock-message ${className}-text`;
  } else {
    stockIndicator.classList.add('stock-unknown');
    msgElement.textContent = stockMessage || 'Estado no disponible';
    msgElement.className = 'stock-message stock-unknown-text';
  }
}

// Cargar detalle del producto
async function loadProductDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  
  if (!id) return showErrorState();
  
  showLoadingState();
  
  try {
    const response = await fetch(`${CONFIG.API_URL}/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const { product } = await response.json();
    if (!product) throw new Error('Producto no encontrado');
    
    currentProduct = product;
    updateProductContent(product);
    showProductContent();

    // ✅ Aquí configuramos el botón después de tener el producto
    addToCartBtn.setAttribute('data-product', encodeURIComponent(JSON.stringify(product)));
    addToCartBtn.addEventListener('click', function () {
      const productData = decodeURIComponent(this.getAttribute('data-product'));
      const parsedProduct = JSON.parse(productData);

      const quantityInput = document.getElementById('quantity');
      const quantity = parseInt(quantityInput?.value) || 1;

      addToCart(parsedProduct, quantity);
    });


  } catch (error) {
    console.error('Error al cargar el producto:', error);
    showErrorState();
  }
}


// Actualizar contenido del producto
function updateProductContent(product) {
  document.title = `${product.name} | eCommerce`;
  
  // Actualizar elementos
  const updates = {
    breadcrumbProduct: product.name,
    productName: product.name || 'Producto sin nombre',
    productCategory: product.category || 'Sin categoría',
    productDescription: product.description || 'Sin descripción disponible',
    productBrand: product.brand || 'Marca no especificada'
  };
  
  Object.entries(updates).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

 // Precio
  const priceElement = document.getElementById('productPrice');
  if (priceElement) {
    let price = 'Precio no disponible';

    if (product.price_start) {
      if (product.price_end && product.price_start !== product.price_end) {
        price = `S/ ${parseFloat(product.price_end).toFixed(2)} <span class="mx-2 text-decoration-line-through fs-6">S/ ${parseFloat(product.price_start).toFixed(2)}</span>`;
      } else {
        price = `S/ ${parseFloat(product.price_start).toFixed(2)}`;
      }
    } else if (product.price) {
      price = `S/ ${parseFloat(product.price).toFixed(2)}`;
    }

    priceElement.innerHTML = price;
    priceElement.classList.toggle('d-none', price === 'Precio no disponible'); // Ocultar si no hay precio
  }

  // Imagen
  const imageElement = document.getElementById('productImage');
  if (imageElement) {
    imageElement.src = product.images_url || CONFIG.PLACEHOLDER_IMG;
    imageElement.alt = product.name || 'Imagen del producto';
  }
  
  updateStockStatus(product.message_stock);
}

// Configuración de eventos y inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadProductDetail();
  
  // Navbar toggle
  const navToggler = document.getElementById('navToggler');
  const navIcon = document.getElementById('navTogglerIcon');
  if (navToggler && navIcon) {
    navToggler.addEventListener('click', () => {
      navIcon.classList.toggle('fa-bars');
      navIcon.classList.toggle('fa-times');
    });
  }
  
  // Input de cantidad
  const quantityInput = elements.quantity;
  if (quantityInput) {
    quantityInput.addEventListener('input', function() {
      let value = parseInt(this.value);
      if (isNaN(value) || value < 1) this.value = 1;
      else if (value > 99) this.value = 99;
    });
    
    quantityInput.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }
  
  // Error de imagen
  const productImage = document.getElementById('productImage');
  if (productImage) {
    productImage.addEventListener('error', function() {
      this.src = CONFIG.PLACEHOLDER_IMG;
    });
  }
});