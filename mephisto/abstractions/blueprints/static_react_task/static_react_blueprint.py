#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from dataclasses import dataclass
from dataclasses import field
from typing import ClassVar
from typing import Type
from typing import TYPE_CHECKING

from omegaconf import MISSING

from mephisto.abstractions.blueprint import (
    SharedTaskState,
)
from mephisto.abstractions.blueprints.abstract.static_task.static_blueprint import (
    SharedStaticTaskState,
)
from mephisto.abstractions.blueprints.abstract.static_task.static_blueprint import StaticBlueprint
from mephisto.abstractions.blueprints.abstract.static_task.static_blueprint import (
    StaticBlueprintArgs,
)
from mephisto.abstractions.blueprints.static_react_task.static_react_task_builder import (
    StaticReactTaskBuilder,
)
from mephisto.operations.registry import register_mephisto_abstraction
from mephisto.utils.logger_core import (
    get_logger,
)

if TYPE_CHECKING:
    from mephisto.abstractions.blueprint import (
        TaskBuilder,
    )
    from mephisto.data_model.task_run import TaskRun
    from omegaconf import DictConfig

BLUEPRINT_TYPE_STATIC_REACT = "static_react_task"

logger = get_logger(name=__name__)


@dataclass
class StaticReactBlueprintArgs(StaticBlueprintArgs):
    """
    StaticReactBlueprint: Tasks launched from static blueprints need
    a prebuilt javascript bundle containing the task. We suggest building
    with our provided useMephistoTask hook.
    """

    _blueprint_type: str = BLUEPRINT_TYPE_STATIC_REACT
    _group: str = field(
        default="StaticReactBlueprint",
        metadata={
            "help": """
                Tasks launched from static blueprints need
                a prebuilt javascript bundle containing the task. We suggest building
                with our provided useMephistoTask hook.
            """
        },
    )
    task_source: str = field(
        default=MISSING,
        metadata={
            "help": "Path to file containing javascript bundle for the task",
            "required": True,
        },
    )
    link_task_source: bool = field(
        default=False,
        metadata={
            "help": """
                Symlinks the task_source file in your development folder to the
                one used for the server. Useful for local development so you can run
                a watch-based build for your task_source, allowing the UI code to
                update without having to restart the server each time.
            """,
            "required": False,
        },
    )


@register_mephisto_abstraction()
class StaticReactBlueprint(StaticBlueprint):
    """Blueprint for a task that runs off of a built react javascript bundle"""

    TaskBuilderClass: ClassVar[Type["TaskBuilder"]] = StaticReactTaskBuilder
    ArgsClass = StaticReactBlueprintArgs
    BLUEPRINT_TYPE = BLUEPRINT_TYPE_STATIC_REACT

    def __init__(self, task_run: "TaskRun", args: "DictConfig", shared_state: "SharedTaskState"):
        assert isinstance(
            shared_state, SharedStaticTaskState
        ), "Cannot initialize with a non-static state"
        super().__init__(task_run, args, shared_state)
        self.js_bundle = os.path.expanduser(args.blueprint.task_source)
        if not os.path.exists(self.js_bundle):
            raise FileNotFoundError(
                f"Specified bundle file {self.js_bundle} was not found from {os.getcwd()}"
            )

    @classmethod
    def assert_task_args(cls, args: "DictConfig", shared_state: "SharedTaskState") -> None:
        """Ensure that static requirements are fulfilled, and source file exists"""
        assert isinstance(
            shared_state, SharedStaticTaskState
        ), "Cannot assert args on a non-static state"
        super().assert_task_args(args, shared_state)

        found_task_source = args.blueprint.task_source
        assert (
            found_task_source is not None
        ), "Must provide a path to a javascript bundle in `task_source`"

        found_task_path = os.path.expanduser(found_task_source)
        assert os.path.exists(
            found_task_path
        ), f"Provided task source {found_task_path} does not exist."

        link_task_source = args.blueprint.link_task_source
        current_architect = args.architect._architect_type
        allowed_architects = ["local"]

        assert_message = (
            f"`link_task_source={link_task_source}` is not compatible with architect type: "
            f"{args.architect._architect_type}. Please check your task configuration."
        )
        assert link_task_source is False or (
            link_task_source is True and current_architect in allowed_architects
        ), assert_message

        if link_task_source is False and current_architect in allowed_architects:
            logger.info(
                "If you want your server to update on reload whenever you make changes to your "
                "webapp, then make sure to set \n\n"
                "link_task_source: [blue]true[/blue]\n\n"
                "in your task's hydra configuration and run \n\n"
                "[purple]cd[/purple] webapp [red]&&[/red] [green]npm[/green] run dev:watch\n\n"
                "in a separate terminal window. For more information check out:\n"
                "https://mephisto.ai/docs/guides/tutorials/custom_react/#12-launching-the-task\n",
                extra={"markup": True},
            )
