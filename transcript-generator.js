/**
 * Express server is setup just to avoid CORS issue in development.
 * In Production there won't be any express server and the static files shall
 * be served directly from IPFS
 */

var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
const DeepSpeech = require("deepspeech");
const VAD = require("node-vad");
const IpfsHttpClient = require("ipfs-http-client");
const DEEPSPEECH_MODEL = require("./settings.js").DEEPSPEECH_MODEL;
const SILENCE_THRESHOLD = require("./settings.js").SILENCE_THRESHOLD;
const INACTIVITY_THRESHOLD = require("./settings.js").INACTIVITY_THRESHOLD;

// Serve Static files to client
app.use(express.static("client/src"));

const VAD_MODE = VAD.Mode.VERY_AGGRESSIVE;
const vad = new VAD(VAD_MODE);

function createModel(modelDir) {
  let modelPath = modelDir + ".pbmm";
  let scorerPath = modelDir + ".scorer";
  let model = new DeepSpeech.Model(modelPath);
  model.enableExternalScorer(scorerPath);
  return model;
}

// Instantiate DeepSpeech Model
let englishModel = createModel(DEEPSPEECH_MODEL);

let modelStream;
let recordedChunks = 0;
let silenceStart = null;
let recordedAudioLength = 0;
let endTimeout = null;
let silenceBuffers = [];
let slash = 0;

// Audio Stream Handler Functions

function processAudioStream(data, callback) {
  vad.processAudio(data, 16000).then((res) => {
    switch (res) {
      case VAD.Event.ERROR:
        console.log("VAD ERROR");
        break;
      case VAD.Event.NOISE:
        console.log("VAD NOISE");
        break;
      case VAD.Event.SILENCE:
        processSilence(data, callback);
        break;
      case VAD.Event.VOICE:
        processVoice(data, callback); // Start precessing when voice is recognized
        break;
      default:
        console.log("default", res);
    }
  });

  // timeout in case no activity is detected
  clearTimeout(endTimeout);
  endTimeout = setTimeout(function () {
    if (recordedChunks > 0) {
      resetAudioStream();
      console.log("timeout");
    }
  }, INACTIVITY_THRESHOLD);
}

function endAudioStream(callback) {
  console.log("[end]");
  let results = finishStream();
  createStream(); // create Stream again for future connections
  if (results) {
    if (callback) {
      callback(results);
    }
  }
}

function resetAudioStream() {
  recordedChunks = 0;
  silenceStart = null;
  clearTimeout(endTimeout);
  console.log("[reset]");
  intermediateDecode(); // ignore results
}

// DeepSpeech Stream Handler Functions

function createStream() {
  modelStream = englishModel.createStream();
  recordedChunks = 0;
  recordedAudioLength = 0;
}

function finishStream() {
  if (modelStream) {
    let start = new Date();
    let text = modelStream.finishStream();
    if (text) {
      console.log("");
      console.log("Recognized Text:", text);
      let recogTime = new Date().getTime() - start.getTime();
      return {
        text,
        recogTime,
        audioLength: Math.round(recordedAudioLength),
      };
    }
  }
  silenceBuffers = [];
  modelStream = null;
}

// Stream Processor functions

function processSilence(data, callback) {
  if (recordedChunks > 0) {
    // recording is on
    // silence detected while recording
    feedAudioContent(data);
    if (silenceStart === null) {
      silenceStart = new Date().getTime();
    } else {
      let now = new Date().getTime();
      if (now - silenceStart > SILENCE_THRESHOLD) {
        silenceStart = null;
        console.log("[end]");
        let results = finishDecode();
        if (results) {
          if (callback) {
            callback(results);
          }
        }
      }
    }
  } else {
    // No Recording
    console.log("Waiting for Recording To Start"); // silence detected while not recording
    bufferSilence(data);
  }
}

function processVoice(data, callback) {
  silenceStart = null;
  console.clear();
  if (slash) {
    console.log("Recording /");
    slash = 0;
  } else {
    console.log("Recording \\");
    slash = 1;
  }
  data = addBufferedSilence(data);
  feedAudioContent(data);
  let results = intermediateDecode();
  if (results) {
    if (callback) {
      callback(results);
    }
  }
  recordedChunks++;
}

// Decoder Functions

function finishDecode() {
  let results = finishStream();
  createStream();
  return results;
}

function intermediateDecode() {
  let results = modelStream.intermediateDecode();
  return results;
}

// Helper Functions

function bufferSilence(data) {
  // VAD has a tendency to cut the first bit of audio data from the start of a recording
  // so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
  silenceBuffers.push(data);
  if (silenceBuffers.length >= 3) {
    silenceBuffers.shift();
  }
}

function addBufferedSilence(data) {
  let audioBuffer;
  if (silenceBuffers.length) {
    silenceBuffers.push(data);
    let length = 0;
    silenceBuffers.forEach(function (buf) {
      length += buf.length;
    });
    audioBuffer = Buffer.concat(silenceBuffers, length);
    silenceBuffers = [];
  } else audioBuffer = data;
  return audioBuffer;
}

function feedAudioContent(chunk) {
  recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
  modelStream.feedAudioContent(chunk);
}

// IPFS
async function shareOnIPFS(data) {
  // Initialize object to work with IPFS API
  try {
    const ipfs = IpfsHttpClient({ host: "localhost", port: 5002 });
    const results = await ipfs.add(data);

    // Iterate over the async iterator to fetch the hash
    for await (let result of results) {
      console.log(
        "The audio has been successfully shared on IPFS with CID: " +
          result.path
      );
    }
  } catch (err) {
    console.log("gre", err.message);
  }
}

// Socket Connection

io.on("connection", (socket) => {
  console.log("a user connected");
  createStream();
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("micBinaryStream", function (blob) {
    processAudioStream(blob, (results) => {
      console.log(results);
      const data = Buffer.from("some message content here");
    });
  });
  socket.on("endAudioStream", (data) => {
    endAudioStream((results) => {
      shareOnIPFS(results.text);
    });
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
