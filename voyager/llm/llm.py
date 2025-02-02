import traceback

from langchain_core.language_models.fake import FakeListLLM
from langchain_core.messages import AIMessage, BaseMessage
from langchain_openai import ChatOpenAI
from logzero import logger

from voyager.core.env import env_var
from voyager.llm.mock import mock_responses


class LLM:
    def __init__(self, *, model_name: str, **kwargs):
        self.model_name = model_name

        if env_var.is_test:
            logger.info("Using mock LLM instead of real LLM")
            self.llm: FakeListLLM = FakeListLLM(responses=mock_responses)
        else:
            logger.info(f"BE CAREFUL: Using real LLM: {model_name}")
            self.llm: ChatOpenAI = ChatOpenAI(model_name=model_name, **kwargs)

    def __call__(self, *args, **kwargs) -> None:
        logger.error(f"Error calling LLM: {traceback.format_exc()}")
        raise Exception("Error calling LLM")

    def generate(self, *args, **kwargs) -> BaseMessage:
        res: BaseMessage | str = self.llm.invoke(*args, **kwargs)
        if isinstance(res, str):
            return AIMessage(content=res)
        return res
