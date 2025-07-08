const net = require('net');

// Your custom MOTD and protocol version
const MOTD    = '§aMy Fake Server §7| §bWelcome!';
const VERSION = '1.20.4';
const PROTOCOL_VERSION = 763; // 1.20.4

// VarInt read/write helpers
function readVarInt(buf, offset = 0) {
  let numRead = 0, result = 0, read;
  do {
    read = buf[offset + numRead++];
    result |= (read & 0x7F) << (7 * (numRead - 1));
    if (numRead > 5) throw new Error('VarInt too big');
  } while ((read & 0x80) === 0x80);
  return { value: result, size: numRead };
}

function writeVarInt(value) {
  const bytes = [];
  do {
    let temp = value & 0x7F;
    value >>>= 7;
    if (value !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (value !== 0);
  return Buffer.from(bytes);
}

// Build a status response packet
function buildStatusPacket() {
  const payload = JSON.stringify({
    version: { name: VERSION, protocol: PROTOCOL_VERSION },
    players: { max: 100, online: 0, sample: [] },
    description: { text: MOTD }
  });

  const dataBuf = Buffer.from(payload, 'utf8');
  const packetId = writeVarInt(0x00);
  const length  = writeVarInt(packetId.length + dataBuf.length);

  return Buffer.concat([ length, packetId, dataBuf ]);
}

const server = net.createServer(socket => {
  const addr = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[+] New connection from ${addr}`);

  let stage = 0;
  let buffer = Buffer.alloc(0);

  socket.on('data', chunk => {
    buffer = Buffer.concat([ buffer, chunk ]);

    // Attempt to parse a full packet
    try {
      // 1) Read packet length
      const { value: packetLen, size: lenSize } = readVarInt(buffer, 0);
      if (buffer.length < lenSize + packetLen) return; // wait for more

      // 2) Read packet ID
      const { value: packetId, size: idSize } = readVarInt(buffer, lenSize);

      // 3) Slice out the packet body
      const bodyStart = lenSize + idSize;
      const body      = buffer.slice(bodyStart, lenSize + packetLen);

      if (stage === 0 && packetId === 0x00) {
        // Handshake packet — next state should be 1 (status)
        // we ignore all handshake fields
        stage = 1;
      }
      else if (stage === 1 && packetId === 0x00) {
        // Status request — reply and close
        console.log(`[>] Status request from ${addr}`);
        const resp = buildStatusPacket();
        socket.write(resp);
        console.log(`[<] Sent status response to ${addr}`);
        socket.end();
      }

      // Remove this packet from buffer
      buffer = buffer.slice(lenSize + packetLen);
    } catch (e) {
      console.error(`[!] Parse error from ${addr}:`, e.message);
      socket.destroy();
    }
  });

  socket.on('error', e => console.error(`[!] Socket error ${addr}:`, e.message));
  socket.on('end',   () => console.log(`[-] Disconnected ${addr}`));
});

// Bind on all interfaces so Fly.io routing works
const PORT = process.env.PORT || 25565;
server.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Fake Minecraft MOTD server listening on port ${PORT}`)
);
