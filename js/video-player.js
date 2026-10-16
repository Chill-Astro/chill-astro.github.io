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
        const skipButtons = player.querySelectorAll("[data-video-skip]");

        if (!media || !playButton || !playIcon || !progress || !fullscreenButton) {
            console.warn("Video player skipped: required controls are missing.", player);
            return;
        }

        player.dataset.videoInitialized = "true";
        player.tabIndex = player.tabIndex >= 0 ? player.tabIndex : 0;
        
        // Remove autoplay and loop, and start muted
        media.autoplay = false;
        media.loop = false;
        media.muted = true; // Start muted, user can unmute
        media.playsInline = true;
        media.preload = "metadata";

        let hideTimer;
        let lastClientX = 0;
        let lastClientY = 0;
        let fullscreenOverlay;
        let overlayMedia;
        let fullscreenOverlayAbort;

        const setProgress = () => progress.style.setProperty("--progress", `${Number(progress.value) || 0}%`);
        
        const showControls = () => {
            player.classList.add("is-active");
            clearTimeout(hideTimer);

            // Auto-hide controls when playing
            if (!media.paused) {
                hideTimer = window.setTimeout(() => {
                    player.classList.remove("is-active");
                }, 4000);
            }
        };

        const updatePlaybackState = () => {
            const paused = media.paused;
            playIcon.textContent = paused ? "▶" : "❚❚";
            playButton.setAttribute("aria-label", paused ? "Play video" : "Pause video");
            player.classList.toggle("is-playing", !paused);
        };

        const togglePlayback = async () => {
            const target = overlayMedia || media;
            try {
                if (target.paused) {
                    await target.play();
                } else {
                    target.pause();
                }
            } catch (error) {
                console.warn("Video playback failed.", error);
            }
            showControls();
        };

        const skip = (seconds) => {
            const target = overlayMedia || media;
            target.currentTime += seconds;
        };

        const updateProgress = () => {
            if (!Number.isFinite(media.duration) || media.duration <= 0) return;
            progress.value = String((media.currentTime / media.duration) * 100);
            setProgress();
        };

        const updateFullscreenState = (nativeFullscreen = false) => {
            const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
            const active = Boolean(fullscreenOverlay) || nativeFullscreen === true || Boolean(fullscreenElement &&
                (fullscreenElement === player || player.contains(fullscreenElement)));
            player.classList.toggle("is-fullscreen", active);
            fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
            fullscreenButton.setAttribute("aria-pressed", String(active));
            showControls();
        };

        const closeFullscreenOverlay = async () => {
            const overlay = fullscreenOverlay;
            if (!overlay) return;
            fullscreenOverlay = null;
            clearTimeout(overlay.hideTimer);
            fullscreenOverlayAbort?.abort();
            fullscreenOverlayAbort = null;
            try {
                if (document.fullscreenElement === overlay) await document.exitFullscreen();
            } catch (error) {
                console.warn("Could not exit fullscreen mode.", error);
            }
            const wasPlaying = overlayMedia && !overlayMedia.paused;
            if (overlayMedia && Number.isFinite(overlayMedia.currentTime)) {
                media.currentTime = overlayMedia.currentTime;
                overlayMedia.pause();
            }
            overlayMedia = null;
            overlay.remove();
            document.body.classList.remove("video-fullscreen-open");
            updateProgress();
            updatePlaybackState();
            if (wasPlaying) media.play().catch(() => {});
            fullscreenButton.setAttribute("aria-pressed", "false");
            fullscreenButton.setAttribute("aria-label", "Enter fullscreen");
        };

        const openFullscreenOverlay = async () => {
            if (fullscreenOverlay) return;
            const overlay = document.createElement("div");
            overlay.className = "video-fullscreen-ui is-controls-visible";
            overlay.setAttribute("role", "dialog");
            overlay.setAttribute("aria-label", "Fullscreen video player");
            overlay.setAttribute("aria-modal", "true");
            const stage = document.createElement("div");
            stage.className = "video-fullscreen-ui__stage";
            overlay.append(stage);
            const clone = media.cloneNode(true);
            clone.removeAttribute("controls");
            clone.autoplay = false;
            clone.loop = false;
            clone.playsInline = true;
            clone.muted = media.muted;
            clone.volume = media.volume;
            clone.playbackRate = media.playbackRate;
            const overlayControls = player.querySelector("[data-video-controls]").cloneNode(true);
            const overlayPlay = overlayControls.querySelector("[data-video-play]");
            const overlayPlayIcon = overlayControls.querySelector(".video-player__play-icon");
            const overlayProgress = overlayControls.querySelector("[data-video-progress]");
            const overlayFullscreen = overlayControls.querySelector("[data-video-fullscreen]");
            overlayControls.removeAttribute("data-video-controls");
            overlayControls.classList.add("video-fullscreen-ui__controls");
            overlayFullscreen.setAttribute("aria-label", "Exit fullscreen");
            overlayFullscreen.setAttribute("aria-pressed", "true");
            overlay.append(overlayControls);
            fullscreenOverlayAbort = new AbortController();
            const syncOverlay = () => {
                overlayPlayIcon.textContent = clone.paused ? "▶" : "❚❚";
                overlayPlay.setAttribute("aria-label", clone.paused ? "Play video" : "Pause video");
                if (Number.isFinite(clone.duration) && clone.duration > 0) {
                    overlayProgress.value = String((clone.currentTime / clone.duration) * 100);
                }
                overlayProgress.style.setProperty("--progress", `${overlayProgress.value}%`);
            };
            const revealControls = () => {
                overlay.classList.add("is-controls-visible");
                clearTimeout(overlay.hideTimer);
                if (!clone.paused) {
                    overlay.hideTimer = window.setTimeout(() => overlay.classList.remove("is-controls-visible"), 2600);
                }
            };

            fullscreenOverlay = overlay;
            overlayMedia = clone;
            const startTime = media.currentTime;
            const resumeOnOpen = !media.paused;
            media.pause();
            stage.append(clone);
            document.body.append(overlay);
            document.body.classList.add("video-fullscreen-open");
            fullscreenButton.setAttribute("aria-pressed", "true");
            fullscreenButton.setAttribute("aria-label", "Exit fullscreen");

            overlayFullscreen.addEventListener("click", closeFullscreenOverlay);
            overlayPlay.addEventListener("click", togglePlayback);
            overlayControls.querySelectorAll("[data-video-skip]").forEach(button => {
                button.addEventListener("click", () => {
                    skip(Number(button.dataset.videoSkip));
                    syncOverlay();
                    revealControls();
                });
            });
            overlayProgress.addEventListener("input", () => {
                if (Number.isFinite(clone.duration) && clone.duration > 0) {
                    clone.currentTime = Number(overlayProgress.value) * clone.duration / 100;
                }
                syncOverlay();
            });
            clone.addEventListener("timeupdate", syncOverlay, { signal: fullscreenOverlayAbort.signal });
            clone.addEventListener("loadedmetadata", syncOverlay, { signal: fullscreenOverlayAbort.signal });
            clone.addEventListener("play", () => {
                syncOverlay();
                revealControls();
            }, { signal: fullscreenOverlayAbort.signal });
            clone.addEventListener("pause", () => {
                syncOverlay();
                revealControls();
            }, { signal: fullscreenOverlayAbort.signal });
            overlay.addEventListener("pointermove", revealControls, { passive: true });
            overlay.addEventListener("pointerdown", revealControls, { passive: true });
            overlay.addEventListener("click", event => {
                if (event.target === stage || event.target === clone) revealControls();
            });
            overlay.addEventListener("keydown", event => {
                if (event.key === "Escape") closeFullscreenOverlay();
                if (event.key === "ArrowLeft") skip(-10);
                if (event.key === "ArrowRight") skip(10);
                if (event.code === "Space" && event.target === overlay) {
                    event.preventDefault();
                    togglePlayback();
                }
            });
            syncOverlay();
            revealControls();
            clone.addEventListener("loadedmetadata", () => {
                if (Number.isFinite(startTime) && startTime > 0) clone.currentTime = startTime;
                syncOverlay();
                if (resumeOnOpen) clone.play().catch(() => {});
            }, { once: true });
            clone.load();

            try {
                if (overlay.requestFullscreen) await overlay.requestFullscreen();
            } catch (error) {
                // The fixed overlay remains usable where the Fullscreen API is unavailable.
            }
            overlayFullscreen.focus({ preventScroll: true });
        };

        const seekVideoToProgress = () => {
            if (Number.isFinite(media.duration) && media.duration > 0) {
                media.currentTime = (Number(progress.value) / 100) * media.duration;
            }
            setProgress();
            showControls();
        };

        playButton.addEventListener("click", togglePlayback);

        media.addEventListener("click", (event) => {
            event.preventDefault();
        });
        
        skipButtons.forEach(button => {
            button.addEventListener("click", () => {
                const seconds = parseFloat(button.dataset.videoSkip);
                skip(seconds);
            });
        });

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
        media.addEventListener("loadedmetadata", updateProgress);
        
        progress.addEventListener("input", seekVideoToProgress);
        progress.addEventListener("change", seekVideoToProgress);

        fullscreenButton.addEventListener("click", async () => {
            if (fullscreenOverlay) await closeFullscreenOverlay();
            else await openFullscreenOverlay();
        });

        document.addEventListener("fullscreenchange", updateFullscreenState);
        document.addEventListener("webkitfullscreenchange", updateFullscreenState);
        document.addEventListener("fullscreenchange", () => {
            if (fullscreenOverlay && document.fullscreenElement !== fullscreenOverlay) closeFullscreenOverlay();
        });
        media.addEventListener("webkitbeginfullscreen", () => updateFullscreenState(true));
        media.addEventListener("webkitendfullscreen", () => updateFullscreenState(false));

        player.addEventListener("keydown", event => {
            if (event.target !== player) return;
            if (event.code === "Space" || event.code === "Enter") {
                event.preventDefault();
                togglePlayback();
            } else if (event.code === "ArrowLeft") {
                event.preventDefault();
                skip(-3);
            } else if (event.code === "ArrowRight") {
                event.preventDefault();
                skip(3);
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
        player.addEventListener("pointermove", event => {
            if (event.pointerType === "mouse") handleMouseMove(event);
        }, { passive: true });
        
        document.addEventListener("mousemove", event => {
            if (document.fullscreenElement === player) {
                handleMouseMove(event);
            }
        }, { passive: true });

        player.addEventListener("pointerleave", () => {
            if (!media.paused) {
                clearTimeout(hideTimer);
                player.classList.remove("is-active");
            }
        });

        const visibilityObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !fullscreenOverlay && document.fullscreenElement !== player && !media.paused) {
                    media.pause();
                }
            });
        }, { threshold: 0.01 });
        visibilityObserver.observe(player);

        setProgress();
        updatePlaybackState();
        updateFullscreenState();
        
        // Start with controls visible
        player.classList.add("is-active");
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
                    <div class="video-player__center-controls">
                        <button class="video-player__skip" type="button" aria-label="Skip backward 3 seconds" data-video-skip="-3">&lt;&lt;</button>
                        <button class="video-player__play" type="button" aria-label="Play video" data-video-play>
                            <span class="video-player__play-icon" aria-hidden="true">▶</span>
                        </button>
                        <button class="video-player__skip" type="button" aria-label="Skip forward 3 seconds" data-video-skip="3">&gt;&gt;</button>
                    </div>
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
