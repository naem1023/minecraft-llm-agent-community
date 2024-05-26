#!/bin/bash

mkdir -p bin
cd bin

# Downlaod server
# curl -OJ https://meta.fabricmc.net/v2/versions/loader/1.19/0.14.18/1.0.1/server/jar
curl -o server.jar https://meta.fabricmc.net/v2/versions/loader/1.19/0.14.18/1.0.1/server/jar

# Run server for generating server artifacts
java -Xmx2G -jar server.jar nogui

# eula=false to true
eula_path="eula.txt"
NEW_SEED="637184628307790"
sed -i'' -e 's/eula=false/eula=true/' "$eula_path"

# Set difficulty to peaceful
server_properties="server.properties"
sed -i'' -e 's/^difficulty=.*/difficulty=peaceful/' "$server_properties"
sed -i'' -e "s/^level-seed=.*/level-seed=$NEW_SEED/" "$server_properties"
sed -i'' -e "s/^online-mode=.*/online-mode=false/" "$server_properties"
sed -i'' -e "s/^gamemode=.*/gamemode=creative/" "$server_properties"

# Run server again
java -Xmx2G -jar server.jar nogui
