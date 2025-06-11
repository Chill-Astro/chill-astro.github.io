import React from 'react';

const Profile = () => {
    const username = "your-github-username";
    const bio = "A brief bio about yourself.";
    const repositories = [
        { name: "Repo 1", link: "https://github.com/your-github-username/repo1" },
        { name: "Repo 2", link: "https://github.com/your-github-username/repo2" },
        { name: "Repo 3", link: "https://github.com/your-github-username/repo3" },
    ];

    return (
        <div className="profile">
            <h1>{username}</h1>
            <p>{bio}</p>
            <h2>Repositories</h2>
            <ul>
                {repositories.map((repo, index) => (
                    <li key={index}>
                        <a href={repo.link} target="_blank" rel="noopener noreferrer">{repo.name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Profile;