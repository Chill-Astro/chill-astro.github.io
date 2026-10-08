// Lightweight sound support for standalone pages that do not load main.js.
(() => {
    const fallback = {
        click: { frequency: 620, endFrequency: 470, duration: 0.05, gain: 0.03, wave: "triangle", overtone: 1.7, overtoneGain: 0.32 },
        menuOpen: { frequency: 330, endFrequency: 740, duration: 0.14, gain: 0.04, wave: "sine", overtone: 1.51, overtoneGain: 0.28 },
        menuClose: { frequency: 740, endFrequency: 310, duration: 0.12, gain: 0.035, wave: "sine", overtone: 0.67, overtoneGain: 0.24 },
        dialogOpen: { frequency: 280, endFrequency: 590, duration: 0.15, gain: 0.04, wave: "sine", overtone: 1.33, overtoneGain: 0.25 },
        dialogClose: { frequency: 590, endFrequency: 280, duration: 0.12, gain: 0.032, wave: "sine", overtone: 0.75, overtoneGain: 0.2 }
    };
    let profile = fallback;
    let context;

    fetch("/assets/data/ui-sounds.json")
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (data && typeof data === "object") profile = data; })
        .catch(() => {});

    function play(name) {
        const sound = profile[name];
        if (!sound) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            context ||= new AudioContextClass();
            if (context.state === "suspended") context.resume();
            const start = context.currentTime;
            const duration = Math.max(0.02, Math.min(0.16, Number(sound.duration) || 0.05));
            const tones = [{ frequency: sound.frequency, endFrequency: sound.endFrequency, gain: sound.gain }];
            if (sound.overtone) tones.push({ frequency: sound.frequency * sound.overtone, endFrequency: sound.endFrequency * sound.overtone, gain: sound.gain * (sound.overtoneGain || 0.25) });
            tones.forEach(tone => {
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.type = sound.wave || "sine";
                oscillator.frequency.setValueAtTime(Number(tone.frequency) || 480, start);
                oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, Number(tone.endFrequency) || 360), start + duration);
                gain.gain.setValueAtTime(Math.max(0.001, Math.min(0.06, Number(tone.gain) || 0.03)), start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start(start);
                oscillator.stop(start + duration);
            });
        } catch (_) { /* Audio is optional; page controls still work silently. */ }
    }

    document.addEventListener("pointerdown", event => {
        const control = event.target.closest("button,a,[role='button'],summary,input[type='button'],input[type='submit']");
        if (control && !control.matches(":disabled,[aria-disabled='true']")) play("click");
    }, { capture: true });
    document.addEventListener("pointermove", event => {
        const target = event.target.closest("button,a,[role='button'],summary,input[type='button'],input[type='submit']");
        if (!target) return;
        const bounds = target.getBoundingClientRect();
        target.style.setProperty("--cursor-shadow-x", `${Math.max(-12, Math.min(12, event.clientX - bounds.left - bounds.width / 2))}px`);
        target.style.setProperty("--cursor-shadow-y", `${Math.max(-12, Math.min(12, event.clientY - bounds.top - bounds.height / 2))}px`);
    }, { passive: true });
    if (window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
        const shadow = document.createElement("div");
        shadow.id = "cursor-shadow";
        shadow.setAttribute("aria-hidden", "true");
        document.body.appendChild(shadow);
        document.addEventListener("pointermove", event => {
            if (event.pointerType !== "mouse") return;
            shadow.style.setProperty("--cursor-x", `${event.clientX}px`);
            shadow.style.setProperty("--cursor-y", `${event.clientY}px`);
            shadow.classList.add("is-visible");
        }, { passive: true });
        document.addEventListener("pointerleave", () => shadow.classList.remove("is-visible"));
        document.addEventListener("pointerenter", () => shadow.classList.add("is-visible"));
    }
    document.addEventListener("click", event => {
        if (event.detail !== 0) return;
        const control = event.target.closest("button,a,[role='button'],summary,input[type='button'],input[type='submit']");
        if (control && !control.matches(":disabled,[aria-disabled='true']")) play("click");
    }, { capture: true });
})();
