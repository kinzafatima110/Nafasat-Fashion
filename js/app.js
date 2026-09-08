/**
 * NAFASAT FASHION - THE STORE FOR RENTAL DRESSES AND ACCESSORIES
 * Digital Showroom Application
 */

(function() {
  'use strict';

  // State
  let catalogData = { categories: [], products: [], available_colors: [], available_sizes: [] };
  let filteredProducts = [];
  let currentCategory = 'all';
  let currentColor = 'all';
  let currentSize = 'all';
  let currentSearchQuery = '';
  let currentSort = 'code-asc';
  
  // Lightbox Modal State
  let activeProduct = null;
  let activePhotoIndex = 0;

  // Try-On List (Local Storage)
  const STORAGE_KEY = 'nafasat_tryon_list_v2';
  let tryOnList = loadTryOnList();

  // DOM Elements
  const elements = {
    productGrid: document.getElementById('productGrid'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    resetFilterBtn: document.getElementById('resetFilterBtn'),
    categoryPills: document.getElementById('categoryPills'),
    countAll: document.getElementById('count-all'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    resultsCount: document.getElementById('resultsCount'),
    activeFiltersSummary: document.getElementById('activeFiltersSummary'),
    activeTagsRow: document.getElementById('activeTagsRow'),
    colorSelect: document.getElementById('colorSelect'),
    sizeSelect: document.getElementById('sizeSelect'),
    sortSelect: document.getElementById('sortSelect'),
    
    // Lightbox
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
    lightboxMainImage: document.getElementById('lightboxMainImage'),
    lightboxPrevBtn: document.getElementById('lightboxPrevBtn'),
    lightboxNextBtn: document.getElementById('lightboxNextBtn'),
    lightboxCategory: document.getElementById('lightboxCategory'),
    lightboxSku: document.getElementById('lightboxSku'),
    lightboxCounter: document.getElementById('lightboxCounter'),
    lightboxColor: document.getElementById('lightboxColor'),
    lightboxSize: document.getElementById('lightboxSize'),
    lightboxRent: document.getElementById('lightboxRent'),
    lightboxDeposit: document.getElementById('lightboxDeposit'),
    lightboxDescription: document.getElementById('lightboxDescription'),
    lightboxBadgeLabel: document.getElementById('lightboxBadgeLabel'),
    lightboxThumbnails: document.getElementById('lightboxThumbnails'),
    lightboxTryOnBtn: document.getElementById('lightboxTryOnBtn'),
    lightboxWhatsAppBtn: document.getElementById('lightboxWhatsAppBtn'),

    // Try-On Drawer
    tryOnDrawer: document.getElementById('tryOnDrawer'),
    tryOnDrawerBtn: document.getElementById('tryOnDrawerBtn'),
    drawerCloseBtn: document.getElementById('drawerCloseBtn'),
    drawerOverlay: document.getElementById('drawerOverlay'),
    drawerItemsList: document.getElementById('drawerItemsList'),
    drawerEmptyState: document.getElementById('drawerEmptyState'),
    tryOnCountBadge: document.getElementById('tryOnCountBadge'),
    drawerCount: document.getElementById('drawerCount'),
    whatsappShareListBtn: document.getElementById('whatsappShareListBtn'),
    printListBtn: document.getElementById('printListBtn'),
    clearTryOnListBtn: document.getElementById('clearTryOnListBtn'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
  };

  // =========================================================================
  // COLOR PALETTE MAPPER FOR DOTS
  // =========================================================================
  function getColorHex(stdColor) {
    const map = {
      'Red & Maroon': '#b3001b',
      'Pink & Peach': '#ff758f',
      'Blue & Ferozi': '#1e90ff',
      'Green & Emerald': '#2a9d8f',
      'Gold & Yellow': '#e5a910',
      'White & Silver': '#d8d8d8',
      'Black': '#1a1a1a',
      'Purple & Plum': '#7209b7',
      'Multi & Other': '#f77f00'
    };
    return map[stdColor] || '#999999';
  }

  function formatPrice(val) {
    if (!val) return 'Inquire for Rent';
    // Clean string, e.g. "3000" -> "Rs. 3,000"
    const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num <= 0) return 'Inquire for Rent';
    return `Rs. ${num.toLocaleString()}`;
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  async function init() {
    setupEventListeners();
    updateTryOnBadges();
    
    try {
      const response = await fetch('data/products.json');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      catalogData = await response.json();
      
      // Populate Dropdowns
      populateFilterDropdowns();

      // Render Category Nav
      renderCategoryPills();
      
      // Initial Filter & Render
      applyFiltersAndSort();
    } catch (error) {
      console.error('Failed to load catalog data:', error);
      elements.loadingState.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation empty-icon" style="color: #d90429;"></i>
        <h3>Unable to load catalogue</h3>
        <p>Please check your connection or reload the page.</p>
      `;
    }
  }

  // =========================================================================
  // POPULATE COLOR & SIZE DROPDOWNS
  // =========================================================================
  function populateFilterDropdowns() {
    // Populate Colors
    elements.colorSelect.innerHTML = '<option value="all">All Colors</option>';
    if (catalogData.available_colors) {
      catalogData.available_colors.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        elements.colorSelect.appendChild(opt);
      });
    }

    // Populate Sizes
    elements.sizeSelect.innerHTML = '<option value="all">All Sizes</option>';
    if (catalogData.available_sizes) {
      catalogData.available_sizes.forEach(sz => {
        const opt = document.createElement('option');
        opt.value = sz;
        opt.textContent = sz;
        elements.sizeSelect.appendChild(opt);
      });
    }
  }

  // =========================================================================
  // CATEGORIES RENDERING
  // =========================================================================
  function renderCategoryPills() {
    elements.countAll.textContent = catalogData.products.length;
    
    catalogData.categories.forEach(cat => {
      if (cat.count <= 0) return;
      
      const btn = document.createElement('button');
      btn.className = 'cat-pill';
      btn.dataset.category = cat.id;
      
      let icon = 'fa-tag';
      if (cat.id.includes('bridal')) icon = 'fa-gem';
      else if (cat.id.includes('party')) icon = 'fa-wand-magic-sparkles';
      else if (cat.id.includes('jewelry')) icon = 'fa-ring';
      else if (cat.id.includes('kids') || cat.id.includes('coat')) icon = 'fa-child';
      else if (cat.id.includes('saree')) icon = 'fa-shirt';
      else if (cat.id.includes('purse')) icon = 'fa-bag-shopping';
      else if (cat.id.includes('shoe')) icon = 'fa-shoe-prints';
      
      btn.innerHTML = `
        <span><i class="fa-solid ${icon}"></i> ${escapeHtml(cat.name)}</span>
        <span class="pill-count">${cat.count}</span>
      `;
      
      btn.addEventListener('click', () => {
        setCategory(cat.id);
      });
      
      elements.categoryPills.appendChild(btn);
    });
  }

  function setCategory(catId) {
    currentCategory = catId;
    
    const allPills = elements.categoryPills.querySelectorAll('.cat-pill');
    allPills.forEach(pill => {
      if (pill.dataset.category === catId) {
        pill.classList.add('active');
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        pill.classList.remove('active');
      }
    });

    applyFiltersAndSort();
  }

  // =========================================================================
  // FILTERING & SORTING (CATEGORY, COLOR, SIZE, SEARCH, SORT)
  // =========================================================================
  function applyFiltersAndSort() {
    let results = catalogData.products.slice();

    // 1. Category
    if (currentCategory !== 'all') {
      results = results.filter(item => item.category_id === currentCategory);
    }

    // 2. Color Filter
    if (currentColor !== 'all') {
      results = results.filter(item => item.standard_color === currentColor);
    }

    // 3. Size Filter
    if (currentSize !== 'all') {
      results = results.filter(item => item.standard_size === currentSize);
    }

    // 4. Search Query
    const query = currentSearchQuery.trim().toLowerCase();
    if (query) {
      results = results.filter(item => {
        return (
          item.sku.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query) ||
          item.size.toLowerCase().includes(query) ||
          item.category_name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.images && item.images.some(img => img.toLowerCase().includes(query)))
        );
      });
    }

    // 5. Sorting
    if (currentSort === 'code-asc') {
      results.sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true, sensitivity: 'base' }));
    } else if (currentSort === 'code-desc') {
      results.sort((a, b) => b.sku.localeCompare(a.sku, undefined, { numeric: true, sensitivity: 'base' }));
    } else if (currentSort === 'rent-asc') {
      results.sort((a, b) => (parseInt(a.rent, 10) || 999999) - (parseInt(b.rent, 10) || 999999));
    } else if (currentSort === 'rent-desc') {
      results.sort((a, b) => (parseInt(b.rent, 10) || 0) - (parseInt(a.rent, 10) || 0));
    } else if (currentSort === 'photos-desc') {
      results.sort((a, b) => b.image_count - a.image_count);
    }

    filteredProducts = results;
    updateStatusSummary();
    renderProductGrid();
  }

  function updateStatusSummary() {
    elements.resultsCount.textContent = filteredProducts.length;

    let catName = 'All Collections';
    if (currentCategory !== 'all') {
      const found = catalogData.categories.find(c => c.id === currentCategory);
      catName = found ? found.name : currentCategory;
    }
    elements.activeFiltersSummary.textContent = catName;

    // Render active filter badges
    elements.activeTagsRow.innerHTML = '';
    let hasFilters = false;

    if (currentColor !== 'all') {
      hasFilters = true;
      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.innerHTML = `Color: ${escapeHtml(currentColor)} <i class="fa-solid fa-xmark tag-remove"></i>`;
      tag.querySelector('.tag-remove').addEventListener('click', () => {
        elements.colorSelect.value = 'all';
        currentColor = 'all';
        applyFiltersAndSort();
      });
      elements.activeTagsRow.appendChild(tag);
    }

    if (currentSize !== 'all') {
      hasFilters = true;
      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.innerHTML = `Size: ${escapeHtml(currentSize)} <i class="fa-solid fa-xmark tag-remove"></i>`;
      tag.querySelector('.tag-remove').addEventListener('click', () => {
        elements.sizeSelect.value = 'all';
        currentSize = 'all';
        applyFiltersAndSort();
      });
      elements.activeTagsRow.appendChild(tag);
    }

    if (currentSearchQuery) {
      hasFilters = true;
      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.innerHTML = `"${escapeHtml(currentSearchQuery)}" <i class="fa-solid fa-xmark tag-remove"></i>`;
      tag.querySelector('.tag-remove').addEventListener('click', () => {
        elements.searchInput.value = '';
        currentSearchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        applyFiltersAndSort();
      });
      elements.activeTagsRow.appendChild(tag);
    }

    elements.activeTagsRow.style.display = hasFilters ? 'flex' : 'none';
  }

  // =========================================================================
  // PRODUCT GRID RENDERING (DUMMY PHOTO ON TOP)
  // =========================================================================
  function renderProductGrid() {
    elements.loadingState.style.display = 'none';

    if (filteredProducts.length === 0) {
      elements.productGrid.innerHTML = '';
      elements.emptyState.style.display = 'block';
      return;
    }

    elements.emptyState.style.display = 'none';
    const fragment = document.createDocumentFragment();

    filteredProducts.forEach(product => {
      const isFav = isFavorited(product.sku);
      
      const card = document.createElement('div');
      card.className = 'product-card';
      card.dataset.sku = product.sku;

      const hasPrice = product.rent && parseInt(product.rent, 10) > 0;
      const rentDisplay = hasPrice ? `Rs. ${parseInt(product.rent, 10).toLocaleString()}` : 'Inquire';
      const depositDisplay = product.deposit ? `Dep: Rs. ${parseInt(product.deposit, 10).toLocaleString()}` : '';

      const colorDotHex = getColorHex(product.standard_color);
      const photoText = product.image_count > 1 ? `${product.image_count} Angles` : '1 Photo';

      card.innerHTML = `
        <div class="card-image-wrap" role="button" tabindex="0" aria-label="View ${escapeHtml(product.sku)}">
          <img 
            src="${escapeHtml(product.primary_image)}" 
            alt="Dummy view for ${escapeHtml(product.sku)}" 
            class="card-img" 
            loading="lazy"
            onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'450\\' viewBox=\\'0 0 300 450\\'><rect fill=\\'%23eee\\' width=\\'300\\' height=\\'450\\'/><text fill=\\'%23aaa\\' font-family=\\'sans-serif\\' font-size=\\'16\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\'>Photo Unavailable</text></svg>'"
          >
          <span class="dummy-badge">
            <i class="fa-solid fa-vest-patches"></i> Mannequin
          </span>
          <span class="photo-count-pill">
            <i class="fa-solid fa-camera"></i> ${photoText}
          </span>
          <button class="card-favorite-btn ${isFav ? 'favorited' : ''}" title="${isFav ? 'Remove from Try-On' : 'Add to Try-On'}">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>

        <div class="card-body">
          <div class="card-meta-top">
            <span class="card-category">${escapeHtml(product.category_name)}</span>
          </div>

          <h3 class="card-sku">${escapeHtml(product.sku)}</h3>

          <div class="card-tags-row">
            <span class="tag-badge" title="Color: ${escapeHtml(product.color)}">
              <span class="color-dot" style="background-color: ${colorDotHex};"></span>
              ${escapeHtml(product.standard_color !== 'Standard' ? product.standard_color : product.color)}
            </span>
            <span class="tag-badge" title="Size: ${escapeHtml(product.size)}">
              <i class="fa-solid fa-ruler" style="font-size:0.65rem; color:#888;"></i>
              ${escapeHtml(product.standard_size)}
            </span>
          </div>

          <div class="card-price-row">
            <div class="price-rent">Rent: <strong>${rentDisplay}</strong></div>
            ${depositDisplay ? `<div class="price-deposit">${depositDisplay}</div>` : ''}
          </div>

          <button class="btn-card-view">
            <i class="fa-regular fa-eye"></i> <span>View All Angles (${product.image_count})</span>
          </button>
        </div>
      `;

      // Click Events
      const imageWrap = card.querySelector('.card-image-wrap');
      const viewBtn = card.querySelector('.btn-card-view');
      const favBtn = card.querySelector('.card-favorite-btn');

      const openModal = (e) => {
        if (e.target.closest('.card-favorite-btn')) return;
        openLightbox(product, 0); // 0 is always the dummy image!
      };

      imageWrap.addEventListener('click', openModal);
      imageWrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(e);
        }
      });
      viewBtn.addEventListener('click', openModal);

      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(product);
      });

      fragment.appendChild(card);
    });

    elements.productGrid.innerHTML = '';
    elements.productGrid.appendChild(fragment);
  }

  // =========================================================================
  // LIGHTBOX MODAL (DUMMY + OTHER ANGLES CAROUSEL)
  // =========================================================================
  function openLightbox(product, photoIndex = 0) {
    activeProduct = product;
    activePhotoIndex = photoIndex;

    elements.lightboxCategory.textContent = product.category_name;
    elements.lightboxSku.textContent = product.sku;

    // Metadata
    elements.lightboxColor.innerHTML = `<i class="fa-solid fa-palette"></i> Color: <strong>${escapeHtml(product.color)}</strong>`;
    elements.lightboxSize.innerHTML = `<i class="fa-solid fa-ruler"></i> Size: <strong>${escapeHtml(product.size)}</strong>`;
    
    if (product.rent && parseInt(product.rent, 10) > 0) {
      elements.lightboxRent.style.display = 'inline-flex';
      elements.lightboxRent.innerHTML = `<i class="fa-solid fa-tag"></i> Rent: <strong>Rs. ${parseInt(product.rent, 10).toLocaleString()}</strong>`;
    } else {
      elements.lightboxRent.style.display = 'none';
    }

    if (product.deposit && parseInt(product.deposit, 10) > 0) {
      elements.lightboxDeposit.style.display = 'inline-flex';
      elements.lightboxDeposit.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Deposit: <strong>Rs. ${parseInt(product.deposit, 10).toLocaleString()}</strong>`;
    } else {
      elements.lightboxDeposit.style.display = 'none';
    }

    elements.lightboxDescription.textContent = product.description && product.description !== 'Rental dress / accessory at Nafasat.' ? product.description : '';

    // Render Thumbnails
    renderLightboxThumbnails();

    // Display Active Photo
    updateLightboxImage();

    // Update Try-On Button in Modal
    updateLightboxTryOnBtn();

    // WhatsApp Inquiry Link with prefilled SKU, Color, Size, and Rent
    let waMsg = `Hello Nafasat, I am inquiring about Item Code: *${product.sku}* (${product.category_name}).\n`;
    if (product.color && product.color !== 'Standard') waMsg += `Color: ${product.color}\n`;
    if (product.size && product.size !== 'Standard') waMsg += `Size: ${product.size}\n`;
    if (product.rent) waMsg += `Rent: Rs. ${product.rent}\n`;
    waMsg += `Please let me know if it is available for booking!`;

    elements.lightboxWhatsAppBtn.href = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;

    // Show Modal
    elements.lightboxModal.classList.add('active');
    elements.lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    elements.lightboxModal.classList.remove('active');
    elements.lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeProduct = null;
  }

  function updateLightboxImage() {
    if (!activeProduct || !activeProduct.images.length) return;

    const currentSrc = activeProduct.images[activePhotoIndex];
    elements.lightboxMainImage.style.opacity = '0';
    
    setTimeout(() => {
      elements.lightboxMainImage.src = currentSrc;
      elements.lightboxMainImage.style.opacity = '1';
    }, 120);

    // Label: Mannequin / Dummy vs Detail Angle
    if (activePhotoIndex === 0) {
      elements.lightboxBadgeLabel.textContent = 'Mannequin (Front View)';
    } else {
      elements.lightboxBadgeLabel.textContent = `Angle / Detail ${activePhotoIndex + 1} of ${activeProduct.images.length}`;
    }

    elements.lightboxCounter.textContent = `Photo ${activePhotoIndex + 1} of ${activeProduct.images.length}`;

    // Highlight active thumbnail
    const thumbs = elements.lightboxThumbnails.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
      if (i === activePhotoIndex) {
        t.classList.add('active');
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        t.classList.remove('active');
      }
    });

    const hasMultiple = activeProduct.images.length > 1;
    elements.lightboxPrevBtn.style.display = hasMultiple ? 'flex' : 'none';
    elements.lightboxNextBtn.style.display = hasMultiple ? 'flex' : 'none';
  }

  function renderLightboxThumbnails() {
    elements.lightboxThumbnails.innerHTML = '';
    if (!activeProduct || activeProduct.images.length <= 1) {
      elements.lightboxThumbnails.style.display = 'none';
      return;
    }

    elements.lightboxThumbnails.style.display = 'flex';

    activeProduct.images.forEach((imgSrc, index) => {
      const thumb = document.createElement('div');
      thumb.className = `thumb-item ${index === activePhotoIndex ? 'active' : ''}`;
      
      thumb.innerHTML = `
        <img src="${escapeHtml(imgSrc)}" alt="Angle ${index + 1}">
        ${index === 0 ? '<span class="thumb-dummy-tag">Dummy</span>' : ''}
      `;
      
      thumb.addEventListener('click', () => {
        activePhotoIndex = index;
        updateLightboxImage();
      });
      elements.lightboxThumbnails.appendChild(thumb);
    });
  }

  function prevPhoto() {
    if (!activeProduct || activeProduct.images.length <= 1) return;
    activePhotoIndex = (activePhotoIndex - 1 + activeProduct.images.length) % activeProduct.images.length;
    updateLightboxImage();
  }

  function nextPhoto() {
    if (!activeProduct || activeProduct.images.length <= 1) return;
    activePhotoIndex = (activePhotoIndex + 1) % activeProduct.images.length;
    updateLightboxImage();
  }

  function updateLightboxTryOnBtn() {
    if (!activeProduct) return;
    const isFav = isFavorited(activeProduct.sku);
    if (isFav) {
      elements.lightboxTryOnBtn.classList.add('active');
      elements.lightboxTryOnBtn.innerHTML = '<i class="fa-solid fa-heart"></i> In Try-On List';
    } else {
      elements.lightboxTryOnBtn.classList.remove('active');
      elements.lightboxTryOnBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Add to Try-On';
    }
  }

  // =========================================================================
  // TRY-ON LIST / WISHLIST
  // =========================================================================
  function loadTryOnList() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTryOnList() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tryOnList));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
    updateTryOnBadges();
  }

  function isFavorited(sku) {
    return tryOnList.some(item => item.sku === sku);
  }

  function toggleFavorite(product) {
    const index = tryOnList.findIndex(item => item.sku === product.sku);
    if (index > -1) {
      tryOnList.splice(index, 1);
      showToast(`Removed ${product.sku} from Try-On List`);
    } else {
      tryOnList.push({
        sku: product.sku,
        title: product.title,
        category_name: product.category_name,
        category_id: product.category_id,
        color: product.color,
        size: product.size,
        rent: product.rent,
        primary_image: product.primary_image,
        image_count: product.image_count,
        addedAt: new Date().toISOString()
      });
      showToast(`Added ${product.sku} to Try-On List ❤️`);
    }

    saveTryOnList();
    
    // Update card button
    const card = document.querySelector(`.product-card[data-sku="${product.sku}"]`);
    if (card) {
      const favBtn = card.querySelector('.card-favorite-btn');
      const isFav = isFavorited(product.sku);
      if (favBtn) {
        favBtn.classList.toggle('favorited', isFav);
        favBtn.innerHTML = `<i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`;
      }
    }

    if (activeProduct && activeProduct.sku === product.sku) {
      updateLightboxTryOnBtn();
    }

    if (elements.tryOnDrawer.classList.contains('active')) {
      renderDrawerItems();
    }
  }

  function updateTryOnBadges() {
    const count = tryOnList.length;
    elements.tryOnCountBadge.textContent = count;
    elements.drawerCount.textContent = count;
  }

  // =========================================================================
  // TRY-ON DRAWER
  // =========================================================================
  function openDrawer() {
    renderDrawerItems();
    elements.tryOnDrawer.classList.add('active');
    elements.tryOnDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    elements.tryOnDrawer.classList.remove('active');
    elements.tryOnDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderDrawerItems() {
    elements.drawerItemsList.innerHTML = '';
    
    if (tryOnList.length === 0) {
      elements.drawerEmptyState.style.display = 'block';
      elements.whatsappShareListBtn.disabled = true;
      elements.whatsappShareListBtn.style.opacity = '0.5';
      return;
    }

    elements.drawerEmptyState.style.display = 'none';
    elements.whatsappShareListBtn.disabled = false;
    elements.whatsappShareListBtn.style.opacity = '1';

    tryOnList.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'drawer-item';
      
      const rentText = item.rent ? `Rent: Rs. ${parseInt(item.rent, 10).toLocaleString()}` : '';
      const metaText = [item.color !== 'Standard' ? item.color : '', item.size !== 'Standard' ? `Size: ${item.size}` : ''].filter(Boolean).join(' • ');

      row.innerHTML = `
        <img src="${escapeHtml(item.primary_image)}" alt="${escapeHtml(item.sku)}" class="drawer-item-img">
        <div class="drawer-item-info">
          <span class="drawer-item-cat">${escapeHtml(item.category_name)}</span>
          <h4 class="drawer-item-sku">${escapeHtml(item.sku)}</h4>
          ${metaText ? `<span class="drawer-item-details">${escapeHtml(metaText)}</span>` : ''}
          ${rentText ? `<span class="drawer-item-rent">${rentText}</span>` : ''}
        </div>
        <button class="drawer-remove-btn" title="Remove item">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      row.querySelector('.drawer-item-img').addEventListener('click', () => {
        closeDrawer();
        const found = catalogData.products.find(p => p.sku === item.sku);
        if (found) openLightbox(found, 0);
      });

      row.querySelector('.drawer-remove-btn').addEventListener('click', () => {
        const found = catalogData.products.find(p => p.sku === item.sku);
        if (found) {
          toggleFavorite(found);
        } else {
          tryOnList.splice(index, 1);
          saveTryOnList();
          renderDrawerItems();
        }
      });

      elements.drawerItemsList.appendChild(row);
    });
  }

  function sendListToWhatsApp() {
    if (tryOnList.length === 0) return;

    let message = `*Nafasat In-Store Fitting Request*\n`;
    message += `Customer would like to try on the following ${tryOnList.length} item(s):\n\n`;
    
    tryOnList.forEach((item, i) => {
      message += `${i + 1}. *${item.sku}* (${item.category_name})`;
      if (item.color && item.color !== 'Standard') message += ` - Color: ${item.color}`;
      if (item.size && item.size !== 'Standard') message += ` - Size: ${item.size}`;
      if (item.rent) message += ` - Rent: Rs. ${item.rent}`;
      message += `\n`;
    });

    message += `\nSent from Nafasat Digital Showroom.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function printOrSaveList() {
    if (tryOnList.length === 0) {
      alert('Please add outfits to your Try-On List first.');
      return;
    }
    window.print();
  }

  function clearTryOnList() {
    if (tryOnList.length === 0) return;
    if (confirm('Are you sure you want to clear your Try-On List?')) {
      tryOnList = [];
      saveTryOnList();
      renderDrawerItems();
      applyFiltersAndSort();
      showToast('Try-On List cleared');
    }
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  let toastTimeout = null;
  function showToast(msg) {
    if (toastTimeout) clearTimeout(toastTimeout);
    elements.toastMessage.textContent = msg;
    elements.toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2400);
  }

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================
  function setupEventListeners() {
    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      elements.clearSearchBtn.style.display = currentSearchQuery ? 'flex' : 'none';
      applyFiltersAndSort();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      currentSearchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      elements.searchInput.focus();
      applyFiltersAndSort();
    });

    // Color Select
    elements.colorSelect.addEventListener('change', (e) => {
      currentColor = e.target.value;
      applyFiltersAndSort();
    });

    // Size Select
    elements.sizeSelect.addEventListener('change', (e) => {
      currentSize = e.target.value;
      applyFiltersAndSort();
    });

    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndSort();
    });

    // Reset All Filters Button
    elements.resetFilterBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      currentSearchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      elements.colorSelect.value = 'all';
      currentColor = 'all';
      elements.sizeSelect.value = 'all';
      currentSize = 'all';
      setCategory('all');
    });

    // Brand Logo click resets to all
    const brandLink = document.getElementById('brandLogoLink');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.resetFilterBtn.click();
      });
    }

    // Category Pill "All"
    const allPill = elements.categoryPills.querySelector('[data-category="all"]');
    if (allPill) {
      allPill.addEventListener('click', () => setCategory('all'));
    }

    // Lightbox Controls
    elements.lightboxCloseBtn.addEventListener('click', closeLightbox);
    elements.lightboxPrevBtn.addEventListener('click', prevPhoto);
    elements.lightboxNextBtn.addEventListener('click', nextPhoto);

    elements.lightboxTryOnBtn.addEventListener('click', () => {
      if (activeProduct) {
        toggleFavorite(activeProduct);
      }
    });

    elements.lightboxModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('lightbox-stage') || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!elements.lightboxModal.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevPhoto();
      else if (e.key === 'ArrowRight') nextPhoto();
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchEndX = 0;
    const stage = document.querySelector('.lightbox-stage');

    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const threshold = 50;
      if (touchEndX < touchStartX - threshold) {
        nextPhoto();
      } else if (touchEndX > touchStartX + threshold) {
        prevPhoto();
      }
    }

    // Drawer Controls
    elements.tryOnDrawerBtn.addEventListener('click', openDrawer);
    elements.drawerCloseBtn.addEventListener('click', closeDrawer);
    elements.drawerOverlay.addEventListener('click', closeDrawer);
    elements.whatsappShareListBtn.addEventListener('click', sendListToWhatsApp);
    elements.printListBtn.addEventListener('click', printOrSaveList);
    elements.clearTryOnListBtn.addEventListener('click', clearTryOnList);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
