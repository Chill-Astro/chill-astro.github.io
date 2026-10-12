(() => {
    const ua = navigator.userAgent || "";
    const platform = navigator.userAgentData?.platform || navigator.platform || "";
    const supportedOS = !/Android|CrOS|iPad|iPhone|iPod|iOS/i.test(ua) &&
        (/Windows|Win32|Win64/i.test(platform) ||
         /Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) && (navigator.maxTouchPoints || 0) <= 1 ||
         /Linux|X11/i.test(platform));
    if (supportedOS) document.documentElement.classList.add("os-effects");
    for (const sheet of document.styleSheets) {
        try {
            const scopeRules = rules => {
                for (const rule of rules) {
                    if (rule.selectorText?.includes(":hover")) {
                        try {
                            rule.selectorText = rule.selectorText.split(/,(?![^()]*\))/).map(selector => {
                                selector = selector.trim();
                                if (/^(html|:root)/i.test(selector)) return selector.replace(/^(html|:root)/i, "html.os-effects");
                                return `html.os-effects ${selector}`;
                            }).join(", ");
                        } catch { /* Ignore selectors the browser does not allow to rewrite. */ }
                    }
                    if (rule.cssRules) scopeRules(rule.cssRules);
                }
            };
            scopeRules(sheet.cssRules);
        } catch { /* Ignore inaccessible stylesheets. */ }
    }

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const body = document.body;
    const configuredSize = Number.parseFloat(getComputedStyle(body).getPropertyValue("--grid-size"));
    const gridSize = Number.isFinite(configuredSize) && configuredSize > 0 ? configuredSize : 40;
    let pointerPosition = null;
    let glowTimeout;

    function updateGlow(clientX, clientY) {
        const x = Math.floor(clientX / gridSize) * gridSize;
        const y = Math.floor(clientY / gridSize) * gridSize;
        body.style.setProperty("--grid-hover-x", `${x}px`);
        body.style.setProperty("--grid-hover-y", `${y}px`);
        body.classList.add("grid-hover-glow");
        window.clearTimeout(glowTimeout);
    }

    document.addEventListener("pointermove", event => {
        if (event.pointerType !== "mouse") return;
        pointerPosition = { x: event.clientX, y: event.clientY };
        updateGlow(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("scroll", () => {
        if (pointerPosition) updateGlow(pointerPosition.x, pointerPosition.y);
    }, { passive: true, capture: true });

    document.addEventListener("pointerleave", () => {
        pointerPosition = null;
        window.clearTimeout(glowTimeout);
        glowTimeout = window.setTimeout(() => body.classList.remove("grid-hover-glow"), 300);
    });
})();
