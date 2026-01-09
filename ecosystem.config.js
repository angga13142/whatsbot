/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'cashflow-bot',
      script: './src/app.js',

      // Instances & Execution Mode
      instances: 1,
      exec_mode: 'fork', // 'cluster' for multiple instances

      // Restart Configuration
      autorestart: true,
      watch: false, // Set to true for development
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      error_file: './storage/logs/pm2-error.log',
      out_file: './storage/logs/pm2-out.log',
      log_file: './storage/logs/pm2-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced Features
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,

      // Source Control
      ignore_watch: [
        'node_modules',
        'storage',
        '.wwebjs_auth',
        '.wwebjs_cache',
        'logs',
        'coverage',
        'tests',
      ],

      // Process Management
      cron_restart: '0 3 * * *', // Restart every day at 3 AM

      // Monitoring
      pmx: true,
      instance_var: 'INSTANCE_ID',
    },
  ],

  // Deployment Configuration (Optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-vps-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/whatsapp-cashflow-bot.git',
      path: '/var/www/whatsapp-cashflow-bot',
      'post-deploy':
        'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy-local': 'echo "Deployment completed!"',
    },
    staging: {
      user: 'deploy',
      host: 'your-staging-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/whatsapp-cashflow-bot.git',
      path: '/var/www/whatsapp-cashflow-bot-staging',
      'post-deploy': 'npm install && npm run migrate && pm2 reload ecosystem.config.js',
    },
  },
};
