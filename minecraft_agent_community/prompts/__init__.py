import pkg_resources

from minecraft_agent_community.utils.file_utils import load_text


def load_prompt(prompt):
    package_path = pkg_resources.resource_filename("minecraft_agent_community", "")
    return load_text(f"{package_path}/prompts/{prompt}.txt")
