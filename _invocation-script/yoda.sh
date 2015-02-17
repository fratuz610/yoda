#!/bin/bash

# Installing Node
echo "-- Installing Node.js & system dependencies"

curl -sL https://deb.nodesource.com/setup | sudo bash -

apt-get install -y nodejs git unzip dos2unix

apt-get autoremove -y

# Some cleanup for idempotency
echo "-- Cleaning up previous folders"

rm -fr /usr/local/yoda
rm -fr /usr/bin/yoda
rm -f /tmp/master.zip
rm -fr /tmp/yoda-master

echo "-- Installing yoda"

wget -P /tmp/ http://github.com/fratuz610/yoda/archive/master.zip -q

unzip -qq /tmp/master.zip -d /tmp

mv /tmp/yoda-master /usr/local/yoda

echo "-- Updating yoda dependencies\n"

cd /usr/local/yoda && npm update 2>&1 > /dev/null

echo "-- Setting up yoda executable"

chmod u+x /usr/local/yoda/yoda.js

ln -s /usr/local/yoda/yoda.js /usr/bin/yoda

dos2unix /usr/local/yoda/yoda.js 2>&1 > /dev/null

echo "-- Yoda setup completed"