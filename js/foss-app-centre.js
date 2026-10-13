(() => {
    const cards = [...document.querySelectorAll(".app-showcase")];
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

    const revealCards = () => {
        if (!cards.length) return;
        if (!("IntersectionObserver" in window) || !window.getScrollRevealOptions) {
            cards.forEach(card => {
                card.classList.remove("hidden");
                card.classList.add("show");
            });
            return;
        }

        const observer = new IntersectionObserver(entries => {
            const visibleEntries = window.orderScrollRevealEntries
                ? window.orderScrollRevealEntries(entries)
                : entries.filter(entry => entry.isIntersecting);

            visibleEntries.forEach(entry => {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            });
        }, window.getScrollRevealOptions());

        cards.forEach(card => {
            card.classList.add("hidden");
            observer.observe(card);
        });
    };

    loadVersions();
    revealCards();
})();
