let audioContext, analyser, dataArray, bufferLength;
let lastBeatTime = 0;
const beatThreshold = 10;
let particles = [];
let beatTimes = [];
let bpm = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(32);
  fill(255);
  noStroke();

  // Capture audio from the microphone
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      source.connect(analyser);

      analyser.fftSize = 2048;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    })
    .catch((err) => {
      console.error("Error accessing audio stream:", err);
    });
}

function draw() {
  background(0);

  if (analyser) {
    analyser.getByteFrequencyData(dataArray);

    stroke(255);
    let wave = [];
    for (let i = 0; i < bufferLength; i++) {
      let x = map(i, 0, bufferLength, 0, width);
      let y = map(dataArray[i], 0, 255, height, 0);
      wave.push({ x, y });
    }

    beginShape();
    for (let i = 0; i < wave.length; i++) {
      vertex(wave[i].x, wave[i].y);
    }
    endShape();

    detectBeat();
  }

  updateParticles();
  displayBPM();
}

function detectBeat() {
  const now = audioContext.currentTime * 1000; // Convert to milliseconds
  const sum = dataArray.reduce((a, b) => a + b, 0);
  const average = sum / dataArray.length;

  if (average > beatThreshold && now - lastBeatTime > 500) {
    // 500ms debounce
    lastBeatTime = now;
    console.log("Beat detected!");
    flashScreen();
    createParticles();
    calculateBPM(now);
  }
}

function flashScreen() {
  background(255, 0, 0);
}

function createParticles() {
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].finished()) {
      particles.splice(i, 1);
    }
  }
}

function calculateBPM(now) {
  beatTimes.push(now);
  if (beatTimes.length > 10) {
    beatTimes.shift(); // Keep only the last 10 beat times
  }

  if (beatTimes.length > 1) {
    const intervals = [];
    for (let i = 1; i < beatTimes.length; i++) {
      intervals.push(beatTimes[i] - beatTimes[i - 1]);
    }
    const averageInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
    bpm = Math.round(60000 / averageInterval); // Convert to BPM
  }
}

function displayBPM() {
  text(`BPM: ${bpm}`, 10, 40);
}

class Particle {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.alpha = 255;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }

  finished() {
    return this.alpha < 0;
  }

  show() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.x, this.y, 16);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
