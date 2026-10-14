// ======================================
// FOSS Root Checker
// root-checker.js
// ======================================

(() => {
    "use strict";


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
        prepareYoutube();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

})();
