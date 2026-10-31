// ======================================
// Chill-Astro Software
// main.js
// ======================================

const componentsBaseURL = new URL("../components/", document.currentScript?.src || location.href);

function enableDesktopEffectsOnSupportedOS() {
    const ua = navigator.userAgent || "";
    const uaData = navigator.userAgentData;
    const platform = uaData?.platform || navigator.platform || "";
    const mobileOrUnsupportedPlatform = /Android|Chrome OS|CrOS|iPad|iPhone|iPod|iOS/i.test(`${ua} ${platform}`) ||
        (uaData?.mobile === true && !/Windows|macOS|Linux/i.test(platform));
    const supportedOS = !mobileOrUnsupportedPlatform &&
        (/Windows|Win32|Win64/i.test(platform) ||
         /Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) && (navigator.maxTouchPoints || 0) <= 1 ||
         /Linux|X11/i.test(platform));

    if (supportedOS) document.documentElement.classList.add("os-effects");
}

enableDesktopEffectsOnSupportedOS();

// ======================================
// Repository Data
// ======================================

let repoData = {};

const modalInfo = {

    lamina: {

        title: "Lamina ✦",

        info:
            "Before installing the MSIX version, import the included certificate (.cer) to Trusted Root Certification Authourities. If you are unsure, use the Setup Executable instead, or use Trust My Msix! to bypass the Untrusted Publisher Error.",

        command: "",

        names: {

            certificate: "Certificate (.cer)",
            msix_bundle: ".MSIXBUNDLE (x64 & ARM64)",            
            setup: "Setup.exe",
            uptodown: "Download from Uptodown"

        }

    },

    rootChecker: {

        title: "Root Checker",

        info:
            "The Official Build Supports Update Checks, whereas the Offline Version lacks this feature, and is deprieved of Internet Access. If you are unsure, trust IzzyOnDroid.",

        command: "",

        names: {

            apk_official: ".APK (Official)",
            apk_offline: ".APK (Offline)",
            izzy: "Download from IzzyOnDroid (Offline)",
            openapk: "Download from OpenAPK (Both)",            
            uptodown: "Download from Uptodown (Official)",
            appteka: "Download from Appteka (Official)"

        }

    },

    trustMyMsix: {

        title: "Trust My Msix!",

        info:
            "Install Python alongside the required packages from pip, before running the Python Script. Alternatively, use the Executable or Setup.exe for a more user-friendly experience.",

        command:
            "pip install colorama requests",

        names: {

            python: "Python Script",
            executable: "Executable (.exe)",
            setup: "Setup.exe"

        }

    },

    minima: {

        title: "Minima",

        info:
            "Paste Minima into an accessible folder and then open your Powershell / Bash Profile as : notepad $Profile for Powershell or nano ~/.bashrc on Linux. Once the following command is pasted, reload Powershell or run source ~/.bashrc.",

        command:
            "oh-my-posh --init --shell pwsh --config <path> Minima.omp.json | Invoke-Expression # For Windows Powershell\n\neval \"$(oh-my-posh init bash --config <path>/Minima.omp.json)\" # For Bash",

        names: {

            json: "Theme File (.omp.json)",

        }

    },

    minimaPlus: {

        title: "Minima PLUS!",

        info:
            "Paste Minima PLUS into an accessible folder and then open your Powershell / Bash Profile as : notepad $Profile for Powershell or nano ~/.bashrc on Linux. Once the following command is pasted, reload Powershell or run source ~/.bashrc.",

        command:
            "oh-my-posh --init --shell pwsh --config <path> Minima-PLUS.omp.json | Invoke-Expression # For Windows Powershell\n\neval \"$(oh-my-posh init bash --config <path>/Minima-PLUS.omp.json)\" # For Bash",

        names: {

            json: "Theme File (.omp.json)",

        }

    }

};

async function loadRepoData() {

    const paths = [
        "../assets/data/repo-data.json"
    ];

    for (const path of paths) {

        try {

            const response = await fetch(path);

            if (!response.ok)
                continue;

            repoData = await response.json();
            updateVersions();
            return;

        }

        catch (error) {

            console.error(`Failed to load ${path}`, error);

        }

    }

    console.error("Failed to load repo-data.json");

}

