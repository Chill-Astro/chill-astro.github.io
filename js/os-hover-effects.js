(() => {
    const ua = navigator.userAgent || "";
    const uaData = navigator.userAgentData;
    const platform = uaData?.platform || navigator.platform || "";
    const mobileOrUnsupportedPlatform = /Android|Chrome OS|CrOS|iPad|iPhone|iPod|iOS/i.test(`${ua} ${platform}`) ||
        (uaData?.mobile === true && !/Windows|macOS|Linux/i.test(platform));
    const supportedOS = !mobileOrUnsupportedPlatform &&
        (/Windows|Win32|Win64/i.test(platform) ||
         /Macintosh|MacIntel|MacPPC|Mac68K/i.test(platform) && (navigator.maxTouchPoints || 0) <= 1 ||
         /Linux|X11/i.test(platform));
    if (supportedOS) document.documentElement.classList.add("os-effects");

})();
