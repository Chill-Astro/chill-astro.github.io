// Short synthesized arcade cues. Audio starts on the game's first user action.
(() => {
    const fallback = {
        pongStart: { frequency: 360, endFrequency: 680, duration: 0.13, gain: 0.035, wave: "sine", overtone: 1.5, overtoneGain: 0.22 },
        pongPause: { frequency: 510, endFrequency: 300, duration: 0.1, gain: 0.025, wave: "sine" },
        pongPaddle: { frequency: 520, endFrequency: 390, duration: 0.045, gain: 0.025, wave: "triangle" },
        pongWall: { frequency: 390, endFrequency: 300, duration: 0.035, gain: 0.018, wave: "sine" },
        pongScore: { frequency: 300, endFrequency: 620, duration: 0.18, gain: 0.045, wave: "triangle", overtone: 1.33, overtoneGain: 0.25 },
        pongEnd: { frequency: 590, endFrequency: 260, duration: 0.22, gain: 0.04, wave: "sine", overtone: 0.75, overtoneGain: 0.22 },
        pongVictory: { gain: 0.04, wave: "square", notes: [{ frequency: 523, duration: 0.09 }, { frequency: 659, duration: 0.09 }, { frequency: 784, duration: 0.1 }, { frequency: 1047, duration: 0.19 }] },
        pongDraw: { gain: 0.03, wave: "triangle", notes: [{ frequency: 440, duration: 0.12 }, { frequency: 440, duration: 0.16 }] },
        dinoJump: { frequency: 380, endFrequency: 700, duration: 0.11, gain: 0.028, wave: "triangle" },
        dinoHit: { frequency: 280, endFrequency: 100, duration: 0.22, gain: 0.04, wave: "sawtooth", overtone: 1.5, overtoneGain: 0.16 },
        dinoOver: { gain: 0.038, wave: "triangle", notes: [{ frequency: 440, duration: 0.12 }, { frequency: 330, duration: 0.15 }, { frequency: 220, duration: 0.22 }] },
        dinoMilestone: { frequency: 780, endFrequency: 980, duration: 0.07, gain: 0.024, wave: "sine" },
        dinoStart: { frequency: 300, endFrequency: 520, duration: 0.12, gain: 0.03, wave: "sine" },
        dinoPause: { frequency: 520, endFrequency: 330, duration: 0.1, gain: 0.024, wave: "sine" },
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

    window.playGameSound = name => {
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
