#!/bin/bash
# Simple deployment to any Linux VPS

# Install dependencies
sudo apt update
sudo apt install -y python3-pip chromium-browser chromium-chromedriver

# Install Python packages
pip3 install -r requirements.txt

# Create systemd service
sudo tee /etc/systemd/system/southwest-checkin.service > /dev/null <<EOF
[Unit]
Description=Southwest Check-in Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 $(pwd)/cloud-app.py
Restart=always
Environment="AUTO_SOUTHWEST_CHECK_IN_CHECK_FARES=false"

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable southwest-checkin
sudo systemctl start southwest-checkin

echo "✅ Deployed! Check status with: sudo systemctl status southwest-checkin"
