#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

from mephisto.utils.console_writer import ConsoleWriter
from .utils import clean_main_node_modules

REPO_PATH = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

logger = ConsoleWriter()


# --- CLEAN ---


def clean_main(remove_package_locks: bool, verbose: bool = False):
    clean_main_node_modules(REPO_PATH, remove_package_locks=remove_package_locks, verbose=verbose)
