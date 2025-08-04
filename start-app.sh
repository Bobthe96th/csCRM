#!/bin/bash

# Navigate to application directory
cd /home/master/applications/YOUR_APP_NAME/public_html/

# Install dependencies
npm install

# Build the application
npm run build

# Start the application on port 3000
npm start 