(() => {
    "use strict";

    function prepareMedia() {
        /*
         * Make every local video behave like a looping showcase video.
         */
        document.querySelectorAll(".lamina-page video:not([data-video-player] video)").forEach((video) => {
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

    const videos = document.querySelectorAll(".lamina-page video:not([data-video-player] video)");

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
