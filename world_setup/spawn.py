import mcworld

# Minecraft 세계 폴더 경로
world_path = "world"

# 새로운 world spawn 위치 설정
new_spawn = (63, 94, 168)

# level.dat 파일 로드
world = mcworld.World(world_path)

# world spawn 위치 설정
world.set_world_spawn(new_spawn)

# 변경 사항 저장
world.save()
