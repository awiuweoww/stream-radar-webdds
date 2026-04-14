/**
 * @file server.js
 * @description Gateway Bridge yang menghubungkan Backend C++ (TCP) dengan Frontend React (WebSocket).
 * Mengimplementasikan pola Binary Relay dengan kebijakan QoS Best Effort.
 */

const WebSocket = require('ws');
const net = require('net');

/** @const {number} WS_PORT - Port untuk koneksi WebSocket dari Dashboard */
const WS_PORT = 8080;
/** @const {number} TCP_PORT - Port untuk koneksi TCP dari Backend C++ */
const TCP_PORT = 9090;

/** @type {WebSocket.Server} wss - Instance server WebSocket */
const wss = new WebSocket.Server({ port: WS_PORT });
/** @type {net.Socket|null} cppSocket - Referensi ke socket aktif dari Backend C++ */
let cppSocket = null;

/**
 * Server TCP untuk menerima aliran data biner dari Backend C++.
 */
const tcpServer = net.createServer((socket) => {
    console.log('🏗️  Backend C++ Terhubung (BINARY MODE)!');
    cppSocket = socket;
    
    let expectedSize = 0;
    let buffer = Buffer.alloc(0);

    /**
     * Event handler saat menerima data biner dari C++.
     * Melakukan fragmentasi paket berdasarkan header 4-byte (length).
     */
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

/**
 * Mengirimkan data biner ke seluruh klien WebSocket yang terhubung.
 * Menerapkan kebijakan QoS Best Effort.
 * 
 * @param {Buffer} data - Payload biner yang akan dikirim (Radar Tracks).
 */
function broadcast(data) {
    wss.clients.forEach((client) => {
        // [QoS: BEST_EFFORT] 
        // berfungsi untuk mengirim data ke browser
        // qos ini akan mengirim data jika buffer socket kosong
        // jika buffer socket penuh maka data akan dilewati
        if (client.readyState === WebSocket.OPEN && client.bufferedAmount === 0) {
            client.send(data, { binary: true });
        }
    });
}

tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
    console.log(`🔌 Gateway BINARY Aktif di port ${WS_PORT} & ${TCP_PORT}`);
});

/**
 * Event handler untuk koneksi baru dari Dashboard (Frontend).
 */
wss.on('connection', (ws) => {
    /**
     * Meneruskan pesan perintah (JSON) dari Frontend ke Backend C++.
     */
    ws.on('message', (msg) => {
        if (cppSocket) cppSocket.write(msg + '\n');
    });
});
