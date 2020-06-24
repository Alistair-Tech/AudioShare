// SETTING CONSTANTS

// path to deepspeech english model directory
const DEEPSPEECH_MODEL =
  __dirname + "/deepspeech-models/deepspeech-0.7.0-models";

// milliseconds of inactivity before processing the audio
const SILENCE_THRESHOLD = 200; // 0.2s

// Threshold value for timing out if no inactivity is detected
const INACTIVITY_THRESHOLD = 10000; // 10s

module.exports = { DEEPSPEECH_MODEL, SILENCE_THRESHOLD, INACTIVITY_THRESHOLD };
