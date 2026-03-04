module.exports = {
  apps: [
    {
      name: 'ronnie-backend',
      script: 'server/index.js',
      cwd: '/home/ubuntu/.openclaw/workspace/ronnie-portfolio',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/tmp/ronnie-backend.log',
      out_file: '/tmp/ronnie-backend-out.log',
      error_file: '/tmp/ronnie-backend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: 5000
    },
    {
      name: 'ronnie-frontend',
      script: 'npm',
      args: 'run preview -- --port 4173 --host',
      cwd: '/home/ubuntu/.openclaw/workspace/ronnie-portfolio',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      log_file: '/tmp/ronnie-frontend.log',
      out_file: '/tmp/ronnie-frontend-out.log',
      error_file: '/tmp/ronnie-frontend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: 5000
    }
  ]
}
