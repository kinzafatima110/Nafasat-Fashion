/**
 * NAFASAT FASHION & RENTALS - Digital Showroom Client Engine
 * Luxury boutique catalogue with mannequin dummy framing, live filtering,
 * customer Try-On tray, and multi-angle lightbox.
 */

(function() {
  'use strict';

  // Application State
  let catalogData = { categories: [], products: [], available_colors: [], available_sizes: [] };
  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = 'all';
  let currentColor = 'all';
  let currentSize = 'all';
  let currentSearch = '';
  let currentSort = 'code-asc';
  let activeProduct = null;

  // LocalStorage Try-On Tray State
  const STORAGE_KEY = 'nafasat_tryon_tray_v3';
  const WISHLIST_KEY = 'nafasat_wishlist_v3';
  let tryOnItems = loadFromStorage(STORAGE_KEY, []);
  let wishlistItems = loadFromStorage(WISHLIST_KEY, []);

  // DOM Elements Cache
  const dom = {
    // Search & Inputs
    itemSearchInput: document.getElementById('itemSearchInput'),
    headerSearchInput: document.getElementById('headerSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    colorFilter: document.getElementById('colorFilter'),
    sizeFilter: document.getElementById('sizeFilter'),
    sortFilter: document.getElementById('sortFilter'),
    
    // Category Nav & Pills
    categoryPills: document.querySelectorAll('.category-pill'),
    headerNavBtns: document.querySelectorAll('.nav-cat-btn'),
    footerNavBtns: document.querySelectorAll('.nav-footer-cat'),
    currentCategoryName: document.getElementById('current-category-name'),
    visibleCount: document.getElementById('visible-count'),
    resetAllFiltersBtn: document.getElementById('resetAllFiltersBtn'),
    emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),

    // Grid Containers
    catalogGrid: document.getElementById('catalogGrid'),
    loadingState: document.getElementById('loadingState'),
    noResultsState: document.getElementById('noResultsState'),

    // Try-On Floating Tray
    floatingTryOnTray: document.getElementById('floatingTryOnTray'),
    trayHeaderToggle: document.getElementById('trayHeaderToggle'),
    trayExpandedContent: document.getElementById('trayExpandedContent'),
    trayChevron: document.getElementById('trayChevron'),
    trayBadgeCount: document.getElementById('trayBadgeCount'),
    bannerCount: document.getElementById('bannerCount'),
    headerTryOnCount: document.getElementById('headerTryOnCount'),
    trayItemsList: document.getElementById('trayItemsList'),
    clearTrayListBtn: document.getElementById('clearTrayListBtn'),
    dispatchFittingRoomBtn: document.getElementById('dispatchFittingRoomBtn'),
    sendWhatsappBtn: document.getElementById('sendWhatsappBtn'),
    quickTryOnToggle: document.getElementById('quick-tryon-toggle'),
    headerTryOnBtn: document.getElementById('headerTryOnBtn'),

    // Angles Modal
    anglesModal: document.getElementById('anglesModal'),
    closeAnglesModal: document.getElementById('closeAnglesModal'),
    modalSkuCode: document.getElementById('modalSkuCode'),
    modalTitle: document.getElementById('modalTitle'),
    modalAnglesGrid: document.getElementById('modalAnglesGrid'),
    modalRateDetails: document.getElementById('modalRateDetails'),
    modalAddTryOn: document.getElementById('modalAddTryOn'),
    modalWhatsappInquire: document.getElementById('modalWhatsappInquire'),

    // Toast
    toast: document.getElementById('toastNotification'),
    toastMsg: document.getElementById('toastMessage')
  };

  // Color Swatch Helper
  function getColorDot(color) {
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
    return map[color] || '#888888';
  }

  // Price Formatter
  function formatRent(val) {
    if (!val) return 'Inquire for Rent';
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    if (!num || isNaN(num)) return 'Inquire for Rent';
    return `Rs. ${num.toLocaleString()}`;
  }

  function formatDeposit(val) {
    if (!val) return 'Standard Deposit';
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    if (!num || isNaN(num)) return 'Standard Deposit';
    return `Rs. ${num.toLocaleString()} (Refundable)`;
  }

  // Storage Helpers
  function loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveToStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  // Toast Notification
  let toastTimer = null;
  function showToast(text) {
    if (!dom.toast || !dom.toastMsg) return;
    if (toastTimer) clearTimeout(toastTimer);

    dom.toastMsg.textContent = text;
    dom.toast.classList.remove('translate-y-16', 'opacity-0', 'pointer-events-none');
    dom.toast.classList.add('translate-y-0', 'opacity-100');

    toastTimer = setTimeout(() => {
      dom.toast.classList.add('translate-y-16', 'opacity-0', 'pointer-events-none');
      dom.toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2500);
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  async function init() {
    setupEventListeners();
    updateTrayUI();

    try {
      const res = await fetch('data/products.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      catalogData = await res.json();
      allProducts = catalogData.products || [];

      // Populate filter dropdowns
      populateDropdowns();

      // Update category pill count numbers
      updateCategoryCounts();

      // Render cards
      applyFiltersAndSort();

      // Reveal grid
      if (dom.loadingState) dom.loadingState.classList.add('hidden');
      if (dom.catalogGrid) dom.catalogGrid.classList.remove('hidden');

    } catch (err) {
      console.error('Failed to load catalogue data:', err);
      if (dom.loadingState) {
        dom.loadingState.innerHTML = `
          <span class="material-symbols-outlined text-[44px] text-red-600 mb-2">warning</span>
          <h3 class="font-headline-sm text-on-surface font-semibold">Unable to load catalogue</h3>
          <p class="font-body-sm text-on-surface-variant mt-1">Please reload the page or check your connection.</p>
        `;
      }
    }
  }

  // =========================================================================
  // DROPDOWNS POPULATION
  // =========================================================================
  function populateDropdowns() {
    // Populate Colors
    if (dom.colorFilter) {
      dom.colorFilter.innerHTML = '<option value="all">Color: All</option>';
      const colors = catalogData.available_colors || [
        "Red & Maroon", "Pink & Peach", "Blue & Ferozi", "Green & Emerald",
        "Gold & Yellow", "White & Silver", "Black", "Purple & Plum", "Multi & Other"
      ];
      colors.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        dom.colorFilter.appendChild(opt);
      });
    }

    // Populate Sizes
    if (dom.sizeFilter) {
      dom.sizeFilter.innerHTML = '<option value="all">Size: All</option>';
      const sizes = catalogData.available_sizes || [
        "XS", "Small", "Medium", "Large", "XL", "Kids", "Free Size"
      ];
      sizes.forEach(sz => {
        const opt = document.createElement('option');
        opt.value = sz;
        opt.textContent = sz;
        dom.sizeFilter.appendChild(opt);
      });
    }
  }

  function updateCategoryCounts() {
    const counts = { all: allProducts.length };
    allProducts.forEach(p => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });

    Object.keys(counts).forEach(catId => {
      const el = document.getElementById(`count-${catId}`);
      if (el) el.textContent = counts[catId];
    });
  }

  // =========================================================================
  // FILTER & SORT ENGINE
  // =========================================================================
  function applyFiltersAndSort() {
    const q = currentSearch.toLowerCase().trim();

    filteredProducts = allProducts.filter(p => {
      // Category check
      if (currentCategory !== 'all' && p.category_id !== currentCategory) {
        return false;
      }

      // Color check
      if (currentColor !== 'all') {
        const pStdCol = (p.standard_color || '').toLowerCase();
        const pRawCol = (p.color || '').toLowerCase();
        const targetCol = currentColor.toLowerCase();
        if (pStdCol !== targetCol && !pRawCol.includes(targetCol)) {
          return false;
        }
      }

      // Size check
      if (currentSize !== 'all') {
        const pStdSz = (p.standard_size || '').toLowerCase();
        const pRawSz = (p.size || '').toLowerCase();
        const targetSz = currentSize.toLowerCase();
        if (pStdSz !== targetSz && !pRawSz.includes(targetSz)) {
          return false;
        }
      }

      // Search query check
      if (q) {
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchCol = (p.color || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchCat = (p.category_name || '').toLowerCase().includes(q);
        if (!matchSku && !matchTitle && !matchCol && !matchDesc && !matchCat) {
          return false;
        }
      }

      return true;
    });

    // Curated Category Priority so Bridal Wear and Party Wear dresses appear first
    const categoryPriority = {
      'rental-bridal': 1,
      'female-partywear': 2,
      'kids-rental': 3,
      'saree': 4,
      'kids-coatpant': 5,
      'jewelry': 6,
      'purses': 7,
      'shoes': 8
    };

    // Sort
    if (currentSort === 'rent-low') {
      filteredProducts.sort((a, b) => {
        const ra = Number(String(a.rent || 0).replace(/[^0-9]/g, '')) || 999999;
        const rb = Number(String(b.rent || 0).replace(/[^0-9]/g, '')) || 999999;
        return ra - rb;
      });
    } else if (currentSort === 'rent-high') {
      filteredProducts.sort((a, b) => {
        const ra = Number(String(a.rent || 0).replace(/[^0-9]/g, '')) || 0;
        const rb = Number(String(b.rent || 0).replace(/[^0-9]/g, '')) || 0;
        return rb - ra;
      });
    } else if (currentSort === 'code-desc') {
      filteredProducts.sort((a, b) => (b.sku || '').localeCompare(a.sku || ''));
    } else {
      // Default: prioritize dresses (Bridal & Party wear) first, then SKU
      filteredProducts.sort((a, b) => {
        const pa = categoryPriority[a.category_id] || 99;
        const pb = categoryPriority[b.category_id] || 99;
        if (pa !== pb) return pa - pb;
        return (a.sku || '').localeCompare(b.sku || '');
      });
    }

    // Update Counter Ribbon
    if (dom.visibleCount) dom.visibleCount.textContent = filteredProducts.length;

    // Render cards
    renderProductCards(filteredProducts);
  }

  // =========================================================================
  // CARD RENDERER (Intelligent Dummy Anchoring & Perfectly Aligned Grid)
  // =========================================================================
  function renderProductCards(products) {
    const grid = dom.catalogGrid;
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = '';
      if (dom.noResultsState) dom.noResultsState.classList.remove('hidden');
      return;
    }

    if (dom.noResultsState) dom.noResultsState.classList.add('hidden');

    // Render cards (virtualized to first 100 for instantaneous DOM performance)
    const cardsToRender = products.slice(0, 100);

    const cardsHtml = cardsToRender.map(p => {
      const isWishlisted = wishlistItems.includes(p.sku);
      const anglesCount = p.images ? p.images.length : 1;
      const primaryImg = p.primary_image || (p.images && p.images[0]) || 'assets/logo.png';
      const rentText = formatRent(p.rent);
      const depositText = formatDeposit(p.deposit);
      const colorDot = getColorDot(p.standard_color);

      // Distinguish apparel (with dummy/mannequin) from accessories
      const isApparel = ['rental-bridal', 'female-partywear', 'saree', 'kids-rental', 'kids-coatpant'].includes(p.category_id);
      let catBadgeIcon = 'accessibility_new';
      let catBadgeText = 'Mannequin';
      if (!isApparel) {
        if (p.category_id === 'shoes') {
          catBadgeIcon = 'footprint';
          catBadgeText = 'Footwear';
        } else if (p.category_id === 'purses') {
          catBadgeIcon = 'shopping_bag';
          catBadgeText = 'Clutch';
        } else if (p.category_id === 'jewelry') {
          catBadgeIcon = 'diamond';
          catBadgeText = 'Jewelry';
        }
      }

      return `
        <article class="garment-card group bg-surface-card rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(31,36,33,0.04)] hover:shadow-md transition-all duration-300 flex flex-col border border-border-hairline h-full" data-sku="${p.sku}">
          
          <!-- Top Media Stage: Tall 3/4 with Dummy anchored to top -->
          <div class="relative w-full aspect-[3/4] bg-surface-container-high overflow-hidden cursor-pointer open-angles-trigger shrink-0" data-sku="${p.sku}">
            <img class="w-full h-full card-dummy-img group-hover:scale-105 transition-transform duration-500" 
                 src="${primaryImg}" 
                 alt="${p.title}" 
                 loading="lazy" 
                 onerror="this.src='assets/logo.png'"/>
            
            <!-- Top Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              <span class="font-label-code text-label-code bg-on-background/90 backdrop-blur-sm text-on-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                ${p.sku}
              </span>
              <span class="inline-flex items-center gap-1 font-label-code text-label-code ${isApparel ? 'bg-brand-gold-deep/90 text-on-primary' : 'bg-surface-card/90 text-on-surface'} backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
                <span class="material-symbols-outlined text-[12px]">${catBadgeIcon}</span> ${catBadgeText}
              </span>
            </div>

            <!-- Top Right Heart Wishlist Button -->
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
              <button class="wishlist-btn w-8 h-8 rounded-full bg-surface-card/90 backdrop-blur-sm text-on-surface flex items-center justify-center hover:bg-surface-card hover:text-brand-coral transition-colors shadow-sm" data-sku="${p.sku}" title="Save to Favorites">
                <span class="material-symbols-outlined text-[18px] ${isWishlisted ? 'text-brand-coral' : ''}" style="${isWishlisted ? "font-variation-settings: 'FILL' 1;" : ''}">favorite</span>
              </button>
            </div>

            <!-- Bottom Image Overlay: Photo Count -->
            <div class="absolute bottom-2.5 right-3">
              <span class="font-label-code text-label-code bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]">photo_camera</span> 1 of ${anglesCount} Angles
              </span>
            </div>
          </div>

          <!-- Card Body Details: Perfectly flex-grow and justify-between -->
          <div class="p-4 flex flex-col flex-grow justify-between gap-3">
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between text-on-surface-variant font-label-code text-label-code uppercase tracking-wider">
                <span class="truncate max-w-[150px]">${p.category_name || 'Boutique Collection'}</span>
                <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px] shrink-0">Available</span>
              </div>
              
              <h3 class="font-headline-sm text-[16px] leading-snug text-on-surface font-semibold line-clamp-1 group-hover:text-primary transition-colors cursor-pointer open-angles-trigger" data-sku="${p.sku}">
                ${p.title}
              </h3>
              
              <div class="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm text-[12px]">
                <span class="flex items-center gap-1 shrink-0">
                  <span class="material-symbols-outlined text-[14px]">straighten</span> ${p.size || p.standard_size || 'Free Size'}
                </span>
                <span>•</span>
                <span class="flex items-center gap-1 truncate">
                  <span class="inline-block w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${colorDot};"></span>
                  <span class="truncate">${p.color || p.standard_color || 'Standard'}</span>
                </span>
              </div>
            </div>

            <!-- Pricing Box: Clean, structured 2-row layout with zero text squishing -->
            <div class="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5 border border-border-hairline/60">
              <div class="flex items-center justify-between">
                <span class="font-label-code text-[10px] text-on-surface-variant uppercase tracking-wider shrink-0">Rental Rate</span>
                <div class="flex items-baseline gap-1">
                  <span class="font-headline-sm text-[15px] text-primary font-bold leading-none">${rentText}</span>
                  ${p.rent ? '<span class="font-body-sm text-[11px] text-on-surface-variant">/ 3 Days</span>' : ''}
                </div>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-border-hairline/40 text-[11px]">
                <span class="font-label-code text-[10px] text-on-surface-variant uppercase tracking-wider shrink-0">Security Deposit</span>
                <span class="font-label-md text-[11px] text-on-surface font-medium">${depositText}</span>
              </div>
            </div>

            <!-- CTA Action Buttons: Pinned to bottom with mt-auto for a straight alignment line -->
            <div class="grid grid-cols-2 gap-2 pt-1 mt-auto">
              <button class="view-angles-btn flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors" data-sku="${p.sku}">
                <span class="material-symbols-outlined text-[16px]">visibility</span>
                <span>Angles (${anglesCount})</span>
              </button>
              
              <button class="add-tryon-btn flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-container font-label-md text-label-md shadow-sm transition-all" data-sku="${p.sku}">
                <span class="material-symbols-outlined text-[16px]">styler</span>
                <span>+ Try-On</span>
              </button>
            </div>

          </div>

        </article>
      `;
    }).join('');

    grid.innerHTML = cardsHtml;
    attachCardListeners();
  }

  // =========================================================================
  // CARD EVENT LISTENERS
  // =========================================================================
  function attachCardListeners() {
    // Open Angles Trigger (Image click or title click or button click)
    document.querySelectorAll('.open-angles-trigger, .view-angles-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const sku = el.getAttribute('data-sku');
        openAnglesModal(sku);
      });
    });

    // Add to Try-On Button
    document.querySelectorAll('.add-tryon-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sku = btn.getAttribute('data-sku');
        addToTryOn(sku);
      });
    });

    // Wishlist Toggle
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sku = btn.getAttribute('data-sku');
        toggleWishlist(sku, btn);
      });
    });
  }

  // =========================================================================
  // TRY-ON TRAY LOGIC
  // =========================================================================
  function addToTryOn(sku) {
    const product = allProducts.find(p => p.sku === sku);
    if (!product) return;

    const existingIdx = tryOnItems.findIndex(item => item.sku === sku);
    if (existingIdx === -1) {
      tryOnItems.push({
        sku: product.sku,
        title: product.title,
        rent: formatRent(product.rent),
        image: product.primary_image || (product.images && product.images[0]) || 'assets/logo.png',
        category: product.category_name || 'Outfit'
      });
      saveToStorage(STORAGE_KEY, tryOnItems);
      updateTrayUI();
      showToast(`✨ Added "${product.sku}" to Fitting Tray`);
      
      // Auto expand tray on first add
      if (dom.trayExpandedContent && dom.trayExpandedContent.classList.contains('hidden')) {
        dom.trayExpandedContent.classList.remove('hidden');
        if (dom.trayChevron) dom.trayChevron.textContent = 'expand_less';
      }
    } else {
      showToast(`"${product.sku}" is already in your Tray`);
    }
  }

  function removeFromTryOn(sku) {
    tryOnItems = tryOnItems.filter(item => item.sku !== sku);
    saveToStorage(STORAGE_KEY, tryOnItems);
    updateTrayUI();
    showToast(`Removed from fitting tray`);
  }

  function updateTrayUI() {
    const count = tryOnItems.length;
    if (dom.trayBadgeCount) dom.trayBadgeCount.textContent = count;
    if (dom.bannerCount) dom.bannerCount.textContent = count;
    if (dom.headerTryOnCount) dom.headerTryOnCount.textContent = count;

    if (!dom.trayItemsList) return;

    if (count === 0) {
      dom.trayItemsList.innerHTML = `
        <div class="py-6 text-center text-on-surface-variant font-body-sm text-body-sm">
          <span class="material-symbols-outlined text-[28px] text-on-surface-variant/50 mb-1 block">dresser</span>
          Your Try-On tray is currently empty.<br>Tap <strong>+ Try-On</strong> on any dress to request it for fitting.
        </div>
      `;
      return;
    }

    dom.trayItemsList.innerHTML = tryOnItems.map(item => `
      <div class="tray-item flex items-center justify-between pt-2 first:pt-0" data-sku="${item.sku}">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-12 bg-surface-container-high rounded overflow-hidden shrink-0">
            <img class="w-full h-full object-cover card-dummy-img" src="${item.image}" alt="${item.sku}" onerror="this.src='assets/logo.png'"/>
          </div>
          <div class="flex flex-col">
            <span class="font-label-md text-label-md text-on-surface font-semibold line-clamp-1">${item.title}</span>
            <span class="font-label-code text-[10px] text-on-surface-variant uppercase">${item.sku} • ${item.rent}</span>
          </div>
        </div>
        <button class="remove-tray-item text-on-surface-variant hover:text-brand-coral p-1 transition-colors" data-sku="${item.sku}" title="Remove">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    `).join('');

    // Wire remove buttons
    dom.trayItemsList.querySelectorAll('.remove-tray-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sku = btn.getAttribute('data-sku');
        removeFromTryOn(sku);
      });
    });
  }

  // =========================================================================
  // WISHLIST TOGGLE
  // =========================================================================
  function toggleWishlist(sku, btnEl) {
    const icon = btnEl.querySelector('.material-symbols-outlined');
    const idx = wishlistItems.indexOf(sku);

    if (idx === -1) {
      wishlistItems.push(sku);
      saveToStorage(WISHLIST_KEY, wishlistItems);
      if (icon) {
        icon.classList.add('text-brand-coral');
        icon.style.fontVariationSettings = "'FILL' 1";
      }
      showToast(`Saved ${sku} to personal favorites`);
    } else {
      wishlistItems.splice(idx, 1);
      saveToStorage(WISHLIST_KEY, wishlistItems);
      if (icon) {
        icon.classList.remove('text-brand-coral');
        icon.style.fontVariationSettings = "'FILL' 0";
      }
      showToast(`Removed from favorites`);
    }
  }

  // =========================================================================
  // MULTI-ANGLE MODAL / LIGHTBOX
  // =========================================================================
  function openAnglesModal(sku) {
    const product = allProducts.find(p => p.sku === sku);
    if (!product) return;
    activeProduct = product;

    if (dom.modalSkuCode) dom.modalSkuCode.textContent = product.sku;
    if (dom.modalTitle) dom.modalTitle.textContent = product.title;
    if (dom.modalRateDetails) {
      dom.modalRateDetails.textContent = `Rental: ${formatRent(product.rent)} / 3 Days • Deposit: ${formatDeposit(product.deposit)}`;
    }

    // Set WhatsApp link
    if (dom.modalWhatsappInquire) {
      const msg = encodeURIComponent(`Hello Nafasat, I am interested in renting ${product.sku} (${product.title}). Rental: ${formatRent(product.rent)}.`);
      dom.modalWhatsappInquire.href = `https://wa.me/923000000000?text=${msg}`;
    }

    // Populate images grid
    if (dom.modalAnglesGrid) {
      const images = (product.images && product.images.length > 0) ? product.images : [product.primary_image || 'assets/logo.png'];
      
      dom.modalAnglesGrid.innerHTML = images.map((imgUrl, index) => {
        const label = index === 0 ? 'Primary Mannequin' : `Angle ${index + 1}`;
        return `
          <div class="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden relative border border-border-hairline shadow-sm">
            <img class="w-full h-full object-cover card-dummy-img" src="${imgUrl}" alt="${product.sku} Angle ${index + 1}" loading="lazy" onerror="this.src='assets/logo.png'"/>
            <span class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full font-label-code flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">camera</span> ${label}
            </span>
          </div>
        `;
      }).join('');
    }

    if (dom.anglesModal) dom.anglesModal.classList.remove('hidden');
  }

  function closeAnglesModal() {
    if (dom.anglesModal) dom.anglesModal.classList.add('hidden');
    activeProduct = null;
  }

  // =========================================================================
  // EVENT LISTENERS SETUP
  // =========================================================================
  function setupEventListeners() {
    // Search input (Debounced)
    let searchTimer = null;
    function handleSearch(val) {
      currentSearch = val;
      if (dom.itemSearchInput && dom.itemSearchInput.value !== val) {
        dom.itemSearchInput.value = val;
      }
      if (dom.headerSearchInput && dom.headerSearchInput.value !== val) {
        dom.headerSearchInput.value = val;
      }
      if (dom.clearSearchBtn) {
        if (val.length > 0) dom.clearSearchBtn.classList.remove('hidden');
        else dom.clearSearchBtn.classList.add('hidden');
      }
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFiltersAndSort, 200);
    }

    dom.itemSearchInput?.addEventListener('input', (e) => handleSearch(e.target.value));
    dom.headerSearchInput?.addEventListener('input', (e) => handleSearch(e.target.value));

    dom.clearSearchBtn?.addEventListener('click', () => {
      handleSearch('');
    });

    // Dropdowns
    dom.colorFilter?.addEventListener('change', (e) => {
      currentColor = e.target.value;
      applyFiltersAndSort();
    });

    dom.sizeFilter?.addEventListener('change', (e) => {
      currentSize = e.target.value;
      applyFiltersAndSort();
    });

    dom.sortFilter?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndSort();
    });

    // Category Pills
    dom.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.getAttribute('data-category');
        selectCategory(cat);
      });
    });

    // Header Nav Category Buttons
    dom.headerNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        selectCategory(cat);
      });
    });

    // Footer Nav Category Links
    dom.footerNavBtns.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.getAttribute('data-category');
        selectCategory(cat);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      });
    });

    // Reset Filters
    function resetFilters() {
      currentSearch = '';
      currentColor = 'all';
      currentSize = 'all';
      currentSort = 'code-asc';
      if (dom.itemSearchInput) dom.itemSearchInput.value = '';
      if (dom.headerSearchInput) dom.headerSearchInput.value = '';
      if (dom.clearSearchBtn) dom.clearSearchBtn.classList.add('hidden');
      if (dom.colorFilter) dom.colorFilter.value = 'all';
      if (dom.sizeFilter) dom.sizeFilter.value = 'all';
      if (dom.sortFilter) dom.sortFilter.value = 'code-asc';
      selectCategory('all');
    }

    dom.resetAllFiltersBtn?.addEventListener('click', resetFilters);
    dom.emptyStateResetBtn?.addEventListener('click', resetFilters);

    // Floating Tray Collapsible Header
    function toggleTray() {
      if (!dom.trayExpandedContent) return;
      const isHidden = dom.trayExpandedContent.classList.contains('hidden');
      if (isHidden) {
        dom.trayExpandedContent.classList.remove('hidden');
        if (dom.trayChevron) dom.trayChevron.textContent = 'expand_less';
      } else {
        dom.trayExpandedContent.classList.add('hidden');
        if (dom.trayChevron) dom.trayChevron.textContent = 'expand_more';
      }
    }

    dom.trayHeaderToggle?.addEventListener('click', toggleTray);
    dom.quickTryOnToggle?.addEventListener('click', () => {
      if (dom.trayExpandedContent?.classList.contains('hidden')) toggleTray();
      dom.floatingTryOnTray?.scrollIntoView({ behavior: 'smooth' });
    });
    dom.headerTryOnBtn?.addEventListener('click', () => {
      if (dom.trayExpandedContent?.classList.contains('hidden')) toggleTray();
      dom.floatingTryOnTray?.scrollIntoView({ behavior: 'smooth' });
    });

    // Clear Tray
    dom.clearTrayListBtn?.addEventListener('click', () => {
      tryOnItems = [];
      saveToStorage(STORAGE_KEY, tryOnItems);
      updateTrayUI();
      showToast('Fitting room tray cleared');
    });

    // Dispatch Fitting Room
    dom.dispatchFittingRoomBtn?.addEventListener('click', () => {
      if (tryOnItems.length === 0) {
        showToast('Please select at least 1 ensemble first');
        return;
      }
      showToast('🚀 Notified In-Store Stylist! Booths 1-6 assigned.');
    });

    // Send WhatsApp to Stylist
    dom.sendWhatsappBtn?.addEventListener('click', () => {
      if (tryOnItems.length === 0) {
        showToast('Please add items to your tray first');
        return;
      }
      const summary = tryOnItems.map((item, idx) => `${idx + 1}. ${item.sku} - ${item.title} (${item.rent})`).join('\n');
      const text = encodeURIComponent(`Hello Nafasat Boutique Assistant! I would like to try on the following shortlisted dresses in the fitting room:\n\n${summary}\n\nPlease bring them to my booth.`);
      window.open(`https://wa.me/923000000000?text=${text}`, '_blank');
    });

    // Modal Events
    dom.closeAnglesModal?.addEventListener('click', closeAnglesModal);
    dom.anglesModal?.addEventListener('click', (e) => {
      if (e.target === dom.anglesModal) closeAnglesModal();
    });

    dom.modalAddTryOn?.addEventListener('click', () => {
      if (activeProduct) {
        addToTryOn(activeProduct.sku);
        closeAnglesModal();
      }
    });

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.anglesModal && !dom.anglesModal.classList.contains('hidden')) {
        closeAnglesModal();
      }
    });
  }

  function selectCategory(cat) {
    currentCategory = cat;

    // Update Category Pills Active Class
    dom.categoryPills.forEach(pill => {
      if (pill.getAttribute('data-category') === cat) {
        pill.classList.remove('bg-surface-card', 'text-on-surface-variant');
        pill.classList.add('bg-on-background', 'text-on-primary', 'shadow-sm');
      } else {
        pill.classList.remove('bg-on-background', 'text-on-primary', 'shadow-sm');
        pill.classList.add('bg-surface-card', 'text-on-surface-variant');
      }
    });

    // Update Header Nav Active Links
    dom.headerNavBtns.forEach(btn => {
      if (btn.getAttribute('data-category') === cat) {
        btn.classList.add('text-primary', 'font-bold');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('text-primary', 'font-bold');
        btn.classList.add('text-on-surface-variant');
      }
    });

    // Update Banner Title Text
    const activePill = document.querySelector(`.category-pill[data-category="${cat}"]`);
    if (activePill && dom.currentCategoryName) {
      const text = activePill.textContent.trim().replace(/[^\w\s&]/gi, '').trim();
      dom.currentCategoryName.textContent = text;
    }

    applyFiltersAndSort();
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
