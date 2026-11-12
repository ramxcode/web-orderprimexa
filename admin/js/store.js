/**
 * Admin Data Store — store.js
 * Memuat data dari MongoDB sebelum setiap render halaman.
 * Write ops di-sync ke MongoDB setelah update lokal.
 */

const store = {

  // ── Prefetch sebelum render ───────────────────────────────────
  async prefetch(page) {
    const map = {
      'dashboard':         store._dashboard,
      'analytics':         store._analytics,
      'orders':            store._orders,
      'categories':        store._categories,
      'vouchers':          store._vouchers,
      'products':          store._productsWithCategories,
      'product-types':     store._productTypes,
      'product-variants':  store._productVariants,
      'stock-data':        store._stockItems,
      'featured-products': store._featuredProducts,
      'flash-sale':        store._flashSales,
      'static-pages':      store._staticPages,
    };
    const loader = map[page];
    if (loader) {
      try { await loader(); } catch (e) {
        console.warn('[store] prefetch gagal untuk ' + page + ':', e.message);
      }
    }
  },

  // ── Loaders ────────────────────────────────────────────────────
  async _dashboard() {
    try {
      // Load stats utama
      const r = await api.dashboard.getStats();
      if (r.success && r.data) {
        const d = r.data;
        if (typeof DASHBOARD_STATS !== 'undefined') {
          if (d.revenue     !== undefined) DASHBOARD_STATS.totalRevenue.value = d.revenue;
          if (d.totalOrders !== undefined) DASHBOARD_STATS.totalOrders.value  = d.totalOrders;
          if (d.totalUsers  !== undefined && DASHBOARD_STATS.totalCustomers) DASHBOARD_STATS.totalCustomers.value = d.totalUsers;
        }
        // Update USER_STATS dengan data real
        if (typeof USER_STATS !== 'undefined') {
          if (d.totalUsers   !== undefined) USER_STATS.registered.value  = d.totalUsers;
          if (d.totalOrders  !== undefined) USER_STATS.success.value     = d.totalOrders;
        }
      }
    } catch (e) {}

    // Load period analytics (Hari Ini / Kemarin / 7 Hari) dari MongoDB
    try {
      const [rToday, rYesterday, rWeek] = await Promise.all([
        api.analytics.getStats('today'),
        api.analytics.getStats('yesterday'),
        api.analytics.getStats('week'),
      ]);
      if (typeof PERIOD_ANALYTICS !== 'undefined') {
        if (rToday.success && rToday.data) {
          PERIOD_ANALYTICS.hariIni.orders = rToday.data.orders   || 0;
          PERIOD_ANALYTICS.hariIni.profit = rToday.data.revenue  || 0;
        }
        if (rYesterday.success && rYesterday.data) {
          PERIOD_ANALYTICS.kemarin.orders = rYesterday.data.orders  || 0;
          PERIOD_ANALYTICS.kemarin.profit = rYesterday.data.revenue || 0;
        }
        if (rWeek.success && rWeek.data) {
          PERIOD_ANALYTICS.tujuhHari.orders = rWeek.data.orders   || 0;
          PERIOD_ANALYTICS.tujuhHari.profit = rWeek.data.revenue  || 0;
        }
      }
    } catch (e) { /* PERIOD_ANALYTICS stays as 0 */ }
  },

  async _analytics() {
    // Data analytics dimuat langsung oleh updateAnalyticsData() via api.analytics.getStats()
    // Tidak perlu prefetch ke global var di sini
  },

  async _orders() {
    try {
      const r = await api.orders.getAll({ limit: 200, sort: '-createdAt' });
      if (r.success && r.data && Array.isArray(r.data)) {
        const mapped = r.data.map(store._mapOrder);
        if (typeof ALL_TRANSACTIONS !== 'undefined' && Array.isArray(ALL_TRANSACTIONS)) {
          ALL_TRANSACTIONS.splice(0, ALL_TRANSACTIONS.length, ...mapped);
        }
        if (typeof RECENT_TRANSACTIONS !== 'undefined' && Array.isArray(RECENT_TRANSACTIONS)) {
          RECENT_TRANSACTIONS.splice(0, RECENT_TRANSACTIONS.length, ...mapped.slice(0, 10));
        }
      }
    } catch (e) {}
  },

  _mapOrder(o) {
    const firstItem = (o.items && o.items[0]) || {};
    return {
      id:            o.orderId || o._id,
      _id:           o._id,
      orderId:       o.orderId || o._id,
      invoice:       o.orderId || o.invoice || o._id,
      customer:      o.userId?.name  || o.customerName || o.customer || 'Unknown',
      email:         o.userId?.email || o.customerEmail || o.email   || '',
      product:       o.productName   || firstItem.productName || o.productId?.name || o.product || 'Produk',
      variant:       o.variantName   || firstItem.variant || '',
      total:         o.total  || o.amount || 0,
      amount:        o.total  || o.amount || 0,
      paymentMethod: o.paymentMethod || o.payment || '',
      status:        o.status || 'pending',
      type:          o.type   || 'order',
      date:          o.createdAt || o.date || new Date().toISOString(),
      note:          o.note  || '',
    };
  },

  async _categories() {
    try {
      const r = await api.categories.getAll();
      if (r.success && Array.isArray(r.data)) {
        const mapped = r.data.map(c => ({
          id:           c._id,
          _id:          c._id,
          name:         c.name,
          slug:         c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          icon:         c.icon || 'fa-tag',
          source:       c.source || 'lokal',
          description:  c.description || '',
          order:        c.sortOrder || c.order || 99,
          isActive:     c.isActive !== false,
          showInBot:    c.showInBot || false,
          productCount: c.productCount || 0,
          createdAt:    (c.createdAt || '').slice(0, 10),
        }));
        window.CATEGORIES = mapped;
      }
    } catch (e) {
      if (typeof CATEGORIES === 'undefined') window.CATEGORIES = [];
    }
  },

  async _vouchers() {
    try {
      const r = await api.vouchers.getAll();
      if (r.success && Array.isArray(r.data)) {
        const mapped = r.data.map(v => ({
          id:           v._id,
          _id:          v._id,
          code:         v.code,
          name:         v.name,
          description:  v.description || '',
          type:         v.type || 'percent',
          value:        v.value || 0,
          minPurchase:  v.minPurchase || 0,
          maxPurchase:  v.maxPurchase || null,
          maxDiscount:  v.maxDiscount || null,
          startDate:    v.startDate || '',
          endDate:      v.endDate   || '',
          quota:        v.quota || -1,
          quotaUsed:    v.usageCount || 0,
          quotaPerUser: v.quotaPerUser || 1,
          scope:        v.scope || 'all',
          requireLogin: v.requireLogin || false,
          showPromo:    v.showPromo !== false,
          isFeatured:   v.isFeatured || false,
          isActive:     v.isActive !== false,
          usageCount:   v.usageCount || 0,
        }));
        if (typeof _voucherList !== 'undefined' && Array.isArray(_voucherList)) {
          _voucherList.splice(0, _voucherList.length, ...mapped);
        } else {
          window._voucherList = mapped;
        }
      }
    } catch (e) {}
  },

  async _products() {
    try {
      const r = await api.products.getAll({ limit: 200, sort: '-createdAt' });
      if (r.success && Array.isArray(r.data)) {
        // Map MongoDB fields ke format yang diharapkan frontend
        window.PRODUCTS = r.data.map(function(p) {
          var vArr = Array.isArray(p.variants) ? p.variants : [];
          return {
            _id:             p._id,
            id:              p._id,           // renderProductRows menggunakan p.id
            name:            p.name || '',
            slug:            p.slug || '',
            categoryId:      p.category || p.categoryId || '',  // getCatName() pakai p.categoryId
            category:        p.category || '',
            description:     p.description || '',
            imageUrl:        p.imageUrl || '',
            icon:            p.icon || 'fa-box',
            source:          p.source || 'lokal',
            isActive:        p.isActive !== false,
            isFeatured:      p.isFeatured || false,
            variantCount:    vArr.length,
            activeVariants:  vArr.filter(function(v){ return v.isActive !== false; }).length,
            price:           p.price || 0,
            stock:           p.stock !== undefined ? p.stock : -1,
            createdAt:       p.createdAt || '',
            normalizeTarget: p.normalizeTarget || 'none',
            supplierId:      p.supplierId || '',
            lastSyncedAt:    p.lastSyncedAt || '',
            showInBot:       p.showInBot !== false,
          };
        });
      }
    } catch (e) {
      if (typeof PRODUCTS === 'undefined') window.PRODUCTS = [];
    }
  },

  // Gabungan: produk + kategori (dibutuhkan halaman products)
  async _productsWithCategories() {
    await Promise.all([ store._products(), store._categories() ]);
    // Auto-migration: fix produk tanpa kategori (produk lama sebelum fix category field)
    try {
      var cats = window.CATEGORIES || [];
      var prds = window.PRODUCTS   || [];
      if (cats.length > 0 && typeof api !== 'undefined') {
        var defaultCatId = cats[0]._id || cats[0].id;
        prds.forEach(function(p) {
          if (!p.categoryId && p._id) {
            p.categoryId = defaultCatId;
            p.category   = defaultCatId;
            api.products.update(p._id, { category: defaultCatId })
              .catch(function(e){ console.warn('[migration] category fix:', e.message); });
          }
        });
      }
    } catch(e) {}
  },

  async _productTypes() {
    try {
      const r = await api.products.getAll({ limit: 500, type: 'type' });
      // Jika endpoint belum tersedia, gunakan array kosong
      if (r.success && Array.isArray(r.productTypes)) {
        window.PRODUCT_TYPES = r.productTypes;
      } else if (!r.success) {
        if (typeof PRODUCT_TYPES === 'undefined') window.PRODUCT_TYPES = [];
      }
    } catch (e) {
      if (typeof PRODUCT_TYPES === 'undefined') window.PRODUCT_TYPES = [];
    }
  },

  async _productVariants() {
    try {
      const r = await api.products.getAll({ limit: 200, sort: '-createdAt' });
      if (r.success && Array.isArray(r.data)) {
        // Flatten embedded variants dari tiap product ke PRODUCT_VARIANTS
        const allVariants = [];
        r.data.forEach(function(p) {
          var vArr = Array.isArray(p.variants) ? p.variants : [];
          vArr.forEach(function(v) {
            allVariants.push({
              id:            v._id || v.id || ('VAR' + allVariants.length),
              _id:           v._id,
              productId:     p._id,
              productName:   p.name || '',
              name:          v.name || '',
              costPrice:     v.costPrice || 0,
              sellingPrice:  v.price || v.sellingPrice || 0,
              markupValue:   (v.price || v.sellingPrice || 0) - (v.costPrice || 0),
              markupType:    'fixed',
              processType:   v.processType || 'auto',
              productTypeId: v.productTypeId || '',
              typeName:      '',
              isActive:      v.isActive !== false,
              showInBot:     v.showInBot !== false,
              stock:         v.stock !== undefined ? v.stock : -1,
              source:        v.source || 'lokal',
            });
          });
        });
        window.PRODUCT_VARIANTS = allVariants;
      } else {
        if (typeof PRODUCT_VARIANTS === 'undefined') window.PRODUCT_VARIANTS = [];
      }
    } catch (e) {
      if (typeof PRODUCT_VARIANTS === 'undefined') window.PRODUCT_VARIANTS = [];
    }
  },

  async _stockItems() {
    try {
      const r = await api.stockItems.getAll({ limit: 200 });
      if (r.success && Array.isArray(r.data)) {
        window.STOCK_ITEMS = r.data.map(s => ({
          id:        s._id,
          _id:       s._id,
          productId: s.productId?._id || s.productId,
          productName: s.productId?.name || 'Produk',
          variantId: s.variantId?._id || s.variantId || null,
          variantName: s.variantId?.name || null,
          content:   s.content,
          status:    s.status || 'available',
          notes:     s.notes || '',
          invoiceId: s.invoiceId || '',
          usedAt:    s.usedAt || null,
          expiredAt: s.expiredAt || null,
          createdAt: s.createdAt ? s.createdAt.slice(0,10) : '',
        }));
      } else {
        if (typeof STOCK_ITEMS === 'undefined') window.STOCK_ITEMS = [];
      }
    } catch (e) {
      if (typeof STOCK_ITEMS === 'undefined') window.STOCK_ITEMS = [];
    }
  },

  async _featuredProducts() {
    try {
      // Load produk terlebih dahulu, lalu filter yang featured
      await store._products();
      const featured = (window.PRODUCTS || []).filter(function(p) { return p.isFeatured; });
      window.FEATURED_PRODUCTS = featured;
      if (typeof FEATURED_PRODUCTS === 'undefined') window.FEATURED_PRODUCTS = [];
    } catch (e) {
      if (typeof FEATURED_PRODUCTS === 'undefined') window.FEATURED_PRODUCTS = [];
    }
  },

  async _flashSales() {
    try {
      // Load produk + kategori untuk flash sale page
      await store._productsWithCategories();
      if (typeof FLASH_SALES === 'undefined') window.FLASH_SALES = [];
      if (typeof PRODUCT_VARIANTS === 'undefined') window.PRODUCT_VARIANTS = [];
    } catch (e) {
      if (typeof FLASH_SALES === 'undefined') window.FLASH_SALES = [];
    }
  },

  async _staticPages() {
    try {
      const r = await api.pages.getAll();
      if (r.success && Array.isArray(r.data)) {
        window.STATIC_PAGES = r.data;
      }
    } catch (e) {
      if (typeof STATIC_PAGES === 'undefined') window.STATIC_PAGES = [];
    }
  },

  // ── Write helpers (dipanggil setelah update lokal) ────────────
  async saveCategory(localCat, isNew) {
    try {
      const payload = {
        name:        localCat.name,
        slug:        localCat.slug,
        icon:        localCat.icon,
        description: localCat.description,
        sortOrder:   localCat.order,
        isActive:    localCat.isActive,
        showInBot:   localCat.showInBot,
        source:      'lokal',
      };
      if (isNew) {
        const r = await api.categories.create(payload);
        if (r.success && r.data?._id) localCat._id = localCat.id = r.data._id;
      } else {
        const id = localCat._id || localCat.id;
        await api.categories.update(id, payload);
      }
    } catch (e) { console.warn('[store] saveCategory error:', e.message); }
  },

  async deleteCategory(id) {
    try { await api.categories.delete(id); }
    catch (e) { console.warn('[store] deleteCategory error:', e.message); }
  },

  async saveVoucher(localV, isNew) {
    try {
      const payload = {
        code:         localV.code,
        name:         localV.name,
        description:  localV.description,
        type:         localV.type,
        value:        localV.value,
        minPurchase:  localV.minPurchase,
        maxPurchase:  localV.maxPurchase,
        maxDiscount:  localV.maxDiscount,
        startDate:    localV.startDate,
        endDate:      localV.endDate,
        quota:        localV.quota,
        quotaPerUser: localV.quotaPerUser,
        scope:        localV.scope,
        requireLogin: localV.requireLogin,
        showPromo:    localV.showPromo,
        isFeatured:   localV.isFeatured,
        isActive:     localV.isActive,
      };
      if (isNew) {
        const r = await api.vouchers.create(payload);
        if (r.success && r.data?._id) localV._id = localV.id = r.data._id;
      } else {
        await api.vouchers.update(localV._id || localV.id, payload);
      }
    } catch (e) { console.warn('[store] saveVoucher error:', e.message); }
  },

  async deleteVoucher(id) {
    try { await api.vouchers.delete(id); }
    catch (e) { console.warn('[store] deleteVoucher error:', e.message); }
  },

  async toggleVoucher(id, active) {
    try { await api.vouchers.toggle(id, active); }
    catch (e) { console.warn('[store] toggleVoucher error:', e.message); }
  },

  async saveOrderStatus(orderId, status) {
    try {
      await api.orders.updateStatus(orderId, status);
      // Reload data terbaru dari server lalu re-render
      await store._orders();
      if (typeof renderOrders === 'function') renderOrders();
    }
    catch (e) { console.warn('[store] saveOrderStatus error:', e.message); }
  },
};
