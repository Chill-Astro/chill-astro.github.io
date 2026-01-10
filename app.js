// Fetch and display GitHub projects for chill-astro using pre-baked local data
window.addEventListener('DOMContentLoaded', () => {
    // Portrait/narrow screen warning logic
    function checkOrientation() {
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        const isNarrow = window.innerWidth < 700;
        const warning = document.getElementById('portrait-warning');
        if (isPortrait && isNarrow) {
            document.body.classList.add('portrait-warning');
            if (warning) warning.style.display = 'flex';
        } else {
            document.body.classList.remove('portrait-warning');
            if (warning) warning.style.display = 'none';
        }
    }
    window.addEventListener('resize', checkOrientation);
    checkOrientation();

    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;

    // List of specific repos to show
    const allowedRepos = [
        'Lamina',
        'PyCalc-GUI',
        'PyCalc',
        'Net-Update',
        'OpenScan',
        'MsixCertImportTool',
        'Mica',
        'Mica-Alt',
        'PyCalc-PLUS',
        'FastCalc',
        'Acrylic',
    ];

    /**
     * SUCCESS: Instead of fetching from api.github.com (which causes rate limits),
     * we fetch the local repo-data.json file created by the GitHub Action.
     */
    fetch('./repo-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Local repo-data.json not found. Ensure GitHub Action has run.');
            }
            return response.json();
        })
        .then(repos => {
            // Filter the baked data based on your allowed list
            const filtered = repos.filter(repo => allowedRepos.includes(repo.name));
            
            projectsList.innerHTML = '';

            filtered.forEach(repo => {
                const li = document.createElement('li');
                
                // The version is now included in the JSON file directly, 
                // so we no longer need a second fetch() inside this loop.
                const versionBadge = repo.version 
                    ? `<span class='version-badge'>${repo.version}</span>` 
                    : '';

                li.innerHTML = `
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    ${versionBadge}
                    <span class="repo-desc">${repo.description || 'No description'}</span>
                `;
                projectsList.appendChild(li);
            });
        })
        .catch((error) => {
            console.error('Error:', error);
            projectsList.innerHTML = '<li>Could not load projects. Please try again later.</li>';
        });
});
