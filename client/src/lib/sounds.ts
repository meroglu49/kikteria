// Sound effects for Kikteria using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Sound definitions for each bacteria type
const BACTERIA_SOUNDS: Record<string, () => void> = {
  blobby: () => playBlobbySound(),
  grumpus: () => playGrumpusSound(),
  wobbly: () => playWobblySound(),
  cyclops: () => playCyclopsSound(),
  squish: () => playSquishSound(),
  chompy: () => playChompySound(),
  derp: () => playDerpSound(),
  ghosty: () => playGhostySound(),
  spiky: () => playSpikySound(),
  gloop: () => playGloopSound(),
  bomb: () => playBombPlaceSound(),
};

// Blobby - silly wet plop sound
function playBlobbySound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

// Grumpus - angry grunt
function playGrumpusSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.setValueAtTime(70, ctx.currentTime + 0.05);
  osc.frequency.setValueAtTime(60, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

// Wobbly - worried wobble sound
function playWobblySound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(20, ctx.currentTime);
  lfoGain.gain.setValueAtTime(50, ctx.currentTime);
  
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  lfo.start(ctx.currentTime);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
  lfo.stop(ctx.currentTime + 0.3);
}

// Cyclops - alien bleep
function playCyclopsSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
  osc.frequency.setValueAtTime(500, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

// Squish - cute squeak
function playSquishSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.18);
}

// Chompy - chomping bite sound
function playChompySound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.setValueAtTime(100, ctx.currentTime + 0.03);
  osc.frequency.setValueAtTime(150, ctx.currentTime + 0.06);
  osc.frequency.setValueAtTime(80, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.03);
  gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

// Derp - confused "boing" sound
function playDerpSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

// Ghosty - spooky whoosh
function playGhostySound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.3);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}

// Spiky - sharp zap sound
function playSpikySound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

// Gloop - bubbly gloop sound
function playGloopSound() {
  const ctx = getAudioContext();
  
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const delay = i * 0.05;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 + i * 50, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(100 + i * 30, ctx.currentTime + delay + 0.1);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.12);
  }
}

// Bomb placement sound - Bomberman/Super Nintendo style explosion
function playBombPlaceSound() {
  const ctx = getAudioContext();
  
  // Initial attack - sharp noise burst like SNES explosions
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    // Decaying noise
    const decay = 1 - (i / noiseData.length);
    noiseData[i] = (Math.random() * 2 - 1) * decay;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(2000, ctx.currentTime);
  noiseFilter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSource.start(ctx.currentTime);
  
  // Deep bass punch - like Bomberman explosion
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = 'sine';
  bassOsc.frequency.setValueAtTime(150, ctx.currentTime);
  bassOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
  bassGain.gain.setValueAtTime(0.5, ctx.currentTime);
  bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  bassOsc.connect(bassGain);
  bassGain.connect(ctx.destination);
  bassOsc.start(ctx.currentTime);
  bassOsc.stop(ctx.currentTime + 0.2);
  
  // Mid-frequency "pow" - gives it that 16-bit punch
  const midOsc = ctx.createOscillator();
  const midGain = ctx.createGain();
  midOsc.type = 'square';
  midOsc.frequency.setValueAtTime(200, ctx.currentTime);
  midOsc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
  midGain.gain.setValueAtTime(0.15, ctx.currentTime);
  midGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
  midOsc.connect(midGain);
  midGain.connect(ctx.destination);
  midOsc.start(ctx.currentTime);
  midOsc.stop(ctx.currentTime + 0.12);
}

export function playPlacementSound(templateId: string) {
  const soundFn = BACTERIA_SOUNDS[templateId];
  if (soundFn) {
    try {
      soundFn();
    } catch (e) {
      // Audio context might not be available
      console.log('Sound not available');
    }
  }
}

// Retro 8-bit victory fanfare like classic arcade games
export function playSuccessSound() {
  const ctx = getAudioContext();
  
  // Classic victory melody - ascending triumphant notes
  const melody = [
    { freq: 392, time: 0, duration: 0.1 },      // G4
    { freq: 523.25, time: 0.1, duration: 0.1 }, // C5
    { freq: 659.25, time: 0.2, duration: 0.1 }, // E5
    { freq: 783.99, time: 0.3, duration: 0.15 }, // G5
    { freq: 659.25, time: 0.45, duration: 0.1 }, // E5
    { freq: 783.99, time: 0.55, duration: 0.3 }, // G5 (held)
  ];
  
  melody.forEach(({ freq, time, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square'; // 8-bit retro sound
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime + time);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + time + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + duration);
  });
  
  // Add sparkle/twinkle effect
  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = 0.6 + i * 0.08;
    const freq = 1500 + Math.random() * 1000;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + 0.1);
  }
}

// Sad but funny game over sound - like a deflating balloon with a comedic "wah wah"
export function playGameOverSound() {
  const ctx = getAudioContext();
  
  // Descending "wah wah wahhh" - classic cartoon fail sound
  const notes = [
    { freq: 440, time: 0, duration: 0.25 },     // A4
    { freq: 392, time: 0.3, duration: 0.25 },   // G4
    { freq: 349.23, time: 0.6, duration: 0.5 }, // F4 (long sad note)
  ];
  
  notes.forEach(({ freq, time, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
    // Add slight vibrato for comedic effect
    osc.frequency.setValueAtTime(freq * 0.98, ctx.currentTime + time + duration * 0.3);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time + duration * 0.6);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime + time);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + duration);
  });
  
  // Funny descending slide whistle effect at the end
  const slideOsc = ctx.createOscillator();
  const slideGain = ctx.createGain();
  
  slideOsc.type = 'sine';
  slideOsc.frequency.setValueAtTime(600, ctx.currentTime + 1.0);
  slideOsc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1.5);
  
  slideGain.gain.setValueAtTime(0.2, ctx.currentTime + 1.0);
  slideGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
  
  slideOsc.connect(slideGain);
  slideGain.connect(ctx.destination);
  slideOsc.start(ctx.currentTime + 1.0);
  slideOsc.stop(ctx.currentTime + 1.5);
  
  // Add a comedic "boing" at the very end
  const boingOsc = ctx.createOscillator();
  const boingGain = ctx.createGain();
  
  boingOsc.type = 'sine';
  boingOsc.frequency.setValueAtTime(150, ctx.currentTime + 1.5);
  boingOsc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.6);
  boingOsc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.8);
  
  boingGain.gain.setValueAtTime(0.2, ctx.currentTime + 1.5);
  boingGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);
  
  boingOsc.connect(boingGain);
  boingGain.connect(ctx.destination);
  boingOsc.start(ctx.currentTime + 1.5);
  boingOsc.stop(ctx.currentTime + 1.8);
}