async function ensureDownloadModal() {
    if (document.getElementById("downloadOverlay")) return;

    try {
        const response = await fetch('/components/download.html');
        if (!response.ok) throw new Error('Failed to fetch download modal');
        const modalHTML = await response.text();
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        attachDownloadModalEvents();
    } catch (error) {
        console.error("Failed to load download modal:", error);
    }
}

function attachDownloadModalEvents() {

    const closeButton = document.getElementById("downloadClose");
    const overlay = document.getElementById("downloadOverlay");

    if (!closeButton || !overlay)
        return;

    if (closeButton.dataset.bound === "true")
        return;

    closeButton.addEventListener("click", closeDownload);
    overlay.addEventListener("click", function(e) {

        if (e.target === this)
            closeDownload();

    });

    closeButton.dataset.bound = "true";
    overlay.dataset.bound = "true";

}

function handleProjectDownloadClick(event) {

    const button = event.target.closest(".project-download");

    if (!button)
        return;

    const projects = {
        "lamina-download": "lamina",
        "root-download": "rootChecker",
        "tmm-download": "trustMyMsix"
    };

    const project = button.dataset.project || projects[button.id];

    if (!project)
        return;

    event.preventDefault();
    event.stopPropagation();
    openDownload(project);

}

function bindDownloadButtons() {

    document.removeEventListener("click", handleProjectDownloadClick);
    document.addEventListener("click", handleProjectDownloadClick);

}

async function openDownload(project) {

    await ensureDownloadModal();

    if (!repoData || Object.keys(repoData).length === 0)
        await loadRepoData();

    const overlay = document.getElementById("downloadOverlay");
    const ui = modalInfo[project];

    if (!overlay || !ui)
        return;

    const projectData = repoData[project];
    const downloads = projectData?.downloads || ui.downloads || {};

    document.getElementById("downloadTitle").textContent =
        ui.title;

    const versionElement = document.getElementById("downloadVersion");
    const versionText = projectData?.tag ? `Version ${projectData.tag}` : (ui.version || "");
    versionElement.textContent = versionText;
    versionElement.style.display = versionText ? "block" : "none";

    document.getElementById("downloadInfo").textContent =
        ui.info;

    const command =
        document.getElementById("downloadCommand");

    if (ui.command) {

        command.textContent = ui.command;
        command.style.display = "block";

    }

    else {

        command.style.display = "none";

    }

    const container =
        document.getElementById("downloadLinks");

    container.innerHTML = "";

    Object.entries(downloads).forEach(([key, url]) => {

        const link = document.createElement("a");

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.textContent = ui.names[key] ?? key;

        container.appendChild(link);

    });

    const wasOpen = overlay.classList.contains("show");
    overlay.classList.add("show");
    if (!wasOpen) playUiSound("dialogOpen");

}

function closeDownload(){

    const overlay = document.getElementById("downloadOverlay");

    if (overlay && overlay.classList.contains("show")) {
        overlay.classList.remove("show");
        playUiSound("dialogClose");
    }

}

document.addEventListener("keydown", e => {

    if (e.key === "Escape")
        closeDownload();

});

// ======================================
// Update Project Versions
// ======================================

function updateVersions() {

    const versions = {

        "lamina-version": repoData.lamina?.tag,
        "root-version": repoData.rootChecker?.tag,
        "tmm-version": repoData.trustMyMsix?.tag

    };

    Object.entries(versions).forEach(([id, tag]) => {

        const element = document.getElementById(id);

        if (element && tag) {

            element.textContent = `Latest: ${tag}`;

        }

    });

}

// ======================================
// Initialize
// ======================================

