# minecraft_world

- [ ] Basic Environment Setup using Voyager baseline
- [ ] Setup local llm via vllm or text-generation-inference
- [ ] Make single agent using Voyager baseline

## Installation Guides
### Download and Run Server
```sh
mkdir -p bin
wget -c -P bin/ https://piston-data.mojang.com/v1/objects/f69c284232d7c7580bd89a5a4931c3581eae1378/server.jar

cd bin 
# Run twice for agree with eula.txt
java -Xmx1024M -Xms1024M -jar server.jar nogui
```
### Set world spawn
Set the x y z position on the server command
```
/setworldspawn ~ ~ ~
```

### Install mineflayer
```sh
npm install mineflayer
```

### Make python environment
```sh
conda create -n mw python=3.9 -y
conda activate mw
pip install poetry
poetry install
```
