import type { ChartData } from "./computeSeries";

type SonifyOptions = {
  chartData: ChartData;
  tempoMs?: number;          // time per datum
  minHz?: number;
  maxHz?: number;
  speakLabels?: boolean;     // optional speech
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // ignore if unsupported
  }
}

export function sonify(opts: SonifyOptions) {
  const tempoMs = opts.tempoMs ?? 280;
  const minHz = opts.minHz ?? 220;
  const maxHz = opts.maxHz ?? 880;
  const speakLabels = opts.speakLabels ?? false;

  const items = opts.chartData.items as Array<{ x: string; y: number }>;
  const ys = items.map((d) => d.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const denom = yMax - yMin || 1;

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new AudioCtx();

  let stopped = false;
  let currentOsc: OscillatorNode | null = null;

  const stop = () => {
    stopped = true;
    try {
      if (currentOsc) currentOsc.stop();
    } catch {}
    currentOsc = null;
    try {
      ctx.close();
    } catch {}
  };

  const playOne = async (i: number) => {
    if (stopped) return;

    const d = items[i];
    const t = clamp01((d.y - yMin) / denom);
    const freq = minHz + t * (maxHz - minHz);

    if (speakLabels) speak(`${d.x}, ${d.y}`);

    // oscillator + gain envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + tempoMs / 1000 - 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    currentOsc = osc;
    osc.start();
    osc.stop(ctx.currentTime + tempoMs / 1000);

    await new Promise((r) => setTimeout(r, tempoMs));
    if (i + 1 < items.length) return playOne(i + 1);
  };

  // Start playback
  void ctx.resume().then(() => playOne(0));

  return { stop };
}
