// A short two-tone chime generated with the Web Audio API, so there's no
// audio asset to manage or license — it works fully offline.
export const playAlertSound = () => {
    if (typeof window === 'undefined') return;

    try {
        const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();

        const playTone = (frequency: number, startTime: number, duration: number) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        playTone(880, now, 0.18); // A5
        playTone(1174.66, now + 0.16, 0.25); // D6

        // Free the audio context once the chime has finished playing.
        setTimeout(() => ctx.close(), 600);
    } catch (e) {
        console.error('Failed to play alert sound', e);
    }
};
