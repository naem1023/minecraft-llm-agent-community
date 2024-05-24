import os

from dotenv import load_dotenv

from voyager.voyager import Voyager

load_dotenv()

openai_api_key = os.environ.get("OPENAI_API_KEY")
model = "gpt-3.5-turbo"
voyager = Voyager(
    mc_port=25575,
    azure_login=None,
    openai_api_key=openai_api_key,
    action_agent_model_name=model,
    critic_agent_model_name=model,
    server_port=25575,
)

# start lifelong learning
voyager.learn()
