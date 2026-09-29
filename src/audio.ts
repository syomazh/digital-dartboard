let context: AudioContext | null = null;

export function unlockAudio() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
}

export function playSound(kind: "throw" | "hit" | "bull") {
  if (!context || context.state !== "running") return;
  const now = context.currentTime;
  const duration = kind === "throw" ? 0.13 : 0.22;
  const buffer = context.createBuffer(
    1,
    context.sampleRate * duration,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = kind === "throw" ? 1500 : 700;
  const gain = context.createGain();
  gain.gain.setValueAtTime(kind === "throw" ? 0.12 : 0.6, now);
  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start(now);
  if (kind !== "throw") {
    const oscillator = context.createOscillator();
    const thud = context.createGain();
    oscillator.frequency.setValueAtTime(kind === "bull" ? 280 : 160, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    thud.gain.setValueAtTime(0.3, now);
    thud.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    oscillator.connect(thud).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.22);
  }
}
