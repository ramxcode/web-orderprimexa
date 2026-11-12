// wishlist.js
async function renderWishlist() {
    let content = `
    <style>
        .wishlist-grid {
            display: grid;
            gap: 20px;
        }
        @media (min-width: 992px) { .wishlist-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 768px) and (max-width: 991px) { .wishlist-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 767px) { .wishlist-grid { grid-template-columns: 1fr; } }
    </style>
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2>Wishlist Saya</h2>
        <div class="wishlist-controls d-flex gap-2 mt-2 mt-md-0">
            <select class="form-select bg-dark text-white border-secondary" onchange="wishlistSort(this.value)">
                <option value="">Urutkan</option>
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Termurah</option>
                <option value="termahal">Termahal</option>
            </select>
            <select class="form-select bg-dark text-white border-secondary" onchange="wishlistFilter(this.value)">
                <option value="semua">Semua Kategori</option>
                <option value="game">Game</option>
                <option value="app">Aplikasi</option>
                <option value="voucher">Voucher</option>
            </select>
        </div>
    </div>
    `;

    if (typeof _acctWishlist === 'undefined' || !_acctWishlist || _acctWishlist.length === 0) {
        content += `
        <div class="empty-state text-center py-5">
            <i class="fa-solid fa-heart fa-4x text-muted mb-3"></i>
            <h4>Wishlist Anda masih kosong</h4>
            <button class="btn btn-primary mt-3" onclick="navigate('products')">Jelajahi Produk</button>
        </div>
        `;
    } else {
        content += `
        <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-danger btn-sm" onclick="wishlistRemoveAll()">
                <i class="fa-solid fa-trash me-1"></i> Hapus Semua
            </button>
        </div>
        <div class="wishlist-grid">
        `;

        _acctWishlist.forEach(item => {
            content += `
            <div class="card h-100 bg-dark text-white border-secondary">
                <div class="card-img-top" style="height: 150px; background-color: #2c3e50; display: flex; align-items: center; justify-content: center;">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-image fa-3x text-secondary"></i>`}
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="mb-2">
                        <span class="badge bg-secondary">${item.category || 'Kategori'}</span>
                    </div>
                    <h5 class="card-title" style="font-weight: 800;">${item.name}</h5>
                    <p class="card-text text-primary mb-2">Mulai Rp ${item.price ? item.price.toLocaleString('id-ID') : '0'}</p>
                    <div class="mb-3">
                        <span class="badge ${item.stock === 'Tersedia' ? 'bg-success' : 'bg-danger'}">${item.stock || 'Habis'}</span>
                    </div>
                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-outline-primary btn-sm flex-grow-1" onclick="navigate('product-detail', ${item.id})">
                            <i class="fa-solid fa-eye"></i> Lihat Produk
                        </button>
                        <button class="btn btn-primary btn-sm flex-grow-1" onclick="wishlistBuy(${item.id})" ${item.stock !== 'Tersedia' ? 'disabled' : ''}>
                            <i class="fa-solid fa-cart-shopping"></i> Beli
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="wishlistRemove(${item.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
        });
        content += `</div>`;
    }

    const container = document.getElementById('main-content');
    if (container) {
        container.innerHTML = content;
    }
}

window.wishlistSort = function(sortType) {
    console.log('Sort wishlist by', sortType);
    renderWishlist();
}

window.wishlistFilter = function(category) {
    console.log('Filter wishlist by', category);
    renderWishlist();
}

window.wishlistRemove = function(productId) {
    console.log('Remove wishlist item', productId);
    if(typeof _acctWishlist !== 'undefined') {
        const index = _acctWishlist.findIndex(i => i.id === productId);
        if(index > -1) _acctWishlist.splice(index, 1);
    }
    renderWishlist();
}

window.wishlistRemoveAll = function() {
    console.log('Remove all wishlist items');
    if(typeof _acctWishlist !== 'undefined') {
        _acctWishlist.length = 0;
    }
    renderWishlist();
}

window.wishlistBuy = function(productId) {
    console.log('Buy wishlist item', productId);
}
