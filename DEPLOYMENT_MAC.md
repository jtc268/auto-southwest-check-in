## Deploying Auto-Southwest Check-In on macOS (Resilient / Reboot-Safe)

This guide shows how to run the check‑in bot as a resilient background service on any Mac so it survives restarts and automatically schedules/executes check‑ins.

Two options are provided:
- LaunchAgent (recommended): starts when the user logs in and restarts if it crashes.
- LaunchDaemon (advanced): starts at boot before login. Use only if you truly need pre‑login startup.

The bot checks in all passengers under a reservation automatically; you only need to specify one passenger name.

---

### 1) Prerequisites
- macOS 12+ recommended
- Python 3.8+ installed (`python3 --version`)
- Google Chrome installed (Driver is auto‑managed by SeleniumBase)
- Git installed

Optional (recommended): Create a dedicated user account on the always‑on Mac to run this service.

---

### 2) Get the code and install dependencies
```bash
git clone https://github.com/jdholtz/auto-southwest-check-in.git
cd auto-southwest-check-in
python3 -m pip install -r requirements.txt
```

Notes:
- The driver and undetected‑chromedriver will auto‑download when first used.
- Headless Chrome is used; no UI is displayed.

---

### 3) Choose how to configure reservations
You can pass a single reservation via CLI args or manage multiple reservations in `config.json`.

- CLI (single reservation):
  - `CONFIRMATION_NUMBER FIRST_NAME LAST_NAME`

- Config file (multiple reservations): create `config.json` in the repo root:
```json
{
  "reservations": [
    { "confirmationNumber": "BJSXZC", "firstName": "Joseph", "lastName": "Cera" },
    { "confirmationNumber": "BJSXZC", "firstName": "Ava", "lastName": "Sirrah" }
  ],
  "retrieval_interval": 24
}
```

Notes:
- You only need to include one passenger of a reservation; the bot checks in all passengers automatically. Including both is harmless.
- `retrieval_interval` is in hours (24 = once per day check/refresh). The code converts it internally to seconds.

---

### 4) Configure notifications (optional)
If you want Slack/SMS/Email notifications, define Apprise URLs in `config.json`. See `CONFIGURATION.md` for details.

---

### 5) Install as a LaunchAgent (recommended)
LaunchAgents start at user login and are simpler to manage.

1. Find the absolute path to your Python 3:
```bash
which -a python3 | head -n 1
```

2. Create the LaunchAgent plist at `~/Library/LaunchAgents/com.auto-southwest-check-in.plist`:
```bash
cat > ~/Library/LaunchAgents/com.auto-southwest-check-in.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.auto-southwest-check-in</string>

  <key>ProgramArguments</key>
  <array>
    <string>/ABSOLUTE/PATH/TO/python3</string>
    <string>/ABSOLUTE/PATH/TO/auto-southwest-check-in/southwest.py</string>
    <!-- EITHER: CLI reservation -->
    <!-- <string>BJSXZC</string> <string>Joseph</string> <string>Cera</string> -->
    <!-- OR: rely on config.json and pass no args -->
  </array>

  <key>WorkingDirectory</key>
  <string>/ABSOLUTE/PATH/TO/auto-southwest-check-in</string>

  <key>EnvironmentVariables</key>
  <dict>
    <!-- Example: run checks once per day (hours) -->
    <key>AUTO_SOUTHWEST_CHECK_IN_RETRIEVAL_INTERVAL</key>
    <string>24</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/ABSOLUTE/PATH/TO/auto-southwest-check-in/logs/launchagent.out.log</string>
  <key>StandardErrorPath</key>
  <string>/ABSOLUTE/PATH/TO/auto-southwest-check-in/logs/launchagent.err.log</string>
</dict>
</plist>
PLIST
```

3. Load and start the agent:
```bash
launchctl unload ~/Library/LaunchAgents/com.auto-southwest-check-in.plist 2>/dev/null || true
launchctl load   ~/Library/LaunchAgents/com.auto-southwest-check-in.plist
launchctl start  com.auto-southwest-check-in
```

