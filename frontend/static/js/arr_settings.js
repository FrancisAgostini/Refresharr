// form_register.js
document.addEventListener('DOMContentLoaded', function() {

    // Sonarr settings form elements - Basic settings
    const sonarrEnabled = document.getElementById('sonarr_enable');
    const sonarrApiKey = document.getElementById('sonarr_api_key').value;
    const sonarrUrl = document.getElementById('sonarr_url').value;
    const sonarrMissingShows = document.getElementById('hunt_missing_shows');
    const sonarrFuture = document.getElementById('sonarr_future');
    const sonarrUpgrade = document.getElementById('sonarr_upgrade');


    // Radarr settings form elements - Basic settings
    const radarrEnabled = document.getElementById('radarr_enable');
    const radarrApiKey = document.getElementById('radarr_api_key').value;
    const radarrUrl = document.getElementById('radarr_url').value;
    const radarrFuture = document.getElementById('radarr_future');
    const radarrUpgrade = document.getElementById('radarr_upgrade');


    // Lidarr settings form elements - Basic settings
    const lidarrEnabled = document.getElementById('lidarr_enable');
    const lidarrApiKey = document.getElementById('lidarr_api_key').value;
    const lidarrUrl = document.getElementById('lidarr_url').value;
    const lidarrMissingAlbums = document.getElementById('lidarr_missing_albums');
    const lidarrFuture = document.getElementById('lidarr_future');
    const lidarrUpgrade = document.getElementById('lidarr_upgrade');

    // Readarr settings form elements - Basic settings
    const readarrEnabled = document.getElementById('readarr_enable');
    const readarrApiKey = document.getElementById('readarr_api_key').value;
    const readarrUrl = document.getElementById('readarr_url').value;
    const readarrMissingAuthors = document.getElementById('readarr_missing_authors');
    const readarrFuture = document.getElementById('readarr_future');
    const readarrUpgrade = document.getElementById('readarr_upgrade');




    // Theme management
    function loadTheme() {
        fetch('/api/settings/theme')
            .then(response => response.json())
            .then(data => {
                const isDarkMode = data.dark_mode || false;
                setTheme(isDarkMode);
                themeToggle.checked = isDarkMode;
                themeLabel.textContent = isDarkMode ? 'Dark Mode' : 'Light Mode';
            })
            .catch(error => console.error('Error loading theme:', error));
    }

    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-theme');
            themeLabel.textContent = 'Dark Mode';
        } else {
            document.body.classList.remove('dark-theme');
            themeLabel.textContent = 'Light Mode';
        }
    }

    themeToggle.addEventListener('change', function() {
        const isDarkMode = this.checked;
        setTheme(isDarkMode);
        
        fetch('/api/settings/theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dark_mode: isDarkMode })
        })
        .catch(error => console.error('Error saving theme:', error));
    });



    // Function to save settings
    function saveSettings() {
        if (!checkForChanges()) {
            // If no changes, don't do anything
            return;
        }
        
        const settings = {
            sonarr: {
                sonarr_enabled: sonarrEnabled.checked,
                sonarr_api_key: String(sonarrApiKey),
                sonarr_url: String(sonarrUrl),
                sonarr_missing_shows: sonarrMissingShows.checked,
                sonarr_future: sonarrFuture.checked,
                sonarr_upgrade: sonarrUpgrade.checked
            },
            radarr: {
                radarr_enabled: radarrEnabled.checked,
                radarr_api_key: String(radarrApiKey),
                radarr_url: String(radarrUrl),
                radarr_future: radarrFuture.checked,
                radarr_upgrade: radarrUpgrade.checked
            },
            lidarr: {
                lidarr_enabled: lidarrEnabled.checked,
                lidarr_api_key: String(lidarrApiKey),
                lidarr_url: String(lidarrUrl),
                lidarr_missing_albums: lidarrMissingAlbums.checked,
                lidarr_future: lidarrFuture.checked,
                lidarr_upgrade: lidarrUpgrade.checked
            },
            readarr: {
                readarr_enabled: readarrEnabled.checked,
                readarr_api_key: String(readarrApiKey),
                readarr_url: String(readarrUrl),
                readarr_missing_authors: readarrMissingAuthors.checked,
                readarr_future: readarrFuture.checked,
                readarr_series_refresh: readarrSeriesRefresh.checked,
                readarr_upgrade: readarrUpgrade.checked
            }
        };
        
        fetch('/api/arr_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update original settings after successful save
                originalSettings = JSON.parse(JSON.stringify(settings));
                
                // Disable save buttons
                saveSettingsButton.disabled = true;
                saveSettingsBottomButton.disabled = true;
                saveSettingsButton.classList.add('disabled-button');
                saveSettingsBottomButton.classList.add('disabled-button');
                
                // Show success message
                if (data.changes_made) {
                    alert('Settings saved successfully and cycle restarted to apply changes!');
                } else {
                    alert('No changes detected.');
                }
            } else {
                alert('Error saving settings: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error saving settings:', error);
            alert('Error saving settings: ' + error.message);
        });
    }


});
