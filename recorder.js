document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    button: document.getElementById("recButton"),
    idleLabel: document.querySelector(".record-button__label--idle"),
    activeLabel: document.querySelector(".record-button__label--active"),
    card: document.getElementById("recordingCard"),
    statusText: document.getElementById("statusText"),
    timestamp: document.getElementById("recordingTimestamp"),
    control: document.getElementById("recordingControl"),
    waveform: document.getElementById("recordingWaveform"),
    emailForm: document.getElementById("recordingEmailForm"),
    feedback: document.getElementById("recordingFeedback"),
    emailInput: document.getElementById("recordingEmail"),
    emailFeedback: document.getElementById("recordingEmailFeedback"),
  };

  if (!elements.button || !elements.card) {
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionSupported = Boolean(SpeechRecognition);

  const state = {
    stage: "idle",
    audioStream: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    animationId: null,
    transcript: "",
    recognition: null,
    bars: [],
    startedAt: null,
    hasMicPermission: false,
  };

  const HEADLINES = {
    idle: "Start a Recording",
    recording: "Recording In Progress",
    paused: "Recording Paused",
  };

  const BUTTON_LABELS = {
    idle: "Start recording",
    recording: "Pause recording",
    paused: "Resume recording",
  };

  const EMAIL_UNAVAILABLE_MESSAGE =
    "Transcripts are not available in this browser.";

  initialiseWaveform();
  setWaveformScale(0.18);
  updateTimestamp();
  updateUI();
  setupEventListeners();
  if (!recognitionSupported) {
    setGeneralFeedback(EMAIL_UNAVAILABLE_MESSAGE);
  }

  function setupEventListeners() {
    elements.button.addEventListener("click", handlePrimaryToggle);
    elements.button.addEventListener("keydown", handleButtonKeyDown);
    if (elements.control) {
      elements.control.addEventListener("click", handlePrimaryToggle);
    }
    if (elements.emailForm) {
      elements.emailForm.addEventListener("submit", handleEmailSubmit);
    }
    window.addEventListener("beforeunload", cleanup);
  }

  function handleButtonKeyDown(event) {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      handlePrimaryToggle();
    }
  }

  function handlePrimaryToggle() {
    switch (state.stage) {
      case "idle":
        return startRecording();
      case "recording":
        return pauseRecording();
      case "paused":
        return resumeRecording();
      default:
        return;
    }
  }

  function startRecording() {
    state.transcript = "";
    if (elements.emailInput) {
      elements.emailInput.value = "";
    }
    setEmailFeedback("");
    if (recognitionSupported) {
      setGeneralFeedback("");
    }
    ensureAudioSession()
      .then(() => {
        state.stage = "recording";
        const now = new Date();
        state.startedAt = now;
        updateTimestamp();
        startWaveform();
        startSpeechRecognition();
        updateUI();
      })
      .catch((error) => {
        console.error(error);
        setGeneralFeedback(
          "We couldn't access your microphone. Please check your permissions."
        );
        state.stage = "idle";
        state.startedAt = null;
        updateUI();
      });
  }

  function pauseRecording() {
    state.stage = "paused";
    stopSpeechRecognition();
    stopWaveform();
    updateUI();
  }

  function resumeRecording() {
    if (!state.audioStream) {
      return startRecording();
    }
    state.stage = "recording";
    updateTimestamp();
    startWaveform();
    startSpeechRecognition();
    setEmailFeedback("");
    updateUI();
  }

  function ensureAudioSession() {
    if (state.audioStream) {
      return Promise.resolve(state.audioStream);
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(
        new Error("Microphone access is not supported in this browser.")
      );
    }
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        state.audioStream = stream;
        state.hasMicPermission = true;
        setupAnalyser(stream);
        return stream;
      });
  }

  function setupAnalyser(stream) {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext || null;
    if (!AudioContext) {
      return;
    }
    if (!state.audioContext) {
      state.audioContext = new AudioContext();
    }
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    state.dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    const source = state.audioContext.createMediaStreamSource(stream);
    source.connect(state.analyser);
  }

  function startWaveform() {
    if (!state.analyser) {
      updateWaveformBaseline();
      return;
    }
    if (state.audioContext && state.audioContext.state === "suspended") {
      state.audioContext.resume().catch(() => {});
    }
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
    }
    const draw = () => {
      if (state.stage !== "recording") {
        return;
      }
      state.analyser.getByteFrequencyData(state.dataArray);
      const segment = Math.floor(
        state.dataArray.length / Math.max(state.bars.length, 1)
      );
      state.bars.forEach((bar, index) => {
        const offset = index * segment;
        let sum = 0;
        for (let i = 0; i < segment; i += 1) {
          sum += state.dataArray[offset + i] || 0;
        }
        const averaged = sum / segment;
        const scale = Math.max(averaged / 255, 0.18);
        bar.style.setProperty("--scale", scale.toFixed(2));
      });
      state.animationId = requestAnimationFrame(draw);
    };
    draw();
  }

  function stopWaveform() {
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }
    updateWaveformBaseline();
  }

  function startSpeechRecognition() {
    if (!recognitionSupported) {
      return;
    }
    stopSpeechRecognition();
    try {
      state.recognition = new SpeechRecognition();
      state.recognition.continuous = true;
      state.recognition.interimResults = true;
      state.recognition.lang = "en-GB";
      state.recognition.onresult = handleRecognitionResult;
      state.recognition.onerror = handleRecognitionError;
      state.recognition.onend = () => {
        if (state.stage === "recording") {
          try {
            state.recognition?.start();
          } catch (error) {
            console.error("Unable to restart recognition", error);
          }
        }
      };
      state.recognition.start();
    } catch (error) {
      console.error(error);
      setGeneralFeedback("Speech recognition could not be started.");
    }
  }

  function stopSpeechRecognition() {
    if (state.recognition) {
      try {
        state.recognition.onresult = null;
        state.recognition.onerror = null;
        state.recognition.onend = null;
        state.recognition.stop();
      } catch {
        /* ignore */
      }
      state.recognition = null;
    }
  }

  function handleRecognitionResult(event) {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      if (result.isFinal) {
        state.transcript += `${transcript}. `;
      }
    }
    updateTranscriptAvailability();
  }

  function handleRecognitionError(event) {
    if (event.error === "not-allowed") {
      setGeneralFeedback(
        "Microphone access was denied. Please allow it to generate transcripts."
      );
      pauseRecording();
    }
  }

  function handleEmailSubmit(event) {
    event.preventDefault();
    if (!state.transcript.trim()) {
      setEmailFeedback("No transcript available yet. Record a message first.");
      return;
    }
    const email = (elements.emailInput.value || "").trim();
    if (!email) {
      setEmailFeedback("Enter an email address to send the transcript.");
      return;
    }
    const subject = encodeURIComponent("Recap - Meeting transcript");
    const body = encodeURIComponent(
      `Here is your transcript from ${formatTimestamp(
        state.startedAt || new Date()
      )}:\n\n${state.transcript.trim()}`
    );
    window.location.href = `mailto:${encodeURIComponent(
      email
    )}?subject=${subject}&body=${body}`;
    setEmailFeedback("Opening your email client to send the transcript.");
  }

  function updateUI() {
    const { stage } = state;
    elements.button.classList.toggle("is-recording", stage === "recording");
    elements.button.classList.toggle("is-paused", stage === "paused");
    elements.button.setAttribute(
      "aria-pressed",
      String(stage === "recording")
    );
    elements.card.dataset.state = stage;

    if (elements.idleLabel) {
      elements.idleLabel.innerHTML =
        stage === "paused" ? "Resume<br />Recording" : "Click to<br />Record";
    }
    if (elements.activeLabel) {
      elements.activeLabel.textContent = ". REC";
    }

    const headline = HEADLINES[stage] || HEADLINES.idle;
    elements.statusText.textContent = headline;
    updateTimestamp();

    const controlLabel = BUTTON_LABELS[stage] || BUTTON_LABELS.idle;
    elements.button.setAttribute("aria-label", controlLabel);
    if (elements.control) {
      elements.control.setAttribute("aria-label", controlLabel);
      elements.control.setAttribute(
        "aria-pressed",
        String(stage === "recording")
      );
    }

    if (stage !== "recording") {
      updateWaveformBaseline();
    } else if (recognitionSupported) {
      setGeneralFeedback("");
    }

    updateTranscriptAvailability();
  }

  function updateTranscriptAvailability() {
    if (!elements.emailForm) {
      return;
    }
    if (!recognitionSupported) {
      elements.emailForm.hidden = true;
      setGeneralFeedback(EMAIL_UNAVAILABLE_MESSAGE);
      return;
    }
    const shouldShowForm =
      state.stage === "paused" && state.transcript.trim().length > 0;
    elements.emailForm.hidden = !shouldShowForm;
    if (!shouldShowForm) {
      setEmailFeedback("");
    }
  }

  function updateTimestamp() {
    if (!elements.timestamp) {
      return;
    }
    const now = new Date();
    if (state.stage === "recording" || state.stage === "paused") {
      const started = state.startedAt || now;
      elements.timestamp.textContent = formatTimestamp(started);
    } else {
      elements.timestamp.textContent = formatTimestamp(now);
    }
  }

  function formatTimestamp(date) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const parts = formatter.formatToParts(date);
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${lookup.day} ${lookup.month} ${lookup.year} \u2013 ${lookup.hour}:${lookup.minute} ${lookup.dayPeriod?.toLowerCase() || ""}`.trim();
  }

  function setWaveformScale(value) {
    state.bars.forEach((bar) =>
      bar.style.setProperty("--scale", value.toFixed(2))
    );
  }

  function updateWaveformBaseline() {
    if (state.stage === "paused") {
      setWaveformScale(0.32);
    } else if (state.stage === "recording") {
      setWaveformScale(0.28);
    } else {
      setWaveformScale(0.18);
    }
  }

  function initialiseWaveform() {
    if (!elements.waveform) {
      return;
    }
    const barCount = 52;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < barCount; i += 1) {
      const bar = document.createElement("span");
      bar.className = "recording-waveform__bar";
      bar.style.setProperty("--scale", "0.18");
      fragment.appendChild(bar);
      state.bars.push(bar);
    }
    elements.waveform.appendChild(fragment);
  }

  function setGeneralFeedback(message) {
    if (!elements.feedback) return;
    elements.feedback.textContent = message || "";
  }

  function setEmailFeedback(message) {
    if (!elements.emailFeedback) return;
    elements.emailFeedback.textContent = message || "";
  }

  function cleanup() {
    stopSpeechRecognition();
    stopWaveform();
    if (state.audioStream) {
      state.audioStream.getTracks().forEach((track) => track.stop());
      state.audioStream = null;
    }
    if (state.audioContext) {
      state.audioContext.close().catch(() => {});
      state.audioContext = null;
    }
  }
});
