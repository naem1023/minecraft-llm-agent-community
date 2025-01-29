import os

from dotenv import load_dotenv

from voyager.voyager import Voyager

load_dotenv()

print(os.system("node -v"))

openai_api_key = os.environ.get("OPENAI_API_KEY")
model = "gpt-4o-mini"
voyager = Voyager(
    mc_port=25565,
    azure_login=None,
    openai_api_key=openai_api_key,
    action_agent_model_name=model,
    critic_agent_model_name=model,
)

# start lifelong learning
voyager.learn()
