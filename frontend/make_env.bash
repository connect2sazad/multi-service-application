#!/usr/bin/env bash

set -euo pipefail

if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        echo "Error: frontend/.env.example not found!"
        exit 1
    fi

    cp .env.example .env
    
    chmod 600 .env    
    
    echo "frontend/.env generated from frontend/.env.example"

else 
    echo "frontend/.env already exists; keeping existing configuration."
fi

