const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let teamList = [];
let selectedTeam = null;

app.use(express.static(path.join(__dirname)));

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', function connection(ws) {
  ws.send(JSON.stringify({ type: 'teamList', teamList }));
  if (selectedTeam) {
    ws.send(JSON.stringify({ type: 'selectTeam', team: selectedTeam }));
  }

  ws.on('message', function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error('Invalid JSON:', err);
      return;
    }

    switch (data.type) {
      case 'addTeam':
        teamList.push(data.team);
        broadcast({ type: 'teamList', teamList });
        break;

      case 'selectTeam':
        selectedTeam = data.team;
        broadcast({ type: 'selectTeam', team: selectedTeam });
        break;

      case 'clearAll':
        teamList = [];
        selectedTeam = null;
        broadcast({ type: 'teamList', teamList });
        broadcast({ type: 'selectTeam', team: null });
        break;

      case 'updateColors':
        broadcast({
          type: 'updateColors',
          backgroundColor: data.backgroundColor,
          textColor: data.textColor
        });
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  });
});

// ✅ use dynamic port (needed for Render)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
