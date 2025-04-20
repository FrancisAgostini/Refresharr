document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements;
    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');
    
    // Sonarr settings form elements - Basic settings
    const sonarrEnabled = document.getElementById('sonarr_enabled');
    const sonarrApiKey = document.getElementById('sonarr_api_key').value;
    const sonarrUrl = document.getElementById('sonarr_url').value;
    const sonarrMissingShows = document.getElementById('sonarr_missing_shows');
    const sonarrFuture = document.getElementById('sonarr_future');
    const sonarrUpgrade = document.getElementById('sonarr_upgrade');

    
    // Button elements for saving and resetting settings
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const resetSettingsButton = document.getElementById('resetSettingsButton');
    
    // Store original settings values
    let originalSettings = {};
    
    
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
    
    
    // Function to check if settings have changed from original values
    function checkForChanges() {
        if (!originalSettings.sonarr) return; // Don't check if original settings not loaded
        
        let hasChanges = false;

        // Check Sonarr Settings
        if (sonarrEnabled.checked !== originalSettings.sonarr.sonarrEnabled) hasChanges = true;
        if (sonarrApiKey.value !== originalSettings.sonarr.sonarrApiKey) hasChanges = true;
        if (sonarrUrl.value !== originalSettings.sonarr.sonarrUrl) hasChanges = true;
        if (sonarrMissingShows.checked !== originalSettings.sonarr.sonarrMissingShows) hasChanges = true;
        if (sonarrFuture.checked !== originalSettings.sonarr.sonarrFuture) hasChanges = true;
        if (sonarrUpgrade.checkbox !== originalSettings.sonarr.sonarrUpgrade) hasChanges = true;

        // Enable/disable save buttons based on whether there are changes
        saveSettingsButton.disabled = !hasChanges;
        
        // Apply visual indicator based on disabled state
        if (hasChanges) {
            saveSettingsButton.classList.remove('disabled-button');
        } else {
            saveSettingsButton.classList.add('disabled-button');
        }
        
        return hasChanges;
    }
    
    // Add change event listeners to all form elements
    [sonarrApiKey, sonarrUrl].forEach(input => {
        if (input) {
            input.addEventListener('input', checkForChanges);
        } else {
            console.warn('Missing input element');
        }
    });
    
    
    [sonarrEnabled, sonarrFuture, sonarrMissingShows, sonarrUpgrade].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', checkForChanges);
        } else {
            console.warn('Missing checkbox element');
        }
    });
    
    
    // Load settings from API
    function loadSettings() {
        fetch('/api/settings')
            .then(response => response.json())
            .then(data => {
                const sonarr = data.sonarr || {};
                console.log(sonarr);

                
                // Store original settings for comparison
                originalSettings = JSON.parse(JSON.stringify(data));
                console.log(JSON.parse(JSON.stringify(data)));

                // Sonarr settings
                sonarrEnabled.checked = sonarr.sonarr_enabled !== false;
                sonarrApiKey.value = sonarr.sonarr_api_key || "https://sonarr:8989";
                sonarrUrl.value = sonarr.sonarr_url || "https://sonarr:8989";
                sonarrMissingShows.checkbox = sonarr.sonarr_missing_shows !== false;
                sonarrFuture.checked = sonarr.sonarr_future !== false;
                sonarrUpgrade.checkbox = sonarr.sonarr_upgrade !== false;
                 
                
                // Initialize save buttons state
                saveSettingsButton.disabled = true;
                saveSettingsButton.classList.add('disabled-button');
            })
            .catch(error => console.error('Error loading settings:', error));
    }
    
    // Function to save settings
    function saveSettings() {
        if (!checkForChanges()) {
            // If no changes, don't do anything
            console.log('no changes');
            return;
        }
        
        const settings = {
            sonarr: {
                sonarr_enabled: sonarrEnabled.checked,
                sonarr_api_key: sonarrApiKey,
                sonarr_url: sonarrUrl,
                sonarr_future: sonarrFuture.checked,
                sonarr_upgrade: sonarrUpgrade.checked
            }
        };
        
        fetch('/api/settings', {
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
                saveSettingsButton.classList.add('disabled-button');
                
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
    
    // Function to reset settings
    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            fetch('/api/settings/reset', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Settings reset to defaults and cycle restarted.');
                    loadSettings();
                } else {
                    alert('Error resetting settings: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error resetting settings:', error);
                alert('Error resetting settings: ' + error.message);
            });
        }
    }
    
    // Add event listeners to both buttons
    saveSettingsButton.addEventListener('click', saveSettings);
    resetSettingsButton.addEventListener('click', resetSettings);
    
    
    // Initialize
    loadTheme();
    loadSettings();
});