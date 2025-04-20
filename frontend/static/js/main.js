document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const logsButton = document.getElementById('logsButton');
    const settingsButton = document.getElementById('settingsButton');
    const logsContainer = document.getElementById('logsContainer');
    const settingsContainer = document.getElementById('settingsContainer');
    const logsElement = document.getElementById('logs');
    const statusElement = document.getElementById('status');
    const clearLogsButton = document.getElementById('clearLogs');
    const autoScrollCheckbox = document.getElementById('autoScroll');
    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');
    const navRadarr = document.getElementById('navRadarr');
    const navSettings = document.getElementById('navSettings');
    
    // Settings form elements - Basic settings
    const huntMissingShowsInput = document.getElementById('hunt_missing_shows');
    const huntUpgradeEpisodesInput = document.getElementById('hunt_upgrade_episodes');
    const sleepDurationInput = document.getElementById('sleep_duration');
    const sleepDurationHoursSpan = document.getElementById('sleep_duration_hours');
    const stateResetIntervalInput = document.getElementById('state_reset_interval_hours');
    const monitoredOnlyInput = document.getElementById('monitored_only');
    const randomMissingInput = document.getElementById('random_missing');
    const randomUpgradesInput = document.getElementById('random_upgrades');
    const skipFutureEpisodesInput = document.getElementById('skip_future_episodes');
    const skipSeriesRefreshInput = document.getElementById('skip_series_refresh');
    
    // Sonarr settings form elements - Basic settings
    const sonarrEnabled = document.getElementById('sonarr_enable');
    const sonarrApiKey = document.getElementById('sonarr_api_key').value;
    const sonarrUrl = document.getElementById('sonarr_url').value;
    const sonarrMissingShows = document.getElementById('sonarr_missing_shows');
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


    // Settings form elements - Advanced settings
    const apiTimeoutInput = document.getElementById('api_timeout');
    const debugModeInput = document.getElementById('debug_mode');
    const commandWaitDelayInput = document.getElementById('command_wait_delay');
    const commandWaitAttemptsInput = document.getElementById('command_wait_attempts');
    const minimumDownloadQueueSizeInput = document.getElementById('minimum_download_queue_size');
    
    // Button elements for saving and resetting settings
    const saveSettingsButton = document.getElementById('saveSettings');
    const resetSettingsButton = document.getElementById('resetSettings');
    const saveSettingsBottomButton = document.getElementById('saveSettingsBottom');
    const resetSettingsBottomButton = document.getElementById('resetSettingsBottom');
    
    // Store original settings values
    let originalSettings = {};
    
    // Update sleep duration display
    function updateSleepDurationDisplay() {
        const seconds = parseInt(sleepDurationInput.value) || 900;
        let displayText = '';
        
        if (seconds < 60) {
            displayText = `${seconds} seconds`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            displayText = `≈ ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (minutes === 0) {
                displayText = `≈ ${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                displayText = `≈ ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
        }
        
        sleepDurationHoursSpan.textContent = displayText;
    }
    
    sleepDurationInput.addEventListener('input', function() {
        updateSleepDurationDisplay();
        checkForChanges();
    });
    
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
    
    navSettings.addEventListener('click', function() {
        saveSettingsButton.classList.add('active');
        resetSettingsButton.classList.add('active');
        loadSettings();
    });

    navRadarr.addEventListener('click', function() {
        saveSettingsButton.classList.add('active');
        resetSettingsButton.classList.add('active');
        loadSettings();
    });

    navSettings.addEventListener('click', function() {
        saveSettingsButton.classList.add('active');
        resetSettingsButton.classList.add('active');
        loadSettings();
    });

    navLogs.addEventListener('click', function() {
        logsContainer.style.display = 'flex';
        saveSettingsButton.classList.add('active');
        resetSettingsButton.classList.add('active');
        loadSettings();
    });
    
    // Log management
    clearLogsButton.addEventListener('click', function() {
        logsElement.innerHTML = '';
    });
    
    // Auto-scroll function
    function scrollToBottom() {
        if (autoScrollCheckbox.checked) {
            logsElement.scrollTop = logsElement.scrollHeight;
        }
    }
    
    // Function to check if settings have changed from original values
    function checkForChanges() {
        if (!originalSettings.refresharr) return; // Don't check if original settings not loaded
        
        let hasChanges = false;
        
        // Check Basic Settings
        if (parseInt(huntMissingShowsInput.value) !== originalSettings.refresharr.hunt_missing_shows) hasChanges = true;
        if (parseInt(huntUpgradeEpisodesInput.value) !== originalSettings.refresharr.hunt_upgrade_episodes) hasChanges = true;
        if (parseInt(sleepDurationInput.value) !== originalSettings.refresharr.sleep_duration) hasChanges = true;
        if (parseInt(stateResetIntervalInput.value) !== originalSettings.refresharr.state_reset_interval_hours) hasChanges = true;
        if (monitoredOnlyInput.checked !== originalSettings.refresharr.monitored_only) hasChanges = true;
        if (skipFutureEpisodesInput.checked !== originalSettings.refresharr.skip_future_episodes) hasChanges = true;
        if (skipSeriesRefreshInput.checked !== originalSettings.refresharr.skip_series_refresh) hasChanges = true;
        
        // Check Advanced Settings
        if (parseInt(apiTimeoutInput.value) !== originalSettings.advanced.api_timeout) hasChanges = true;
        if (debugModeInput.checked !== originalSettings.advanced.debug_mode) hasChanges = true;
        if (parseInt(commandWaitDelayInput.value) !== originalSettings.advanced.command_wait_delay) hasChanges = true;
        if (parseInt(commandWaitAttemptsInput.value) !== originalSettings.advanced.command_wait_attempts) hasChanges = true;
        if (parseInt(minimumDownloadQueueSizeInput.value) !== originalSettings.advanced.minimum_download_queue_size) hasChanges = true;
        if (randomMissingInput.checked !== originalSettings.advanced.random_missing) hasChanges = true;
        if (randomUpgradesInput.checked !== originalSettings.advanced.random_upgrades) hasChanges = true;

        // Check Radarr Settings
        if (radarrEnabled.checked !== originalSettings.radarr.radarrEnabled) hasChanges = true;
        
        // Enable/disable save buttons based on whether there are changes
        saveSettingsButton.disabled = !hasChanges;
        saveSettingsBottomButton.disabled = !hasChanges;
        
        // Apply visual indicator based on disabled state
        if (hasChanges) {
            saveSettingsButton.classList.remove('disabled-button');
            saveSettingsBottomButton.classList.remove('disabled-button');
        } else {
            saveSettingsButton.classList.add('disabled-button');
            saveSettingsBottomButton.classList.add('disabled-button');
        }
        
        return hasChanges;
    }
    
    // Add change event listeners to all form elements
    [huntMissingShowsInput, huntUpgradeEpisodesInput, stateResetIntervalInput, 
     apiTimeoutInput, commandWaitDelayInput, commandWaitAttemptsInput, 
     minimumDownloadQueueSizeInput].forEach(input => {
        input.addEventListener('input', checkForChanges);
    });
    
    [monitoredOnlyInput, randomMissingInput, randomUpgradesInput, 
     skipFutureEpisodesInput, skipSeriesRefreshInput, debugModeInput,radarrEnabled].forEach(checkbox => {
        checkbox.addEventListener('change', checkForChanges);
    });
    
    // Load settings from API
    function loadSettings() {
        fetch('/api/settings')
            .then(response => response.json())
            .then(data => {
                const refresharr = data.refresharr || {};
                const advanced = data.advanced || {};
                const sonarr = data.sonarr || {};
                const radarr = data.radarr || {};
                const lidarr = data.lidarr || {};
                const readarr = data.readarr || {};
                
                // Store original settings for comparison
                originalSettings = JSON.parse(JSON.stringify(data));
                
                // Fill form with current settings - Basic settings
                huntMissingShowsInput.value = refresharr.hunt_missing_shows !== undefined ? refresharr.hunt_missing_shows : 1;
                huntUpgradeEpisodesInput.value = refresharr.hunt_upgrade_episodes !== undefined ? refresharr.hunt_upgrade_episodes : 5;
                sleepDurationInput.value = refresharr.sleep_duration || 900;
                updateSleepDurationDisplay();
                stateResetIntervalInput.value = refresharr.state_reset_interval_hours || 168;
                monitoredOnlyInput.checked = refresharr.monitored_only !== false;
                skipFutureEpisodesInput.checked = refresharr.skip_future_episodes !== false;
                skipSeriesRefreshInput.checked = refresharr.skip_series_refresh === true;
                
                // Fill form with current settings - Advanced settings
                apiTimeoutInput.value = advanced.api_timeout || 60;
                debugModeInput.checked = advanced.debug_mode === true;
                commandWaitDelayInput.value = advanced.command_wait_delay || 1;
                commandWaitAttemptsInput.value = advanced.command_wait_attempts || 600;
                minimumDownloadQueueSizeInput.value = advanced.minimum_download_queue_size || -1;
                
                // Handle random settings
                randomMissingInput.checked = advanced.random_missing !== false;
                randomUpgradesInput.checked = advanced.random_upgrades !== false;

                // Radarr settings
                radarrEnabled.checked = radarr.radarr_enabled !== false;
                radarrApiKey.value = radarr.radarr_api_key || "https://radarr:7878";
                radarrUrl.value = radarr.radarr_url || "https://radarr:7878";
                radarrFuture.checked = radarr.radarr_future !== false;
                radarrUpgrade.checkbox = radarr.radarr_upgrade !== false;

                // Sonarr settings
                sonarrEnabled.checked = sonarr.sonarr_enabled !== false;
                sonarrApiKey.value = sonarr.sonarr_api_key || "https://sonarr:8989";
                sonarrUrl.value = sonarr.sonarr_url || "https://sonarr:8989";
                sonarrMissingShows.checkbox = sonarr.sonarr_missing_shows !== false;
                sonarrFuture.checked = sonarr.sonarr_future !== false;
                sonarrUpgrade.checkbox = sonarr.sonarr_upgrade !== false;
                 
                
                // Lidarr settings
                lidarrEnabled.checked = lidarr.lidarr_enabled !== false;
                lidarrApiKey.value = lidarr.lidarr_api_key || "https://lidarr:8686";
                lidarrUrl.value = lidarr.lidarr_url || "https://lidarr:8686";
                lidarrMissingAlbums.checkbox = lidarr.lidarr_missing_albums !== false;
                lidarrFuture.checked = lidarr.lidarr_future !== false;
                lidarrUpgrade.checkbox = lidarr.lidarr_upgrade !== false;

                // Readarr settings
                readarrEnabled.checked = readarr.readarr_enabled !== false;
                readarrApiKey.value = readarr.readarr_api_key || "https://readarr:8787";
                readarrUrl.value = readarr.readarr_url || "https://readarr:8787";
                readarrMissingAuthors.checkbox = readarr.readarr_missing_authors !== false;
                readarrFuture.checked = readarr.readarr_future !== false;
                readarrUpgrade.checkbox = readarr.readarr_upgrade !== false;

                
                // Initialize save buttons state
                saveSettingsButton.disabled = true;
                saveSettingsBottomButton.disabled = true;
                saveSettingsButton.classList.add('disabled-button');
                saveSettingsBottomButton.classList.add('disabled-button');
            })
            .catch(error => console.error('Error loading settings:', error));
    }
    
    // Function to save settings
    function saveSettings() {
        if (!checkForChanges()) {
            // If no changes, don't do anything
            return;
        }
        
        const settings = {
            refresharr: {
                hunt_missing_shows: parseInt(huntMissingShowsInput.value) || 0,
                hunt_upgrade_episodes: parseInt(huntUpgradeEpisodesInput.value) || 0,
                sleep_duration: parseInt(sleepDurationInput.value) || 900,
                state_reset_interval_hours: parseInt(stateResetIntervalInput.value) || 168,
                monitored_only: monitoredOnlyInput.checked,
                skip_future_episodes: skipFutureEpisodesInput.checked,
                skip_series_refresh: skipSeriesRefreshInput.checked
            },
            advanced: {
                api_timeout: parseInt(apiTimeoutInput.value) || 60,
                debug_mode: debugModeInput.checked,
                command_wait_delay: parseInt(commandWaitDelayInput.value) || 1,
                command_wait_attempts: parseInt(commandWaitAttemptsInput.value) || 600,
                minimum_download_queue_size: parseInt(minimumDownloadQueueSizeInput.value) || -1,
                random_missing: randomMissingInput.checked,
                random_upgrades: randomUpgradesInput.checked
            },
            radarr: {
                radarr_enabled: radarrEnabled.checked,
                radarr_api_key: radarrApiKey,
                radarr_url: radarrUrl,
                radarr_future: radarrFuture.checked,
                radarr_upgrade: radarrUpgrade.checked
            },
            lidarr: {
                lidarr_enabled: lidarrEnabled.checked,
                lidarr_api_key: lidarrApiKey,
                lidarr_url: lidarrUrl,
                lidarr_missing_albums: lidarrMissingAlbums.checked,
                lidarr_future: lidarrFuture.checked,
                lidarr_upgrade: lidarrUpgrade.checked
            },
            readarr: {
                readarr_enabled: readarrEnabled.checked,
                readarr_api_key: readarrApiKey,
                readarr_url: readarrUrl,
                readarr_missing_authors: readarrMissingAuthors.checked,
                readarr_future: readarrFuture.checked,
                readarr_upgrade: readarrUpgrade.checked
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
    
    // Add event listeners to both button sets
    saveSettingsButton.addEventListener('click', saveSettings);
    resetSettingsButton.addEventListener('click', resetSettings);
    
    saveSettingsBottomButton.addEventListener('click', saveSettings);
    resetSettingsBottomButton.addEventListener('click', resetSettings);
    
    // Event source for logs
    let eventSource;
    
    function connectEventSource() {
        if (eventSource) {
            eventSource.close();
        }
        
        eventSource = new EventSource('/logs');
        
        eventSource.onopen = function() {
            statusElement.textContent = 'Connected';
            statusElement.className = 'status-connected';
        };
        
        eventSource.onerror = function() {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status-disconnected';
            
            // Attempt to reconnect after 5 seconds
            setTimeout(connectEventSource, 5000);
        };
        
        eventSource.onmessage = function(event) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // Add appropriate class for log level
            if (event.data.includes(' - INFO - ')) {
                logEntry.classList.add('log-info');
            } else if (event.data.includes(' - WARNING - ')) {
                logEntry.classList.add('log-warning');
            } else if (event.data.includes(' - ERROR - ')) {
                logEntry.classList.add('log-error');
            } else if (event.data.includes(' - DEBUG - ')) {
                logEntry.classList.add('log-debug');
            }
            
            logEntry.textContent = event.data;
            logsElement.appendChild(logEntry);
            
            // Auto-scroll to bottom if enabled
            scrollToBottom();
        };
    }
    
    // Observe scroll event to detect manual scrolling
    logsElement.addEventListener('scroll', function() {
        // If we're at the bottom or near it (within 20px), ensure auto-scroll stays on
        const atBottom = (logsElement.scrollHeight - logsElement.scrollTop - logsElement.clientHeight) < 20;
        if (!atBottom && autoScrollCheckbox.checked) {
            // User manually scrolled up, disable auto-scroll
            autoScrollCheckbox.checked = false;
        }
    });
    
    // Re-enable auto-scroll when checkbox is checked
    autoScrollCheckbox.addEventListener('change', function() {
        if (this.checked) {
            scrollToBottom();
        }
    });
    
    // Initialize
    loadTheme();
    updateSleepDurationDisplay();
    connectEventSource();
});