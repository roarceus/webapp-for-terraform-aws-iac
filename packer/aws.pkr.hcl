packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0, <2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type = string
}

variable "aws_source_ami" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "ssh_username" {
  type = string
}

variable "ami_name" {
  type = string
}

variable "volume_size" {
  type = number
}

variable "volume_type" {
  type = string
}

variable "demo_account_id" {
  type = number
}

source "amazon-ebs" "ubuntu" {
  region          = var.aws_region
  source_ami      = var.aws_source_ami
  instance_type   = var.instance_type
  ssh_username    = var.ssh_username
  ami_name        = "${var.ami_name}-${formatdate("YYYY_MM_DD", timestamp())}"
  ami_description = "AMI for setting up Webapp, and Node.js"
  tags = {
    Name = "CSYE6225-WebApp-Image"
  }

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = var.volume_size
    volume_type           = var.volume_type
  }

  ami_users = ["${var.demo_account_id}"]
}

build {
  sources = ["source.amazon-ebs.ubuntu"]

  # Create a temporary directory to copy the artifact
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /tmp/webapp",
      "sudo chmod 777 /tmp/webapp"
    ]
  }

  # Copy the artifact from the Packer build folder to the custom image
  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  # Install system and web application dependencies
  provisioner "shell" {
    script = "scripts/install_dependencies.sh"
  }

  # Unzip the artifact in the /tmp/webapp folder
  provisioner "shell" {
    inline = [
      "cd /tmp",
      "unzip -o webapp.zip -d /tmp/webapp"
    ]
  }

  # Set up the web application
  provisioner "shell" {
    script = "scripts/setup_webapp.sh"
  }
}
