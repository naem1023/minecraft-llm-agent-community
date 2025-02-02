import json
import os.path
import time
from typing import Any, Dict, SupportsFloat, Tuple

import gymnasium as gym
import requests
from gymnasium.core import ObsType


class VoyagerEnv(gym.Env):
    def __init__(
        self,
        name: str,
        mc_port: int = None,
        server_host: str = "http://localhost",
        server_port: int = 3000,
        request_timeout: int = 1200,
        log_path: str = "./logs",
    ):
        self.mc_port = mc_port
        self.server_url: str = f"{server_host}:{server_port}"
        self.server_port: int = server_port
        self.request_timeout: int = request_timeout
        self.name: str = name
        self.log_path: str = os.path.join(log_path, self.name)
        self.has_reset: bool = False
        self.reset_options: dict = None
        self.connected: bool = False
        self.server_paused: bool = False

    def check_process(self) -> str | None:
        retry = 0
        while not self.connected:
            if retry > 3:
                raise RuntimeError("Mineflayer process failed to start")
            else:
                res = requests.post(
                    f"{self.server_url}/start",
                    json=self.reset_options,
                    timeout=self.request_timeout,
                )
                if res.status_code != 200:
                    raise RuntimeError(
                        f"Minecraft server reply with code {res.status_code}"
                    )
                return res.json()
        return None

    def step(
        self,
        code: str,
        programs: str = "",
        max_retries: int = 3,
    ) -> Tuple[ObsType, SupportsFloat, bool, bool, Dict[str, Any]]:
        if not self.has_reset:
            raise RuntimeError("Environment has not been reset yet")

        self.unpause()
        data = {
            "code": code,
            "programs": programs,
            "bot_name": self.name,
        }

        retry_count = 0
        while retry_count < max_retries:
            try:
                res = requests.post(
                    f"{self.server_url}/step", json=data, timeout=self.request_timeout
                )
                if res.status_code == 200:
                    returned_data = res.json()
                    self.pause()
                    return json.loads(returned_data)
                elif res.status_code == 404:  # Bot not found
                    raise RuntimeError("Bot not found")
                elif res.status_code == 429:  # Bot is busy
                    retry_count += 1
                    if retry_count == max_retries:
                        raise RuntimeError("Bot is busy processing another request")
                    time.sleep(2)  # Wait longer for busy bot
                    continue

            except (
                requests.exceptions.Timeout,
                requests.exceptions.ConnectionError,
            ) as e:
                retry_count += 1
                if retry_count == max_retries:
                    raise RuntimeError(
                        f"Failed to connect after {max_retries} retries: {str(e)}"
                    )
                time.sleep(1)  # Wait before retrying

        raise RuntimeError("Failed to step Minecraft server")

    def render(self):
        raise NotImplementedError("render is not implemented")

    def reset(
        self,
        *,
        seed: int = None,
        options: dict = None,
    ) -> Tuple[ObsType, Dict[str, Any]]:
        if options is None:
            options = {}

        if options.get("inventory", {}) and options.get("mode", "hard") != "hard":
            raise RuntimeError("inventory can only be set when options is hard")

        self.reset_options = {
            "port": self.mc_port,
            "reset": options.get("mode", "hard"),
            "inventory": options.get("inventory", {}),
            "equipment": options.get("equipment", []),
            "spread": options.get("spread", False),
            "waitTicks": options.get("wait_ticks", 5),
            "position": options.get("position", None),
            "bot_name": self.name,
        }

        self.unpause()

        returned_data: str | None = self.check_process()
        self.has_reset = True
        self.connected = True
        # All the reset in step will be soft
        self.reset_options["reset"] = "soft"
        self.pause()
        return json.loads(returned_data) if returned_data is not None else {}

    def close(self):
        self.unpause()
        if self.connected:
            res = requests.post(f"{self.server_url}/stop", json={"bot_name": self.name})
            if res.status_code == 200:
                self.connected = False
        return not self.connected

    def pause(self):
        if self.connected and not self.server_paused:
            res = requests.post(
                f"{self.server_url}/pause", json={"bot_name": self.name}
            )
            if res.status_code == 200:
                self.server_paused = True
        return self.server_paused

    def unpause(self):
        if self.connected and self.server_paused:
            res = requests.post(
                f"{self.server_url}/pause", json={"bot_name": self.name}
            )
            if res.status_code == 200:
                self.server_paused = False
            else:
                print(res.json())
        return self.server_paused
