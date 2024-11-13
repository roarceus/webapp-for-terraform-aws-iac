#!/bin/bash
# Update and install dependencies
sudo apt-get update -y
sudo apt-get install -y nodejs npm unzip wget
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
