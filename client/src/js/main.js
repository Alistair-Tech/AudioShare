/**
 * TODO:
 * Implement error handling for bad/invalid/non-existent CID input while searching on IPFS
 */

let home = `
    <button class="button" onClick=setSelected(1)>Share Audio</button>
    <button class="button" onClick=setSelected(2)>Retrieve Audio</button>
`;

let share = `
    <button id='recordButton' class="button" onclick=toggleRecording()>
      Start Recording
    </button>
    <br>


`;

let retrieve = `
    <h4>Search Audio on IPFS</h4>
    <label for='cid'>Enter CID</label>
    <input type='text' id='cid' name='cid'>
    <br>
    <button class="button" onClick=searchOnIPFS()>Search</button>
    <br>
  </div>
`;

/**
 * loadDiv() dynamically renders HTML based on user's choice
 * selected variable indicates user's choice
 */

var selected = 0;

function loadDiv() {
  let divToRender = document.getElementById("toRender");
  let back = document.getElementById("temp");
  if (!selected) {
    divToRender.innerHTML = home;
    back.style.visibility = "hidden"; // Make the back button invisible for home page
  } else if (selected == 1) {
    divToRender.innerHTML = share;
    back.style.visibility = "visible";
  } else if (selected == 2) {
    divToRender.innerHTML = retrieve;
    back.style.visibility = "visible";
  }
}

// Load the div to render html content
loadDiv();

function setSelected(id) {
  selected = id;
  loadDiv(); // Load div again to get new content
}

/**
 * Audio Functions:
 * loadAudio() takes access of user's audio devices
 * toggleRecording() starts/stops audio recording
 * audioHandler() combines the audioChunks retrieved from the audio stream
 */

// Socket Initialization
var socket = io();
let rec, blob, audioContext;

function loadAudio() {
  audioContext = new AudioContext();
  let bufferSize = 1024 * 16;
  var processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
  processor.connect(audioContext.destination);

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioHandler(stream);
  });

  function audioHandler(stream) {
    rec = new MediaRecorder(stream);
    // Start Recording
    rec.start();

    input = audioContext.createMediaStreamSource(stream);
    input.connect(processor);

    processor.onaudioprocess = (e) => {
      microphoneProcess(e); // receives data from microphone
    };

    async function microphoneProcess(e) {
      const left = e.inputBuffer.getChannelData(0); // get only one audio channel
      const left16 = convertFloat32ToInt16(left); //convert to BINARY16
      await socket.emit("micBinaryStream", left16); // send to transcriptor via web socket
    }

    // Convert data to BINARY16
    function convertFloat32ToInt16(buffer) {
      let l = buffer.length;
      const buf = new Int16Array(l / 3);

      while (l--) {
        if (l % 3 === 0) {
          buf[l / 3] = buffer[l] * 0xffff;
        }
      }
      return buf.buffer;
    }

    rec.ondataavailable = (e) => {
      audioChunks.push(e.data);
      blob = new Blob(audioChunks, { type: "audio/wav" });
      if (rec.state == "inactive") {
        blob = new Blob(audioChunks, { type: "audio/mpeg-3" });
        let blobUrl = URL.createObjectURL(blob);
        addOptions("share", blobUrl);
      }
    };
  }
}

async function toggleRecording(id) {
  let record = document.getElementById("recordButton");
  try {
    if (record.innerHTML === "Start Recording") {
      record.innerHTML = "Stop Recording";
      loadAudio();
    } else {
      rec.stop();
      audioChunks = [];
      audioContext.close();
      await socket.emit("endAudioStream", "close");
      blob = null;
      record.innerHTML = "Start Recording";
    }
  } catch {
    alert("Please turn on Audio and Try Again!");
  }
}

async function shareOnIPFS() {
  // Initialize object to work with IPFS API
  const ipfs = window.IpfsHttpClient({ host: "localhost", port: 5001 });
  const results = await ipfs.add(blob);

  // Iterate over the async iterator to fetch the hash
  for await (let result of results) {
    alert(
      "The audio has been successfully shared on IPFS with CID: " + result.path
    );
  }
}

function searchOnIPFS() {
  // TODO: Add error handling for search feature

  let cId = document.getElementById("cid").value;
  let url = "http://127.0.0.1:8080/ipfs/" + cId;
  loadDiv(2); // Re-render the page to remove previous result (if any)
  addOptions("search", url);
}

function addOptions(purpose, url) {
  divToRender = document.getElementById("toRender");
  divToRender.innerHTML += `
      <br>
      <audio id='recordedAudio'></audio>
      <br>
      <a id='link'>Download Audio</a>
      <br>
  `;
  if (purpose === "share") {
    divToRender.innerHTML += `
      <br>
      <button class="button" onClick=shareOnIPFS()>Share on IPFS</button>
    `;
  }
  audio = document.getElementById("recordedAudio");
  audioDownload = document.getElementById("link");
  audioDownload.href = url;
  audio.src = url;
  audio.controls = true;
}
