(() => {
    const cookieName = "site_settings";
    const platform = `${navigator.userAgent || ""} ${navigator.userAgentData?.platform || navigator.platform || ""}`;
    const isMobile = navigator.userAgentData?.mobile === true ||
        /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(platform) ||
        (/Macintosh|MacIntel/i.test(platform) && (navigator.maxTouchPoints || 0) > 1);
    const defaults = { blur: !isMobile, saturn: !isMobile, lite: false };
    const savedCookie = document.cookie.split(";").map(value => value.trim())
        .find(value => value.startsWith(`${cookieName}=`));

    function readSettings() {
        const bits = savedCookie ? decodeURIComponent(savedCookie.slice(cookieName.length + 1)) : "";
        if (!/^[01]{3,4}$/.test(bits)) return { ...defaults };
        return {
            blur: bits[0] === "1",
            saturn: bits[2] === "1",
            lite: bits.length === 4 && bits[3] === "1"
        };
    }

    let settings = readSettings();
    const root = document.documentElement;
    let overlay;
    let previousFocus;
    let closeTimer;
    let saturnScriptLoaded = false;
    const originalHoverRules = new Map();
    let hoverRulesEnabled;

    function splitSelectors(selectorText) {
        const selectors = [];
        let start = 0;
        let depth = 0;
        let quote = "";
        for (let index = 0; index < selectorText.length; index++) {
            const character = selectorText[index];
            if (quote) {
                if (character === quote && selectorText[index - 1] !== "\\") quote = "";
            } else if (character === "'" || character === '"') {
                quote = character;
            } else if (character === "(" || character === "[") {
                depth++;
            } else if (character === ")" || character === "]") {
                depth--;
            } else if (character === "," && depth === 0) {
                selectors.push(selectorText.slice(start, index).trim());
                start = index + 1;
            }
        }
        selectors.push(selectorText.slice(start).trim());
        return selectors;
    }

    function disableHoverSelector(selector) {
        // Keep each rule syntactically intact, but make its hover selector
        // impossible to match while Lite Mode is active. This also handles
        // selectors nested in :is(), :where(), and pseudo-element rules.
        return selector.replace(/:hover\b/g, ":not(*)");
    }

    function setLiteHoverRules(enabled) {
        if (hoverRulesEnabled === enabled) return;
        hoverRulesEnabled = enabled;

        function visitRules(rules) {
            for (const rule of rules) {
                if (rule.type === CSSRule.STYLE_RULE && typeof rule.selectorText === "string" && rule.selectorText.includes(":hover")) {
                    if (!originalHoverRules.has(rule)) originalHoverRules.set(rule, rule.selectorText);
                    const original = originalHoverRules.get(rule);
                    try {
                        rule.selectorText = enabled
                            ? original
                            : splitSelectors(original).map(disableHoverSelector).join(", ");
                    } catch (_) { /* Some browser-owned stylesheet rules are read-only. */ }
                } else if (rule.cssRules) {
                    try { visitRules(rule.cssRules); } catch (_) { /* Ignore inaccessible nested sheets. */ }
                }
            }
        }

        for (const sheet of document.styleSheets) {
            try { visitRules(sheet.cssRules); } catch (_) { /* Ignore cross-origin stylesheets. */ }
        }
    }

    function loadSaturnScript() {
        if (saturnScriptLoaded || !document.querySelector(".saturn-frame")) return;
        saturnScriptLoaded = true;
        const script = document.createElement("script");
        script.src = "/js/saturn.js?simulation=12";
        document.body.append(script);
    }

    function syncModalControls() {
        if (!overlay) return;
        for (const input of overlay.querySelectorAll("input[data-setting]")) {
            const setting = input.dataset.setting;
            input.checked = Boolean(settings[setting]);
            input.disabled = settings.lite && setting !== "lite";
            input.closest(".site-setting-row")?.classList.toggle("is-disabled", input.disabled);
            input.closest(".site-setting-row")?.setAttribute("aria-disabled", String(input.disabled));
        }
    }

    const applySettings = () => {
        root.classList.toggle("lite-mode", settings.lite);
        setLiteHoverRules(!settings.lite);
        root.classList.toggle("effects-blur", settings.blur && !settings.lite);
        const effectiveSettings = {
            ...settings,
            blur: settings.blur && !settings.lite,
            saturn: settings.saturn && !settings.lite
        };
        window.siteSettings = effectiveSettings;
        document.dispatchEvent(new CustomEvent("site-settings-change", { detail: effectiveSettings }));
        syncModalControls();
        if (!settings.lite) loadSaturnScript();
    };

    function saveSettings() {
        const bits = `${+settings.blur}0${+settings.saturn}${+settings.lite}`;
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${cookieName}=${bits}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
        applySettings();
    }

    applySettings();
    const savedBits = savedCookie ? decodeURIComponent(savedCookie.slice(cookieName.length + 1)) : "";
    if (!/^[01]{4}$/.test(savedBits)) {
        const initialBits = `${+settings.blur}0${+settings.saturn}${+settings.lite}`;
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${cookieName}=${initialBits}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    }

    function buildModal() {
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.className = "download-overlay site-settings-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section class="download-dialog site-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="site-settings-title">
                <div class="dialog-header">
                    <h2 id="site-settings-title">Settings</h2>
                    <button class="dialog-close" type="button" aria-label="Close settings">✕</button>
                </div>
                <div class="dialog-body site-settings-body">
                    <p class="site-settings-description">Toggle Heavy Visual Effects from here if Performance is Bad on VM / Mobile Device or you are Experiencing Lag.
                    <br><br>Lite Mode disables ALL Visual Effects and "Chill-Astro-ness" for Maximum Performance even if it Looks Trash. </p>
                    <label class="site-setting-row"><span>Gaussian Blur</span><input type="checkbox" data-setting="blur"></label>
                    <label class="site-setting-row"><span>Homepage Saturn Animation</span><input type="checkbox" data-setting="saturn"></label>
                    <label class="site-setting-row"><span>Lite Mode</span><input type="checkbox" data-setting="lite"></label>
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
        syncModalControls();
        modal.hidden = false;
        requestAnimationFrame(() => modal.classList.add("show"));
        modal.querySelector(`input[data-setting='${settings.lite ? "lite" : "blur"}']`).focus();
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

    if (!document.getElementById("header") && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        let frame = 0;
        let hoveredCard = null;
        let pointerX = 0;
        let pointerY = 0;
        document.addEventListener("pointermove", event => {
            if (settings.lite) return;
            const card = event.target.closest(".project-card");
            if (!card) return;
            hoveredCard = card;
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                if (settings.lite || !hoveredCard?.isConnected) return;
                const bounds = hoveredCard.getBoundingClientRect();
                hoveredCard.style.setProperty("--cursor-shadow-x", `${Math.max(-12, Math.min(12, pointerX - bounds.left - bounds.width / 2))}px`);
                hoveredCard.style.setProperty("--cursor-shadow-y", `${Math.max(-12, Math.min(12, pointerY - bounds.top - bounds.height / 2))}px`);
            });
        }, { passive: true });
    }
})();
