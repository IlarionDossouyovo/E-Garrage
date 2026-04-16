#!/bin/bash
cd /workspace/project/E-Garrage
PORT=12000 node server.js > /tmp/egarrage.log 2>&1 &
echo "Server started, PID: $!"
sleep 3
curl -s http://localhost:12000/api/agents/status