4. Verify status and logs:
```bash
launchctl list | grep com.auto-southwest-check-in || true
tail -n 200 /ABSOLUTE/PATH/TO/auto-southwest-check-in/logs/launchagent.out.log
tail -n 200 /ABSOLUTE/PATH/TO/auto-southwest-check-in/logs/launchagent.err.log
```

Behavior:
- Starts on user login and restarts automatically if it exits.
- Survives OS updates/reboots (you just need to log back in to that user).

Keep‑awake guidance:
- Ensure the Mac doesn’t sleep through check‑in. Either configure Energy Saver to prevent sleep during scheduled times, or use:
```bash
caffeinate -dimsu
```
Run this as needed or turn on Power Nap/wake for network access.

---

### 6) Alternative: LaunchDaemon (starts before login)
Use this if the Mac might reboot and you cannot guarantee auto‑login.

1. Create `/Library/LaunchDaemons/com.auto-southwest-check-in.plist` (requires sudo):
```bash
sudo tee /Library/LaunchDaemons/com.auto-southwest-check-in.plist >/dev/null <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.auto-southwest-check-in</string>

  <key>ProgramArguments</key>
  <array>
    <string>/ABSOLUTE/PATH/TO/python3</string>
    <string>/ABSOLUTE/PATH/TO/auto-southwest-check-in/southwest.py</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/ABSOLUTE/PATH/TO/auto-southwest-check-in</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>AUTO_SOUTHWEST_CHECK_IN_RETRIEVAL_INTERVAL</key>
    <string>24</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>

  <!-- Logs must be writable by root; consider /var/log or the repo path with correct perms -->
  <key>StandardOutPath</key>
  <string>/var/log/auto-southwest-check-in.out.log</string>
  <key>StandardErrorPath</key>
  <string>/var/log/auto-southwest-check-in.err.log</string>
</dict>
</plist>
PLIST
```

2. Set permissions and load:
```bash
sudo chown root:wheel /Library/LaunchDaemons/com.auto-southwest-check-in.plist
sudo chmod 644       /Library/LaunchDaemons/com.auto-southwest-check-in.plist
sudo launchctl unload /Library/LaunchDaemons/com.auto-southwest-check-in.plist 2>/dev/null || true
sudo launchctl load   /Library/LaunchDaemons/com.auto-southwest-check-in.plist
sudo launchctl start  com.auto-southwest-check-in
```

3. Verify status and logs:
```bash
sudo launchctl list | grep com.auto-southwest-check-in || true
sudo tail -n 200 /var/log/auto-southwest-check-in.out.log
sudo tail -n 200 /var/log/auto-southwest-check-in.err.log
```

Notes:
- LaunchDaemons run as root without a logged‑in window server. Headless Chrome is supported, but ensure the daemon can write logs and that the network is available at boot.

---

### 7) Common operations
- Restart the service:
```bash
# Agent
launchctl unload ~/Library/LaunchAgents/com.auto-southwest-check-in.plist
launchctl load   ~/Library/LaunchAgents/com.auto-southwest-check-in.plist
launchctl start  com.auto-southwest-check-in

# Daemon
sudo launchctl unload /Library/LaunchDaemons/com.auto-southwest-check-in.plist
sudo launchctl load   /Library/LaunchDaemons/com.auto-southwest-check-in.plist
sudo launchctl start  com.auto-southwest-check-in
```

- Update the code:
```bash
cd /ABSOLUTE/PATH/TO/auto-southwest-check-in
git pull
python3 -m pip install -r requirements.txt
# Then restart the agent/daemon (see above)
```

---

### 8) Troubleshooting
- If you see driver downloads on every start, that’s normal the first time and occasionally when Chrome updates.
- If fare check 400s appear, they are non‑fatal; the check‑in scheduling still proceeds.
- Ensure the Mac is awake at T‑24 check‑in time; consider `caffeinate -dimsu` during critical windows.
- If logs are empty, verify the paths exist and are writable by the launchd context (user vs root).

---

### 9) Quick verification checklist
- `launchctl list | grep com.auto-southwest-check-in` returns a line with a PID or 0.
- `.../logs/launchagent.out.log` shows: “Successfully scheduled the following flights …”.
- You receive notifications (if configured) on successful check‑in.



