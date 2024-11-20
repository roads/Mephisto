#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
This file contains the various datatypes that are used on the operations layer
to facilitate executing task runs.
"""

import asyncio
import threading
from dataclasses import dataclass
from functools import partial
from typing import Any
from typing import Dict
from typing import List
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mephisto.abstractions.architect import Architect
    from mephisto.abstractions.blueprint import TaskRunner, Blueprint
    from mephisto.abstractions.crowd_provider import CrowdProvider
    from mephisto.data_model.task_run import TaskRun
    from mephisto.operations.client_io_handler import ClientIOHandler
    from mephisto.operations.task_launcher import TaskLauncher
    from mephisto.operations.worker_pool import WorkerPool


class LoopWrapper:
    def __init__(self, event_loop: asyncio.AbstractEventLoop):
        self.loop = event_loop
        self.tid = threading.current_thread()

    def set_active_thread(self):
        self.tid = threading.current_thread()

    def execute_coro(self, coro) -> None:
        """Execute this coroutine in the loop, regardless of callsite"""

        def _async_execute(func):
            """Wrapper to execute this function"""
            func()

        f = partial(asyncio.ensure_future, coro, loop=self.loop)
        if threading.current_thread() == self.tid:
            # We're in the loop's thread, just execute!
            f()
        else:
            # Schedule calling the function from the loop's thread
            self.loop.call_soon_threadsafe(_async_execute, f)


@dataclass
class LiveTaskRun:
    task_run: "TaskRun"
    # Core abstraction instances
    architect: "Architect"
    blueprint: "Blueprint"
    provider: "CrowdProvider"
    # Live job operations and state
    qualifications: List[Dict[str, Any]]
    task_runner: "TaskRunner"
    task_launcher: "TaskLauncher"

    client_io: "ClientIOHandler"
    worker_pool: "WorkerPool"

    loop_wrap: LoopWrapper

    # Toggle used to tell operator to force shutdown
    # of this task run in error conditions
    force_shutdown: bool = False

    def shutdown(self):
        self.task_runner.shutdown()
        self.worker_pool.shutdown()
        self.client_io.shutdown()


class WorkerFailureReasons:
    NOT_QUALIFIED = "You are not currently qualified to work on this task..."
    NOT_AUTHORIZED = "You are not authorized to work on this task..."
    NO_AVAILABLE_UNITS = "There is currently no available work, please try again later..."
    TOO_MANY_CONCURRENT = (
        "You are currently working on too many tasks concurrently to accept another, "
        "please finish your current work."
    )
    MAX_FOR_TASK = (
        "You have already completed the maximum amount of tasks "
        "the requester has set for this task."
    )
    TASK_MISSING = (
        "You appear to have already completed this task, "
        "or have disconnected long enough for your session to clear..."
    )
