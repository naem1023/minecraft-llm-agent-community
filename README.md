# ⛏️ minecraft_world

This project aims to observe how agents in the Minecraft world autonomously form groups and create villages. It is still in its early stages, and if valuable insights can be derived, it will be used as a research topic.

This project seeks to expand the research to include how multi-agents form groups, in addition to autonomously learning skills and exploring items, similar to [Voyager](https://github.com/MineDojo/Voyager).

## TODO 
- [ ] Basic Environment Setup using Voyager baseline
- [ ] Setup local llm via vllm or text-generation-inference
- [ ] Make single agent using Voyager baseline
- [ ] Make simple multi agent 

## Installation Guides
### Dependenceis
- Pyhton: v3.9
- Node: v18
- (Optional) Minecraft client launcher: v1.19.2

### Prepare JDK 21>=
- For example, donwload the installation file from [https://www.oracle.com/java/technologies/downloads/#jdk22-mac](https://www.oracle.com/java/technologies/downloads/#jdk22-mac).

### Download and Run Fabric Minecraft Server Launcher on local
```sh
chmod 751 scritps/run*.sh

# If a server isn't installed 
scritps/download_run_server.sh

# IF a server is already install 
scritps/run_server.sh
```
### Set world
- seed: scritps/run_server.sh
- coordinate: 63 94 ~
Set the x y z position on the server command
```
/setworldspawn 63 94 168
```
### Make python environment
```sh
conda create -n mw python=3.9 -y
conda activate mw
make install
```

### Install mineflayer and additional minecraft interface library
```sh
npm install mineflayer

cd voyager/env/mineflayers
npm install -g npx
npm install
cd mineflayer-collectblock
npm install
npx tsc
cd ..
npm install
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
