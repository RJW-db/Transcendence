#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.example to .env and add your NGROK_AUTHTOKEN"
    exit 1
fi

# Check if ngrok is already installed
if [ ! -f ./node_modules/.bin/ngrok ]; then
    echo "Installing ngrok..."
    npm install ngrok
    
    # Load .env file
    source .env
    
    # Configure ngrok with auth token
    ./node_modules/.bin/ngrok config add-authtoken $NGROK_AUTHTOKEN
    
    # Update vite config if NGROK_SITE is set
    if [ -n "$NGROK_SITE" ]; then
        # Extract just the domain from the URL (remove https://)
        NGROK_DOMAIN=$(echo "$NGROK_SITE" | sed 's|https://||' | sed 's|http://||')
        
        # Use perl for multiline replacement (more reliable than sed for this case)
        perl -i -0pe "s/allowedHosts: \[.*?\]/allowedHosts: [\n    '$NGROK_DOMAIN'\n\t]/s" ./frontend/vite.config.ts
        
        echo "Updated allowedHosts with: $NGROK_DOMAIN"
    else
        echo "WARNING: NGROK_SITE not set in .env file"
    fi
    
    echo "ngrok installed and configured!"
else
    echo "ngrok already installed"
fi
