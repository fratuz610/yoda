#!/bin/bash

echo ""
echo "-- Yoda installer version 0.1"
echo ""

# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "-- ERROR: This script must be run as root" 1>&2
   exit 1
fi

# check if node is already installed
if command -v node >/dev/null 2>&1; then
	
	NODE_VERSION="$(node -v)"

	# Installing Node
	echo "-- Node js already installed: ${NODE_VERSION}, installing system dependencies"

	apt-get update
	apt-get install -y git unzip dos2unix

else

  # Installing Node
	echo "-- Installing Node.js & system dependencies"

	curl -sL https://deb.nodesource.com/setup | sudo bash -

	apt-get install -y nodejs git unzip dos2unix
	
fi

apt-get autoremove -y

# Some cleanup for idempotency
echo "-- Cleaning up previous folders"
echo ""

rm -fr /usr/local/yoda
rm -fr /usr/bin/yoda
rm -f /tmp/master.zip
rm -fr /tmp/yoda-master

echo "-- Installing yoda"
echo ""

wget -P /tmp/ http://github.com/fratuz610/yoda/archive/master.zip -q

unzip -qq /tmp/master.zip -d /tmp

mv /tmp/yoda-master /usr/local/yoda

echo "-- Updating yoda NPM dependencies"
echo ""

cd /usr/local/yoda && npm update 2>&1 > /dev/null

echo "-- Setting up yoda executable"
echo ""

chmod u+x /usr/local/yoda/yoda.js

ln -s /usr/local/yoda/yoda.js /usr/bin/yoda

dos2unix /usr/local/yoda/yoda.js 2>&1 > /dev/null

echo "-- Yoda setup completed"