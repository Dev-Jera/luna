#!/bin/sh
set -e

# Replace Nginx listening port 80 with $PORT if it is provided by the hosting environment (Render/Heroku/Fly)
if [ -n "$PORT" ]; then
  echo "Replacing default Nginx port 80 with environment port $PORT..."
  sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/sites-available/default
fi

# Run Django migrations
echo "Running database migrations..."
python backend/manage.py migrate --noinput

# Start Daphne server in the background on port 8000
echo "Starting Daphne ASGI backend server..."
daphne -b 127.0.0.1 -p 8000 config.asgi:application &

# Start Nginx in the foreground to serve frontend and proxy backend API/WebSockets
echo "Starting Nginx reverse proxy..."
nginx -g "daemon off;"
