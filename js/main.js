// ======================================
// Chill-Astro Software
// main.js
// ======================================

// ======================================
// Repository Data
// ======================================

let repoData = {};

const headerHTML = `
<header class="site-header">
    <div class="scroll-meter"><div class="scroll-meter-fill"></div></div>
    <div class="site-header-inner">
        <div class="header-left-group">
            <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false"><span></span><span></span><span></span></button>
            <a href="/" class="site-title">Chill-Astro</a>
        </div>
        <a href="mailto:masterarc3435@outlook.com" class="secondary-btn">Email</a>
    </div>
</header>
<div class="mobile-nav-backdrop" aria-hidden="true"></div>
<nav class="header-nav" aria-label="Header navigation">
    <div class="header-nav-top"><span>Navigation</span><button class="nav-close" type="button" aria-label="Close navigation menu">✕</button></div>
    <a href="/">Home Page</a>
    <a href="https://github.com/Chill-Astro">Github Profile</a>
    <a href="/lamina-calculator/">Lamina ✦</a>
    <a href="/foss-root-checker/">FOSS Root Checker</a>
    <a href="/trust-my-msix/">Trust My Msix!</a>
    <a href="/android-rooting-guide/">Android Rooting Guide</a>
    <a href="/oh-my-posh-themes/">Oh My Posh! Themes</a>
    <a href="/easter-egg-guide/">Easter Egg Guide</a>
    <a href="/about">About Me</a>
    <a href="mailto:masterarc3435@outlook.com">Submit Feedback</a>
    <a href="https://github.com/Chill-Astro/chill-astro.github.io/issues/new" target="_blank" rel="noopener noreferrer">Report Site Issue</a>
</nav>`;

const downloadModalHTML = `
<div class="download-overlay" id="downloadOverlay">
    <div class="download-dialog">
        <div class="dialog-header">
            <h2 id="downloadTitle"></h2>
            <button class="dialog-close" id="downloadClose">✕</button>
        </div>
        <div class="dialog-body">
            <div class="dialog-version" id="downloadVersion"></div>
            <p id="downloadInfo"></p>
            <div class="command-box">
                <pre id="downloadCommand" class="download-command"></pre>
            </div>
            <div class="dialog-links" id="downloadLinks"></div>
        </div>
    </div>
</div>`;

const modalInfo = {

    lamina: {

        title: "Lamina ✦",

        info:
            "Before installing the MSIX version, import the included certificate (.cer) to Trusted Root Certification Authourities. If you are unsure, use the Setup Executable instead, or use Trust My Msix! to bypass the Untrusted Publisher Error.",

        command: "",

        names: {

            certificate: "Certificate (.cer)",
            msix_x64: "MSIX (x64)",
            msix_arm64: "MSIX (ARM64)",
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
            openapk: "Download from OpenAPK (Offline)",
            androidfreeware: "Download from Android Freeware (Offline)",
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

function ensureDownloadModal() {

    if (document.getElementById("downloadOverlay"))
        return;

    document.body.insertAdjacentHTML("beforeend", downloadModalHTML);
    attachDownloadModalEvents();

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

    ensureDownloadModal();

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

    document
        .getElementById("downloadOverlay")
        .classList
        .add("show");

}

function closeDownload(){

    const overlay = document.getElementById("downloadOverlay");

    if (overlay)
        overlay.classList.remove("show");

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
        nav.classList.toggle("open", isOpen);
        backdrop.classList.toggle("open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
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

    if (document.querySelector(".hero")) {

        heroAnimation();
        loadRepoData();
        prepareScrollAnimations();

    }

    if (document.querySelector(".about-page")) {

        aboutAnimation();

    }

    ensureDownloadModal();
    bindDownloadButtons();

});

// ======================================
// Hero Animation
// ======================================

function heroAnimation() {

    const logo = document.querySelector(".hero-left");
    const title = document.querySelector(".hero-right h1");
    const desc = document.querySelector(".hero-right p");    
    const buttons = document.querySelector(".hero-btn");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    logo.style.opacity = "0";
    logo.style.transform = "translate(-50%, calc(-50% - 36px))";

    title.style.opacity = "0";
    title.style.transform = "translateY(30px)";

    desc.style.opacity = "0";
    desc.style.transform = "translateY(30px)";

    buttons.style.opacity = "0";
    buttons.style.transform = "translateY(24px) scale(.96)";

    requestAnimationFrame(() => {

        animate(
            logo,
            "translate(-50%, -50%)",
            0
        );

        animate(
            title,
            "translateY(0)",
            400
        );

        animate(
            desc,
            "translateY(0)",
            700
        );

        animate(buttons, "translateY(0) scale(1)", 1300);

    });

}

// ======================================
// Generic Animation
// ======================================

function animate(element, transform, delay) {

    setTimeout(() => {

        element.style.transition =
            "all 1.2s cubic-bezier(.22,1,.36,1)";

        element.style.opacity = "1";
        element.style.transform = transform;

    }, delay);

}

// ======================================
// Scroll Animations
// ======================================

function prepareScrollAnimations() {

    const animated = [

        ...document.querySelectorAll(".projects h2"),
        ...document.querySelectorAll(".project-card"),

        ...document.querySelectorAll(".additional-stuff h2"),
        ...document.querySelectorAll(".additional-grid"),

    ];

    animated.forEach(item => {

        item.classList.add("hidden");

    });

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting)
                    return;

                const element = entry.target;

                if (
                    element.classList.contains("project-card") ||
                    element.classList.contains("additional-stuff-card")
                ) {

                    const cards = [

                        ...document.querySelectorAll(".project-card"),
                        ...document.querySelectorAll(".additional-stuff-card")

                    ];

                    const index = cards.indexOf(element);

                    setTimeout(() => {

                        element.classList.add("show");

                    }, index * 280);

                }

                else {

                    element.classList.add("show");

                }

                observer.unobserve(element);

            });

        },

        {

            threshold: .15

        }

    );

    animated.forEach(item => {

        observer.observe(item);

    });

}

// ======================================
// About Page Animation
// ======================================

function aboutAnimation() {

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting)
                    return;

                entry.target.classList.add("show");
                observer.unobserve(entry.target);

            });

        },

        {

            threshold: .15

        }

    );

    const elements = [

        ...document.querySelectorAll(".about-hero .hidden"),
        ...document.querySelectorAll(".academic .hidden"),
        ...document.querySelectorAll(".future")

    ];

    elements.forEach(element => {

        observer.observe(element);

    });

}

async function loadComponent(id, file) {

    if (id === "header") {
        document.querySelectorAll('.site-header, .mobile-nav-backdrop, .header-nav').forEach(el => el.remove());
        document.getElementById(id).innerHTML = headerHTML;
        initHeaderMenu();
        initScrollHeader();
        initScrollProgress();
        return;
    }

    const prefixes = ["", "../"];

    for (const prefix of prefixes) {

        try {

            const response = await fetch(prefix + file);

            if (!response.ok)
                continue;

            document.getElementById(id).innerHTML = await response.text();

            return;

        }

        catch {}

    }

}

// Header show/hide on scroll: initially visible, hides after a large downward scroll,
// reappears on small upward scrolls. Keeps header visible while nav is open.
function initScrollHeader() {
    // No-op: header should always remain visible (user requested)
    return;
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
