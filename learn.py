import os

from dotenv import load_dotenv

from minecraft_agent_community.voyager import Voyager
from logzero import logger

load_dotenv()

logger.info(f"node version: {os.system('node -v')}")

openai_api_key = os.environ.get("OPENAI_API_KEY")
model = "gpt-3.5-turbo"
voyager = Voyager(
    mc_port=25565,
    azure_login=None,
    openai_api_key=openai_api_key,
    action_agent_model_name=model,
    critic_agent_model_name=model,
)

# start lifelong learning
voyager.learn()
