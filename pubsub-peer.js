const IPFS = require("ipfs");
const Room = require("ipfs-pubsub-room");

async function createNode() {
  var ipfs = await IPFS.create({
    repo: (() => `ipfs-temp-repo/repo-${Math.random()}`)(),
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

  // Subscribe to Topic
  ipfs.pubsub.subscribe("deepspeech", (message) => {
    console.log(message.data.toString());
  });
}

// create IPFS node
createNode();
