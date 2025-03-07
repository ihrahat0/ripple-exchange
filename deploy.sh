#!/bin/bash

# Deployment script for Ripple Exchange Email Service
# Run this script on your server

# Set variables
APP_DIR="/var/www/rippleexchange.org"
FRONTEND_DIR="$APP_DIR/frontend"
EMAILS_DIR="$APP_DIR/emails"
NGINX_CONF="/etc/nginx/sites-available/rippleexchange.org"
NGINX_ENABLED="/etc/nginx/sites-enabled/rippleexchange.org"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Create directories
echo "Creating application directories..."
mkdir -p $FRONTEND_DIR
mkdir -p $EMAILS_DIR

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Copy Nginx configuration
echo "Setting up Nginx configuration..."
cp nginx.conf $NGINX_CONF
ln -sf $NGINX_CONF $NGINX_ENABLED

# Ensure emails directory is writable by the node process
echo "Setting up permissions for emails directory..."
chmod -R 777 $EMAILS_DIR

# Copy the production build to the frontend directory
echo "Copying frontend files..."
rsync -av --delete build/ $FRONTEND_DIR/

# Setup the server
echo "Setting up the server..."
cp .env $APP_DIR/
cp server.js $APP_DIR/
cp -r server $APP_DIR/
cp -r node_modules $APP_DIR/
cp package.json $APP_DIR/

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  npm install -g pm2
fi

# Start the server with PM2
echo "Starting the server with PM2..."
cd $APP_DIR
pm2 start server.js --name ripple-server
pm2 save
pm2 startup

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "Deployment completed successfully!"
echo "Your application is now accessible at https://rippleexchange.org"
echo "Emails can be viewed at https://rippleexchange.org/emails/" 