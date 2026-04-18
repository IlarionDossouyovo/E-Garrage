#!/bin/bash
cd /workspace/project/E-Garrage
export PORT=12000
node server.js > /tmp/egarrage.log 2>&1 &
echo "Server started on port 12000"
sleep 3
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:12000/