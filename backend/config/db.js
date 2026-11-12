const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS:         30000,
      socketTimeoutMS:          45000,
      family: 4, // Paksa IPv4 — atasi masalah DNS SRV di beberapa jaringan
    });
    console.log(`✅ MongoDB Atlas terhubung: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB gagal terhubung:', err.message);
    console.error('💡 Pastikan:');
    console.error('   1. MONGODB_URI di .env sudah benar');
    console.error('   2. IP 0.0.0.0/0 sudah di-whitelist di Atlas Network Access');
    console.error('   3. Username & password database user sudah benar');
    process.exit(1);
  }
};

module.exports = connectDB;
