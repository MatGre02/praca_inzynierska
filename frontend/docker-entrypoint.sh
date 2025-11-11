#!/bin/sh

# Frontend entrypoint - czeka na backend przed startem
set -e

echo "🔍 Czekanie na backend..."
until curl -f http://backend:4000/api/status > /dev/null 2>&1; do
  echo "⏳ Backend nie jest gotowy, czekam..."
  sleep 2
done

echo "✅ Backend jest gotowy!"
echo "🚀 Uruchamianie frontendu..."

# Uruchom nginx
exec "$@"
