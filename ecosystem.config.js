module.exports = {
  apps: [
    // ── Backend API ─────────────────────────────────────────────────────────
    {
      name: 'primexa-backend',
      script: 'backend/server.js',
      cwd: '/var/www/primexa',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/primexa-backend-error.log',
      out_file:   '/var/log/pm2/primexa-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Restart dengan delay jika crash (cegah crash loop)
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // ── Frontend Server ─────────────────────────────────────────────────────
    {
      name: 'primexa-frontend',
      script: 'server-frontend.js',
      cwd: '/var/www/primexa',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        FRONTEND_PORT: 5500
      },
      error_file: '/var/log/pm2/primexa-frontend-error.log',
      out_file:   '/var/log/pm2/primexa-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
