// Fetch and display GitHub projects for chill-astro
window.addEventListener('DOMContentLoaded', () => {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;
    fetch('https://api.github.com/users/chill-astro/repos?sort=updated')
        .then(response => response.json())
        .then(repos => {
            projectsList.innerHTML = '';
            repos.slice(0, 6).forEach(repo => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${repo.html_url}" target="_blank">${repo.name}</a>: ${repo.description || 'No description'} `;
                projectsList.appendChild(li);
            });
        })
        .catch(() => {
            projectsList.innerHTML = '<li>Could not load projects.</li>';
        });
});