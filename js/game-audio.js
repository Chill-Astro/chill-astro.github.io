// Short synthesized arcade cues. Audio starts on the game's first user action.
(() => {
    const fallback = {
        snakeStart: { frequency: 320, endFrequency: 540, duration: 0.11, gain: 0.028, wave: "sine" },
        snakeEat: { frequency: 620, endFrequency: 920, duration: 0.075, gain: 0.032, wave: "triangle" },
        snakeCrash: { frequency: 300, endFrequency: 95, duration: 0.2, gain: 0.038, wave: "sawtooth" },
        snakeEnd: { frequency: 480, endFrequency: 240, duration: 0.14, gain: 0.03, wave: "triangle" },
        snakePause: { frequency: 520, endFrequency: 330, duration: 0.1, gain: 0.024, wave: "sine" },
        snakeButton: { frequency: 680, endFrequency: 540, duration: 0.035, gain: 0.016, wave: "triangle" },
        tttMenu: { frequency: 300, endFrequency: 510, duration: 0.1, gain: 0.025, wave: "sine" },
        tttMoveX: { frequency: 510, endFrequency: 420, duration: 0.06, gain: 0.025, wave: "triangle" },
        tttMoveO: { frequency: 420, endFrequency: 560, duration: 0.06, gain: 0.025, wave: "sine" },
        tttPress: { frequency: 680, endFrequency: 540, duration: 0.035, gain: 0.016, wave: "triangle" },
        tttWin: { frequency: 420, endFrequency: 820, duration: 0.22, gain: 0.045, wave: "sine", overtone: 1.5, overtoneGain: 0.25 },
        tttVictory: { gain: 0.045, wave: "square", notes: [{ frequency: 523, duration: 0.09 }, { frequency: 659, duration: 0.09 }, { frequency: 784, duration: 0.1 }, { frequency: 1047, duration: 0.2 }] },
        tttDefeat: { gain: 0.035, wave: "triangle", notes: [{ frequency: 392, duration: 0.12 }, { frequency: 330, duration: 0.14 }, { frequency: 262, duration: 0.2 }] },
        tttDraw: { frequency: 480, endFrequency: 360, duration: 0.16, gain: 0.03, wave: "triangle" },
        tttPause: { frequency: 560, endFrequency: 400, duration: 0.09, gain: 0.025, wave: "sine" }
    };
    let sounds = fallback;
    let context;

    fetch("/assets/data/ui-sounds.json")
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (data?.games) sounds = data.games; })
        .catch(() => {});

    document.addEventListener("site-settings-change", event => {
        if (event.detail?.lite) context?.suspend();
    });

    window.playGameSound = name => {
        if (document.documentElement.classList.contains("lite-mode")) return;
        const sound = sounds[name];
        if (!sound) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            context ||= new AudioContextClass();
            if (context.state === "suspended") context.resume();
            const start = context.currentTime;
            if (Array.isArray(sound.notes)) {
                sound.notes.forEach((note, index) => {
                    const at = start + (Number(note.delay) || index * 0.085);
                    const duration = Math.max(0.035, Math.min(0.25, Number(note.duration) || 0.1));
                    const oscillator = context.createOscillator();
                    const gain = context.createGain();
                    oscillator.type = sound.wave || "sine";
                    oscillator.frequency.setValueAtTime(Number(note.frequency) || 440, at);
                    if (note.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, Number(note.endFrequency)), at + duration);
                    gain.gain.setValueAtTime(Math.max(0.001, Math.min(0.055, Number(note.gain ?? sound.gain) || 0.03)), at);
                    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
                    oscillator.connect(gain);
                    gain.connect(context.destination);
                    oscillator.start(at);
                    oscillator.stop(at + duration);
                });
                return;
            }
            const duration = Math.max(0.025, Math.min(0.25, Number(sound.duration) || 0.06));
            const tones = [{ frequency: sound.frequency, endFrequency: sound.endFrequency, gain: sound.gain }];
            if (sound.overtone) tones.push({ frequency: sound.frequency * sound.overtone, endFrequency: sound.endFrequency * sound.overtone, gain: sound.gain * (sound.overtoneGain || 0.2) });
            tones.forEach(tone => {
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.type = sound.wave || "sine";
                oscillator.frequency.setValueAtTime(Number(tone.frequency) || 440, start);
                oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, Number(tone.endFrequency) || 330), start + duration);
                gain.gain.setValueAtTime(Math.max(0.001, Math.min(0.055, Number(tone.gain) || 0.025)), start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start(start);
                oscillator.stop(start + duration);
            });
        } catch (_) { /* Games remain fully playable with audio unavailable. */ }
    };
})();
