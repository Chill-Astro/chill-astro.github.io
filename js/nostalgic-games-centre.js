(() => {
    const setupRevealAnimations = () => {
        const revealElements = [...document.querySelectorAll(".game-showcase")];
        if (!revealElements.length || !("IntersectionObserver" in window)) return;

        const observer = new IntersectionObserver(entries => {
            window.orderScrollRevealEntries(entries).forEach(entry => {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            });
        }, window.getScrollRevealOptions());

        revealElements.forEach(element => {
            element.classList.add("hidden");
            observer.observe(element);
        });
    };

    setupRevealAnimations();
})();
