(() => {
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
