const IPFS = require("ipfs");
const Room = require("ipfs-pubsub-room");

var room;
// create IPFS node
async function createNode() {
  var ipfs = await IPFS.create({
    repo: (() => `ipfs-temp-repo/repo-${Math.random()}`)(),
    Addresses: {
      Swarm: ["/ip4/0.0.0.0/tcp/4009", "/ip4/127.0.0.1/tcp/4008/ws"],
      API: "/ip4/127.0.0.1/tcp/5003",
      Gateway: "/ip4/127.0.0.1/tcp/9091",
    },
    EXPERIMENTAL: {
      pubsub: true, // required, enables pubsub
    },
  });
  try {
    await ipfs.start();
    console.log("Node started!");
  } catch (error) {
    console.error("Node failed to start!", error);
  }
  room = new Room(ipfs, "deepspeech");

  room.on("peer joined", (peer) => console.log("peer " + peer + " joined"));
  room.on("peer left", (peer) => console.log("peer " + peer + " left"));
  room.on("message", (message) => console.log(message.data.toString()));
}

createNode();
