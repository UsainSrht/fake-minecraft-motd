const mc = require('minecraft-protocol');

const motd = '§aMy Fake Server §7| §bWelcome!';
const version = '1.20.4';

const server = mc.createServer({
  'online-mode': false,     // no Mojang auth
  encryption: false,        // no login encryption
  host: '0.0.0.0',
  port: process.env.PORT || 25565,
  version: version
});

server.on('listening', () => {
  console.log(`🚀 Fake Minecraft MOTD server listening on port ${server.address().port}`);
});

// Fired when client does the status ping
server.on('status', (response, client) => {
  response.version.name   = version;
  response.version.protocol = mc.supportedVersions[version];
  response.players.max    = 100;
  response.players.online = 0;
  response.description    = { text: motd };
  client.write('status', response);
  console.log(`◀ Sent status response to ${client.socket.remoteAddress}:${client.socket.remotePort}`);
});

// Immediately close on login attempts
server.on('login', client => {
  client.close();
});