module.exports = function formatRupiah(n) {
  return 'Rp. ' + (Number(n)||0).toLocaleString('id-ID');
};
