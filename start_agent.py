from voyager.core.env import env
from voyager.voyager import Voyager


model: str = "gpt-4o-mini"
names: list[str] = ["Alice"]

for name in names:
    voyager = Voyager(
        mc_port=25565,
        azure_login=None,
        openai_api_key=env.OPENAI_API_KEY,
        action_agent_model_name=model,
        critic_agent_model_name=model,
        name=name,
    )

    # start lifelong learning
    voyager.learn()
