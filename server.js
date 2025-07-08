const net = require("net");

const motd = "§aMy Fake Server §7| §bWelcome!";
const version = "1.20.4";

const server = net.createServer(socket => {
  const remoteAddress = socket.remoteAddress + ":" + socket.remotePort;
  console.log(`[+] Connection from ${remoteAddress}`);

  socket.once("data", (data) => {
    console.log(`[>] Received data from ${remoteAddress}: ${data.toString("hex")}`);

    const response = {
      version: { name: version, protocol: 763 },
      players: { max: 100, online: 0, sample: [] },
      description: { text: motd },
    };

    const json = JSON.stringify(response);
    const dataBuffer = Buffer.from(json, "utf-8");

    const packet = Buffer.concat([
      Buffer.from([0x00]), // packet ID
      Buffer.from([dataBuffer.length]), // length
      dataBuffer
    ]);

    socket.write(Buffer.concat([
      Buffer.from([0x00, packet.length]),
      packet
    ]));

    console.log(`[<] Sent MOTD to ${remoteAddress}`);
    socket.end();
  });

  socket.on("end", () => {
    console.log(`[-] Connection from ${remoteAddress} closed`);
  });

  socket.on("error", err => {
    console.log(`[!] Error with ${remoteAddress}:`, err.message);
  });
});

// ✅ Bind to 0.0.0.0 so Fly.io can route to it
const PORT = process.env.PORT || 25565;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Fake Minecraft MOTD server running on port ${PORT}`);
});
