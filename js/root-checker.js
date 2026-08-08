// ======================================
// FOSS Root Checker
// root-checker.js
// ======================================

(() => {
    "use strict";


    // ======================================
    // Scroll Animations
    // ======================================

    function prepareAnimations() {
        const page = document.querySelector(".root-checker-page");

        if (!page) {
            return;
        }

        const elements = [
            page.querySelector(".root-checker-hero img, .root-checker-media"),

            ...page.querySelectorAll(
                ".root-checker-page > section, " +
                ".root-checker-page > div"
            )
        ].filter(Boolean);

        const animated = [...new Set(elements)];

        animated.forEach((element) => {
            element.classList.add("hidden");
        });

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            animated.forEach((element) => {
                element.classList.remove("hidden");
                element.classList.add("show");
            });
            return;
        }

        const hero = page.querySelector(".root-checker-hero img, .root-checker-media");

        if (hero) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    hero.classList.remove("hidden");
                    hero.classList.add("show");
                });
            });
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.remove("hidden");
                    entry.target.classList.add("show");
                    obs.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -60px 0px"
            }
        );

        animated.forEach((element) => {
            if (element !== hero) {
                observer.observe(element);
            }
        });
    }


    // ======================================
    // YouTube
    // ======================================

    function prepareYoutube() {
        document
            .querySelectorAll(".root-checker-page iframe")
            .forEach((iframe) => {
                iframe.setAttribute(
                    "loading",
                    iframe.getAttribute("loading") || "lazy"
                );
            });
    }


    // ======================================
    // Initialize
    // ======================================

    function init() {
        prepareAnimations();
        prepareYoutube();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

})();