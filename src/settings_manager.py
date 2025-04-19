import json
import pathlib
import logging
from typing import Dict, Any

# Create a simple logger for settings_manager
logging.basicConfig(level=logging.INFO)
settings_logger = logging.getLogger("settings_manager")

# Settings directory setup
SETTINGS_DIR = pathlib.Path("/config/settings")
SETTINGS_DIR.mkdir(parents=True, exist_ok=True)

SETTINGS_FILE = SETTINGS_DIR / "refresharr.json"

# Default settings
DEFAULT_SETTINGS = {
    "ui": {
        "dark_mode": True
    },
    "refresharr": {
        "sleep_duration": 900,  # 15 minutes in seconds
        "hunt_missing_shows": 1,
        "hunt_upgrade_episodes": 5,
        "state_reset_interval_hours": 168,  # 1 week in hours
        "monitored_only": True,
        "random_selection": True,
        "skip_future_episodes": True,
        "skip_series_refresh": False
    },
    "advanced": {
        "api_timeout": 60,
        "debug_mode": False,
        "command_wait_delay": 1,
        "command_wait_attempts": 600,
        "minimum_download_queue_size": -1,
        "random_missing": True,
        "random_upgrades": True
    },
    "sonarr": {
        "sonarr_enabled": False,
        "sonarr_api_key": "api key",
        "sonarr_url": "app url",
        "sonarr_missing_shows": False,
        "sonarr_future": False,
        "sonarr_upgrade": False
    },
    "radarr": {
        "radarr_enabled": False,
        "radarr_api_key": "api key",
        "radarr_url": "app url",
        "radarr_future": False,
        "radarr_upgrade": False
    },
    "lidarr": {
        "lidarr_enabled": False,
        "lidarr_api_key": "api key",
        "lidarr_url": "app url",
        "lidarr_missing_albums": False,
        "lidarr_future": False,
        "lidarr_upgrade": False
    },
    "readarr": {
        "readarr_enabled": False,
        "readarr_api_key": "api key",
        "readarr_url": "app url",
        "readarr_missing_authors": False,
        "readarr_future": False,
        "readarr_series_refresh": False,
        "readarr_upgrade": False
    }
}


def load_settings() -> Dict[str, Any]:
    """Load settings from the settings file,
        or return defaults if not available."""
    try:
        if SETTINGS_FILE.exists():
            with open(SETTINGS_FILE, 'r') as f:
                settings = json.load(f)
                settings_logger.info("Settings loaded from configuration file")
                return settings
        else:
            settings_logger.info(
                "No settings file found, creating with default values")
            save_settings(DEFAULT_SETTINGS)
            return DEFAULT_SETTINGS
    except Exception as e:
        settings_logger.error(f"Error loading settings: {e}")
        settings_logger.info("Using default settings due to error")
        return DEFAULT_SETTINGS


def save_settings(settings: Dict[str, Any]) -> bool:
    """Save settings to the settings file."""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
        settings_logger.info("Settings saved successfully")
        return True
    except Exception as e:
        settings_logger.error(f"Error saving settings: {e}")
        return False


def update_setting(category: str, key: str, value: Any) -> bool:
    """Update a specific setting value."""
    try:
        settings = load_settings()

        # Ensure category exists
        if category not in settings:
            settings[category] = {}

        # Update the value
        settings[category][key] = value

        # Save the updated settings
        return save_settings(settings)
    except Exception as e:
        settings_logger.error(f"Error updating setting {category}.{key}: {e}")
        return False


def get_setting(category: str, key: str, default: Any = None) -> Any:
    """Get a specific setting value."""
    try:
        settings = load_settings()
        return settings.get(category, {}).get(key, default)
    except Exception as e:
        settings_logger.error(f"Error getting setting {category}.{key}: {e}")
        return default


def get_all_settings() -> Dict[str, Any]:
    """Get all settings."""
    return load_settings()


# Initialize settings file if it doesn't exist
if not SETTINGS_FILE.exists():
    save_settings(DEFAULT_SETTINGS)
