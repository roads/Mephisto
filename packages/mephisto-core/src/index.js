/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  ErrorBoundary,
  getBlockedExplanation,
  getNowUtcSec,
  getTaskConfig,
  isMobile,
  postCompleteOnboarding,
  postCompleteTask,
  postErrorLog,
  postMetadata,
  requestAgent,
} from "./utils";

export * from "./constants";
export * from "./MephistoContext";
export * from "./utils";
export * from "./live";
export * from "./RemoteTask.js";

/*
  The following global methods are to be specified in wrap_crowd_source.js
  They are sideloaded and exposed as global import during the build process:
*/
/* global
  getWorkerName, getAssignmentId, getAgentRegistration, handleSubmitToProvider
*/

const useMephistoTask = function () {
  const providerWorkerId = getWorkerName();
  const assignmentId = getAssignmentId();
  const isPreview = providerWorkerId === null || assignmentId === null;

  const [taskSubmitData, setTaskSubmitData] = React.useState({});
  const [autoSubmit, setAutoSubmit] = React.useState(false);

  const reducerFn = (state, action) => ({
    ...state,
    ...action,
  });
  const initialState = {
    agentId: null,
    assignmentId: assignmentId,
    blockedExplanation: null,
    blockedReason: null,
    initialTaskData: null,
    isOnboarding: null,
    isPreview: isPreview,
    loaded: false,
    mephistoWorkerId: null,
    previewHtml: null,
    providerType: null,
    providerWorkerId: providerWorkerId,
    taskConfig: null,
  };

  const [state, setState] = React.useReducer(reducerFn, initialState);

  const handleSubmit = React.useCallback(
    (data, _autoSubmit) => {
      if (state.isOnboarding) {
        postCompleteOnboarding(state.agentId, data).then((packet) => {
          afterAgentRegistration(packet);
        });
      } else {
        const isMultipart = data instanceof FormData;
        postCompleteTask(state.agentId, data, isMultipart, _autoSubmit);
      }
    },
    [state.agentId]
  );

  function submit() {
    // Shortcut for `handleSubmit` if `setTaskSubmitData` was used in task
    handleSubmit(taskSubmitData);
  }

  const handleMetadataSubmit = React.useCallback(
    (metadata) => {
      const isMultipart = metadata instanceof FormData;
      return new Promise(function (resolve, reject) {
        resolve(postMetadata(state.agentId, metadata, isMultipart));
      });
    },
    [state.agentId]
  );

  const handleFatalError = React.useCallback(
    (data) => {
      postErrorLog(state.agentId, data);
    },
    [state.agentId]
  );

  function handleIncomingTaskConfig(taskConfig) {
    if (taskConfig.block_mobile && isMobile()) {
      setState({ blockedReason: "no_mobile" });
    } else if (!state.isPreview) {
      requestAgent().then((data) => {
        afterAgentRegistration(data);
      });
    }
    setState({
      loaded: isPreview,
      providerType: taskConfig.provider_type,
      taskConfig: taskConfig,
    });
  }
  function afterAgentRegistration(dataPacket) {
    const workerId = dataPacket.data.worker_id;
    const agentId = dataPacket.data.agent_id;
    const isOnboarding = agentId !== null && agentId.startsWith("onboarding");

    // Update main state
    setState({ agentId: agentId, isOnboarding: isOnboarding });

    if (agentId === null) {
      setState({
        mephistoWorkerId: workerId,
        agentId: agentId,
        blockedReason: "null_agent_id",
        blockedExplanation: dataPacket.data.failure_reason,
      });
    } else {
      setState({
        mephistoWorkerId: workerId,
        mephistoAgentId: agentId,
        initialTaskData: dataPacket.data.init_task_data,
        loaded: true,
      });
    }

    // Initiate auto-submission
    if (!isOnboarding && agentId) {
      const submissionDeadlineUtc = dataPacket.data.submission_deadline_utc;
      if (submissionDeadlineUtc !== null) {
        const nowUTC = getNowUtcSec();
        const autoSubmitLeftTimeSec = Math.round(
          submissionDeadlineUtc - nowUTC
        );
        console.log(`Auto-submission in ${autoSubmitLeftTimeSec} seconds...`);
        runAutoSubmitTimer(autoSubmitLeftTimeSec);
      }
    }
  }

  function runAutoSubmitTimer(autoSubmitTimerSec) {
    setTimeout(() => setAutoSubmit(true), autoSubmitTimerSec * 1000);
  }

  React.useEffect(() => {
    getTaskConfig().then((data) => handleIncomingTaskConfig(data));
  }, []);

  React.useEffect(() => {
    if (autoSubmit) {
      console.log("Worker incomplete task is being auto-submitted");

      handleSubmit(taskSubmitData, true);
    }
  }, [autoSubmit]);

  return {
    ...state,
    isLoading: !state.loaded,
    blockedExplanation:
      state.blockedExplanation ||
      (state.blockedReason && getBlockedExplanation(state.blockedReason)),
    handleSubmit,
    handleMetadataSubmit,
    handleFatalError,
    setTaskSubmitData,
    submit,
  };
};

export { useMephistoTask, ErrorBoundary };
