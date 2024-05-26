# ⛏️ minecraft-llm-agent-community

This project aims to observe how agents in the Minecraft world autonomously form groups and create villages. It is still in its early stages, and if valuable insights can be derived, it will be used as a research topic.

This project seeks to expand the research to include how multi-agents form groups, in addition to autonomously learning skills and exploring items, similar to [Voyager](https://github.com/MineDojo/Voyager).

<div style="display: flex;">
  <div style="flex: 1;">
    <img src="assets/cover-image.jpeg" alt="Description" style="max-width: 100%; height: auto;">
  </div>
  <div style="flex: 1; padding-left: 20px;">
    <p>
      The purpose of this project is subject to change, and we welcome diverse opinions and feedback. Currently, we are focusing on observing how issues of cooperation, coexistence, and survival are resolved. Additionally, most of our resources are currently invested in setting up the Minecraft environment, which has slowed the progress of core functionality development.
    </p>
  </div>
</div>


## TODO 
- [x] Basic Environment Setup using Voyager baseline
- [x] Make single agent using Voyager baseline
- [ ] Analysis Voyager baseline and make a detail architecture image and pseudo code
- [ ] Setup local llm via vllm or text-generation-inference
- [ ] Make simple multi agent 

## Installation Guides
### Dependenceis
- Pyhton: v3.9
- Node: v18

### Prepare JDK 21>=
- For example, donwload the installation file from [https://www.oracle.com/java/technologies/downloads/#jdk22-mac](https://www.oracle.com/java/technologies/downloads/#jdk22-mac).

### Download and Run Fabric Minecraft Server Launcher on local
```sh
chmod 751 scripts/*run*.sh

# If a server isn't installed 
scripts/download_run_server.sh

# IF a server is already install 
scripts/run_server.sh
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
- Check the [fabric mods installation document](installation/fabric_mods_install.md)
### Make python environment
```sh
conda create -n mw python=3.9 -y
conda activate mw
make install
```

### Install mineflayer and additional minecraft interface library
```sh
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

# Test
```sh
python learn_voyager.py
```

# Contribution
## Check lint
```sh
make pre-commit
```

# Citation
```bibtex
@article{wang2023voyager,
  title   = {Voyager: An Open-Ended Embodied Agent with Large Language Models},
  author  = {Guanzhi Wang and Yuqi Xie and Yunfan Jiang and Ajay Mandlekar and Chaowei Xiao and Yuke Zhu and Linxi Fan and Anima Anandkumar},
  year    = {2023},
  journal = {arXiv preprint arXiv: Arxiv-2305.16291}
}
```
