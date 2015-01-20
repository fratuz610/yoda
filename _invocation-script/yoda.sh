#!/bin/bash

# Some cleanup for idempotency
rm -fr /usr/local/node
rm -f /usr/bin/node
rm -f /usr/bin/npm
rm -fr /tmp/node*
rm -fr /usr/local/yoda
rm -fr /usr/bin/yoda

wget http://nodejs.org/dist/latest/node-v0.10.35-linux-x64.tar.gz -P /tmp
tar -C /tmp -xf /tmp/node-v0.10.35-linux-x64.tar.gz
mv /tmp/node-v0.10.35-linux-x64 /usr/local/node
ln -s /usr/local/node/bin/node /usr/bin/node
ln -s /usr/local/node/bin/npm /usr/bin/npm

apt-get update && apt-get upgrade -y && apt-get install git unzip dos2unix -y && apt-get autoremove -y

mkdir /usr/local/yoda

git clone https://github.com/fratuz610/yoda /usr/local/yoda

cd /usr/local/yoda && npm update

chmod u+x /usr/local/yoda/yoda.js

ln -s /usr/local/yoda/yoda.js /usr/bin/yoda

dos2unix /usr/local/yoda/yoda.js

yoda $*
