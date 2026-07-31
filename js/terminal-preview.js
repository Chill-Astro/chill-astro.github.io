// ======================================
// Chill-Astro Software
// terminal-preview.js
// ======================================

function escapeHtml(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

}

// ======================================
// Set Theme
// ======================================

function setTerminalPreview(config, targetId = "terminalPreview") {

    const terminal =
        document.getElementById(targetId);

    if (!terminal)
        return;

    terminal.className = `terminal-preview ${config.mode ?? "dark"}`;

    terminal.innerHTML = `
        <div class="terminal-titlebar">
            <div class="terminal-controls">
                <span class="control close"></span>
                <span class="control minimize"></span>
                <span class="control maximize"></span>
            </div>
        </div>
        <div class="terminal-body">
            <div class="terminal-prompt">
                <span class="seg user">${escapeHtml(config.user ?? "")}</span>
                <span class="plain">@</span>
                <span class="seg host">${escapeHtml(config.host ?? "")}</span>
                <span class="plain">:</span>
                <span class="seg path">${escapeHtml(config.path ?? "~")}</span>
                <span class="seg symbol">${escapeHtml(config.symbol ?? "$")}</span>
                <span class="cursor"></span>
            </div>
        </div>
    `;

}

// ======================================
// Theme Presets
// ======================================

const terminalThemes = {

    minima: {

        mode: "dark",

        theme: "Minima",

        user: "minima",

        host: "simplicity",

        path: "~",

        symbol: "$",

        extra: []

    },

    minimaPlus: {

        mode: "dark",

        theme: "Minima PLUS!",

        user: "minima",

        host: "simplicity",

        path: "~",

        symbol: "$",

        extra: [

            {
                separator: "›"
            },

            {
                class: "time",
                text: "in 1.008s"
            },

            {
                separator: "›"
            },

            {
                class: "git",
                text: "main"
            }

        ]

    }

};

// ======================================
// Auto Preview
// ======================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        if (document.getElementById("terminal-minima")) {

            setTerminalPreview(
                terminalThemes.minima,
                "terminal-minima"
            );

        }

        if (document.getElementById("terminal-minima-plus")) {

            setTerminalPreview(
                terminalThemes.minimaPlus,
                "terminal-minima-plus"
            );

        }

    }

);