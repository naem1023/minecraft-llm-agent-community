import asyncio

from logzero import logger

from voyager.core.env import env_var
from voyager.voyager import Voyager


model: str = "gpt-4o-mini"
names: list[str] = ["Alice", "Bob"]


async def run_voyager(name: str):
    voyager = Voyager(
        mc_port=25565,
        azure_login=None,
        openai_api_key=env_var.openai_api_key,
        action_agent_model_name=model,
        critic_agent_model_name=model,
        name=name,
    )
    try:
        await asyncio.to_thread(voyager.learn)
    except asyncio.CancelledError:
        logger.error(f"Learning job is cancelled for {name}")
        raise


async def main():
    tasks = [asyncio.create_task(run_voyager(name)) for name in names]
    try:
        await asyncio.gather(*tasks)
    except Exception:
        logger.error("Error occurred:", exc_info=True)
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Program is terminated by user")
