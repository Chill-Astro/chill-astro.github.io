function animate(element, transform, delay) {
    setTimeout(() => {
        element.style.transition = "all .8s cubic-bezier(.22,1,.36,1)";
        element.style.opacity = "1";
        element.style.transform = transform;
    }, delay);
}

function heroAnimation() {
    const hero = document.querySelector(".rooting-hero");
    const image = document.querySelector(".rooting-hero .hero-image");
    const title = document.querySelector(".rooting-hero .hero-content h1");
    const copy = document.querySelector(".rooting-hero .hero-copy");
    const badges = document.querySelector(".rooting-hero .hero-badges");

    if (!hero || !image || !title || !copy) {
        return;
    }

    [image, title, copy, badges].forEach((element) => {
        if (element) {
            element.style.opacity = "0";
            element.style.transform = "translateY(24px)";
        }
    });

    requestAnimationFrame(() => {
        animate(image, "translateY(0)", 0);
        animate(title, "translateY(0)", 120);
        animate(copy, "translateY(0)", 240);
        if (badges) {
            animate(badges, "translateY(0)", 360);
        }
    });
}

function prepareRootingAnimations() {
    const animated = [
        ...document.querySelectorAll(".rooting-page .hidden"),
        ...document.querySelectorAll(".rooting-content > *")
    ];

    animated.forEach((item) => {
        item.classList.add("hidden");
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    animated.forEach((item) => {
        observer.observe(item);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".rooting-page")) {
        heroAnimation();
        prepareRootingAnimations();
    }
});
