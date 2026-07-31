// ======================================
// Chill-Astro Software
// oh-my-posh-themes.js
// ======================================

function setupRevealAnimations() {

    const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry) => {

            if (!entry.isIntersecting) return;

            entry.target.classList.add("show");
            observer.unobserve(entry.target);

        });

    }, {

        threshold: 0.12

    });

    const revealElements = [

        ...document.querySelectorAll(".theme-showcase")

    ];

    revealElements.forEach((element) => {

        element.classList.add("hidden");
        observer.observe(element);

    });

}

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

document.addEventListener("DOMContentLoaded", () => {

    if (!document.querySelector(".omp-page")) return;

    setupRevealAnimations();
    loadTerminalPreviews();

});