function initHeaderMenu() {

    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".header-nav");
    const backdrop = document.querySelector(".mobile-nav-backdrop");
    const closeButton = document.querySelector(".nav-close");

    if (!toggle || !nav || !backdrop)
        return;

    const setOpen = (isOpen) => {
        const wasOpen = nav.classList.contains("open");
        nav.classList.toggle("open", isOpen);
        backdrop.classList.toggle("open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
        if (wasOpen !== isOpen) playUiSound(isOpen ? "menuOpen" : "menuClose");
    };

    toggle.addEventListener("click", () => {
        setOpen(!nav.classList.contains("open"));
    });

    if (closeButton) {
        closeButton.addEventListener("click", () => setOpen(false));
    }

    backdrop.addEventListener("click", () => setOpen(false));

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape")
            setOpen(false);
    });

}

document.addEventListener("DOMContentLoaded", () => {
    initUiSounds();

    if (document.querySelector(".hero")) {
        loadRepoData();
    }

    ensureDownloadModal();
    bindDownloadButtons();

});

// UI sounds are synthesized from a tiny JSON profile, so there are no audio
// files to download or autoplay. AudioContext starts only after user input.
let uiSoundProfile = {
    click: { frequency: 620, endFrequency: 470, duration: 0.05, gain: 0.03, wave: "triangle", overtone: 1.7, overtoneGain: 0.32 },
    menuOpen: { frequency: 330, endFrequency: 740, duration: 0.14, gain: 0.04, wave: "sine", overtone: 1.51, overtoneGain: 0.28 },
    menuClose: { frequency: 740, endFrequency: 310, duration: 0.12, gain: 0.035, wave: "sine", overtone: 0.67, overtoneGain: 0.24 },
    dialogOpen: { frequency: 280, endFrequency: 590, duration: 0.15, gain: 0.04, wave: "sine", overtone: 1.33, overtoneGain: 0.25 },
    dialogClose: { frequency: 590, endFrequency: 280, duration: 0.12, gain: 0.032, wave: "sine", overtone: 0.75, overtoneGain: 0.2 }
};
let uiAudioContext;

function initUiSounds() {
    const configUrl = new URL("../assets/data/ui-sounds.json", document.currentScript?.src || location.href);
    fetch(configUrl).then(response => response.ok ? response.json() : null)
        .then(profile => { if (profile && typeof profile === "object") uiSoundProfile = profile; })
        .catch(() => {});

    // Let the shared click cue finish before the browser unloads this page.
    document.addEventListener("click", event => {
        const gameLink = event.target.closest("a.game-centre-play");
        if (!gameLink || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        playUiSound("click");
        window.setTimeout(() => { window.location.href = gameLink.href; }, 90);
    }, { capture: true });

    document.addEventListener("pointerdown", event => {
        const control = event.target.closest("button,a,[role='button'],summary,input[type='button'],input[type='submit']");
        if (!control || control.matches(":disabled,[aria-disabled='true'],.menu-toggle,.game-centre-play") || control.closest(".pong-game,.dino-game,.ttt-game")) return;
        playUiSound("click");
    }, { capture: true });
    document.addEventListener("click", event => {
        if (event.detail !== 0) return; // pointer clicks were handled on pointerdown
        const control = event.target.closest("button,a,[role='button'],summary,input[type='button'],input[type='submit']");
        if (control && !control.matches(":disabled,[aria-disabled='true'],.menu-toggle,.game-centre-play") && !control.closest(".pong-game,.dino-game,.ttt-game")) playUiSound("click");
    }, { capture: true });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let hoverFrame = 0;
    let hoverTarget = null;
    let pointerX = 0;
    let pointerY = 0;
    document.addEventListener("pointermove", event => {
        const target = event.target.closest("button,a,[role='button'],summary,input[type='button'],input[type='submit'],.project-card,.additional-card,.feature-card,.theme-showcase,.hero,.game-showcase,.eeg-app,.future,.error-shell");
        if (!target) return;

        hoverTarget = target;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (hoverFrame) return;

        hoverFrame = requestAnimationFrame(() => {
            hoverFrame = 0;
            if (!hoverTarget?.isConnected) return;

            const bounds = hoverTarget.getBoundingClientRect();
            hoverTarget.style.setProperty("--cursor-shadow-x", `${Math.max(-12, Math.min(12, pointerX - bounds.left - bounds.width / 2))}px`);
            hoverTarget.style.setProperty("--cursor-shadow-y", `${Math.max(-12, Math.min(12, pointerY - bounds.top - bounds.height / 2))}px`);
        });
    }, { passive: true });
}

function playUiSound(name) {
    const sound = uiSoundProfile[name];
    if (!sound) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        uiAudioContext ||= new AudioContextClass();
        if (uiAudioContext.state === "suspended") uiAudioContext.resume();
        const start = uiAudioContext.currentTime;
        const duration = Math.max(0.02, Math.min(0.16, Number(sound.duration) || 0.05));
        const tones = [{ frequency: sound.frequency, endFrequency: sound.endFrequency, gain: sound.gain }];
        if (sound.overtone) tones.push({ frequency: sound.frequency * sound.overtone, endFrequency: sound.endFrequency * sound.overtone, gain: sound.gain * (sound.overtoneGain || 0.25) });
        tones.forEach(tone => {
            const oscillator = uiAudioContext.createOscillator();
            const gain = uiAudioContext.createGain();
            oscillator.type = sound.wave || "sine";
            oscillator.frequency.setValueAtTime(Number(tone.frequency) || 480, start);
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, Number(tone.endFrequency) || 360), start + duration);
            gain.gain.setValueAtTime(Math.max(0.001, Math.min(0.06, Number(tone.gain) || 0.03)), start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            oscillator.connect(gain);
            gain.connect(uiAudioContext.destination);
            oscillator.start(start);
            oscillator.stop(start + duration);
        });
    } catch (_) { /* Sound is optional; controls must always work silently too. */ }
}

