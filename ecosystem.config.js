module.exports = {
  apps: [{
    name: 'whatsapp-chat-app',
    script: 'npm',
    args: 'start',
    cwd: '/home/master/applications/YOUR_APP_NAME/public_html/',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
} 