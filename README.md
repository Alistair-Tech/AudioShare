# AudioShare
A Web App to record and share audio on IPFS. This project also includes a script to transcribe the audio and share the transcript on IPFS in real-time.

This Web App uses the API at port 5001 and the gateway at port 8080, exposed on running the IPFS node as daemon.

The Web App connects to the `transcript_generator.js` script through Web Socket on port 3000.

IPFS Node Setup instructions: https://docs.ipfs.io/install/

  - To run the IPFS Node as daemon:
  ```
  $ ipfs daemon
  ```
  - To access the Web App in the browser, use the URL:
  ```
  http://127.0.0.1:8080/ipns/QmeWpo7nS7ASUwXK6m6A4f7S9QgrAjChLmkNxWbP37KZsT/
  ```
  - To set the environment for the `transcript-generator.js` script:
  ```
  $ npm install
  $ mkdir deepspeech-models
  $ cd deepspeech-models
  ```
  - Download the pre-trained DeepSpeech english model (1089MB):
  ```
  $ wget https://github.com/mozilla/DeepSpeech/releases/download/v0.7.0/deepspeech-0.7.0-models.pbmm
  $ wget https://github.com/mozilla/DeepSpeech/releases/download/v0.7.0/deepspeech-0.7.0-models.scorer
  ```
  - To run the script:
  ```
  $ node transcript-generator.js
  ```
