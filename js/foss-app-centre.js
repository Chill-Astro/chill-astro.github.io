(() => {
    const versionLabels = [...document.querySelectorAll("[data-repo-version]")];

    const loadVersions = async () => {
        try {
            const response = await fetch("../assets/data/repo-data.json");
            if (!response.ok) throw new Error("Version data unavailable");
            const repositories = await response.json();

            versionLabels.forEach(label => {
                const version = repositories[label.dataset.repoVersion]?.tag;
                label.textContent = version || "Unavailable";
            });
        } catch (_) {
            versionLabels.forEach(label => { label.textContent = "Unavailable"; });
        }
    };

    loadVersions();
})();
