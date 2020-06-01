/**
 * TODO:
 * Add feature to share recored audio on IPFS
 * Add feature to fetch recorded audio from IPFS
 * Handle errors while audio recording
 */

let home = `
    <button onClick=setSelected(1)>Share Audio</button>
    <button onClick=setSelected(2)>Retrieve Audio</button>
`;

let share = `
    <button id='recordButton' onclick=toggleRecording()>
      Start Recording
    </button>
`;

let retrieve = `
    <p>TODO:Add Search feature</p>
`;

/**
 * loadDiv() dynamically renders HTML based on user's choice
 * selected varibale indicates user's choice
 */

var selected = 0;

function loadDiv() {
  let divToRender = document.getElementById("toRender");
  if (!selected) {
    divToRender.innerHTML = home;
  } else if (selected == 1) {
    divToRender.innerHTML = share;
    loadAudio();
  } else if (selected == 2) {
    divToRender.innerHTML = retrieve;
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

let rec, blob;

function loadAudio() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioHandler(stream);
  });
}

function toggleRecording(id) {
  let record = document.getElementById("recordButton");
  if (rec.state === "inactive") {
    AudioChunks = [];
    record.innerHTML = "Stop Recording";
    rec.start();
  } else {
    rec.stop();
    audioChunks = [];
    blob = null;
    record.innerHTML = "Start Recording";
  }
}

function audioHandler(stream) {
  rec = new MediaRecorder(stream);
  rec.ondataavailable = (e) => {
    audioChunks.push(e.data);
    if (rec.state == "inactive") {
      blob = new Blob(audioChunks, { type: "audio/mpeg-3" });
      let blobUrl = URL.createObjectURL(blob);
      divToRender = document.getElementById("toRender");
      divToRender.innerHTML += `
        <div>
          <audio id='recordedAudio'></audio>
          <a id='link'>Download Audio</a>
          <button onClick=shareOnIPFS()>Share on IPFS</button>
        </div>
      `;
      audio = document.getElementById("recordedAudio");
      audioDownload = document.getElementById("link");
      audioDownload.href = blobUrl;
      audio.src = blobUrl;
      audio.controls = true;
    }
  };
}

async function shareOnIPFS() {
  // Initialize object to work with IPFS API
  const ipfs = window.IpfsHttpClient({ host: "localhost", port: 5001 });
  const results = await ipfs.add(blob);

  // Iterate over thr async iterator to fetch the hash
  for await (let result of results) {
    alert(
      "The audio has been successfully shared on IPFS with CID: " + result.path
    );
  }
}
