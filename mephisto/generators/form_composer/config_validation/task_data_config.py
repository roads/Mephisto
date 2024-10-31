#!/usr/bin/env python3
# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import List
from typing import Optional

from mephisto.generators.form_composer.config_validation.config_validation_constants import (
    ATTRS_WITH_UNIQUE_NAMES,
)
from mephisto.generators.generators_utils.config_validation.task_data_config import (
    set_tokens_in_unit_config_item,
)
from mephisto.generators.generators_utils.config_validation.task_data_config import (
    verify_generator_configs,
)
from mephisto.generators.generators_utils.constants import DYNAMIC_TOKEN_END_REGEX
from mephisto.generators.generators_utils.constants import DYNAMIC_TOKEN_START_REGEX


def verify_form_composer_configs(
    task_data_config_path: str,
    unit_config_path: Optional[str] = None,
    token_sets_values_config_path: Optional[str] = None,
    separate_token_values_config_path: Optional[str] = None,
    task_data_config_only: bool = False,
    data_path: Optional[str] = None,
    force_exit: bool = False,
):
    verify_generator_configs(
        task_data_config_path=task_data_config_path,
        unit_config_path=unit_config_path,
        token_sets_values_config_path=token_sets_values_config_path,
        separate_token_values_config_path=separate_token_values_config_path,
        task_data_config_only=task_data_config_only,
        data_path=data_path,
        force_exit=force_exit,
        error_message="\n[red]Provided Form Composer config files are invalid:[/red] {exc}\n",
    )


def collect_unit_config_items_to_extrapolate(config_data: dict) -> List[dict]:
    items_to_extrapolate = []

    if not isinstance(config_data, dict):
        return items_to_extrapolate

    form = config_data["form"]
    items_to_extrapolate.append(form)

    submit_button = form["submit_button"]
    items_to_extrapolate.append(submit_button)

    sections = form["sections"]
    for section in sections:
        items_to_extrapolate.append(section)

        fieldsets = section["fieldsets"]
        for fieldset in fieldsets:
            items_to_extrapolate.append(fieldset)

            rows = fieldset["rows"]
            for row in rows:
                items_to_extrapolate.append(row)

                fields = row["fields"]
                for field in fields:
                    items_to_extrapolate.append(field)

    return items_to_extrapolate


def find_dynamic_fieldsets_for_section(config_data: dict, section_name: str) -> List[dict]:
    """
    Each section can contain regular as well as dynamic fieldsets.
    Here we find and return only dynamic fieldsets.
    Dynamic fieldsets are treated differently from regular ones:
    - they must have `lookup_name` attribute
    - they serve as just configs to make a proper fieldset out of them
    """
    fieldsets_for_section = []

    if not isinstance(config_data, dict):
        return fieldsets_for_section

    form = config_data["form"]

    sections = form["sections"]
    for section in sections:
        _section_name = section.get("name")
        if _section_name != section_name:
            continue

        fieldsets = section["fieldsets"]
        for fieldset in fieldsets:
            lookup_name = fieldset.get("lookup_name")
            item_is_dynamic = lookup_name
            if not item_is_dynamic:
                continue

            fieldsets_for_section.append(fieldset)

    return fieldsets_for_section


def extrapolate_dynamic_fieldset(
    fieldset_config: dict,
    tokens_values: dict,
    index: int,
    fields_values: Optional[dict] = None,
) -> dict:
    """
    Create a "normal" fieldset out of config represented by the dynamic fieldset
    """
    # Dynamic fieldsets can contain tokenized string values, like regular fieldsets.
    set_tokens_in_unit_config_item(
        item=fieldset_config,
        tokens_values=tokens_values,
        token_start_regex=DYNAMIC_TOKEN_START_REGEX,
        token_end_regex=DYNAMIC_TOKEN_END_REGEX,
    )

    # Add suffix `__<index>__`  to all unique fields of the fieldset
    # to avoid conflicts with other fieldset instances created from the same dynamic config.
    # (`__` is used to comply with HTML class naming convention, and avoid breaking JS selectors)
    rows = fieldset_config["rows"]
    for row in rows:
        fields = row["fields"]
        for field in fields:
            # Optionally, update default field value
            if fields_values is not None:
                if value := fields_values.get(field["name"]):
                    field["value"] = value

            # Append suffix to each unique attribute of the fieldset
            for unique_attr in ATTRS_WITH_UNIQUE_NAMES:
                if unique_value_from_config := field.get(unique_attr):
                    field[unique_attr] = f"{unique_value_from_config}__{index}__"

    return fieldset_config
