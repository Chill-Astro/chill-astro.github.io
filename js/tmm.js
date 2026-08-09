(() => {
    "use strict";

    function prepareAnimations() {
        const page = document.querySelector(".tmm-page");

        if (!page) {
            return;
        }

        /*
         * Animate sections rather than individual elements.
         * This keeps the page smooth and avoids excessive animations.
         */
        const elements = [
            page.querySelector(".tmm-hero"),
            ...page.querySelectorAll(
                ".tmm-page > .tmm-content, " +
                ".tmm-page > .tmm-actions, " +
                ".tmm-page > .tmm-section"
            )
        ].filter(Boolean);

        /*
         * Remove duplicates while preserving order.
         */
        const animated = [...new Set(elements)];

        /*
         * Hide everything before the observer starts.
         */
        animated.forEach((element) => {
            element.classList.add("hidden");
        });

        /*
         * Respect reduced-motion preferences.
         */
        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            animated.forEach((element) => {
                element.classList.remove("hidden");
                element.classList.add("show");
            });

            return;
        }

        /*
         * Hero appears immediately.
         */
        const hero = page.querySelector(".tmm-hero");

        if (hero) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    hero.classList.remove("hidden");
                    hero.classList.add("show");
                });
            });
        }

        /*
         * Remaining sections appear as they enter the viewport.
         */
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


    function prepareMedia() {
        /*
         * Make local TMM videos behave like looping showcase videos.
         *
         * Videos already handled by video-player.js are excluded.
         */
        document
            .querySelectorAll(
                ".tmm-page video:not([data-video-player] video)"
            )
            .forEach((video) => {

                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;

                video.setAttribute("autoplay", "");
                video.setAttribute("muted", "");
                video.setAttribute("loop", "");
                video.setAttribute("playsinline", "");

                const playVideo = () => {
                    const promise = video.play();

                    if (
                        promise &&
                        typeof promise.catch === "function"
                    ) {
                        promise.catch(() => {
                            /*
                             * Autoplay may be blocked by the browser.
                             */
                        });
                    }
                };

                if (video.readyState >= 2) {
                    playVideo();
                } else {
                    video.addEventListener(
                        "loadeddata",
                        playVideo,
                        { once: true }
                    );
                }
            });
    }


    function prepareYoutube() {
        /*
         * YouTube videos are lazy-loaded but not
         * automatically played.
         */
        document
            .querySelectorAll(".tmm-page iframe")
            .forEach((iframe) => {

                iframe.setAttribute(
                    "loading",
                    iframe.getAttribute("loading") || "lazy"
                );

            });
    }


    function init() {
        prepareAnimations();
        prepareMedia();
        prepareYoutube();
    }


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})();