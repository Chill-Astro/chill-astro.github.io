// ======================================
// Chill-Astro Software
// easter-egg-guide.js
// ======================================

/* ======================================
   Reveal Animations (Standard Smooth)
====================================== */

function setupEasterEggRevealAnimations() {
    const revealElements = [
        ...document.querySelectorAll(".eeg-reveal")
    ];

    if (!revealElements.length) return;

    if (!("IntersectionObserver" in window)) {
        revealElements.forEach(element => {
            element.classList.add("eeg-show");
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("eeg-show");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12
    });

    revealElements.forEach(element => {
        observer.observe(element);
    });
}

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

        // 3. Trigger when parent reveal section enters viewport
        const parentReveal = difficulty.closest(".eeg-reveal");

        if (parentReveal && "IntersectionObserver" in window) {
            const starObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    animateStars();
                    starObserver.disconnect();
                }
            }, { threshold: 0.15 });

            starObserver.observe(parentReveal);
        } else {
            animateStars();
        }
    });
}

/* ======================================
   Page Init
====================================== */

function initEasterEggGuide() {
    if (!document.querySelector(".eeg-page")) return;

    setupDifficultyStars();
    setupEasterEggRevealAnimations();
}

document.addEventListener(
    "DOMContentLoaded",
    initEasterEggGuide
);

if (document.readyState !== "loading") {
    initEasterEggGuide();
}