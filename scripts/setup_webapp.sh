#!/bin/bash
# Create the user and group csye6225 if they don't exist
sudo groupadd -f csye6225
sudo id -u csye6225 &>/dev/null || sudo useradd -m -g csye6225 -s /usr/sbin/nologin csye6225

# Ensure the /tmp/webapp directory exists
if [ ! -d "/tmp/webapp" ]; then
  echo "Error: /tmp/webapp directory does not exist. Provisioning failed."
  exit 1
fi

# Ensure the web app files (including the artifact) are present in /tmp/webapp
if [ ! "$(ls -A /tmp/webapp)" ]; then
  echo "Error: /tmp/webapp directory is empty. Provisioning failed."
  exit 1
fi

# Copy the web app files to the /opt/webapp directory
sudo mkdir -p /opt/webapp
sudo cp -r /tmp/webapp/. /opt/webapp/

# Change ownership of /opt/webapp to the csye6225 user and group
sudo chown -R csye6225:csye6225 /opt/webapp

# Check if package.json exists before running npm install
if [ ! -f "/opt/webapp/package.json" ]; then
  echo "Error: package.json not found in /opt/webapp."
  exit 1
fi

# Install Node.js dependencies under /opt/webapp
cd /opt/webapp || { echo "Failed to change directory to /opt/webapp"; exit 1; }
sudo -u csye6225 npm install

# Ensure the webapp.service file exists in /tmp/webapp/config
if [ ! -f "/tmp/webapp/config/webapp.service" ]; then
  echo "Error: webapp.service file not found in /tmp/webapp/config."
  exit 1
fi

# Copy the systemd service file to /etc/systemd/system/
sudo cp /tmp/webapp/config/webapp.service /etc/systemd/system/

# Set ownership of the service file to the root
sudo chown root:root /etc/systemd/system/webapp.service

# Ensure the amazon-cloudwatch-agent.json file exists in /tmp/webapp/config
if [ ! -f "/tmp/webapp/config/amazon-cloudwatch-agent.json" ]; then
  echo "Error: amazon-cloudwatch-agent.json file not found in /tmp/webapp/config."
  exit 1
fi

# Copy the Cloudwatch agent config to the correct directory
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo cp /tmp/webapp/config/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/
sudo chown root:root /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo chmod 644 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create webapp log file and set ownership
sudo touch /var/log/webapp.log
sudo chown csye6225:csye6225 /var/log/webapp.log
sudo chmod 644 /var/log/webapp.log
