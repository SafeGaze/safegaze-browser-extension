// src/content/worker.js
onmessage = function(e) {
  console.log(e.data);
  postMessage(["worker", "message"]);
};
