import pkg_resources

from voyager.utils.file_utils import f_exists, f_join, f_mkdir, load_text
from voyager.utils.json_utils import (
    dump_json,
    json_dump,
    json_dumps,
    json_load,
    load_json,
)


def load_prompt(prompt):
    package_path = pkg_resources.resource_filename("voyager", "")
    return load_text(f"{package_path}/prompts/{prompt}.txt")
