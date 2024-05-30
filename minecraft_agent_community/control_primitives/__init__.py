import os

import pkg_resources

from minecraft_agent_community.utils.file_utils import load_text


def load_control_primitives(primitive_names=None):
    package_path = pkg_resources.resource_filename("minecraft_agent_community", "")
    if primitive_names is None:
        primitive_names = [
            primitives[:-3]
            for primitives in os.listdir(f"{package_path}/control_primitives")
            if primitives.endswith(".js")
        ]
    primitives = [
        load_text(f"{package_path}/control_primitives/{primitive_name}.js")
        for primitive_name in primitive_names
    ]
    return primitives
