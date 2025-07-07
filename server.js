const net = require("net");

const motd = "§aMy Fake Server §7| §bWelcome!";
const version = "1.20.4";

const server = net.createServer(socket => {
  socket.once("data", () => {
    const response = {
      version: { name: version, protocol: 763 },
      players: { max: 100, online: 0, sample: [] },
      description: { text: motd },
    };

    const json = JSON.stringify(response);
    const data = Buffer.from(json, "utf-8");

    const packet = Buffer.concat([
      Buffer.from([0x00]),
      Buffer.from([data.length]),
      data
    ]);

    socket.write(Buffer.concat([
      Buffer.from([0x00, packet.length]),
      packet
    ]));

    socket.end();
  });
});

server.listen(process.env.PORT || 25565, () => {
  console.log("Fake Minecraft MOTD server running on port 25565");
});
