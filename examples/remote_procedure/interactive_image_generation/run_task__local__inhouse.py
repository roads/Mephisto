#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import random
from copy import deepcopy
from time import sleep
from typing import Dict
from typing import List
from typing import TypedDict
from typing import Union

from omegaconf import DictConfig
from omegaconf.errors import ConfigAttributeError

from mephisto.abstractions.blueprints.remote_procedure.remote_procedure_agent_state import (
    RemoteProcedureAgentState,
)
from mephisto.abstractions.blueprints.remote_procedure.remote_procedure_blueprint import (
    SharedRemoteProcedureTaskState,
)
from mephisto.client.cli_form_composer_commands import FORM_COMPOSER__DATA_CONFIG_NAME
from mephisto.client.cli_form_composer_commands import FORM_COMPOSER__DATA_DIR_NAME
from mephisto.client.cli_form_composer_commands import FORM_COMPOSER__TOKEN_SETS_VALUES_CONFIG_NAME
from mephisto.client.cli_form_composer_commands import FORM_COMPOSER__UNIT_CONFIG_NAME
from mephisto.client.cli_form_composer_commands import set_form_composer_env_vars
from mephisto.generators.form_composer.config_validation.task_data_config import (
    find_dynamic_fieldsets_for_section,
)
from mephisto.generators.form_composer.config_validation.task_data_config import (
    extrapolate_dynamic_fieldset,
)
from mephisto.generators.generators_utils.config_validation.task_data_config import (
    create_extrapolated_config,
)
from mephisto.generators.generators_utils.config_validation.utils import read_config_file
from mephisto.operations.operator import Operator
from mephisto.tools.building_react_apps import examples
from mephisto.tools.building_react_apps.examples import (
    REMOTE_PROCEDURE_INTERACTIVE_IMAGE_GENERATION_EXAMPLE_PATH,
)
from mephisto.tools.scripts import task_script
from mephisto.utils.logger_core import get_logger

# --- Constants ---
SCORE_MAX = 10
SCORE_MIDDLE = 5

IMAGE_REQUEST_DELAYS = [0, 1, 2, 3]
IMAGE_URLS = {
    "bears": [
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/"
            "Kodiak_Brown_Bear.jpg/640px-Kodiak_Brown_Bear.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/"
            "Kamchatka_Brown_Bear_near_Dvuhyurtochnoe_on_2015-07-23.jpg/"
            "640px-Kamchatka_Brown_Bear_near_Dvuhyurtochnoe_on_2015-07-23.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/"
            "Closeup_kodiak_bear_hamburg.JPG/640px-Closeup_kodiak_bear_hamburg.JPG"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/"
            "Ours_brun_parcanimalierpyrenees_1.jpg/640px-Ours_brun_parcanimalierpyrenees_1.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/"
            "Brown_bear_%28Ursus_arctos_arctos%29_running.jpg/"
            "640px-Brown_bear_%28Ursus_arctos_arctos%29_running.jpg"
        ),
    ],
    "foxes": [
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/"
            "Vulpes_vulpes_laying_in_snow.jpg/640px-Vulpes_vulpes_laying_in_snow.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/"
            "Alaska_Red_Fox_%28Vulpes_vulpes%29.jpg/640px-Alaska_Red_Fox_%28Vulpes_vulpes%29.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/"
            "Renard_roux_Ichkeul.jpg/640px-Renard_roux_Ichkeul.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/"
            "Vulpes_vulpes_ssp_fulvus.jpg/640px-Vulpes_vulpes_ssp_fulvus.jpg"
        ),
        (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/"
            "Rød_ræv_%28Vulpes_vulpes%29.jpg/640px-Rød_ræv_%28Vulpes_vulpes%29.jpg"
        ),
    ],
}

# --- Logger ---
logger = get_logger(name=__name__)


# --- Types ----
class NextFieldsetRequestArgsType(TypedDict):
    fieldset_lookup_name: Union[str, None]
    prompt: str
    score: int
    section_name: str


class FieldsetType(TypedDict):
    prompt: str
    score: int


