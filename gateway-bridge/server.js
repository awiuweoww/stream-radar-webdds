const WebSocket = require('ws');
const net = require('net');

const WS_PORT = 8080;
const TCP_PORT = 9090;

const wss = new WebSocket.Server({ port: WS_PORT });
let cppSocket = null;

const tcpServer = net.createServer((socket) => {
    console.log('🏗️  Backend C++ Terhubung (BINARY MODE)!');
    cppSocket = socket;
    
    let expectedSize = 0;
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        
        while (true) {
            // Baca header 4-byte (Ukuran Data) jika belum tahu berapa biner yang masuk
            if (expectedSize === 0 && buffer.length >= 4) {
                expectedSize = buffer.readUInt32LE(0);
                buffer = buffer.subarray(4);
            }

            // Jika buffer sudah penuh sesuai header, kirim mentah-mentah ke Browser
            if (expectedSize > 0 && buffer.length >= expectedSize) {
                const binaryPacket = buffer.subarray(0, expectedSize);
                buffer = buffer.subarray(expectedSize);
                
                broadcast(binaryPacket);
                
                expectedSize = 0; // Reset untuk paket berikutnya
            } else {
                break;
            }
        }
    });

    socket.on('close', () => { cppSocket = null; });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        // Kirim data biner tanpa membukanya (Zero-Copy)
        if (client.readyState === WebSocket.OPEN && client.bufferedAmount === 0) {
            client.send(data, { binary: true });
        }
    });
}

tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
    console.log(`🔌 Gateway BINARY Aktif di port ${WS_PORT} & ${TCP_PORT}`);
});

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        if (cppSocket) cppSocket.write(msg + '\n');
    });
});
