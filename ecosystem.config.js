module.exports = {
  apps: [
    {
      name: "ripple-server",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "300M",
      env_production: {
        NODE_ENV: "production"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/server-error.log",
      out_file: "./logs/server-out.log"
    },
    {
      name: "ripple-frontend",
      script: "npm",
      args: "run serve",
      env: {
        NODE_ENV: "production",
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: "true"
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "300M",
      env_production: {
        NODE_ENV: "production"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log"
    }
  ]
}; 