class UnitDataType(TypedDict):
    current_answer_index: int
    fieldset_history: List[FieldsetType]


class UnitSafeCacheService(dict):
    """Simple Unit-safe Cache service"""

    DEFAULT_UNIT_VALUE: UnitDataType = dict(
        current_answer_index=0,
        fieldset_history=[],
    )

    def __init__(self, *args, **kwargs):
        self.__data: Dict[str, UnitDataType] = {}
        super().__init__(*args, **kwargs)

    def __getitem__(self, unit_id: str) -> UnitDataType:
        if unit_id not in self.__data:
            self.__data[unit_id] = self.DEFAULT_UNIT_VALUE
        return self.__data[unit_id]

    def append_fieldset_data(self, unit_id: str, fieldset: FieldsetType):
        prev_value = self[unit_id].get("fieldset_history", [])
        prev_value.append(fieldset)
        self.__data[unit_id]["fieldset_history"] = prev_value

    def update_current_answer_index(self, unit_id: str):
        self[unit_id]["current_answer_index"] += 1


unit_safe_cache_service = UnitSafeCacheService()


def _request_image_url(agent_data: dict, index: int, prompt: str) -> str:
    """Simulate retrival of generated image using provided prompt"""
    target_image: str = (
        agent_data.get("task_data", {})
        .get("form_metadata", {})
        .get("tokens_values", {})
        .get("target_image", "")
    )
    images = []
    if "bear" in target_image.lower():
        images = IMAGE_URLS["bears"]
    elif "fox" in target_image.lower():
        images = IMAGE_URLS["foxes"]

    # Here you can call external API like ChatGPT, OpenAI, etc
    delay = random.choice(IMAGE_REQUEST_DELAYS)
    sleep(delay)  # Some delay to make it more realistic
    image_url = images[index]
    logger.debug(f"Received image: {image_url}. Request time: {delay}")
    return image_url


def _get_next_fieldset(
    request_id: str,
    args: NextFieldsetRequestArgsType,
    agent_state: RemoteProcedureAgentState,
) -> dict:
    """Main remote procedure to request next fieldset"""
    logger.debug(
        f"Request '{request_id}' for next dynamic fieldset. "
        f"Args: {args}. "
        f"AgentState: {agent_state}"
    )

    # 1. Update current answer iundex in cache
    unit_id = agent_state.agent.unit_id
    unit_safe_cache_service.update_current_answer_index(unit_id)

    # 2. Get arguments from the client
    fieldset_lookup_name = args["fieldset_lookup_name"]
    prompt = args.get("prompt", "").strip()
    score = args.get("score")
    section_name = args["section_name"]

    # 3. Validate prompt. It can be same as all previous versions
    prev_prompts = [fh["prompt"] for fh in unit_safe_cache_service[unit_id]["fieldset_history"]]
    if prompt in prev_prompts:
        logger.error("Worker used same prompt as before")
        return {
            "validation_errors": {
                "prompt": [
                    "Same prompt cannot be used twice.",
                ],
            },
        }

    # 4. Add current `score` and `prompt` into cache
    unit_safe_cache_service.append_fieldset_data(
        unit_id,
        fieldset={
            "prompt": prompt,
            "score": score,
        },
    )

    # 5. Get `max_answer_loops` from TaskRun args
    agent_data = agent_state.get_init_state()
    task_run_args = agent_state.agent.get_task_run().args
    try:
        max_answer_loops = task_run_args.task.aux_parameters.max_answer_loops
    except ConfigAttributeError:
        max_answer_loops = None

    # 6. Get current answer index
    current_answer_index = unit_safe_cache_service[unit_id]["current_answer_index"]

    # 7. Check if task is finished
    score_is_max = score == SCORE_MAX
    reached_max_answer_loops = max_answer_loops and (current_answer_index > max_answer_loops)
    if (
        # Worker already scored an image as perfect
        score_is_max
        or
        # Check if we have reached the maximum of answer loop
        reached_max_answer_loops
    ):
        submit_message = None
        if score_is_max:
            submit_message = "Thank you for guiding the algorithm to perfection."
        elif reached_max_answer_loops:
            submit_message = "You have reached the limit of allowed attempts."

        return {
            "current_answer_index": None,
            "fieldset_config": None,
            "finished": True,
            "submit_message": submit_message,
        }

    # 8. Find next fieldset config
    dynamic_fieldsets = find_dynamic_fieldsets_for_section(
        config_data=agent_data.get("task_data", {}),
        section_name=section_name,
    )

    next_fieldset_name = "low_score_loop"
    if score < SCORE_MIDDLE:
        next_fieldset_name = "low_score_loop"
    elif score >= SCORE_MIDDLE:
        next_fieldset_name = "high_score_loop"

    next_fieldset_config = deepcopy(
        {f["lookup_name"]: f for f in dynamic_fieldsets}[next_fieldset_name]
    )

    # 9. Reaquest an image from third-party service
    try:
        image_url = _request_image_url(
            agent_data=agent_data,
            index=current_answer_index - 1,
            prompt=prompt,
        )
    except Exception as e:
        logger.exception("Unexpected error requesting an image")
        return {
            "errors": [
                "Could not retrieve an image.",
            ],
        }

    # 10. Extrapolate token values in fieldset config with retrieved image
    tokens_values = {
        "image_url": image_url,
    }
    # Set previous value into next `prompt` field
    prompt_fieldname = "prompt_1" if next_fieldset_name == "low_score_loop" else "prompt_2"
    fields_values = {
        prompt_fieldname: prompt,
    }
    next_fieldset_config = extrapolate_dynamic_fieldset(
        fieldset_config=next_fieldset_config,
        tokens_values=tokens_values,
        index=current_answer_index,
        fields_values=fields_values,
    )

    # 11. Return response
    return {
        "current_answer_index": current_answer_index,
        "fieldset_config": next_fieldset_config,
        "finished": False,
    }


