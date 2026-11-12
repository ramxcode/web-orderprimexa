const dayjs = require('dayjs');

// Helper to format date in WIB
function formatDateWIB(date) {
  // Add 7 hours manually if we don't have timezone plugin setup completely
  // For safety with simple dayjs, convert to UTC then add 7 hours
  const d = new Date(date);
  return d.toLocaleString('id-ID', { 
    timeZone: 'Asia/Jakarta', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  }).replace(/\./g, ':');
}

function timeNowWIB() {
  const d = new Date();
  return d.toLocaleString('id-ID', { 
    timeZone: 'Asia/Jakarta', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  }).replace(/\./g, ':') + ' WIB';
}

module.exports = {
  formatDateWIB,
  timeNowWIB
};
