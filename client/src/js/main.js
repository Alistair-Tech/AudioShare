let home = `
    <button onClick=setSelected(1)>Share Audio</button>
    <button onClick=setSelected(2)>Retrieve Audio</button>
`;

let share = `
    <button id='start' onclick=toggleRecording("start")>
      Start Recording
    </button>
    <button id='stop' onclick=toggleRecording("stop")>
      Stop Recording
    </button>
    <button onClick='setSelected(0)'>Back</button>
`;

let retrieve = `
    <p>TODO:Add Search feature</p>
    <button onClick=setSelected(0)>Back</button>
`;

/**
 * loadDiv() dynamically renders HTML based on user's choice
 * selected varibale indicates user's choice
 */

var selected = 0;

function loadDiv() {
  divToRender = document.getElementById("toRender");
  if (!selected) {
    divToRender.innerHTML = home;
  } else if (selected == 1) {
    divToRender.innerHTML = share;
    loadAudio();
  } else if (selected == 2) {
    divToRender.innerHTML = retrieve;
  }
}

function setSelected(id) {
  selected = id;
  loadDiv();
}

/**
 * Audio Functions:
 * loadAudio() takes access of user's audio devices
 * toggleRecording() starts/stops audio recording
 * audioHandler() combines the audioChunks retrieved from the audio stream
 */

var rec;

function loadAudio() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioHandler(stream);
  });
}

function toggleRecording(id) {
  let start = document.getElementById("start");
  let stop = document.getElementById("stop");
  if (id == "start") {
    start.disabled = true;
    stop.disabled = false;
    audioChunks = [];
    rec.start();
  } else {
    rec.stop();
    audioChunks = [];
    stop.disabled = true;
    start.disabled = false;
  }
}

function audioHandler(stream) {
  rec = new MediaRecorder(stream);
  rec.ondataavailable = (e) => {
    audioChunks.push(e.data);
    if (rec.state == "inactive") {
      let blob = new Blob(audioChunks, { type: "audio/mpeg-3" });
      /**
       * TODO:
       * Add feature to share recored audio on IPFS
       * Add feature to download/play the recorded audio
       */
    }
  };
}

loadDiv();
