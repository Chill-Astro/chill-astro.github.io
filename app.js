// Fetch and display GitHub projects for chill-astro
window.addEventListener('DOMContentLoaded', () => {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;
    // List of specific repos to show
    const allowedRepos = [
        'Calculator',
        'PyCalc-GUI',
        'PyCalc',
        'PyCalc-SE',
        'Net-Update',
        'OpenScan',
        'MsixCertImportTool'
    ];
    fetch('https://api.github.com/users/chill-astro/repos?per_page=100')
        .then(response => response.json())
        .then(repos => {
            const filtered = repos.filter(repo => allowedRepos.includes(repo.name));
            projectsList.innerHTML = '';
            filtered.forEach(repo => {
                // Fetch version from repo's latest release
                fetch(`https://api.github.com/repos/chill-astro/${repo.name}/releases/latest`)
                    .then(r => r.ok ? r.json() : null)
                    .then(release => {
                        const version = release && release.tag_name ? `${release.tag_name}` : '';
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                            ${version ? `<span class='version-badge'>${version}</span>` : ''}
                            <span class="repo-desc">${repo.description || 'No description'}</span>
                        `;
                        projectsList.appendChild(li);
                    });
            });
        })
        .catch(() => {
            projectsList.innerHTML = '<li>Could not load projects.</li>';
        });
});