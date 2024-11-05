#!/usr/bin/env python3

# Copyright (c) Meta Platforms and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import time
from typing import Any
from typing import Dict
from typing import TYPE_CHECKING
from typing import Union

from mephisto.abstractions.blueprint import TaskRunner
from mephisto.abstractions.blueprints.remote_procedure.remote_procedure_agent_state import (
    RemoteProcedureAgentState,
)
from mephisto.data_model.agent import Agent
from mephisto.data_model.agent import OnboardingAgent
from mephisto.utils import http_status
from mephisto.utils.logger_core import get_logger

if TYPE_CHECKING:
    from mephisto.abstractions.blueprints.remote_procedure.remote_procedure_blueprint import (
        SharedRemoteProcedureTaskState,
    )
    from mephisto.data_model.task_run import TaskRun
    from mephisto.data_model.unit import Unit
    from omegaconf import DictConfig


THREAD_SHORT_SLEEP = 0.3

logger = get_logger(name=__name__)


class RemoteProcedureTaskRunner(TaskRunner):
    """
    Task runner for a task with live remote queries on the local machine
    # TODO this is pretty gross, and would be better as a series of worker
    # threads that handle commands, as the functions all have direct access
    # to the full worker state.
    """

    def __init__(
        self,
        task_run: "TaskRun",
        args: "DictConfig",
        shared_state: "SharedRemoteProcedureTaskState",
    ):
        super().__init__(task_run, args, shared_state)

        # TODO load up the possible functions from the shared_state
        self.is_concurrent = False  # This task is 1 person w/ backend
        self.function_registry = shared_state.function_registry
        self.assignment_duration_in_seconds = (
            task_run.get_task_args().assignment_duration_in_seconds
        )

    def get_init_data_for_agent(self, agent: "Agent") -> Dict[str, Any]:
        """
        Return the data for an agent already assigned to a particular unit
        """
        init_state = agent.state.get_init_state()

        if init_state is not None:
            # reconnecting agent, give what we've got
            return init_state
        else:
            assignment = agent.get_unit().get_assignment()
            assignment_data = self.get_data_for_assignment(assignment)
            agent.state.set_init_state(assignment_data.shared)
            new_state = agent.state.get_init_state()

            assert new_state is not None, "Recently initialized state still None"

            return new_state

    def _agent_in_onboarding_or_live(self, agent: Union["Agent", "OnboardingAgent"]) -> bool:
        """Determine if an agent server should still be maintained"""
        return (
            agent.get_agent_id() in self.running_units
            or agent.get_agent_id() in self.running_onboardings
        )

    def _run_server_timestep_for_agent(self, agent: Union["Agent", "OnboardingAgent"]):
        """
        Both onboarding and regular tasks have access to the server for remote
        queries
        """
        live_update = agent.get_live_update()

        if live_update is not None and "request_id" in live_update:
            request_id = live_update["request_id"]
            # Execute commands that come in from the frontend
            # TODO extend scope to handle yield-style functions, and
            # move these to async tasks

            error_message = (
                f"Target function {live_update['target']} not found in registry: "
                f"{self.function_registry}"
            )
            assert (
                self.function_registry is not None
                and live_update["target"] in self.function_registry
            ), error_message

            state = agent.state

            assert isinstance(
                state,
                RemoteProcedureAgentState,
            ), "Must use an agent with RemoteProcedureAgentState"

            try:
                procedure_name = live_update["target"]
                procedure = self.function_registry[procedure_name]
                request_arguments = json.loads(live_update["args"])
                procedure_response = procedure(request_id, request_arguments, state)
            except Exception as e:
                # If remote procedure raises any uncaught exception, we should not skip it,
                # but return a comprehensive error response.
                error_message = "Unexpected error during performing remote procedure."
                logger.exception(error_message)
                procedure_response = {
                    "errors": [error_message],
                    "original_error_message": str(e),
                    "status_code": http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                }

            agent.observe(
                {
                    "handles": request_id,
                    "response": json.dumps(procedure_response),
                }
            )

        # sleep to avoid tight loop
        time.sleep(THREAD_SHORT_SLEEP)

    def run_onboarding(self, agent: "OnboardingAgent") -> None:
        """
        Running onboarding with access to remote queries
        """
        # Run the server while the task isn't submitted yet
        start_time = time.time()
        while (
            not agent.await_submit(timeout=None)
            and agent.get_agent_id() in self.running_onboardings
            and time.time() - start_time < self.assignment_duration_in_seconds
        ):
            self._run_server_timestep_for_agent(agent)

        remaining_time = self.assignment_duration_in_seconds - (time.time() - start_time)
        agent.await_submit(timeout=remaining_time)

    def cleanup_onboarding(self, agent: "OnboardingAgent") -> None:
        """Shutdown onboarding resources"""
        pass

    def run_unit(self, unit: "Unit", agent: "Agent") -> None:
        """
        Running a task with access to remote queries
        """
        start_time = time.time()
        while (
            not agent.await_submit(timeout=None)
            and unit.db_id in self.running_units
            and time.time() - start_time < self.assignment_duration_in_seconds
        ):
            self._run_server_timestep_for_agent(agent)

        remaining_time = self.assignment_duration_in_seconds - (time.time() - start_time)
        agent.await_submit(timeout=remaining_time)

    def cleanup_unit(self, unit: "Unit") -> None:
        """Handle cleanup for a specific unit"""
        pass
