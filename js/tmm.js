(() => {
    "use strict";

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
