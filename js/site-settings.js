(() => {
    const cookieName = "site_settings";
    const platform = `${navigator.userAgent || ""} ${navigator.userAgentData?.platform || navigator.platform || ""}`;
    const isMobile = navigator.userAgentData?.mobile === true ||
        /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(platform) ||
        (/Macintosh|MacIntel/i.test(platform) && (navigator.maxTouchPoints || 0) > 1);
    const defaults = { blur: !isMobile, hover: !isMobile, saturn: !isMobile };
    const savedCookie = document.cookie.split(";").map(value => value.trim())
        .find(value => value.startsWith(`${cookieName}=`));

    function readSettings() {
        const bits = savedCookie ? decodeURIComponent(savedCookie.slice(cookieName.length + 1)) : "";
        if (!/^[01]{3}$/.test(bits)) return { ...defaults };
        return { blur: bits[0] === "1", hover: bits[1] === "1", saturn: bits[2] === "1" };
    }

    let settings = readSettings();
    const root = document.documentElement;
    const applySettings = () => {
        root.classList.toggle("effects-blur", settings.blur);
        root.classList.toggle("effects-hover", settings.hover);
        window.siteSettings = { ...settings };
        document.dispatchEvent(new CustomEvent("site-settings-change", { detail: { ...settings } }));
    };

    function saveSettings() {
        const bits = `${+settings.blur}${+settings.hover}${+settings.saturn}`;
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${cookieName}=${bits}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
        applySettings();
    }

    applySettings();
    const savedBits = savedCookie ? decodeURIComponent(savedCookie.slice(cookieName.length + 1)) : "";
    if (!/^[01]{3}$/.test(savedBits)) {
        const initialBits = `${+settings.blur}${+settings.hover}${+settings.saturn}`;
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${cookieName}=${initialBits}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    }

    let overlay;
    let previousFocus;
    let closeTimer;
    function buildModal() {
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.className = "download-overlay site-settings-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section class="download-dialog site-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="site-settings-title">
                <div class="dialog-header">
                    <h2 id="site-settings-title">Settings</h2>
                    <button class="dialog-close" type="button" aria-label="Close settings">×</button>
                </div>
                <div class="dialog-body site-settings-body">
                    <p class="site-settings-description">Choose which Visual Effects this Device can use if you are facing Performance Issues on VM/Tablets.</p>
                    <label class="site-setting-row"><span>Gaussian Blur</span><input type="checkbox" data-setting="blur"></label>
                    <label class="site-setting-row"><span>Advanced Hover Effects ( PC ONLY )</span><input type="checkbox" data-setting="hover"></label>
                    <label class="site-setting-row"><span>Homepage Saturn Animation</span><input type="checkbox" data-setting="saturn"></label>
                </div>
            </section>`;
        document.body.append(overlay);
        overlay.addEventListener("click", event => {
            if (event.target === overlay || event.target.closest(".dialog-close")) closeModal();
        });
        overlay.addEventListener("change", event => {
            const input = event.target.closest("input[data-setting]");
            if (!input) return;
            settings[input.dataset.setting] = input.checked;
            saveSettings();
        });
        return overlay;
    }

    function openModal(button) {
        const modal = buildModal();
        window.clearTimeout(closeTimer);
        previousFocus = button;
        button.setAttribute("aria-expanded", "true");
        for (const input of modal.querySelectorAll("input[data-setting]")) {
            input.checked = Boolean(settings[input.dataset.setting]);
        }
        modal.hidden = false;
        requestAnimationFrame(() => modal.classList.add("show"));
        modal.querySelector("input[data-setting='blur']").focus();
    }

    function closeModal() {
        if (!overlay || overlay.hidden) return;
        overlay.classList.remove("show");
        closeTimer = window.setTimeout(() => { overlay.hidden = true; }, 240);
        previousFocus?.setAttribute("aria-expanded", "false");
        previousFocus?.focus();
    }

    document.addEventListener("click", event => {
        const button = event.target.closest("#device-settings-button");
        if (button) openModal(button);
    });
    document.addEventListener("keydown", event => {
        if (!overlay || overlay.hidden) return;
        if (event.key === "Escape") {
            closeModal();
            return;
        }
        if (event.key !== "Tab") return;
        const focusable = [...overlay.querySelectorAll("button, input")].filter(element => !element.disabled);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        let frame = 0;
        let hoveredCard = null;
        let pointerX = 0;
        let pointerY = 0;
        document.addEventListener("pointermove", event => {
            if (!settings.hover) return;
            const card = event.target.closest(".project-card");
            if (!card) return;
            hoveredCard = card;
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                if (!settings.hover || !hoveredCard?.isConnected) return;
                const bounds = hoveredCard.getBoundingClientRect();
                hoveredCard.style.setProperty("--cursor-shadow-x", `${Math.max(-12, Math.min(12, pointerX - bounds.left - bounds.width / 2))}px`);
                hoveredCard.style.setProperty("--cursor-shadow-y", `${Math.max(-12, Math.min(12, pointerY - bounds.top - bounds.height / 2))}px`);
            });
        }, { passive: true });
    }
})();
