#!/bin/bash
# Rename index.html to app.html to bypass Replit edge layer
if [ -f "dist/public/index.html" ]; then
  mv dist/public/index.html dist/public/app.html
  echo "✅ Renamed index.html to app.html"
fi
