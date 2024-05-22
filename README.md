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
make install
```

# Contribution
## Check lint
```sh
make pre-commit
```

# Citation

If you find our work useful, please consider citing us! 

```bibtex
@article{wang2023voyager,
  title   = {Voyager: An Open-Ended Embodied Agent with Large Language Models},
  author  = {Guanzhi Wang and Yuqi Xie and Yunfan Jiang and Ajay Mandlekar and Chaowei Xiao and Yuke Zhu and Linxi Fan and Anima Anandkumar},
  year    = {2023},
  journal = {arXiv preprint arXiv: Arxiv-2305.16291}
}
```
