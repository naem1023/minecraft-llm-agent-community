#!/bin/bash

mkdir -p bin
cd bin

# Downlaod server
curl -OJ https://meta.fabricmc.net/v2/versions/loader/1.19.2/0.15.11/1.0.1/server/jar

# Run server for generating server artifacts
java -Xmx2G -jar fabric-server-mc.1.19.2-loader.0.15.11-launcher.1.0.1.jar nogui

# eula=false to true
eula_path="eula.txt"
sed -i'' -e 's/eula=false/eula=true/' "$eula_path"

# Set difficulty to peaceful
server_properties="server.properties"
sed -i'' -e 's/^difficulty=.*/difficulty=peaceful/' "$server_properties"

# Run server again
java -Xmx2G -jar fabric-server-mc.1.19.2-loader.0.15.11-launcher.1.0.1.jar nogui
