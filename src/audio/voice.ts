/**
 * Voice callouts via the Web Speech API — zero-asset mission-control audio.
 * speechSynthesis needs no user-gesture priming in practice, but if the
 * browser blocks it the call is simply a no-op.
 */

export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.06;
    u.pitch = 0.92;
    u.volume = 0.9;
    synth.speak(u);
  } catch {
    // ignore — voice is best-effort
  }
}

export function cancelSpeech() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}
