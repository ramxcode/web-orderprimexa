const router     = require('express').Router();
const StaticPage = require('../models/StaticPage');
const auth       = require('../middleware/auth');
const adminOnly  = require('../middleware/adminOnly');

// Default content untuk setiap halaman
const DEFAULTS = {
  faq: {
    title: 'Pertanyaan yang Sering Diajukan (FAQ)',
    content: `<h2>Pertanyaan Umum</h2>
<h3>Bagaimana cara melakukan pembelian?</h3>
<p>Pilih produk, tambahkan ke keranjang, lalu ikuti proses pembayaran.</p>
<h3>Berapa lama proses pengiriman?</h3>
<p>Produk digital dikirim otomatis dalam hitungan menit setelah pembayaran dikonfirmasi.</p>
<h3>Apakah ada garansi?</h3>
<p>Ya, kami memberikan garansi untuk setiap produk. Hubungi CS kami jika ada masalah.</p>`
  },
  terms: {
    title: 'Syarat & Ketentuan',
    content: `<h2>Syarat & Ketentuan Penggunaan</h2>
<p>Dengan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut.</p>
<h3>1. Ketentuan Umum</h3>
<p>Pengguna wajib berusia minimal 17 tahun atau mendapat izin orang tua.</p>
<h3>2. Pembayaran</h3>
<p>Semua transaksi bersifat final dan tidak dapat dikembalikan kecuali ada kesalahan dari pihak kami.</p>
<h3>3. Privasi</h3>
<p>Data Anda kami jaga dengan ketat sesuai kebijakan privasi yang berlaku.</p>`
  },
  privacy: {
    title: 'Kebijakan Privasi',
    content: `<h2>Kebijakan Privasi</h2>
<p>Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda.</p>
<h3>Data yang Dikumpulkan</h3>
<p>Kami mengumpulkan nama, email, nomor telepon, dan data transaksi untuk keperluan layanan.</p>
<h3>Penggunaan Data</h3>
<p>Data hanya digunakan untuk memproses transaksi dan meningkatkan layanan kami.</p>
<h3>Keamanan Data</h3>
<p>Data Anda disimpan dengan enkripsi dan tidak dibagikan ke pihak ketiga tanpa izin.</p>`
  }
};

// GET /api/pages/:slug — publik
router.get('/:slug', async (req, res) => {
  try {
    let page = await StaticPage.findOne({ slug: req.params.slug });
    if (!page) {
      const def = DEFAULTS[req.params.slug];
      if (!def) return res.status(404).json({ success: false, message: 'Halaman tidak ditemukan' });
      // Buat dengan default jika belum ada
      page = await StaticPage.create({ slug: req.params.slug, ...def });
    }
    res.json({ success: true, data: page });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/pages/:slug — admin only
router.put('/:slug', auth, adminOnly, async (req, res) => {
  try {
    const { title, content } = req.body;
    const page = await StaticPage.findOneAndUpdate(
      { slug: req.params.slug },
      { title, content },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: page });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
