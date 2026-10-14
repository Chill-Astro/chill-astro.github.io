// ======================================
// Chill-Astro Software
// oh-my-posh-themes.js
// ======================================

// ======================================
// Terminal Previews
// ======================================

function loadTerminalPreviews() {

    if (typeof createTerminalPreview !== "function") return;

    createTerminalPreview("terminal-minima", "minima");
    createTerminalPreview("terminal-minima-plus", "minimaPlus");

}

// ======================================
// Page Init
// ======================================

function initOhMyPoshPage() {

    if (!document.querySelector(".omp-page")) return;

    loadTerminalPreviews();

}

document.addEventListener("DOMContentLoaded", initOhMyPoshPage);

if (document.readyState !== "loading") {
    initOhMyPoshPage();
}
