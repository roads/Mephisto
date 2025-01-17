#!/usr/bin/env python3

from typing import Any, Dict

from mephisto.data_model.unit import Unit
from mephisto.data_model.qualification import QUAL_NOT_EXIST, QUAL_GREATER_EQUAL
from mephisto.operations.operator import Operator
from mephisto.tools.scripts import task_script, build_custom_bundle
from mephisto.abstractions.blueprints.abstract.static_task.static_blueprint import (
    SharedStaticTaskState,
)
from mephisto.utils.qualifications import make_qualification_dict
from omegaconf import DictConfig

ALL_BLOCKLIST_QUALIFICATION = "all_projects_blocklist"
EXAMPLE_PROJECT_ONBOARDING_SCORE = "example_project_onboarding_score"
EXAMPLE_PROJECT_CUMULIATIVE_SCORE = "example_project_cumulative_score"
ONBOARDING_SCORE_THRESHOLD = 80
CUMULATIVE_SCORE_THRESHOLD = 80


@task_script(default_config_file="example_project.yaml")
def main(operator: Operator, cfg: DictConfig) -> None:
    provider_type = cfg.mephisto.provider._provider_type

    shared_state = SharedStaticTaskState()
    shared_state.qualifications = [
        make_qualification_dict(
            ALL_BLOCKLIST_QUALIFICATION,
            QUAL_NOT_EXIST,
            None,
        ),
        make_qualification_dict(
            EXAMPLE_PROJECT_ONBOARDING_SCORE,
            QUAL_GREATER_EQUAL,
            ONBOARDING_SCORE_THRESHOLD,
        ),
        make_qualification_dict(
            EXAMPLE_PROJECT_CUMULIATIVE_SCORE,
            QUAL_GREATER_EQUAL,
            CUMULATIVE_SCORE_THRESHOLD,
        ),
    ]

    if provider_type == "mturk":
        # Only require MTurk qualifications if deploying live, do not require
        # for `mock` or `mturk_sandbox`.
        shared_state.mturk_specific_qualifications = [
            {
                "QualificationTypeId": "00000000000000000040",  # The total number of HITs submitted by a Worker that have been approved.
                "Comparator": "GreaterThanOrEqualTo",
                "IntegerValues": [1000],
                "ActionsGuarded": "DiscoverPreviewAndAccept",
            },
            {
                "QualificationTypeId": "000000000000000000L0",  # The percentage of assignments the Worker has submitted that were subsequently approved by the Requester.
                "Comparator": "GreaterThanOrEqualTo",
                "IntegerValues": [90],
                "ActionsGuarded": "DiscoverPreviewAndAccept",
            },
            {
                "QualificationTypeId": "00000000000000000071",  # Only allow Turkers from specified states in US.
                "Comparator": "In",
                "LocaleValues": [
                    {"Country": "US", "Subdivision": "AL"},
                    {"Country": "US", "Subdivision": "AR"},
                    {"Country": "US", "Subdivision": "DE"},
                    {"Country": "US", "Subdivision": "FL"},
                    {"Country": "US", "Subdivision": "GA"},
                    {"Country": "US", "Subdivision": "IA"},
                    {"Country": "US", "Subdivision": "KS"},
                    {"Country": "US", "Subdivision": "KY"},
                    {"Country": "US", "Subdivision": "LA"},
                    {"Country": "US", "Subdivision": "MD"},
                    {"Country": "US", "Subdivision": "MN"},
                    {"Country": "US", "Subdivision": "MS"},
                    {"Country": "US", "Subdivision": "MO"},
                    {"Country": "US", "Subdivision": "NE"},
                    {"Country": "US", "Subdivision": "ND"},
                    {"Country": "US", "Subdivision": "OK"},
                    {"Country": "US", "Subdivision": "SC"},
                    {"Country": "US", "Subdivision": "TN"},
                    {"Country": "US", "Subdivision": "TX"},
                    {"Country": "US", "Subdivision": "VA"},
                    {"Country": "US", "Subdivision": "WV"},
                ],
                "ActionsGuarded": "DiscoverPreviewAndAccept",
            },
        ]
    task_dir = cfg.task_dir

    build_custom_bundle(
        task_dir,
        force_rebuild=cfg.mephisto.task.force_rebuild,
        post_install_script=cfg.mephisto.task.post_install_script,
    )

    operator.launch_task_run(cfg.mephisto, shared_state)
    operator.wait_for_runs_then_shutdown(skip_input=True, log_rate=30)


if __name__ == "__main__":
    main()
