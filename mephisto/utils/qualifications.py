#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import TYPE_CHECKING

from mephisto.data_model.qualification import COMPARATOR_OPERATIONS
from mephisto.data_model.qualification import QUAL_EXISTS
from mephisto.data_model.qualification import QUAL_GREATER
from mephisto.data_model.qualification import QUAL_GREATER_EQUAL
from mephisto.data_model.qualification import QUAL_IN_LIST
from mephisto.data_model.qualification import QUAL_LESS
from mephisto.data_model.qualification import QUAL_LESS_EQUAL
from mephisto.data_model.qualification import QUAL_NOT_EXIST
from mephisto.data_model.qualification import QUAL_NOT_IN_LIST
from mephisto.data_model.qualification import SUPPORTED_COMPARATORS
from mephisto.utils.logger_core import get_logger

if TYPE_CHECKING:
    from mephisto.abstractions.database import MephistoDB
    from mephisto.data_model.task_run import TaskRun
    from mephisto.data_model.worker import Worker

logger = get_logger(name=__name__)

QualificationType = Dict[str, Any]


def worker_is_qualified(
    worker: "Worker",
    shared_state_qualifications: List[QualificationType],
    task_run: Optional["TaskRun"] = None,
):
    db = worker.db

    # 1. Check if provider has `admit_workers_with_no_prior_qualification` setting
    provider_args = task_run.get_provider_args()
    admit_with_no_prior_qualification = provider_args.get(
        "admit_workers_with_no_prior_qualification"
    )
    all_worker_granted_qualifications = db.find_granted_qualifications(worker_id=worker.db_id)
    worker_has_granted_qualifications = len(all_worker_granted_qualifications) > 0
    task_run_has_qualifications = len(shared_state_qualifications) > 0
    if (
        admit_with_no_prior_qualification is True
        and task_run_has_qualifications
        and not worker_has_granted_qualifications
    ):
        # If TaskRun has quelifications and Worker has no granted qualifications,
        # they should be considered as quailified
        return True

    # 2. Check Worker's qualification
    for shared_state_qualification in shared_state_qualifications:
        qualification_name = shared_state_qualification["qualification_name"]
        qualifications = db.find_qualifications(qualification_name)

        if not qualifications:
            logger.warning(
                f"Expected to create qualification for {qualification_name}, "
                f"but none found... skipping."
            )
            continue

        qualification = qualifications[0]
        granted_qualifications = db.find_granted_qualifications(
            qualification_id=qualification.db_id,
            worker_id=worker.db_id,
        )
        comparator = shared_state_qualification["comparator"]
        compare_value = shared_state_qualification["value"]

        if comparator == QUAL_EXISTS and not granted_qualifications:
            return False
        elif comparator == QUAL_NOT_EXIST and granted_qualifications:
            return False
        elif comparator in [QUAL_EXISTS, QUAL_NOT_EXIST]:
            continue
        else:
            if not granted_qualifications:
                return False

            granted_qualification = granted_qualifications[0]
            if not COMPARATOR_OPERATIONS[comparator](granted_qualification.value, compare_value):
                return False

    return True


def as_valid_qualification_dict(qual_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check to ensure that a qualification dict properly checks
    against a Mephisto qualification
    """
    required_keys = [
        "qualification_name",
        "comparator",
        "value",
        "applicable_providers",
    ]
    for key in required_keys:
        if key not in qual_dict:
            raise AssertionError(f"Required key {key} not in qualification dict {qual_dict}")

    qual_name = qual_dict["qualification_name"]
    if type(qual_name) is not str or len(qual_name) == 0:
        raise AssertionError(f"Qualification name '{qual_name}' is not a string with length > 0")

    comparator = qual_dict["comparator"]
    if comparator not in SUPPORTED_COMPARATORS:
        raise AssertionError(
            f"Qualification comparator '{comparator}' not in supported list: {SUPPORTED_COMPARATORS}'"
        )

    value = qual_dict["value"]

    if (
        comparator in [QUAL_GREATER, QUAL_LESS, QUAL_GREATER_EQUAL, QUAL_LESS_EQUAL]
        and type(value) != int
    ):
        raise AssertionError(
            f"Value {value} is not valid for comparator {comparator}, must be an int"
        )

    if comparator in [QUAL_EXISTS, QUAL_NOT_EXIST] and value is not None:
        raise AssertionError(
            f"Value {value} is not valid for comparator {comparator}, must be None"
        )

    if comparator in [QUAL_IN_LIST, QUAL_NOT_IN_LIST] and type(value) != list:
        raise AssertionError(
            f"Value {value} is not valid for comparator {comparator}, must be a list"
        )

    if qual_dict["applicable_providers"] is not None:
        from mephisto.operations.registry import get_valid_provider_types

        assert (
            type(qual_dict["applicable_providers"]) == list
        ), "Applicable providers must be a string list of providers or none."
        valid_providers = get_valid_provider_types()
        for provider_name in qual_dict["applicable_providers"]:
            assert (
                provider_name in valid_providers
            ), f"Noted applicable provider name {provider_name} not in list of usable providers: {valid_providers}"

    return qual_dict


def make_qualification_dict(
    qualification_name: str,
    comparator: str,
    value: Any,
    applicable_providers: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Create a qualification dict to pass to an operator as part
    of extra_args
    """
    qual_dict = {
        "qualification_name": qualification_name,
        "comparator": comparator,
        "value": value,
        "applicable_providers": applicable_providers,
    }
    return as_valid_qualification_dict(qual_dict)


def find_or_create_qualification(db: "MephistoDB", qualification_name: str) -> str:
    """
    Ensure the given qualification exists in the db,
    creating it if it doesn't already. Returns the id
    """
    found_qualifications = db.find_qualifications(qualification_name)
    if len(found_qualifications) == 0:
        return db.make_qualification(qualification_name)
    else:
        return found_qualifications[0].db_id
