from pydantic_settings import BaseSettings, SettingsConfigDict


class Env(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    minecraft_host: str = "localhost"
    minecraft_port: int = 25575
    minecraft_bot_username: str = "TestBot"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    vllm_api_key: str = ""
    is_test: bool = False


env: BaseSettings = Env()
