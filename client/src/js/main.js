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
    <h4>Search Audio on IPFS</h4>
    <label for='cid'>Enter CID</label>
    <input type='text' id='cid' name='cid'>
    <br>
    <br>
    <button onClick=searchOnIPFS()>Search</button>
  </div>
`;

/**
 * loadDiv() dynamically renders HTML based on user's choice
 * selected varibale indicates user's choice
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
    loadAudio();
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

async function searchOnIPFS() {
  let cId = document.getElementById("cid").value;
  console.log(cId);
  let results;
  loadDiv(2);
  const ipfs = window.IpfsHttpClient({ host: "localhost", port: 5001 });
  try {
    results = await ipfs.cat(new window.Cids(cId));
  } catch {
    alert("Invalid Hash for an audio file! Please Try Again.");
    return;
  }
  let count = 0;
  for await (let result of results) {
    count++;
  }
  if (count === 0) {
    alert("Failed to find an audio file with this hash! Please Try Again! ");
    return;
  }
  divToRender = document.getElementById("toRender");
  divToRender.innerHTML += `
    <div>
      <audio id='recordedAudio'></audio>
      <a id='link'>Download Audio</a>
    </div>
  `;
  audio = document.getElementById("recordedAudio");
  audioDownload = document.getElementById("link");
  audioDownload.href = "http://127.0.0.1:8080/ipfs/" + cId;
  audio.src = "http://127.0.0.1:8080/ipfs/" + cId;
  audio.controls = true;
}

function handleError() {
  loadDiv(2);
  alert("This audio is not available on IPFS right now!");
}
