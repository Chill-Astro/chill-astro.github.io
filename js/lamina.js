(() => {
    "use strict";

    function prepareAnimations() {
        const page = document.querySelector(".lamina-page");

        if (!page) {
            return;
        }

        /*
         * Animate the actual sections rather than every individual
         * paragraph/list item. This keeps the page smooth and avoids
         * hundreds of tiny animations.
         */
        const elements = [
        page.querySelector(".hero-media"),
        ...page.querySelectorAll(
        ".lamina-page > .lamina-content, .lamina-page > .lamina-actions, .lamina-page > .lamina-section"
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
         * Respect users who disable animations.
         */
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            animated.forEach((element) => {
                element.classList.remove("hidden");
                element.classList.add("show");
            });

            return;
        }

        /*
         * Hero media appears immediately.
         * The remaining content animates as it enters the viewport.
         */
        const hero = page.querySelector(".hero-media");

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


    function prepareMedia() {
        /*
         * Make every local video behave like a looping showcase video.
         */
        document.querySelectorAll(".lamina-page video").forEach((video) => {
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;

            /*
             * Some browsers are picky about autoplay.
             */
            video.setAttribute("autoplay", "");
            video.setAttribute("muted", "");
            video.setAttribute("loop", "");
            video.setAttribute("playsinline", "");

            const playVideo = () => {
                const promise = video.play();

                if (promise && typeof promise.catch === "function") {
                    promise.catch(() => {
                        /*
                         * Autoplay can still be blocked by the browser.
                         * The video remains usable normally.
                         */
                    });
                }
            };

            if (video.readyState >= 2) {
                playVideo();
            } else {
                video.addEventListener("loadeddata", playVideo, {
                    once: true
                });
            }
        });
    }


    function prepareYoutube() {
        /*
         * YouTube is intentionally not forced to autoplay.
         * The local showcase videos are the GIF-like looping media.
         */
        document
            .querySelectorAll(".lamina-page iframe")
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
        document.addEventListener("DOMContentLoaded", init, {
            once: true
        });
    } else {
        init();
    }
})();
document.addEventListener("DOMContentLoaded", () => {

    const videos = document.querySelectorAll(".lamina-page video");

    if (!videos.length) {
        return;
    }

    const mobileQuery = window.matchMedia(
        "(max-width: 768px), (pointer: coarse)"
    );

    const isMobile = () => mobileQuery.matches;

    videos.forEach((video) => {

        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        if (isMobile()) {
            video.pause();
            video.preload = "none";
            return;
        }

        video.preload = "metadata";

    });

    if (isMobile()) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                const video = entry.target;

                if (entry.isIntersecting) {

                    video.preload = "auto";

                    const playPromise = video.play();

                    if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                    }

                } else {

                    video.pause();

                }

            });

        },
        {
            threshold: 0.15
        }
    );

    videos.forEach((video) => {
        observer.observe(video);
    });

});