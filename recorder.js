document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("recButton");
  const statusWrapper = document.getElementById("recordingStatus");
  const statusText = document.getElementById("statusText");

  if (!btn || !statusWrapper || !statusText) {
    return;
  }

  let recording = false;

  const updateUI = () => {
    btn.classList.toggle("is-recording", recording);
    statusWrapper.classList.toggle("is-recording", recording);
    btn.setAttribute("aria-pressed", String(recording));
    btn.setAttribute("aria-label", recording ? "Stop recording" : "Start recording");
    statusText.textContent = recording ? "Recording In Progress" : "Recording Not Started";
  };

  btn.addEventListener("click", () => {
    recording = !recording;
    updateUI();
  });

  btn.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      btn.click();
    }
  });

  updateUI();
});
