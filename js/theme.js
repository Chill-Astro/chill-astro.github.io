(() => {
    const cookieName = "site_theme";
    const validModes = ["system", "dark", "light"];
    const isPhone = navigator.userAgentData?.mobile === true ||
        /iPhone|iPod|Android.*Mobile|Windows Phone|Mobile/i.test(navigator.userAgent);
    const icons = {
        system: isPhone
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="1" width="17" height="22" rx="3"></rect><path d="M10 19.5h4"></path></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>',
        dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"></path></svg>',
        light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>'
    };
    const nextModes = {
        system: "dark",
        dark: "light",
        light: "system"
    };

    const savedCookie = document.cookie
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${cookieName}=`));
    let mode = savedCookie ? savedCookie.slice(cookieName.length + 1) : "system";
    if (!validModes.includes(mode)) mode = "system";

    const root = document.documentElement;
    const themeColorMeta = [...document.querySelectorAll('meta[name="theme-color"]')];
    const originalThemeColors = themeColorMeta.map(meta => ({
        content: meta.getAttribute("content"),
        media: meta.getAttribute("media")
    }));

    const describeMode = value => value[0].toUpperCase() + value.slice(1);

    const updateControl = () => {
        const button = document.getElementById("theme-toggle");
        if (!button) return;

        const icon = button.querySelector("span");
        if (icon && icon.innerHTML !== icons[mode]) icon.innerHTML = icons[mode];

        const label = `Theme: ${describeMode(mode)}. Click to switch to ${describeMode(nextModes[mode])}.`;
        button.setAttribute("aria-label", label);
        button.title = label;
    };

    const applyMode = () => {
        root.dataset.theme = mode;
        root.style.colorScheme = mode === "system" ? "light dark" : mode;

        if (mode === "system") {
            themeColorMeta.forEach((meta, index) => {
                const original = originalThemeColors[index];
                if (original.content === null) meta.removeAttribute("content");
                else meta.setAttribute("content", original.content);
                if (original.media === null) meta.removeAttribute("media");
                else meta.setAttribute("media", original.media);
            });
        } else if (themeColorMeta.length) {
            themeColorMeta.forEach((meta, index) => {
                if (index === 0) {
                    meta.setAttribute("content", mode === "dark" ? "#0b0b0b" : "#ffffff");
                    meta.removeAttribute("media");
                } else {
                    meta.setAttribute("media", "not all");
                }
            });
        }

        updateControl();
    };

    const saveMode = () => {
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${cookieName}=${mode}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    };

    applyMode();

    document.addEventListener("click", event => {
        if (!event.target.closest("#theme-toggle")) return;
        mode = nextModes[mode];
        saveMode();
        applyMode();
    });

    new MutationObserver(updateControl).observe(root, {
        childList: true,
        subtree: true
    });
})();
