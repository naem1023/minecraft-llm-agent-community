---
sidebar_position: 3
---

# Installation

### Dependenceis
- Pyhton: v3.9
- Node: v18

### Prepare JDK 21>=
mac
```sh
brew install cask
brew install --cask temurin@21
```

### Download and Run Fabric Minecraft Server Launcher on local
```shell
chmod 751 scripts/*.sh

# If a server isn't installed 
bash scripts/download_and_run.sh

# IF a server is already install 
bash scripts/run.sh
```
### Set world
- seed: 637184628307790
- coordinate: 63 94 168
Set the x y z position on the server command
```
/setworldspawn 63 94 168
```

server.properties: These settings will automatically set via download_run_server.sh.
```txt
difficulty=peaceful
gamemode=survival
online-mode=false
enable-rcon=true # Only needed if you wish to use RCON features
rcon.password=hunter2
rcon.port=25575
spawn-protection=0 # This is important, otherwise the bot can't do anything near the spawn
```
### Prepare minecraft mods for client
- Check the [fabric mods installation document](Fabric-mod-installation.md)
### Make python environment
```shell
conda create -n mw python=3.9 -y
conda activate mw
make install
```

### Install mineflayer and additional minecraft interface library
```shell
npm install mineflayer

cd voyager/env/mineflayer
npm install -g npx
npm install
cd mineflayer-collectblock
npm install
npx tsc
cd ..
npm install
```

### Set environment variables
Make `.env` file and set environment variables like `.env.sample`.
