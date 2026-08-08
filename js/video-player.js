// Reusable custom video-player enhancement.
(() => {
    "use strict";

    function initVideoPlayer(player) {
        if (!player || player.dataset.videoInitialized === "true") return;

        const media = player.querySelector(".video-player__media");
        const playButton = player.querySelector("[data-video-play]");
        const playIcon = player.querySelector(".video-player__play-icon");
        const progress = player.querySelector("[data-video-progress]");
        const fullscreenButton = player.querySelector("[data-video-fullscreen]");
        
        if (!media || !playButton || !playIcon || !progress || !fullscreenButton) {
            console.warn("Video player skipped: required controls are missing.", player);
            return;
        }

        player.dataset.videoInitialized = "true";
        player.tabIndex = player.tabIndex >= 0 ? player.tabIndex : 0;
        
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = "metadata";

        let hideTimer;
        let lastClientX = 0;
        let lastClientY = 0;
        const isMobile = window.innerWidth <= 768 || navigator.maxTouchPoints > 0;

        const setProgress = () => progress.style.setProperty("--progress", `${Number(progress.value) || 0}%`);
        
        const showControls = () => {
            player.classList.add("is-active");
            clearTimeout(hideTimer);
            
            // Auto-hide controls when playing, on both mobile and PC fullscreen
            if (!media.paused) {
                hideTimer = window.setTimeout(() => {
                    player.classList.remove("is-active");
                }, 2000);
            }
        };

        const updatePlaybackState = () => {
            const paused = media.paused;
            playIcon.textContent = paused ? "▶" : "❚❚";
            playButton.setAttribute("aria-label", paused ? "Play video" : "Pause video");
            player.classList.toggle("is-playing", !paused);
        };

        const togglePlayback = async () => {
            try {
                if (media.paused) {
                    await media.play();
                } else {
                    media.pause();
                }
            } catch (error) {
                console.warn("Video playback failed.", error);
            }
            showControls();
        };

        const updateProgress = () => {
            if (!Number.isFinite(media.duration) || media.duration <= 0) return;
            progress.value = String((media.currentTime / media.duration) * 100);
            setProgress();
        };

        const updateFullscreenState = () => {
            const active = document.fullscreenElement === player;
            fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
            fullscreenButton.setAttribute("aria-pressed", String(active));
            showControls();
        };

        playButton.addEventListener("click", togglePlayback);
        media.addEventListener("click", togglePlayback);
        
        media.addEventListener("play", () => { 
            updatePlaybackState(); 
            showControls(); 
        });
        
        media.addEventListener("pause", () => { 
            updatePlaybackState(); 
            player.classList.add("is-active"); 
            clearTimeout(hideTimer); 
        });

        media.addEventListener("ended", updateProgress);
        media.addEventListener("timeupdate", updateProgress);
        
        progress.addEventListener("input", () => {
            if (Number.isFinite(media.duration) && media.duration > 0) {
                media.currentTime = (Number(progress.value) / 100) * media.duration;
            }
            setProgress();
            showControls();
        });

        fullscreenButton.addEventListener("click", async () => {
            try {
                if (document.fullscreenElement === player) await document.exitFullscreen();
                else if (player.requestFullscreen) await player.requestFullscreen();
                else if (media.webkitEnterFullscreen) media.webkitEnterFullscreen();
            } catch (error) {
                console.warn("Fullscreen failed.", error);
            }
            showControls();
        });

        document.addEventListener("fullscreenchange", updateFullscreenState);

        player.addEventListener("keydown", event => {
            if (event.target !== player) return;
            if (event.code === "Space" || event.code === "Enter") {
                event.preventDefault();
                togglePlayback();
            }
        });

        const handleMouseMove = event => {
            const currentX = event.clientX;
            const currentY = event.clientY;
            if (Math.abs(currentX - lastClientX) > 4 || Math.abs(currentY - lastClientY) > 4) {
                lastClientX = currentX;
                lastClientY = currentY;
                showControls();
            }
        };

        player.addEventListener("pointerenter", showControls, { passive: true });
        player.addEventListener("pointerdown", showControls, { passive: true });
        player.addEventListener("pointermove", handleMouseMove, { passive: true });
        
        document.addEventListener("mousemove", event => {
            if (document.fullscreenElement === player) {
                handleMouseMove(event);
            }
        }, { passive: true });

        player.addEventListener("pointerleave", () => {
            if (!media.paused && document.fullscreenElement !== player) {
                clearTimeout(hideTimer);
                player.classList.remove("is-active");
            }
        });

        setProgress();
        updatePlaybackState();
        updateFullscreenState();

        // Ensure class state starts completely clean
        player.classList.remove("is-active");

        if (isMobile) {
            media.pause();
            player.classList.add("is-active"); // Force show play prompt on mobile initially
        } else {
            media.autoplay = true;
            const startAutoplay = () => media.play().catch(() => {
                player.classList.add("is-active");
            });
            
            if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                startAutoplay();
            } else {
                media.addEventListener("loadeddata", startAutoplay, { once: true });
            }
        }
    }

    function initVideoPlayers(root = document) {
        root.querySelectorAll("video").forEach(media => {
            if (media.closest("[data-video-player]")) return;

            const player = media.parentElement;
            if (!player) return;

            player.classList.add("video-player");
            player.dataset.videoPlayer = "";
            media.classList.add("video-player__media");
            player.insertAdjacentHTML("beforeend", `
                <div class="video-player__controls" data-video-controls>
                    <button class="video-player__play" type="button" aria-label="Play video" data-video-play>
                        <span class="video-player__play-icon" aria-hidden="true">▶</span>
                    </button>
                    <div class="video-player__progress">
                        <input type="range" min="0" max="100" value="0" step="0.1" aria-label="Video progress" data-video-progress>
                    </div>
                    <button class="video-player__fullscreen" type="button" aria-label="Enter fullscreen" aria-pressed="false" data-video-fullscreen>⛶</button>
                </div>
            `);
        });
        root.querySelectorAll("[data-video-player]").forEach(initVideoPlayer);
    }

    window.initVideoPlayers = initVideoPlayers;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => initVideoPlayers(), { once: true });
    } else {
        initVideoPlayers();
    }
})();