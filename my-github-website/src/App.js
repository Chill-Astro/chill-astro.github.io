import React from 'react';
import Profile from './components/Profile';
import './styles/main.css';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to My GitHub Profile</h1>
            </header>
            <main>
                <Profile />
            </main>
        </div>
    );
}

export default App;