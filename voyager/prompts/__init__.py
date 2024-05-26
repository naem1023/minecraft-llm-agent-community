import pkg_resources

from voyager.utils.file_utils import load_text


def load_prompt(prompt):
    package_path = pkg_resources.resource_filename("voyager", "")
    return load_text(f"{package_path}/prompts/{prompt}.txt")
