const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>🍳 KitchenSync Cloud Broker is Active!</h1>`);
});

const wss = new WebSocket.Server({ server });
const clients = new Map(); // WebSocket -> Room ID (String)

wss.on('connection', (ws) => {
    clients.set(ws, null);
    ws.on('message', (message) => {
        try {
            const rawText = message.toString();
            const action = JSON.parse(rawText);
            if (action.type === 'JOIN') {
                const roomId = (action.payload || 'KITCHEN_DEFAULT').trim().toUpperCase();
                clients.set(ws, roomId);
                return;
            }
            const currentRoom = clients.get(ws);
            if (!currentRoom) return;
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    if (clients.get(client) === currentRoom) {
                        client.send(rawText);
                    }
                }
            });
        } catch (e) {
            console.error(e);
        }
    });
    ws.on('close', () => { clients.delete(ws); });
});

server.listen(PORT, () => { console.log('Broker running on port ' + PORT); });
