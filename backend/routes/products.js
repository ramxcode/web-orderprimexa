const router    = require('express').Router();
const Product   = require('../models/Product');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Helper: hapus costPrice dari setiap variant (field sensitif — harga modal)
// .select('-variants.costPrice') tidak reliabel di semua versi Mongoose,
// jadi kita gunakan .lean() lalu hapus field secara eksplisit
function stripVariantCostPrice(data) {
  if (!data) return data;
  const strip = (p) => {
    if (p.variants && Array.isArray(p.variants)) {
      p.variants = p.variants.map(v => {
        const copy = { ...v };
        delete copy.costPrice;
        return copy;
      });
    }
    return p;
  };
  return Array.isArray(data) ? data.map(strip) : strip(data);
}

// GET /api/products — publik
router.get('/', async (req, res) => {
  try {
    const { category, featured, slug, limit = 50, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (slug)     filter.slug = slug;

    // Sembunyikan field sensitif dari publik (harga modal, dll)
    const HIDDEN_PUBLIC = '-costPrice -__v';

    const products = await Product.find(filter)
      .select(HIDDEN_PUBLIC)
      .sort({ name: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean(); // lean() agar bisa modifikasi object JS biasa
    const total = await Product.countDocuments(filter);

    // Hapus costPrice dari setiap variant (field nested tidak di-handle .select())
    res.json({ success: true, data: stripVariantCostPrice(products), total, page: Number(page) });

  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/products/slug/:slug — publik, ambil produk berdasarkan slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();

    // 1. Cari langsung via field slug (sembunyikan field sensitif)
    let product = await Product.findOne({ slug }).select('-costPrice -__v').lean();

    // 2. Fallback: produk lama mungkin belum punya slug — cari lewat name
    if (!product) {
      const all = await Product.find({ isActive: true }).select('-costPrice -__v').lean();

      product = all.find(p => {
        const gen = (p.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return gen === slug;
      }) || null;

      // Auto-patch slug ke database agar next request langsung hit index
      if (product) {
        await Product.updateOne({ _id: product._id }, { $set: { slug } }).catch(() => {});
        product.slug = slug;
      }
    }

    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    // Hapus costPrice dari setiap variant
    res.json({ success: true, data: stripVariantCostPrice(product) });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});


// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    res.json({ success: true, data: product });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});


// POST /api/products — admin only
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

// PUT /api/products/:id — admin only
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    res.json({ success: true, data: product });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Produk dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
