// ======================================
// Chill-Astro Software
// easter-egg-guide.js
// ======================================

/* ======================================
   Difficulty Stars (Ultra-Bouncy Cascade)
====================================== */

function setupDifficultyStars() {
    const difficultyElements = [
        ...document.querySelectorAll(".eeg-difficulty")
    ];

    difficultyElements.forEach(difficulty => {
        const starsContainer = difficulty.querySelector(".eeg-stars");
        if (!starsContainer) return;

        const difficultyValue = Number.parseInt(
            difficulty.dataset.difficulty,
            10
        );

        if (!Number.isFinite(difficultyValue) || difficultyValue < 1) {
            return;
        }

        starsContainer.replaceChildren();

        // 1. Generate star elements
        for (let index = 0; index < difficultyValue; index++) {
            const star = document.createElement("span");
            star.className = "eeg-star";
            star.textContent = "★";
            star.setAttribute("aria-hidden", "true");
            starsContainer.appendChild(star);
        }

        const stars = [...starsContainer.querySelectorAll(".eeg-star")];

        // 2. Animate stars with rapid, bouncy sequence
        const animateStars = () => {
            stars.forEach((star, index) => {
                // 200ms initial wait + 130ms spacing between star bounces
                window.setTimeout(() => {
                    star.classList.add("eeg-star-visible");
                }, 200 + (index * 130));
            });
        };

        animateStars();
    });
}

/* ======================================
   Page Init
====================================== */

function initEasterEggGuide() {
    if (!document.querySelector(".eeg-page")) return;

    setupDifficultyStars();
}

document.addEventListener(
    "DOMContentLoaded",
    initEasterEggGuide
);

if (document.readyState !== "loading") {
    initEasterEggGuide();
}