def _generate_data_json_config():
    """
    Generate extrapolated `task_data.json` config file,
    based on existing form and tokens values config files
    """
    data_path = os.path.join(
        REMOTE_PROCEDURE_INTERACTIVE_IMAGE_GENERATION_EXAMPLE_PATH,
        FORM_COMPOSER__DATA_DIR_NAME,
    )

    unit_config_path = os.path.join(
        data_path,
        FORM_COMPOSER__UNIT_CONFIG_NAME,
    )
    token_sets_values_config_path = os.path.join(
        data_path,
        FORM_COMPOSER__TOKEN_SETS_VALUES_CONFIG_NAME,
    )
    task_data_config_path = os.path.join(
        data_path,
        FORM_COMPOSER__DATA_CONFIG_NAME,
    )

    set_form_composer_env_vars()

    create_extrapolated_config(
        unit_config_path=unit_config_path,
        token_sets_values_config_path=token_sets_values_config_path,
        task_data_config_path=task_data_config_path,
        data_path=data_path,
    )

    # Shuffle images (just to make it more realistic)
    for links in IMAGE_URLS.values():
        random.shuffle(links)


@task_script(default_config_file="example__local__inhouse")
def main(operator: Operator, cfg: DictConfig) -> None:
    js_name_function_mapping = {
        "getNextFieldset": _get_next_fieldset,
    }

    examples.build_remote_procedure_interactive_image_generation(
        force_rebuild=cfg.mephisto.task.force_rebuild,
        post_install_script=cfg.mephisto.task.post_install_script,
    )

    # Configure shared state
    task_data_config_path = os.path.join(
        REMOTE_PROCEDURE_INTERACTIVE_IMAGE_GENERATION_EXAMPLE_PATH,
        FORM_COMPOSER__DATA_DIR_NAME,
        "task_data.json",
    )
    task_data = read_config_file(task_data_config_path)
    shared_state = SharedRemoteProcedureTaskState(
        static_task_data=task_data,
        function_registry=js_name_function_mapping,
    )

    operator.launch_task_run(cfg.mephisto, shared_state)
    operator.wait_for_runs_then_shutdown(skip_input=True, log_rate=30)


if __name__ == "__main__":
    _generate_data_json_config()
    main()
