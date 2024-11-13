#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Script to pull the current version of `mephisto-core` in the
repo and push that version to all files setting a CURR_MEPHISTO_CORE_PACKAGE_VERSION
constant value
"""

import json
import os
import re
import sys

from mephisto.utils.console_writer import ConsoleWriter
from mephisto.utils.dirs import get_root_dir
from mephisto.utils.logger_core import format_loud

ROOT_DIR = get_root_dir()
PATTERN = r'(CURR_MEPHISTO_CORE_PACKAGE_VERSION = "([0-9a-zA-Z.]*)")'
TARGET_FILES = [
    "mephisto/abstractions/architects/router/flask/mephisto_flask_blueprint.py",
    "mephisto/abstractions/architects/router/node/server.js",
    "mephisto/abstractions/architects/router/build_router.py",
]
MEPHISTO_CORE_PACKAGE_JSON_PATH = os.path.join(ROOT_DIR, "packages/mephisto-core/package.json")


logger = ConsoleWriter()


def run_replace():
    assert os.path.exists(
        MEPHISTO_CORE_PACKAGE_JSON_PATH
    ), f"Can't find core package at {MEPHISTO_CORE_PACKAGE_JSON_PATH}"

    with open(MEPHISTO_CORE_PACKAGE_JSON_PATH) as mephisto_core_package:
        version = json.load(mephisto_core_package)["version"]

    is_check_mode = len(sys.argv) > 1 and sys.argv[1] == "check"
    are_all_versions_synced = True
    are_all_versions_found = True

    logger.info(
        f"Detected `mephisto-core` version '{version}' at '{MEPHISTO_CORE_PACKAGE_JSON_PATH}'"
    )

    if is_check_mode:
        logger.info(
            f"Checking all dependent files are using `mephisto-core` version '{version}'...\n"
        )
    else:
        logger.info(f"Syncing all dependent files to `mephisto-core` version '{version}'...\n")

    output = f'CURR_MEPHISTO_CORE_PACKAGE_VERSION = "{version}"'

    for fn in TARGET_FILES:
        target_file = os.path.join(ROOT_DIR, fn)

        assert os.path.exists(target_file), f"Missing target replace file {target_file}"

        with open(target_file, "r") as file_to_replace:
            file_contents = file_to_replace.read()

        search = re.search(PATTERN, file_contents)
        if search is None:
            logger.error(f"{format_loud('[NOT FOUND]')} {target_file}")

            are_all_versions_found &= False
        elif is_check_mode:
            file_version = search.group(2)
            current_file_synced = file_version == version
            are_all_versions_synced &= current_file_synced

            logger.error(
                f"[{'CORRECT' if current_file_synced else format_loud(f'WRONG VERSION {file_version}')}] {target_file}"
            )
        else:
            new_contents = re.sub(PATTERN, output, file_contents)
            with open(target_file, "w") as file_to_replace:
                file_to_replace.write(new_contents)

                logger.info(f"[REPLACED] {target_file}")

    if not are_all_versions_found:
        sys.exit(1)

    if is_check_mode and not are_all_versions_synced:
        sys.exit(1)


if __name__ == "__main__":
    run_replace()
