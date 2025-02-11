import re
import time
from typing import Any, Dict, List, Tuple, Union

from javascript import require
from langchain_core.messages.ai import AIMessage
from langchain_core.messages.human import HumanMessage
from langchain_core.messages.system import SystemMessage
from langchain_core.prompts.chat import SystemMessagePromptTemplate

from voyager.control_primitives_context import load_control_primitives_context
from voyager.llm import LLM
from voyager.prompts import load_prompt
from voyager.utils.file_utils import f_mkdir
from voyager.utils.json_utils import dump_json, load_json


class ActionAgent:
    def __init__(
        self,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0,
        request_timout: int = 120,
        ckpt_dir: str = "ckpt",
        resume: bool = False,
        chat_log: bool = True,
        execution_error: bool = True,
    ) -> None:
        self.ckpt_dir = ckpt_dir
        self.chat_log = chat_log
        self.execution_error = execution_error
        f_mkdir(f"{ckpt_dir}/action")
        if resume:
            print(f"\033[32mLoading Action Agent from {ckpt_dir}/action\033[0m")
            self.chest_memory = load_json(f"{ckpt_dir}/action/chest_memory.json")
        else:
            self.chest_memory: Dict[str, Union[Dict, str]] = {}
        self.llm = LLM(
            model_name=model_name,
            temperature=temperature,
            request_timeout=request_timout,
        )

    def update_chest_memory(self, chests: Dict[str, Union[Dict, str]]) -> None:
        for position, chest in chests.items():
            if position in self.chest_memory:
                if isinstance(chest, dict):
                    self.chest_memory[position] = chest
                if chest == "Invalid":
                    print(
                        f"\033[32mAction Agent removing chest {position}: {chest}\033[0m"
                    )
                    self.chest_memory.pop(position)
            else:
                if chest != "Invalid":
                    print(
                        f"\033[32mAction Agent saving chest {position}: {chest}\033[0m"
                    )
                    self.chest_memory[position] = chest
        dump_json(self.chest_memory, f"{self.ckpt_dir}/action/chest_memory.json")

    def render_chest_observation(self) -> str:
        chests: List[str] = []
        for chest_position, chest in self.chest_memory.items():
            if isinstance(chest, dict) and len(chest) > 0:
                chests.append(f"{chest_position}: {chest}")
        for chest_position, chest in self.chest_memory.items():
            if isinstance(chest, dict) and len(chest) == 0:
                chests.append(f"{chest_position}: Empty")
        for chest_position, chest in self.chest_memory.items():
            if isinstance(chest, str):
                assert chest == "Unknown"
                chests.append(f"{chest_position}: Unknown items inside")
        assert len(chests) == len(self.chest_memory)
        if chests:
            chests_str = "\n".join(chests)
            return f"Chests: \n{chests_str}\n\n"
        else:
            return "Chests: None\n\n"

    def render_system_message(self, skills: List[str] = []) -> SystemMessage:
        system_template = load_prompt("action_template")
        # FIXME: Hardcoded control_primitives
        base_skills: List[str] = [
            "exploreUntil",
            "mineBlock",
            "craftItem",
            "placeItem",
            "smeltItem",
            "killMob",
        ]
        if not self.llm.model_name == "gpt-4o-mini":
            base_skills += [
                "useChest",
                "mineflayer",
            ]
        programs: str = "\n\n".join(
            load_control_primitives_context(base_skills) + skills
        )
        response_format = load_prompt("action_response_format")
        system_message_prompt = SystemMessagePromptTemplate.from_template(
            system_template
        )
        system_message = system_message_prompt.format(
            programs=programs, response_format=response_format
        )
        assert isinstance(system_message, SystemMessage)
        return system_message

    def render_human_message(
        self,
        *,
        events: List[Tuple[str, Dict[str, Any]]],
        code: str = "",
        task: str = "",
        context: str = "",
        critique: str = "",
    ) -> HumanMessage:
        chat_messages: List[str] = []
        error_messages: List[str] = []
        damage_messages: List[str] = []
        assert events[-1][0] == "observe", "Last event must be observe"
        for i, (event_type, event) in enumerate(events):
            if event_type == "onChat":
                chat_messages.append(event["onChat"])
            elif event_type == "onError":
                error_messages.append(event["onError"])
            elif event_type == "onDamage":
                damage_messages.append(event["onDamage"])
            elif event_type == "observe":
                biome = event["status"]["biome"]
                time_of_day = event["status"]["timeOfDay"]
                voxels = event["voxels"]
                entities = event["status"]["entities"]
                health = event["status"]["health"]
                hunger = event["status"]["food"]
                position = event["status"]["position"]
                equipment = event["status"]["equipment"]
                inventory_used = event["status"]["inventoryUsed"]
                inventory = event["inventory"]
                assert i == len(events) - 1, "observe must be the last event"

        observation = ""

        if code:
            observation += f"Code from the last round: \n{code}\n\n"
        else:
            observation += "Code from the last round: No code in the first round\n\n"

        if self.execution_error:
            if error_messages:
                error = "\n".join(error_messages)
                observation += f"Execution error: \n{error}\n\n"
            else:
                observation += "Execution error: No error\n\n"

        if self.chat_log:
            if chat_messages:
                chat_log = "\n".join(chat_messages)
                observation += f"Chat log: {chat_log}\n\n"
            else:
                observation += "Chat log: None\n\n"

        observation += f"Biome: {biome}\n\n"

        observation += f"Time: {time_of_day}\n\n"

        if voxels:
            observation += f"Nearby blocks: {', '.join(voxels)}\n\n"
        else:
            observation += "Nearby blocks: None\n\n"

        if entities:
            nearby_entities = [
                k for k, v in sorted(entities.items(), key=lambda x: x[1])
            ]
            observation += f"Nearby entities (nearest to farthest): {', '.join(nearby_entities)}\n\n"
        else:
            observation += "Nearby entities (nearest to farthest): None\n\n"

        observation += f"Health: {health:.1f}/20\n\n"

        observation += f"Hunger: {hunger:.1f}/20\n\n"

        observation += f"Position: x={position['x']:.1f}, y={position['y']:.1f}, z={position['z']:.1f}\n\n"

        observation += f"Equipment: {equipment}\n\n"

        if inventory:
            observation += f"Inventory ({inventory_used}/36): {inventory}\n\n"
        else:
            observation += f"Inventory ({inventory_used}/36): Empty\n\n"

        if not (
            task == "Place and deposit useless items into a chest"
            or task.startswith("Deposit useless items into the chest at")
        ):
            observation += self.render_chest_observation()

        observation += f"Task: {task}\n\n"

        if context:
            observation += f"Context: {context}\n\n"
        else:
            observation += "Context: None\n\n"

        if critique:
            observation += f"Critique: {critique}\n\n"
        else:
            observation += "Critique: None\n\n"

        return HumanMessage(content=observation)

    def process_ai_message(self, message: AIMessage) -> Union[Dict[str, str], str]:
        assert isinstance(message, AIMessage)

        retry = 3
        error = None
        while retry > 0:
            try:
                babel = require("@babel/core")
                babel_generator = require("@babel/generator").default

                code_pattern = re.compile(r"```(?:javascript|js)(.*?)```", re.DOTALL)
                code = "\n".join(code_pattern.findall(message.content))
                parsed = babel.parse(code)
                functions: List[Dict[str, Any]] = []
                assert len(list(parsed.program.body)) > 0, "No functions found"
                for i, node in enumerate(parsed.program.body):
                    if node.type != "FunctionDeclaration":
                        continue
                    node_type = (
                        "AsyncFunctionDeclaration"
                        if node["async"]
                        else "FunctionDeclaration"
                    )
                    functions.append(
                        {
                            "name": node.id.name,
                            "type": node_type,
                            "body": babel_generator(node).code,
                            "params": list(node["params"]),
                        }
                    )
                # find the last async function
                main_function = None
                for function in reversed(functions):
                    if function["type"] == "AsyncFunctionDeclaration":
                        main_function = function
                        break
                assert main_function is not None, (
                    "No async function found. Your main function must be async."
                )
                assert (
                    len(main_function["params"]) == 1
                    and main_function["params"][0].name == "bot"
                ), (
                    f"Main function {main_function['name']} must take a single argument named 'bot'"
                )
                program_code = "\n\n".join(function["body"] for function in functions)
                exec_code = f"await {main_function['name']}(bot);"
                return {
                    "program_code": program_code,
                    "program_name": main_function["name"],
                    "exec_code": exec_code,
                }
            except Exception as e:
                retry -= 1
                error = e
                time.sleep(1)
        return f"Error parsing action response (before program execution): {error}"

    def summarize_chatlog(self, events: List[Tuple[str, Dict[str, Any]]]) -> str:
        def filter_item(message: str) -> str:
            craft_pattern = r"I cannot make \w+ because I need: (.*)"
            craft_pattern2 = (
                r"I cannot make \w+ because there is no crafting table nearby"
            )
            mine_pattern = r"I need at least a (.*) to mine \w+!"
            if re.match(craft_pattern, message):
                return re.match(craft_pattern, message).groups()[0]
            elif re.match(craft_pattern2, message):
                return "a nearby crafting table"
            elif re.match(mine_pattern, message):
                return re.match(mine_pattern, message).groups()[0]
            else:
                return ""

        chatlog: set[str] = set()
        for event_type, event in events:
            if event_type == "onChat":
                item = filter_item(event["onChat"])
                if item:
                    chatlog.add(item)
        return "I also need " + ", ".join(chatlog) + "." if chatlog else ""
