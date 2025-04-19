import os
import time
import datetime
import pathlib
import socket
import signal
import logging
from src.config import ENABLE_WEB_UI
from src import settings_manager
from src.utils.logger import setup_logger
from flask import (
    Flask,
    render_template,
    Response,
    stream_with_context,
    request,
    jsonify,
    send_from_directory
)



# Check if web UI is disabled
if not ENABLE_WEB_UI:
    print("Web UI is disabled. Exiting web server.")
    exit(0)

# Disable Flask default logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'frontend', 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'frontend', 'static')

# Create Flask app
app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)


# Log file location
LOG_FILE = "/tmp/refresharr-logs/refresharr.log"
LOG_DIR = pathlib.Path("/tmp/refresharr-logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)


# Get the PID of the main process
def get_main_process_pid():
    try:
        # Try to find the main.py process
        for proc in os.listdir('/proc'):
            if not proc.isdigit():
                continue
            try:
                with open(f'/proc/{proc}/cmdline', 'r') as f:
                    cmdline = f.read().replace('\0', ' ')
                    if 'python' in cmdline and 'main.py' in cmdline:
                        return int(proc)
            except (IOError, ProcessLookupError):
                continue
        return None
    except:
        return None


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.route('/radarr')
def radarr():
    return render_template('radarr.html')


@app.route('/sonarr')
def sonarr():
    return render_template('sonarr.html')


@app.route('/readarr')
def readarr():
    return render_template('readarr.html')


@app.route('/lidarr')
def lidarr():
    return render_template('lidarr.html')


@app.route('/settings')
def settings():
    return render_template('settings.html')


@app.route('/static/<path:path>')
def send_static(path):
    """Serve static files"""
    return send_from_directory('static', path)


@app.route('/logs')
def stream_logs():
    """Stream logs to the client"""
    def generate():
        # First get all existing logs
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r') as f:
                # Read the last 100 lines of the log file
                lines = f.readlines()[-100:]
                for line in lines:
                    yield f"data: {line}\n\n"

        # Then stream new logs as they appear
        with open(LOG_FILE, 'r') as f:
            # Move to the end of the file
            f.seek(0, 2)
            while True:
                line = f.readline()
                if line:
                    yield f"data: {line}\n\n"
                else:
                    time.sleep(0.1)

    return Response(stream_with_context(generate()),
                    mimetype='text/event-stream')


@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get all settings"""
    return jsonify(settings_manager.get_all_settings())


@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings 
    and restart the main process to apply them immediately"""
    try:
        data = request.json
        if not data:
            return jsonify(
                {"success": False, "message": "No data provided"}), 400

        # Get current settings to compare
        old_settings = settings_manager.get_all_settings()
        old_refresharr = old_settings.get("refresharr", {})
        old_advanced = old_settings.get("advanced", {})
        old_ui = old_settings.get("ui", {})

        # Arr settings
        old_sonarr = old_settings.get("sonarr", {})
        old_radarr = old_settings.get("radarr", {})
        old_lidarr = old_settings.get("lidarr", {})
        old_readarr = old_settings.get("readarr", {})

        # Arr settings changes
        sonarr_changes = {}
        radarr_changes = {}
        lidarr_changes = {}
        readarr_changes = {}

        # Find changes
        refresharr_changes = {}
        advanced_changes = {}
        ui_changes = {}

        # Track if any real changes were made
        changes_made = False

        # Update refresharr settings and track changes
        if "refresharr" in data:
            for key, value in data["refresharr"].items():
                old_value = old_refresharr.get(key)
                if old_value != value:
                    refresharr_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("refresharr", key, value)

        # Update Sonarr settings and track changes
        if "sonarr" in data:
            for key, value in data["sonarr"].items():
                old_value = old_sonarr.get(key)
                if old_value != value:
                    sonarr_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("sonarr", key, value)

        # Update Radarr settings and track changes
        if "radarr" in data:
            for key, value in data["radarr"].items():
                old_value = old_radarr.get(key)
                if old_value != value:
                    radarr_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("radarr", key, value)

        # Update Lidarr settings and track changes
        if "lidarr" in data:
            for key, value in data["lidarr"].items():
                old_value = old_lidarr.get(key)
                if old_value != value:
                    lidarr_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("lidarr", key, value)

        # Update Readarr settings and track changes
        if "readarr" in data:
            for key, value in data["readarr"].items():
                old_value = old_readarr.get(key)
                if old_value != value:
                    readarr_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("readarr", key, value)

        # Update UI settings and track changes
        if "ui" in data:
            for key, value in data["ui"].items():
                old_value = old_ui.get(key)
                if old_value != value:
                    ui_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("ui", key, value)

        # Update advanced settings and track changes
        if "advanced" in data:
            for key, value in data["advanced"].items():
                old_value = old_advanced.get(key)
                if old_value != value:
                    advanced_changes[key] = {"old": old_value, "new": value}
                    changes_made = True
                settings_manager.update_setting("advanced", key, value)

                # Special handling for debug_mode setting
                if key == "debug_mode" and old_value != value:
                    # Reconfigure the logger with new debug mode setting
                    setup_logger(value)

        # Log changes if any were made
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if changes_made:
            with open(LOG_FILE, 'a') as f:
                f.write(f"{timestamp} - refresharr-web - INFO - Settings updated by user\n")

                # Log refresharr changes
                for key, change in refresharr_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed {key} from {change['old']} to {change['new']}\n")

                # Log advanced changes
                for key, change in advanced_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed advanced.{key} from {change['old']} to {change['new']}\n")

                # Log UI changes
                for key, change in ui_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed UI.{key} from {change['old']} to {change['new']}\n")

                # Log Sonarr changes
                for key, change in sonarr_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed sonarr.{key} from {change['old']} to {change['new']}\n")
                
                # Log Radarr changes
                for key, change in radarr_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed radarr.{key} from {change['old']} to {change['new']}\n")

                # Log Lidarr changes
                for key, change in lidarr_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed lidarr.{key} from {change['old']} to {change['new']}\n")

                # Log Readarr changes
                for key, change in readarr_changes.items():
                    f.write(f"{timestamp} - refresharr-web - INFO - Changed readarr.{key} from {change['old']} to {change['new']}\n")

                f.write(f"{timestamp} - refresharr-web - INFO - Settings saved successfully\n")
                f.write(f"{timestamp} - refresharr-web - INFO - Restarting current cycle to apply new settings immediately\n")

            # Try to signal the main process to restart the cycle
            main_pid = get_main_process_pid()
            if main_pid:
                try:
                    # Send a SIGUSR1 signal which we'll handle in main.py to restart the cycle
                    os.kill(main_pid, signal.SIGUSR1)
                    return jsonify({"success": True, "message": "Settings saved and cycle restarted", "changes_made": True})
                except:
                    # If signaling fails, just return success for the settings save
                    return jsonify({"success": True, "message": "Settings saved, but cycle not restarted", "changes_made": True})
            else:
                return jsonify({"success": True, "message": "Settings saved, but main process not found", "changes_made": True})
        else:
            # No changes were made
            return jsonify({"success": True, "message": "No changes detected", "changes_made": False})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500



@app.route('/api/settings/reset', methods=['POST'])
def reset_settings():
    """Reset settings to defaults"""
    try:
        # Get current settings to compare
        old_settings = settings_manager.get_all_settings()

        # Reset settings
        settings_manager.save_settings(settings_manager.DEFAULT_SETTINGS)

        # Log the reset
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(LOG_FILE, 'a') as f:
            f.write(f"{timestamp} - refresharr-web - INFO - Settings reset to defaults by user\n")
            f.write(f"{timestamp} - refresharr-web - INFO - Restarting current cycle to apply new settings immediately\n")

        # Try to signal the main process to restart the cycle
        main_pid = get_main_process_pid()
        if main_pid:
            try:
                # Send a SIGUSR1 signal which we'll handle in main.py to restart the cycle
                os.kill(main_pid, signal.SIGUSR1)
                return jsonify({"success": True, "message": "Settings reset and cycle restarted"})
            except:
                # If signaling fails, just return success for the settings reset
                return jsonify({"success": True, "message": "Settings reset, but cycle not restarted"})
        else:
            return jsonify({"success": True, "message": "Settings reset, but main process not found"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/settings/theme', methods=['GET'])
def get_theme():
    """Get the current theme setting"""
    dark_mode = settings_manager.get_setting("ui", "dark_mode", True)
    return jsonify({"dark_mode": dark_mode})


@app.route('/api/settings/theme', methods=['POST'])
def update_theme():
    """Update the theme setting"""
    try:
        data = request.json
        old_value = settings_manager.get_setting("ui", "dark_mode", True)
        if "dark_mode" in data and old_value != data["dark_mode"]:
            settings_manager.update_setting("ui", "dark_mode", data["dark_mode"])

            # Log the theme change - simplified to remove "from X" text
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with open(LOG_FILE, 'a') as f:
                new_mode = 'Dark' if data['dark_mode'] else 'Light'
                f.write(f"{timestamp} - refresharr-web - INFO - Changed theme to {new_mode} Mode\n")

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


def get_ip_address():
    """Get the host's IP address from API_URL for display"""
    try:
        from urllib.parse import urlparse
        from src.config import API_URL

        # Extract the hostname/IP from the API_URL
        parsed_url = urlparse(API_URL)
        hostname = parsed_url.netloc

        # Remove port if present
        if ':' in hostname:
            hostname = hostname.split(':')[0]

        return hostname
    except Exception as e:
        # Fallback to the current method if there's an issue
        try:
            hostname = socket.gethostname()
            ip = socket.gethostbyname(hostname)
            return ip
        except:
            return "localhost"


if __name__ == "__main__":
    # Create a basic log entry at startup
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ip_address = get_ip_address()

    with open(LOG_FILE, 'a') as f:
        f.write(f"{timestamp} - refresharr-web - INFO - Web server starting on port 8988\n")
        f.write(f"{timestamp} - refresharr-web - INFO - Web interface available at http://{ip_address}:8988\n")

    # Run the Flask app
    app.run(host='0.0.0.0', port=8988, debug=True, threaded=True)
