#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from omegaconf import DictConfig

from mephisto.abstractions.blueprints.abstract.static_task.static_blueprint import (
    SharedStaticTaskState,
)
from mephisto.data_model.qualification import QUAL_GREATER_EQUAL
from mephisto.operations.operator import Operator
from mephisto.tools.building_react_apps import examples
from mephisto.tools.scripts import task_script
from mephisto.utils.qualifications import make_qualification_dict


@task_script(default_config_file="example_with_authorization__local__inhouse")
def main(operator: Operator, cfg: DictConfig) -> None:
    examples.build_static_react_task(
        force_rebuild=cfg.mephisto.task.force_rebuild,
        post_install_script=cfg.mephisto.task.post_install_script,
    )

    shared_state = SharedStaticTaskState(
        static_task_data=[
            {"text": "This text is good text!"},
            {"text": "This text is bad text!"},
        ],
    )
    shared_state.qualifications = [
        make_qualification_dict("test-react-static-passed_qualification", QUAL_GREATER_EQUAL, 2),
    ]

    operator.launch_task_run(cfg.mephisto, shared_state)
    operator.wait_for_runs_then_shutdown(skip_input=True, log_rate=30)


if __name__ == "__main__":
    main()
