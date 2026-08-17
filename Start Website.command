#!/bin/bash
# Double-click this file to view the Hiramar and Costa website on this computer.
# A Terminal window will open and stay open while the site is running.
# To stop the site, press Control-C in that window, or just close it.

cd "$(dirname "$0")" || exit 1

PORT=8080
while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 8100 ]; then
    echo "Could not find a free port between 8080 and 8100."
    read -r -p "Press Return to close."
    exit 1
  fi
done

URL="http://localhost:$PORT/"

echo ""
echo "  HIRAMAR AND COSTA — website running"
echo "  ------------------------------------------------"
echo "  Website:          $URL"
echo "  Equipment manager: ${URL}admin.html"
echo ""
echo "  Leave this window open while you browse."
echo "  Press Control-C here to stop."
echo ""

( sleep 1; open "$URL" ) &

python3 -m http.server "$PORT" --bind 127.0.0.1
