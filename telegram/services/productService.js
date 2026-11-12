const Product = require('../../backend/models/Product');

async function getActiveProducts(page = 1, limit = 9) {
  const skip = (page - 1) * limit;
  const products = await Product.find({ isActive: true })
    .sort({ name: 1 })          // A-Z alphabetically
    .skip(skip)
    .limit(limit);
  const total = await Product.countDocuments({ isActive: true });
  return { products, total, totalPages: Math.ceil(total / limit) };
}

async function getProductById(id) {
  return await Product.findById(id);
}

async function getFeaturedProducts(limit = 10) {
  return await Product.find({ isActive: true }).sort({ sortOrder: 1 }).limit(limit);
}

async function getVariantById(productId, variantId) {
  const product = await Product.findById(productId);
  if (!product) return null;
  return product.variants.id(variantId);
}

module.exports = { getActiveProducts, getProductById, getFeaturedProducts, getVariantById };
