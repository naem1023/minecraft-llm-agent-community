from langchain_core.embeddings.fake import FakeEmbeddings
from langchain_openai.embeddings import OpenAIEmbeddings
from logzero import logger

from voyager.core.env import env_var


class EmbeddingModel:
    def __init__(self, *, model_name: str, **kwargs):
        self.model_name = model_name

        if env_var.is_test:
            logger.info("Using mock Embedding instead of real Embedding")
            self.embeddings: FakeEmbeddings = FakeEmbeddings(size=100)
        else:
            logger.info(f"BE CAREFUL: Using real Embedding: {model_name}")
            self.embeddings: OpenAIEmbeddings = OpenAIEmbeddings(
                model=model_name, **kwargs
            )

    def embed_documents(self, *args, **kwargs) -> list[list[float]]:
        return self.embeddings.embed_documents(*args, **kwargs)

    def embed_query(self, *args, **kwargs) -> list[float]:
        return self.embeddings.embed_query(*args, **kwargs)
