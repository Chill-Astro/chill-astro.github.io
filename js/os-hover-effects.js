(() => {
    const ua = navigator.userAgent || "";
    const uaData = navigator.userAgentData;
    const platform = uaData?.platform || navigator.platform || "";
    const mobileOrUnsupportedPlatform = /Android|Chrome OS|CrOS|iPad|iPhone|iPod|iOS/i.test(`${ua} ${platform}`) ||
        (uaData?.mobile === true && !/Windows|macOS|Linux/i.test(platform));
    const supportedOS = !mobileOrUnsupportedPlatform &&
        (/Windows|Win32|Win64/i.test(platform) ||
         /Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) && (navigator.maxTouchPoints || 0) <= 1 ||
         /Linux|X11/i.test(platform));
    if (supportedOS) document.documentElement.classList.add("os-effects");

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let hoveredCard = null;
    let pointerX = 0;
    let pointerY = 0;

    document.addEventListener("pointermove", event => {
        const card = event.target.closest(".project-card");
        if (!card) return;

        hoveredCard = card;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (frame) return;

        frame = requestAnimationFrame(() => {
            frame = 0;
            if (!hoveredCard?.isConnected) return;

            const bounds = hoveredCard.getBoundingClientRect();
            hoveredCard.style.setProperty("--cursor-shadow-x", `${Math.max(-12, Math.min(12, pointerX - bounds.left - bounds.width / 2))}px`);
            hoveredCard.style.setProperty("--cursor-shadow-y", `${Math.max(-12, Math.min(12, pointerY - bounds.top - bounds.height / 2))}px`);
        });
    }, { passive: true });
})();
