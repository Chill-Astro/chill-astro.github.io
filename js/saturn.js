(() => {
    const frame = document.querySelector(".saturn-frame");
    const backCanvas = frame?.querySelector(".saturn-canvas--back");
    const frontCanvas = frame?.querySelector(".saturn-canvas--front");
    if (!(backCanvas instanceof HTMLCanvasElement) || !(frontCanvas instanceof HTMLCanvasElement)) return;

    const backContext = backCanvas.getContext("2d");
    const frontContext = frontCanvas.getContext("2d");
    if (!backContext || !frontContext) {
        console.error("Could not initialize the profile orbit canvas.");
        return;
    }

    const staticDeviceQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const simulationCookieName = "saturn_simulation";
    const j2000Start = Date.UTC(2000, 0, 1, 12);
    const millisecondsPerDay = 86400000;
    const viewInclination = Math.acos(0.36);
    const fastestDisplayOrbitSeconds = 6;
    const slowestDisplayOrbitSeconds = 60;
    const profileButton = frame.querySelector(".logo-circle");
    let width = 0;
    let height = 0;
    let profileRadius = 0;
    let animationFrame = 0;
    let moons = [];
    let saturnGm = 0;
    let minimumMoonDistance = 0;
    let maximumMoonDistance = 0;
    let minimumOrbitalPeriod = 0;
    let maximumOrbitalPeriod = 0;
    let simulationStartDay = 0;
    let simulationStartTimestamp = 0;
    let simulationEnabled = readSimulationPreference();

    function readSavedSimulationPreference() {
        const savedCookie = document.cookie
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${simulationCookieName}=`));
        const savedValue = savedCookie?.slice(simulationCookieName.length + 1);
        if (savedValue === "on") return true;
        if (savedValue === "off") return false;
        return null;
    }

    function readSimulationPreference() {
        return readSavedSimulationPreference() ?? !staticDeviceQuery.matches;
    }

    function updateSimulationControl() {
        const label = `${simulationEnabled ? "Pause" : "Resume"} moon simulation`;
        profileButton.setAttribute("aria-label", label);
        profileButton.setAttribute("title", label);
        profileButton.setAttribute("aria-pressed", String(simulationEnabled));
    }

    function toggleSimulation() {
        simulationEnabled = !simulationEnabled;
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${simulationCookieName}=${simulationEnabled ? "on" : "off"}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
        const savedPreference = document.cookie
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${simulationCookieName}=`));
        if (savedPreference?.slice(simulationCookieName.length + 1) !== (simulationEnabled ? "on" : "off")) {
            console.error("Could not save the moon simulation preference in a cookie.");
        }
        updateSimulationControl();
        updateMotion();
    }

    function createRandom(seed) {
        let value = seed;
        return () => {
            value = (value * 1664525 + 1013904223) % 4294967296;
            return value / 4294967296;
        };
    }

    const random = createRandom(150);

    const stars = Array.from({ length: 42 }, () => ({
        x: random(),
        y: random(),
        alpha: 0.12 + random() * 0.36,
        radius: 0.35 + random() * 0.55
    }));

    function strokeRing(context, radius, start, end, color, lineWidth) {
        context.beginPath();
        context.arc(0, 0, radius, start, end);
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke();
    }

    function drawRings(context, centerX, centerY, profileRadius, front) {
        const start = front ? 0 : Math.PI;
        const end = front ? Math.PI : Math.PI * 2;
        context.save();
        context.translate(centerX, centerY);
        context.rotate(-0.22);
        context.scale(1, 0.36);

        strokeRing(context, profileRadius * 1.36, start, end, "rgba(132, 140, 153, 0.28)", profileRadius * 0.11);
        strokeRing(context, profileRadius * 1.43, start, end, "rgba(220, 224, 232, 0.34)", profileRadius * 0.065);
        strokeRing(context, profileRadius * 1.48, start, end, "rgba(245, 247, 250, 0.7)", Math.max(profileRadius * 0.014, 0.8));
        strokeRing(context, profileRadius * 1.55, start, end, "rgba(48, 52, 60, 0.78)", Math.max(profileRadius * 0.032, 1.2));
        strokeRing(context, profileRadius * 1.62, start, end, "rgba(199, 205, 215, 0.36)", profileRadius * 0.075);
        strokeRing(context, profileRadius * 1.7, start, end, "rgba(242, 244, 248, 0.68)", Math.max(profileRadius * 0.012, 0.7));

        for (let index = 0; index < 9; index++) {
            const radius = profileRadius * (1.32 + index * 0.038);
            strokeRing(
                context,
                radius,
                start,
                end,
                `rgba(230, 234, 241, ${0.08 + index % 3 * 0.035})`,
                Math.max(profileRadius * 0.008, 0.45)
            );
        }
        context.restore();
    }

    function drawMoon(context, x, y, moon) {
        const titan = moon.name === "Titan";
        const radius = titan ? 4.8 : 0.9 + Math.min(moon.e, 0.5) * 0.7;
        const colors = titan
            ? ["#ffe0a6", "#d88b43", "#56331d"]
            : ["#fff", "#bfc3ca", "#51545a"];

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = colors[1];
        context.shadowColor = titan ? "rgba(244, 157, 73, 0.8)" : "rgba(235, 239, 246, 0.58)";
        context.shadowBlur = titan ? radius * 1.9 : radius * 1.6;
        context.fill();
        context.shadowBlur = 0;

        context.beginPath();
        context.arc(x - radius * 0.28, y - radius * 0.3, Math.max(radius * 0.2, 0.2), 0, Math.PI * 2);
        context.fillStyle = colors[0];
        context.fill();

        context.beginPath();
        context.arc(x + radius * 0.3, y + radius * 0.28, radius * 0.72, 0, Math.PI * 2);
        context.fillStyle = colors[2];
        context.globalAlpha = 0.42;
        context.fill();
        context.globalAlpha = 1;
    }

    function getOrbitRadius(distanceKm) {
        const logRange = Math.log(maximumMoonDistance / minimumMoonDistance);
        const fraction = Math.log(Math.max(distanceKm, minimumMoonDistance) / minimumMoonDistance) / logRange;
        return profileRadius * (1.12 + fraction * 0.66);
    }

    function getMoonPosition(moon, simulationDay, animationSeconds = 0) {
        const periodDays = 2 * Math.PI * Math.sqrt(moon.aKm ** 3 / saturnGm) / 86400;
        const periodProgress = Math.log(periodDays / minimumOrbitalPeriod) /
            Math.log(maximumOrbitalPeriod / minimumOrbitalPeriod);
        const visualPeriodSeconds = fastestDisplayOrbitSeconds +
            periodProgress * (slowestDisplayOrbitSeconds - fastestDisplayOrbitSeconds);
        const meanAnomaly = ((moon.meanDeg * Math.PI / 180 +
            2 * Math.PI * (simulationDay - moon.epochDays) / periodDays +
            2 * Math.PI * animationSeconds / visualPeriodSeconds + Math.PI) %
            (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        let eccentricAnomaly = moon.e < 0.8 ? meanAnomaly : Math.PI;
        for (let iteration = 0; iteration < 8; iteration++) {
            eccentricAnomaly -= (eccentricAnomaly - moon.e * Math.sin(eccentricAnomaly) - meanAnomaly) /
                (1 - moon.e * Math.cos(eccentricAnomaly));
        }

        const orbitalX = moon.aKm * (Math.cos(eccentricAnomaly) - moon.e);
        const orbitalY = moon.aKm * Math.sqrt(1 - moon.e ** 2) * Math.sin(eccentricAnomaly);
        const argument = moon.argDeg * Math.PI / 180;
        const inclination = moon.iDeg * Math.PI / 180;
        const node = moon.nodeDeg * Math.PI / 180;
        const xPerifocal = orbitalX * Math.cos(argument) - orbitalY * Math.sin(argument);
        const yPerifocal = orbitalX * Math.sin(argument) + orbitalY * Math.cos(argument);
        const x = xPerifocal * Math.cos(node) - yPerifocal * Math.cos(inclination) * Math.sin(node);
        const y = xPerifocal * Math.sin(node) + yPerifocal * Math.cos(inclination) * Math.cos(node);
        const z = yPerifocal * Math.sin(inclination);
        const distance = Math.hypot(x, y, z);
        const scale = getOrbitRadius(distance) / distance;
        const scaledX = x * scale;
        const scaledY = y * scale;
        const scaledZ = z * scale;
        const rotatedY = scaledX * Math.sin(-0.22) + scaledY * Math.cos(-0.22);

        return {
            x: scaledX * Math.cos(-0.22) - scaledY * Math.sin(-0.22),
            y: rotatedY * Math.cos(viewInclination) - scaledZ * Math.sin(viewInclination),
            depth: rotatedY * Math.sin(viewInclination) + scaledZ * Math.cos(viewInclination)
        };
    }

    function drawLayer(context, simulationDay, front, animationSeconds = 0) {
        context.clearRect(0, 0, width, height);
        if (!front) {
            for (const star of stars) {
                context.beginPath();
                context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(220, 225, 233, ${star.alpha})`;
                context.fill();
            }
        }

        const centerX = width / 2;
        const centerY = height / 2;

        if (!front) drawRings(context, centerX, centerY, profileRadius, false);

        for (const moon of moons) {
            const position = getMoonPosition(moon, simulationDay, animationSeconds);
            if ((position.depth >= 0) !== front) continue;

            drawMoon(
                context,
                centerX + position.x,
                centerY + position.y,
                moon
            );
        }

        if (front) drawRings(context, centerX, centerY, profileRadius, true);
    }

    function resizeCanvas() {
        const bounds = frame.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        profileRadius = frame.querySelector(".logo-circle").getBoundingClientRect().width / 2;
        for (const canvas of [backCanvas, frontCanvas]) {
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
        }
        backContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        frontContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (moons.length) {
            const simulationDay = animationFrame ? simulationStartDay : getCurrentSimulationDay();
            const animationSeconds = animationFrame
                ? (window.performance.now() - simulationStartTimestamp) / 1000
                : 0;
            drawLayer(backContext, simulationDay, false, animationSeconds);
            drawLayer(frontContext, simulationDay, true, animationSeconds);
        }
    }

    function getCurrentSimulationDay() {
        return (Date.now() - j2000Start) / millisecondsPerDay;
    }

    function isStaticMode() {
        return !simulationEnabled || reducedMotionQuery.matches;
    }

    function animate(timestamp) {
        if (isStaticMode() || document.hidden) {
            animationFrame = 0;
            const currentDay = getCurrentSimulationDay();
            drawLayer(backContext, currentDay, false);
            drawLayer(frontContext, currentDay, true);
            return;
        }
        const animationSeconds = (timestamp - simulationStartTimestamp) / 1000;
        drawLayer(backContext, simulationStartDay, false, animationSeconds);
        drawLayer(frontContext, simulationStartDay, true, animationSeconds);
        animationFrame = window.requestAnimationFrame(animate);
    }

    function updateMotion() {
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
        }
        if (isStaticMode()) {
            const currentDay = getCurrentSimulationDay();
            drawLayer(backContext, currentDay, false);
            drawLayer(frontContext, currentDay, true);
        } else if (!document.hidden) {
            simulationStartDay = getCurrentSimulationDay();
            simulationStartTimestamp = window.performance.now();
            animationFrame = window.requestAnimationFrame(animate);
        }
    }

    function updateDeviceDefault() {
        const savedPreference = readSavedSimulationPreference();
        if (savedPreference === null) {
            simulationEnabled = !staticDeviceQuery.matches;
            updateSimulationControl();
        }
        updateMotion();
    }

    async function initialize() {
        updateSimulationControl();
        profileButton.addEventListener("click", toggleSimulation);

        const response = await fetch("/assets/data/saturn-moons.json");
        if (!response.ok) throw new Error(`JPL moon data request failed: ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.moons) || data.moons.length !== data.moonCount ||
            data.moonCount !== 292 ||
            !data.moons.some((moon) => moon.name === "Titan")) {
            throw new Error("The local JPL moon data must contain all 292 records including Titan.");
        }
        saturnGm = data.saturnGmKm3S2;
        moons = data.moons;
        minimumMoonDistance = Math.min(...moons.map((moon) => moon.aKm * (1 - moon.e)));
        maximumMoonDistance = Math.max(...moons.map((moon) => moon.aKm * (1 + moon.e)));
        minimumOrbitalPeriod = Math.min(...moons.map(
            (moon) => 2 * Math.PI * Math.sqrt(moon.aKm ** 3 / saturnGm) / 86400
        ));
        maximumOrbitalPeriod = Math.max(...moons.map(
            (moon) => 2 * Math.PI * Math.sqrt(moon.aKm ** 3 / saturnGm) / 86400
        ));

        window.addEventListener("resize", resizeCanvas);
        document.addEventListener("visibilitychange", updateMotion);
        staticDeviceQuery.addEventListener("change", updateDeviceDefault);
        reducedMotionQuery.addEventListener("change", updateMotion);
        resizeCanvas();
        updateMotion();
    }

    initialize().catch((error) => console.error("Failed to initialize the Saturn moon simulation:", error));
})();