async function loadComponent(id, file) {
    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    // Special handling for header to replace multiple elements
    if (id === "header") {
        document.querySelectorAll('.site-header, .mobile-nav-backdrop, .header-nav').forEach(el => el.remove());
    }

    try {
        const componentName = file.replace(/^components\//, "");
        const response = await fetch(new URL(componentName, componentsBaseURL));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        targetElement.innerHTML = await response.text();
        if (id === "header") {
            initHeaderMenu();
            initScrollProgress();
        }
        if (id === "footer") {
            initBackToTop();
        }
    } catch (error) {
        console.error(`Failed to load component '${file}':`, error);
    }
}

function initBackToTop() {
    const button = document.querySelector(".back-to-top");
    if (!button || button.dataset.ready === "true") return;

    button.dataset.ready = "true";
    const footer = document.querySelector(".site-footer");
    const baseBottom = Number.parseFloat(getComputedStyle(button).bottom) || 32;
    const updateVisibility = () => {
        button.classList.toggle("is-visible", window.scrollY > 360);

        if (!footer) return;
        const footerBounds = footer.getBoundingClientRect();
        const buttonHeight = button.offsetHeight;
        const overlap = window.innerHeight - baseBottom - footerBounds.top + 16;
        const footerLift = footerBounds.bottom > 0
            ? Math.min(window.innerHeight - buttonHeight - 16, Math.max(0, overlap))
            : 0;
        button.style.setProperty("--footer-lift", `${Math.max(0, footerLift)}px`);
    };

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    updateVisibility();
    button.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
    });
}

function initScrollProgress() {
    if (window.__scrollProgressInitialized)
        return;

    const header = document.querySelector('.site-header');
    const meter = header?.querySelector('.scroll-meter');
    const fill = meter?.querySelector('.scroll-meter-fill');

    if (!header || !meter || !fill)
        return;

    window.__scrollProgressInitialized = true;

    const updateProgress = () => {
        const doc = document.documentElement;
        const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop;
        const scrollHeight = doc.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;

        fill.style.width = `${progress}%`;
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
}

if (document.getElementById("header")) {

    loadComponent(
        "header",
        "components/header.html"
    );

}

if (document.getElementById("footer")) {

    loadComponent(
        "footer",
        "components/footer.html"
    );

}

