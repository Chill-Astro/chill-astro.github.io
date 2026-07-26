// ======================================
// Chill-Astro Software
// main.js
// ======================================

let repoData = {};

// ======================================
// Load Repository Data
// ======================================

async function loadRepoData() {

    try {

        const response = await fetch("assets/data/repo-data.json");

        if (!response.ok) {
            throw new Error("Failed to load repo-data.json");
        }

        repoData = await response.json();

        updateVersions();
        updateDownloadButtons();

    }

    catch (err) {

        console.error(err);

    }

}

loadRepoData();

// ======================================
// Update Project Versions
// ======================================

function updateVersions() {

    const versions = {

        "lamina-version": repoData.lamina,
        "root-version": repoData.rootChecker,
        "tmm-version": repoData.trustMyMsix

    };

    Object.entries(versions).forEach(([id, project]) => {

        const element = document.getElementById(id);

        if (element && project) {

            element.textContent = `Latest: ${project.tag}`;

        }

    });

}

// ======================================
// Update Download Buttons
// ======================================

function updateDownloadButtons() {

    const buttons = {

        "lamina-download": repoData.lamina,
        "root-download": repoData.rootChecker,
        "tmm-download": repoData.trustMyMsix

    };

    Object.entries(buttons).forEach(([id, project]) => {

        const button = document.getElementById(id);

        if (button && project) {

            button.href = project.download;
            button.target = "_blank";
            button.rel = "noopener noreferrer";

        }

    });

}

// ======================================
// Initialize
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    heroAnimation();
    prepareScrollAnimations();

});

// ======================================
// Hero Animation
// ======================================

function heroAnimation() {

    const logo = document.querySelector(".hero-left");
    const title = document.querySelector(".hero-right h1");
    const desc = document.querySelector(".hero-right p");
    const button = document.querySelector(".hero-right");

    logo.style.opacity = "0";
    logo.style.transform = "translateX(-60px)";

    title.style.opacity = "0";
    title.style.transform = "translateX(60px)";

    desc.style.opacity = "0";
    desc.style.transform = "translateX(60px)";

    button.style.opacity = "0";
    button.style.transform = "translateX(60px) scale(.95)";

    requestAnimationFrame(() => {

        animate(
            logo,
            "translateX(0)",
            0
        );

        animate(
            title,
            "translateX(0)",
            200
        );

        animate(
            desc,
            "translateX(0)",
            350
        );

        animate(
            button,
            "translateX(0) scale(1)",
            500
        );

    });

}

// ======================================
// Generic Animation
// ======================================

function animate(element, transform, delay) {

    setTimeout(() => {

        element.style.transition =
            "all .8s cubic-bezier(.22,1,.36,1)";

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
        ...document.querySelectorAll(".cta h2"),
        ...document.querySelectorAll(".cta .primary-btn")

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

                if (element.classList.contains("project-card")) {

                    const cards = [
                        ...document.querySelectorAll(".project-card")
                    ];

                    const index = cards.indexOf(element);

                    setTimeout(() => {

                        element.classList.add("show");

                    }, index * 140);

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