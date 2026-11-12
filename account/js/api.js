/* ============================================================
   ACCOUNT API.JS — API Client untuk Customer Portal
   ============================================================ */

(function() {
  var API_BASE = '/api';

  async function _req(method, path, body) {
    var token = localStorage.getItem('ramx_token') || '';
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      credentials: 'include', // kirim httpOnly cookie secara otomatis
    };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    var res  = await fetch(API_BASE + path, opts);
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) throw new Error(data.message || 'Request gagal (' + res.status + ')');
    return data;
  }


  window.acctApi = {
    auth: {
      me: function() { return _req('GET', '/auth/me'); },
    },
    account: {
      dashboard:      function()       { return _req('GET',    '/account/dashboard'); },
      orders:         function(params) {
        var qs = params ? ('?' + Object.keys(params).map(function(k){ return k+'='+encodeURIComponent(params[k]); }).join('&')) : '';
        return _req('GET', '/account/orders' + qs);
      },
      orderDetail:    function(inv)    { return _req('GET',    '/account/orders/' + inv); },
      cancelOrder:    function(inv)    { return _req('POST',   '/account/orders/' + inv + '/cancel'); },
      balance:        function()       { return _req('GET',    '/account/balance'); },
      balanceHistory: function()       { return _req('GET',    '/account/balance/history'); },
      topups:         function()       { return _req('GET',    '/account/topups'); },
      createTopup:    function(data)   { return _req('POST',   '/account/topups', data); },
      topupDetail:    function(inv)    { return _req('GET',    '/account/topups/' + inv); },
      checkTopup:     function(inv)    { return _req('POST',   '/account/topups/' + inv + '/check-status'); },
      cancelTopup:    function(inv)    { return _req('POST',   '/account/topups/' + inv + '/cancel'); },
      wishlist:       function()       { return _req('GET',    '/account/wishlist'); },
      addWishlist:    function(pid)    { return _req('POST',   '/account/wishlist', { productId: pid }); },
      removeWishlist: function(pid)    { return _req('DELETE', '/account/wishlist/' + pid); },
      clearWishlist:  function()       { return _req('DELETE', '/account/wishlist'); },
      profile:        function()       { return _req('GET',    '/account/profile'); },
      updateProfile:  function(data)   { return _req('PATCH',  '/account/profile', data); },
      changePassword: function(data)   { return _req('PATCH',  '/account/password', data); },
      sessions:       function()       { return _req('GET',    '/account/sessions'); },
      revokeSession:  function(id)     { return _req('DELETE', '/account/sessions/' + id); },
      revokeOthers:   function()       { return _req('DELETE', '/account/sessions/others'); },
      securityLogs:   function()       { return _req('GET',    '/account/security-activities'); },
    },
  };
})();
