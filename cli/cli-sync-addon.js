// CLI SYNC ADDON
// Adds GitHub Gist sync to CLI tool without modifying original code

(function() {
    'use strict';

    const GITHUB_API = 'https://api.github.com';
    
    // Create sync buttons in header
    function injectSyncButtons() {
        // Try multiple possible header selectors
        let header = document.querySelector('.header-actions');
        if (!header) header = document.querySelector('.toolbar');
        if (!header) header = document.querySelector('header');
        if (!header) header = document.querySelector('.header');
        
        if (!header) {
            // If no header found, create button container at top of body
            console.warn('CLI Sync: No header found, creating sync bar at top');
            const syncBar = document.createElement('div');
            syncBar.style.cssText = 'position: fixed; top: 0; right: 0; z-index: 9999; padding: 10px; background: #282828; border-bottom: 1px solid #3c3836; display: flex; gap: 8px;';
            syncBar.id = 'cliSyncBar';
            document.body.insertBefore(syncBar, document.body.firstChild);
            header = syncBar;
        }

        // Create button container
        const syncContainer = document.createElement('span');
        syncContainer.style.cssText = 'display: inline-flex; gap: 8px; margin-left: 8px;';

        // Login button
        const loginBtn = document.createElement('button');
        loginBtn.id = 'cliSyncLoginBtn';
        loginBtn.textContent = '☁️ Login';
        loginBtn.onclick = showLoginModal;
        loginBtn.style.cssText = 'background: #689d6a; color: #ebdbb2; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 13px; font-weight: 600;';

        // Push button
        const pushBtn = document.createElement('button');
        pushBtn.id = 'cliSyncPushBtn';
        pushBtn.textContent = '↑ Push';
        pushBtn.onclick = pushNow;
        pushBtn.style.cssText = 'background: #689d6a; color: #ebdbb2; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 13px; font-weight: 600; display: none;';

        // Pull button
        const pullBtn = document.createElement('button');
        pullBtn.id = 'cliSyncPullBtn';
        pullBtn.textContent = '↓ Pull';
        pullBtn.onclick = pullNow;
        pullBtn.style.cssText = 'background: #689d6a; color: #ebdbb2; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 13px; font-weight: 600; display: none;';

        syncContainer.appendChild(loginBtn);
        syncContainer.appendChild(pushBtn);
        syncContainer.appendChild(pullBtn);
        
        // Append to header
        header.appendChild(syncContainer);

        // Add sync status to bottom stats bar (if exists)
        const stats = document.querySelector('.stats');
        if (stats) {
            const syncStatus = document.createElement('span');
            syncStatus.id = 'cliSyncStatus';
            syncStatus.style.cssText = 'font-size: 11px; color: #928374; margin-left: 20px;';
            stats.appendChild(syncStatus);
        }

        console.log('CLI Sync: Buttons injected successfully');
    }

    // Create login modal
    function createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'cliSyncLoginModal';
        modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); z-index: 10000; justify-content: center; align-items: center; padding: 20px;';
        modal.onclick = (e) => { if (e.target === modal) closeLoginModal(); };
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: #282828; border: 2px solid #504945; border-radius: 8px; padding: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;';
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #fabd2f; font-size: 18px; margin: 0;">Login to GitHub</h2>
                <button onclick="window.cliSyncCloseModal()" style="background: #458588; color: #ebdbb2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            <p style="margin-bottom: 12px; color: #a89984; font-family: monospace; font-size: 13px;">Enter your GitHub Personal Access Token to enable sync.</p>
            <input type="password" id="cliSyncGithubToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="width: 100%; padding: 10px; background: #3c3836; border: 1px solid #504945; color: #ebdbb2; border-radius: 4px; font-family: monospace; margin-bottom: 12px; font-size: 13px;">
            <p style="font-size: 12px; color: #665c54; margin-bottom: 16px; font-family: monospace;">Token stored locally. Auto-pulls on login. Get token at <a href="https://github.com/settings/tokens" target="_blank" style="color: #8ec07c;">github.com/settings/tokens</a> (gist scope only)</p>
            <button onclick="window.cliSyncLogin()" style="background: #689d6a; color: #ebdbb2; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 13px; font-weight: 600;">Login</button>
            <button onclick="window.cliSyncCloseModal()" style="margin-left: 8px; background: #458588; color: #ebdbb2; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 13px;">Cancel</button>
            <div style="margin-top: 20px; padding: 12px; background: #3c3836; border-radius: 4px; font-size: 12px; font-family: monospace;">
                <strong>Already logged in?</strong><br>
                <button onclick="window.cliSyncLogout()" style="margin-top: 8px; padding: 6px 12px; font-size: 12px; background: #cc241d; color: #ebdbb2; border: none; border-radius: 4px; cursor: pointer; font-family: monospace;">Logout</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    function showLoginModal() {
        const modal = document.getElementById('cliSyncLoginModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('cliSyncGithubToken').focus();
        }
    }

    function closeLoginModal() {
        const modal = document.getElementById('cliSyncLoginModal');
        if (modal) modal.style.display = 'none';
    }

    async function login() {
        const token = document.getElementById('cliSyncGithubToken').value.trim();
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            alert('Invalid token format. GitHub PATs start with "ghp_" or "github_pat_"');
            return;
        }
        localStorage.setItem('cli_github_token', token);
        document.getElementById('cliSyncLoginBtn').style.display = 'none';
        document.getElementById('cliSyncPushBtn').style.display = 'inline-block';
        document.getElementById('cliSyncPullBtn').style.display = 'inline-block';
        closeLoginModal();
        document.getElementById('cliSyncGithubToken').value = '';
        updateSyncStatus('syncing', '↻ Pulling...');
        await pullFromGitHub(true);
    }

    function logout() {
        if (!confirm('Logout? You will need to enter token again to sync.')) return;
        localStorage.removeItem('cli_github_token');
        localStorage.removeItem('cli_gist_id');
        document.getElementById('cliSyncLoginBtn').style.display = 'inline-block';
        document.getElementById('cliSyncPushBtn').style.display = 'none';
        document.getElementById('cliSyncPullBtn').style.display = 'none';
        updateSyncStatus('', '');
        closeLoginModal();
    }

    async function pushNow() {
        const token = localStorage.getItem('cli_github_token');
        if (!token) return;

        updateSyncStatus('syncing', '↻ Pushing...');
        const gistId = localStorage.getItem('cli_gist_id');

        // Gather ALL CLI data from localStorage
        const data = {
            commands: JSON.parse(localStorage.getItem('commands') || '[]'),
            categories: JSON.parse(localStorage.getItem('categories') || '[]'),
            currentCategory: localStorage.getItem('currentCategory') || 'all',
            lastSync: new Date().toISOString()
        };

        const payload = {
            description: 'CLI Commands Data',
            public: false,
            files: {
                'cli-data.json': {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };

        try {
            let response;
            if (gistId) {
                response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch(`${GITHUB_API}/gists`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const gist = await response.json();
                    localStorage.setItem('cli_gist_id', gist.id);
                }
            }

            if (response.ok) {
                updateSyncStatus('synced', '☁️ Pushed');
            } else {
                console.error('Push failed:', await response.json());
                updateSyncStatus('error', '⚠️ Push failed');
                alert('Push failed. Check console for details.');
            }
        } catch (err) {
            console.error('Push error:', err);
            updateSyncStatus('error', '⚠️ Push error');
            alert('Push error: ' + err.message);
        }
    }

    async function pullNow() {
        if (!confirm('Pull from GitHub? This will overwrite your local CLI commands.')) return;
        await pullFromGitHub(false);
    }

    async function pullFromGitHub(silent) {
        const token = localStorage.getItem('cli_github_token');
        const gistId = localStorage.getItem('cli_gist_id');

        if (!token) {
            if (!silent) alert('Not logged in');
            return;
        }

        if (!gistId) {
            if (!silent) updateSyncStatus('error', '⚠️ No Gist found. Push first.');
            return;
        }

        updateSyncStatus('syncing', '↻ Pulling...');

        try {
            const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
                headers: { 'Authorization': `token ${token}` }
            });

            if (response.ok) {
                const gist = await response.json();
                const content = gist.files['cli-data.json'].content;
                const data = JSON.parse(content);

                // Restore ALL CLI data to localStorage
                localStorage.setItem('commands', JSON.stringify(data.commands));
                localStorage.setItem('categories', JSON.stringify(data.categories));
                if (data.currentCategory) {
                    localStorage.setItem('currentCategory', data.currentCategory);
                }

                // Reload the page to reflect changes
                updateSyncStatus('synced', '☁️ Pulled - Reloading...');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                console.error('Pull failed:', await response.json());
                updateSyncStatus('error', '⚠️ Pull failed');
                if (!silent) alert('Pull failed. Check console for details.');
            }
        } catch (err) {
            console.error('Pull error:', err);
            updateSyncStatus('error', '⚠️ Pull error');
            if (!silent) alert('Pull error: ' + err.message);
        }
    }

    function updateSyncStatus(state, text) {
        const statusEl = document.getElementById('cliSyncStatus');
        if (!statusEl) {
            console.log('CLI Sync Status:', text);
            return;
        }

        statusEl.className = '';
        if (state === 'synced') {
            statusEl.style.color = '#a9b665';
            statusEl.textContent = text;
        } else if (state === 'error') {
            statusEl.style.color = '#fb4934';
            statusEl.textContent = text;
        } else if (state === 'syncing') {
            statusEl.style.color = '#83a598';
            statusEl.textContent = text;
        } else {
            statusEl.style.color = '#928374';
            statusEl.textContent = text;
        }
    }

    // Expose functions to window for onclick handlers
    window.cliSyncLogin = login;
    window.cliSyncLogout = logout;
    window.cliSyncCloseModal = closeLoginModal;

    // Initialize on page load
    function init() {
        console.log('CLI Sync Addon: Initializing...');
        injectSyncButtons();
        createLoginModal();

        // Check if already logged in
        if (localStorage.getItem('cli_github_token')) {
            document.getElementById('cliSyncLoginBtn').style.display = 'none';
            document.getElementById('cliSyncPushBtn').style.display = 'inline-block';
            document.getElementById('cliSyncPullBtn').style.display = 'inline-block';
            updateSyncStatus('synced', '☁️ Ready');
        }
        console.log('CLI Sync Addon: Initialized successfully');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
