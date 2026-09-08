/**
 * NAFASAT FASHION & RENTALS - Admin Portal Controller
 * Handles authentication, outfit image uploads, real-time catalogue updates, and inventory controls.
 */

(function() {
  'use strict';

  // State
  let adminState = {
    isLoggedIn: false,
    username: '',
    totalItems: 0,
    categories: [],
    selectedDummyFile: null,
    selectedAngleFiles: [],
    allProducts: []
  };

  // Color Mapping Helper
  const colorMap = [
    { keys: ['red', 'maroon', 'ruby', 'crimson', 'rust', 'burgundy', 'wine'], group: 'Red & Maroon' },
    { keys: ['pink', 'peach', 'blush', 'rose', 'coral', 'magenta', 'fuchsia'], group: 'Pink & Peach' },
    { keys: ['blue', 'ferozi', 'navy', 'sky', 'teal', 'royal'], group: 'Blue & Ferozi' },
    { keys: ['green', 'dhani', 'bottle', 'sea green', 'mint', 'emerald', 'olive'], group: 'Green & Emerald' },
    { keys: ['yellow', 'gold', 'mustard', 'lemon', 'fone', 'khaki', 'tan', 'beige'], group: 'Gold & Yellow' },
    { keys: ['white', 'silver', 'ivory', 'off white', 'skin', 'zinc', 'cream', 'grey', 'gray'], group: 'White & Silver' },
    { keys: ['black'], group: 'Black' },
    { keys: ['purple', 'plum', 'violet', 'lavender', 'lilac'], group: 'Purple & Plum' }
  ];

  // Size Mapping Helper
  function guessStandardSize(val) {
    if (!val) return 'Medium';
    const s = val.toLowerCase().trim();
    if (s.includes('xs') || s.includes('extra small')) return 'XS';
    if (s.includes('small') || s === 's' || s.includes('36')) return 'Small';
    if (s.includes('med') || s === 'm' || s.includes('38')) return 'Medium';
    if (s.includes('large') || s === 'l' || s.includes('40')) return 'Large';
    if (s.includes('xl') || s.includes('xxl') || s.includes('42')) return 'XL';
    if (s.includes('kid') || /\b(24|26|28|30|32|34)\b/.test(s)) return 'Kids';
    return 'Free Size';
  }

  // DOM Elements Cache
  const dom = {
    loginSection: document.getElementById('loginSection'),
    dashboardSection: document.getElementById('dashboardSection'),
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginSubmitBtn: document.getElementById('loginSubmitBtn'),
    loginError: document.getElementById('loginError'),
    loginErrorText: document.getElementById('loginErrorText'),
    adminLogoutBtn: document.getElementById('adminLogoutBtn'),
    
    // Stats
    statTotalItems: document.getElementById('statTotalItems'),
    statTotalCategories: document.getElementById('statTotalCategories'),
    tabCountBadge: document.getElementById('tabCountBadge'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Add Outfit Form
    addOutfitForm: document.getElementById('addOutfitForm'),
    outfitCategory: document.getElementById('outfitCategory'),
    outfitSku: document.getElementById('outfitSku'),
    outfitColor: document.getElementById('outfitColor'),
    outfitStdColor: document.getElementById('outfitStdColor'),
    outfitSize: document.getElementById('outfitSize'),
    outfitStdSize: document.getElementById('outfitStdSize'),
    outfitRent: document.getElementById('outfitRent'),
    outfitDeposit: document.getElementById('outfitDeposit'),
    outfitDescription: document.getElementById('outfitDescription'),
    resetOutfitFormBtn: document.getElementById('resetOutfitFormBtn'),
    submitOutfitBtn: document.getElementById('submitOutfitBtn'),

    // Dropzones
    dummyDropzone: document.getElementById('dummyDropzone'),
    dummyImageInput: document.getElementById('dummyImageInput'),
    dummyDropzoneEmpty: document.getElementById('dummyDropzoneEmpty'),
    dummyDropzonePreview: document.getElementById('dummyDropzonePreview'),
    dummyPreviewImg: document.getElementById('dummyPreviewImg'),
    dummyFileName: document.getElementById('dummyFileName'),
    removeDummyBtn: document.getElementById('removeDummyBtn'),

    anglesDropzone: document.getElementById('anglesDropzone'),
    angleImagesInput: document.getElementById('angleImagesInput'),
    anglesDropzoneEmpty: document.getElementById('anglesDropzoneEmpty'),
    anglesPreviewGrid: document.getElementById('anglesPreviewGrid'),

    // Progress
    uploadProgress: document.getElementById('uploadProgress'),
    uploadProgressBar: document.getElementById('uploadProgressBar'),
    uploadProgressText: document.getElementById('uploadProgressText'),

    // Manage Table
    adminSearchInput: document.getElementById('adminSearchInput'),
    adminCategoryFilter: document.getElementById('adminCategoryFilter'),
    adminProductsTableBody: document.getElementById('adminProductsTableBody'),
    tableCountSummary: document.getElementById('tableCountSummary'),

    // Confirm Modal
    confirmModal: document.getElementById('confirmModal'),
    confirmModalMessage: document.getElementById('confirmModalMessage'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    confirmProceedBtn: document.getElementById('confirmProceedBtn'),

    // Toast
    adminToast: document.getElementById('adminToast'),
    toastIcon: document.getElementById('toastIcon'),
    adminToastMsg: document.getElementById('adminToastMsg')
  };

  let pendingDeleteSku = null;

  // =========================================================================
  // INITIALIZATION & SESSION CHECK
  // =========================================================================
  async function init() {
    setupEventListeners();
    await checkAuthStatus();
  }

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      
      if (data.logged_in) {
        setLoggedInState(true, data.username);
        updateDashboardStats(data);
        loadInventoryTable();
      } else {
        setLoggedInState(false);
      }
    } catch (e) {
      console.warn('Backend status check failed:', e);
      setLoggedInState(false);
    }
  }

  function setLoggedInState(isLoggedIn, username = '') {
    adminState.isLoggedIn = isLoggedIn;
    adminState.username = username;

    if (isLoggedIn) {
      dom.loginSection.classList.add('hidden');
      dom.dashboardSection.classList.remove('hidden');
      dom.adminLogoutBtn.classList.remove('hidden');
    } else {
      dom.loginSection.classList.remove('hidden');
      dom.dashboardSection.classList.add('hidden');
      dom.adminLogoutBtn.classList.add('hidden');
    }
  }

  function updateDashboardStats(data) {
    adminState.totalItems = data.total_items || 0;
    adminState.categories = data.categories || [];

    if (dom.statTotalItems) dom.statTotalItems.textContent = adminState.totalItems;
    if (dom.tabCountBadge) dom.tabCountBadge.textContent = adminState.totalItems;
    if (dom.statTotalCategories) dom.statTotalCategories.textContent = (data.categories ? data.categories.length : 9);
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  let toastTimer = null;
  function showToast(message, type = 'success') {
    if (toastTimer) clearTimeout(toastTimer);
    
    dom.adminToastMsg.textContent = message;
    dom.adminToast.className = 'admin-toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
    dom.toastIcon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    dom.adminToast.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      dom.adminToast.classList.add('hidden');
    }, 4000);
  }

  // =========================================================================
  // EVENT LISTENERS SETUP
  // =========================================================================
  function setupEventListeners() {
    // Login Submit
    dom.loginForm.addEventListener('submit', handleLogin);

    // Logout Click
    dom.adminLogoutBtn.addEventListener('click', handleLogout);

    // Tab Navigation
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        dom.tabBtns.forEach(b => b.classList.remove('active'));
        dom.tabPanes.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const activePane = document.getElementById(targetTab);
        if (activePane) activePane.classList.add('active');

        if (targetTab === 'manageOutfitsTab') {
          loadInventoryTable();
        }
      });
    });

    // Color Auto-Suggest Standard Group
    dom.outfitColor.addEventListener('input', (e) => {
      const text = e.target.value.toLowerCase();
      for (const item of colorMap) {
        if (item.keys.some(k => text.includes(k))) {
          dom.outfitStdColor.value = item.group;
          break;
        }
      }
    });

    // Size Auto-Suggest
    dom.outfitSize.addEventListener('input', (e) => {
      const text = e.target.value;
      dom.outfitStdSize.value = guessStandardSize(text);
    });

    // Dummy Image Dropzone
    setupDummyDropzone();

    // Additional Angles Dropzone
    setupAnglesDropzone();

    // Add Outfit Form Submit
    dom.addOutfitForm.addEventListener('submit', handleAddOutfit);

    // Reset Form
    dom.resetOutfitFormBtn.addEventListener('click', resetUploadForm);

    // Inventory Table Filter & Search
    let searchDebounce = null;
    dom.adminSearchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(filterInventoryTable, 250);
    });
    dom.adminCategoryFilter.addEventListener('change', filterInventoryTable);

    // Confirm Modal Cancel & Proceed
    dom.confirmCancelBtn.addEventListener('click', () => {
      dom.confirmModal.classList.add('hidden');
      pendingDeleteSku = null;
    });

    dom.confirmProceedBtn.addEventListener('click', executeDeleteItem);
  }

  // =========================================================================
  // AUTHENTICATION HANDLERS
  // =========================================================================
  async function handleLogin(e) {
    e.preventDefault();
    dom.loginError.classList.add('hidden');
    dom.loginSubmitBtn.disabled = true;
    dom.loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

    const username = dom.usernameInput.value.trim();
    const password = dom.passwordInput.value.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Welcome to Nafasat Admin Dashboard!');
        dom.passwordInput.value = '';
        await checkAuthStatus();
      } else {
        dom.loginErrorText.textContent = data.error || 'Invalid username or password';
        dom.loginError.classList.remove('hidden');
      }
    } catch (err) {
      dom.loginErrorText.textContent = 'Server connection error. Please try again.';
      dom.loginError.classList.remove('hidden');
    } finally {
      dom.loginSubmitBtn.disabled = false;
      dom.loginSubmitBtn.innerHTML = '<span>Sign In to Dashboard</span> <i class="fa-solid fa-arrow-right"></i>';
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setLoggedInState(false);
      showToast('Logged out successfully.');
    } catch (e) {
      setLoggedInState(false);
    }
  }

  // =========================================================================
  // DROPZONE 1: PRIMARY DUMMY / MANNEQUIN PHOTO
  // =========================================================================
  function setupDummyDropzone() {
    const dz = dom.dummyDropzone;
    const input = dom.dummyImageInput;

    dz.addEventListener('click', (e) => {
      if (e.target.closest('#removeDummyBtn')) return;
      input.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        dz.classList.add('dropzone-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        dz.classList.remove('dropzone-dragover');
      });
    });

    dz.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        setDummyFile(file);
      }
    });

    input.addEventListener('change', (e) => {
      if (input.files && input.files.length > 0) {
        setDummyFile(input.files[0]);
      }
    });

    dom.removeDummyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearDummyFile();
    });
  }

  function setDummyFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, or WEBP)', 'error');
      return;
    }
    adminState.selectedDummyFile = file;
    dom.dummyFileName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      dom.dummyPreviewImg.src = e.target.result;
      dom.dummyDropzoneEmpty.classList.add('hidden');
      dom.dummyDropzonePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function clearDummyFile() {
    adminState.selectedDummyFile = null;
    dom.dummyImageInput.value = '';
    dom.dummyPreviewImg.src = '';
    dom.dummyDropzoneEmpty.classList.remove('hidden');
    dom.dummyDropzonePreview.classList.add('hidden');
  }

  // =========================================================================
  // DROPZONE 2: ADDITIONAL ANGLE PHOTOS
  // =========================================================================
  function setupAnglesDropzone() {
    const dz = dom.anglesDropzone;
    const input = dom.angleImagesInput;

    dz.addEventListener('click', () => input.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        dz.classList.add('dropzone-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        dz.classList.remove('dropzone-dragover');
      });
    });

    dz.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        appendAngleFiles(Array.from(e.dataTransfer.files));
      }
    });

    input.addEventListener('change', (e) => {
      if (input.files && input.files.length > 0) {
        appendAngleFiles(Array.from(input.files));
      }
    });
  }

  function appendAngleFiles(files) {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    adminState.selectedAngleFiles = [...adminState.selectedAngleFiles, ...validFiles];
    renderAnglesPreviews();
  }

  function renderAnglesPreviews() {
    const grid = dom.anglesPreviewGrid;
    grid.innerHTML = '';

    if (adminState.selectedAngleFiles.length === 0) {
      grid.classList.add('hidden');
      return;
    }

    grid.classList.remove('hidden');

    adminState.selectedAngleFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'angle-preview-item';

      const img = document.createElement('img');
      img.alt = file.name;
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(file);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'angle-del-btn';
      delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      delBtn.title = 'Remove this angle';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adminState.selectedAngleFiles.splice(index, 1);
        renderAnglesPreviews();
      });

      const badge = document.createElement('span');
      badge.className = 'angle-badge';
      badge.textContent = `Angle ${index + 1}`;

      item.appendChild(img);
      item.appendChild(delBtn);
      item.appendChild(badge);
      grid.appendChild(item);
    });
  }

  function resetUploadForm() {
    clearDummyFile();
    adminState.selectedAngleFiles = [];
    renderAnglesPreviews();
    dom.addOutfitForm.reset();
  }

  // =========================================================================
  // SUBMIT NEW OUTFIT
  // =========================================================================
  function handleAddOutfit(e) {
    e.preventDefault();

    if (!adminState.selectedDummyFile) {
      showToast('Please upload the primary Mannequin / Dummy photo', 'error');
      dom.dummyDropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const sku = dom.outfitSku.value.trim().toUpperCase();
    if (!sku) {
      showToast('Please enter an Item Code / SKU', 'error');
      dom.outfitSku.focus();
      return;
    }

    const formData = new FormData();
    formData.append('sku', sku);
    formData.append('category_id', dom.outfitCategory.value);
    formData.append('color', dom.outfitColor.value.trim());
    formData.append('standard_color', dom.outfitStdColor.value);
    formData.append('size', dom.outfitSize.value.trim());
    formData.append('standard_size', dom.outfitStdSize.value);
    formData.append('rent', dom.outfitRent.value.trim());
    formData.append('deposit', dom.outfitDeposit.value.trim());
    formData.append('description', dom.outfitDescription.value.trim());

    // Primary Dummy Image
    formData.append('dummy_image', adminState.selectedDummyFile);

    // Angle Images
    adminState.selectedAngleFiles.forEach(file => {
      formData.append('angle_images', file);
    });

    // UI Progress State
    dom.submitOutfitBtn.disabled = true;
    dom.uploadProgress.classList.remove('hidden');
    dom.uploadProgressBar.style.width = '0%';
    dom.uploadProgressText.textContent = 'Preparing upload...';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/add-item', true);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 95);
        dom.uploadProgressBar.style.width = pct + '%';
        dom.uploadProgressText.textContent = `Uploading outfit photos (${pct}%)...`;
      }
    };

    xhr.onload = function() {
      dom.uploadProgressBar.style.width = '100%';
      dom.submitOutfitBtn.disabled = false;
      dom.uploadProgress.classList.add('hidden');

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            showToast(`Outfit ${sku} successfully added to catalogue!`);
            resetUploadForm();
            checkAuthStatus();
            
            // Switch to manage tab to show newly added item
            const manageBtn = document.querySelector('[data-tab="manageOutfitsTab"]');
            if (manageBtn) manageBtn.click();
          } else {
            showToast(res.error || 'Failed to add outfit', 'error');
          }
        } catch (err) {
          showToast('Invalid response from server', 'error');
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          showToast(errRes.error || `Upload error: ${xhr.statusText}`, 'error');
        } catch (_) {
          showToast(`Server error (${xhr.status})`, 'error');
        }
      }
    };

    xhr.onerror = function() {
      dom.submitOutfitBtn.disabled = false;
      dom.uploadProgress.classList.add('hidden');
      showToast('Network error while uploading outfit. Please check connection.', 'error');
    };

    xhr.send(formData);
  }

  // =========================================================================
  // INVENTORY MANAGER TABLE
  // =========================================================================
  async function loadInventoryTable() {
    try {
      dom.adminProductsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <i class="fa-solid fa-spinner fa-spin"></i> Loading catalogue items...
          </td>
        </tr>
      `;

      const res = await fetch('/api/admin/products');
      const data = await res.json();
      adminState.allProducts = data.products || [];

      filterInventoryTable();
    } catch (err) {
      console.error('Error fetching admin products:', err);
      dom.adminProductsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-danger">
            <i class="fa-solid fa-triangle-exclamation"></i> Error loading inventory list.
          </td>
        </tr>
      `;
    }
  }

  function filterInventoryTable() {
    const q = dom.adminSearchInput.value.toLowerCase().trim();
    const cat = dom.adminCategoryFilter.value;

    let filtered = adminState.allProducts;

    if (cat && cat !== 'all') {
      filtered = filtered.filter(p => p.category_id === cat);
    }

    if (q) {
      filtered = filtered.filter(p => 
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.size && p.size.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q))
      );
    }

    renderTableRows(filtered);
  }

  function renderTableRows(products) {
    dom.tableCountSummary.textContent = `Showing ${products.length} of ${adminState.allProducts.length} outfits`;

    if (products.length === 0) {
      dom.adminProductsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted">
            <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            No outfits found matching your filters.
          </td>
        </tr>
      `;
      return;
    }

    // Limit rendered rows to first 100 for responsive DOM performance
    const displayList = products.slice(0, 100);

    const rows = displayList.map(p => {
      const rentText = p.rent ? `Rs. ${Number(p.rent).toLocaleString()}` : '<span class="text-muted">Inquire</span>';
      const anglesCount = p.images ? p.images.length : 1;

      return `
        <tr data-sku="${p.sku}">
          <td>
            <div class="table-img-wrap">
              <img src="${p.primary_image || 'assets/logo.png'}" alt="${p.sku}" loading="lazy" onerror="this.src='assets/logo.png'">
            </div>
          </td>
          <td>
            <strong>${p.sku}</strong>
          </td>
          <td><span class="badge-tag">${p.category_name || p.category_id}</span></td>
          <td>
            <div class="color-cell">
              <span class="dot" style="background-color: ${getColorHex(p.standard_color)};"></span>
              <span>${p.color || p.standard_color || 'N/A'}</span>
            </div>
          </td>
          <td>${p.size || p.standard_size || 'Free Size'}</td>
          <td><strong class="text-gold">${rentText}</strong></td>
          <td><i class="fa-solid fa-images"></i> ${anglesCount} photos</td>
          <td>
            <div class="table-actions">
              <a href="/?search=${encodeURIComponent(p.sku)}" target="_blank" class="action-btn" title="View in Showroom">
                <i class="fa-solid fa-eye"></i>
              </a>
              <button class="action-btn text-danger delete-btn" data-sku="${p.sku}" title="Delete Outfit">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    dom.adminProductsTableBody.innerHTML = rows;

    // Attach delete button clicks
    dom.adminProductsTableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-sku');
        openDeleteModal(sku);
      });
    });
  }

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

  function openDeleteModal(sku) {
    pendingDeleteSku = sku;
    dom.confirmModalMessage.innerHTML = `Are you sure you want to delete outfit <strong>${sku}</strong> from the catalogue?`;
    dom.confirmModal.classList.remove('hidden');
  }

  async function executeDeleteItem() {
    if (!pendingDeleteSku) return;

    dom.confirmProceedBtn.disabled = true;
    dom.confirmProceedBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

    try {
      const res = await fetch('/api/admin/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: pendingDeleteSku })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Outfit ${pendingDeleteSku} removed from catalogue.`);
        dom.confirmModal.classList.add('hidden');
        pendingDeleteSku = null;
        await checkAuthStatus();
        loadInventoryTable();
      } else {
        showToast(data.error || 'Failed to delete outfit', 'error');
      }
    } catch (err) {
      showToast('Network error while deleting outfit', 'error');
    } finally {
      dom.confirmProceedBtn.disabled = false;
      dom.confirmProceedBtn.innerHTML = 'Delete Outfit';
    }
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
