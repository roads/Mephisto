/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import InitialParametersCollapsable from "components/InitialParametersCollapsable/InitialParametersCollapsable";
import { InReviewFileModal } from "components/InReviewFileModal/InReviewFileModal";
import Preloader from "components/Preloader/Preloader";
import ResultsCollapsable from "components/ResultsCollapsable/ResultsCollapsable";
import VideoAnnotatorWebVTTCollapsable from "components/VideoAnnotatorWebVTTCollapsable/VideoAnnotatorWebVTTCollapsable";
import WorkerOpinionCollapsable from "components/WorkerOpinionCollapsable/WorkerOpinionCollapsable";
import {
  AUTO_SUBMIT_MARK_KEY,
  MESSAGES_IFRAME_DATA_KEY,
  MESSAGES_IN_REVIEW_FILE_DATA_KEY,
  ReviewType,
} from "consts/review";
import { setPageTitle, setResponseErrors, updateModalState } from "helpers";
import cloneDeep from "lodash/cloneDeep";
import * as React from "react";
import { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { postQualificationRevokeWorker } from "requests/qualifications";
import { getStats } from "requests/stats";
import { getTask, getTaskWorkerUnitsIds } from "requests/tasks";
import {
  getUnits,
  getUnitsDetails,
  postUnitsApprove,
  postUnitsReject,
  postUnitsSoftReject,
} from "requests/units";
import { postWorkerBlock, postWorkerGrant } from "requests/workers";
import urls from "urls";
import {
  APPROVE_MODAL_DATA_STATE,
  DEFAULT_MODAL_STATE_VALUE,
  REJECT_MODAL_DATA_STATE,
  SOFT_REJECT_MODAL_DATA_STATE,
} from "./modalData";
import ReviewModal from "./ReviewModal/ReviewModal";
import TaskHeader from "./TaskHeader/TaskHeader";
import "./TaskPage.css";

const defaultStats = {
  total_count: null,
  reviewed_count: 0,
  approved_count: 0,
  rejected_count: 0,
  soft_rejected_count: 0,
};

type UnitDetailsMapType = { [key: string]: UnitType & UnitDetailsType };

type ParamsType = {
  id: string;
};

interface TaskPagePropsType {
  setErrors: Function;
}

function TaskPage(props: TaskPagePropsType) {
  const params = useParams<ParamsType>();
  const navigate = useNavigate();

  const iframeRef = React.useRef(null);

  const [iframeLoaded, setIframeLoaded] = React.useState<boolean>(false);
  const [iframeHeight, setIframeHeight] = React.useState<number>(100);
  const [task, setTask] = React.useState<TaskType>(null);
  const [units, setUnits] = React.useState<Array<UnitType>>(null);
  const [loading, setLoading] = React.useState(false);

  const [modalShow, setModalShow] = React.useState<boolean>(false);
  const [modalData, setModalData] = React.useState<ModalDataType>(
    cloneDeep(APPROVE_MODAL_DATA_STATE)
  );

  const [modalState, setModalState] = React.useState<ModalStateType>(
    cloneDeep(DEFAULT_MODAL_STATE_VALUE)
  );

  const [taskStats, setTaskStats] = React.useState<TaskStatsType>(defaultStats);
  const [workerStats, setWorkerStats] = React.useState<WorkerStatsType>(
    defaultStats
  );
  const [workerUnits, setWorkerUnits] = React.useState<
    Array<[string, string[]]>
  >(null);
  const [unitsOnReview, setUnitsOnReview] = React.useState<[string, string[]]>(
    null
  );
  const [currentWorkerOnReview, setCurrentWorkerOnReview] = React.useState<
    string
  >(null);
  const [currentUnitOnReview, setCurrentUnitOnReview] = React.useState<string>(
    null
  );
  const [unitDetails, setUnitDetails] = React.useState<UnitDetailsType[]>(null);
  const [unitDetailsMap, setUnitDetailsMap] = React.useState<
    UnitDetailsMapType
  >({});

  const [finishedTask, setFinishedTask] = React.useState<boolean>(false);

  const currentUnitDetails = unitDetailsMap[String(currentUnitOnReview)];

  const [unitInputsIsJSON, setUnitInputsIsJSON] = React.useState<boolean>(
    false
  );
  const [unitResultsIsJSON, setUnitResultsIsJSON] = React.useState<boolean>(
    false
  );

  // Allow `null` state so that non-null values persist between task units
  const [inputsVisibility, setInputsVisibility] = React.useState<boolean>(null);
  const [resultsVisibility, setResultsVisibility] = React.useState<boolean>(
    null
  );
  const [inReviewFileModalShow, setInReviewFileModalShow] = React.useState<
    boolean
  >(false);
  const [inReviewFileModalData, setInReviewFileModalData] = React.useState<
    InReviewFileModalDataType
  >({});

  const taskIsAutoSubmitted: boolean = [true, "true"].includes(
    (currentUnitDetails?.outputs || {})[AUTO_SUBMIT_MARK_KEY]
  );

  const onError = (response: ErrorResponseType) =>
    setResponseErrors(props.setErrors, response);

  function getUnitDataFolder(): string {
    const unitDataFolderStartIndex = currentUnitDetails.unit_data_folder.indexOf(
      "data/data"
    );
    const unitDataFolder = currentUnitDetails.unit_data_folder.slice(
      unitDataFolderStartIndex
    );

    return unitDataFolder;
  }

  window.onmessage = function (e) {
    if (
      e.data &&
      e.type === "message" && // Waiting for `message` type only
      !e.data?.type // Exclude all unexpected messages from iframe
    ) {
      const data = JSON.parse(e.data);

      // Resize iframe message
      if (data.hasOwnProperty(MESSAGES_IFRAME_DATA_KEY)) {
        setIframeHeight(data[MESSAGES_IFRAME_DATA_KEY]["height"]);
      }
      // Open file field modal message
      else if (data.hasOwnProperty(MESSAGES_IN_REVIEW_FILE_DATA_KEY)) {
        const fieldname = data[MESSAGES_IN_REVIEW_FILE_DATA_KEY].fieldname;
        const filename = data[MESSAGES_IN_REVIEW_FILE_DATA_KEY].filename;
        const unitDataFolder = getUnitDataFolder();

        setInReviewFileModalData({
          fieldname: fieldname,
          filename: filename,
          title: filename,
          unitDataFolder: unitDataFolder,
          unitId: currentUnitOnReview,
        });
        setInReviewFileModalShow(true);
      }
    }
  };

  function onClickOnWorkerOpinionAttachment(file: WorkerOpinionAttachmentType) {
    const unitDataFolder = getUnitDataFolder();
    setInReviewFileModalData({
      fieldname: file.fieldname,
      filename: file.filename,
      requestByFilename: true,
      title: file.filename,
      unitDataFolder: unitDataFolder,
      unitId: currentUnitOnReview,
    });
    setInReviewFileModalShow(true);
  }

  function onGetTaskWorkerUnitsIdsSuccess(workerUnitsIds: WorkerUnitIdType[]) {
    setWorkerUnits(() => {
      const workerUnitsMap = {};

      workerUnitsIds.forEach((item: WorkerUnitIdType) => {
        let prevValue = workerUnitsMap[item.worker_id] || [];
        prevValue.push(item.unit_id);
        workerUnitsMap[item.worker_id] = prevValue;
      });

      let sortedValue = [];
      for (let i in workerUnitsMap) {
        sortedValue.push([i, workerUnitsMap[i]]);
      }

      // Sort workers by number of their units (the fewest number of units goes first)
      sortedValue.sort((a: [number, number[]], b: [number, number[]]) => {
        return a[1].length > b[1].length ? 1 : -1;
      });

      return sortedValue;
    });
  }

  function onApproveClick() {
    const initData = cloneDeep(APPROVE_MODAL_DATA_STATE);

    initData.applyToNext = false;
    initData.form = modalState.approve.form;
    initData.applyToNextUnitsCount = unitsOnReview[1].length;

    setModalShow(true);
    setModalData(initData);
  }

  function onSoftRejectClick() {
    const initData = cloneDeep(SOFT_REJECT_MODAL_DATA_STATE);

    initData.applyToNext = false;
    initData.form = modalState.softReject.form;
    initData.applyToNextUnitsCount = unitsOnReview[1].length;

    setModalShow(true);
    setModalData(initData);
  }

  function onRejectClick() {
    const initData = cloneDeep(REJECT_MODAL_DATA_STATE);

    initData.applyToNext = false;
    initData.form = modalState.reject.form;
    initData.applyToNextUnitsCount = unitsOnReview[1].length;

    setModalShow(true);
    setModalData(initData);
  }

  function setNextUnit() {
    let firstWrokerUnits = workerUnits[0];

    // If no Workers left (in case we review multiple Units)
    if (!firstWrokerUnits) {
      setFinishedTask(true);
      return;
    }

    if (firstWrokerUnits[1].length === 0) {
      workerUnits.shift();

      // If no Worker Units left (in case we review Units one by one)
      if (workerUnits.length === 0) {
        setFinishedTask(true);
        return;
      }
      firstWrokerUnits = workerUnits[0];
    }

    setUnitsOnReview([firstWrokerUnits[0], [...firstWrokerUnits[1]]]);
    setCurrentWorkerOnReview(firstWrokerUnits[0]);
    setModalData({
      ...modalData,
      applyToNextUnitsCount: [...firstWrokerUnits[1]].length,
    });

    const firstUnit = firstWrokerUnits[1].shift();
    setCurrentUnitOnReview(firstUnit);
  }

  function onReviewSuccess(_modalData: ModalDataType, unitIds: string[]) {
    if (_modalData.type === ReviewType.APPROVE) {
      // Grant Qualification
      if (
        _modalData.form.checkboxAssignQualification &&
        _modalData.form.selectedQualifications?.length > 0
      ) {
        postWorkerGrant(
          currentWorkerOnReview,
          () => null,
          setLoading,
          onError,
          {
            unit_ids: unitIds,
            qualification_grants: _modalData.form.selectedQualifications,
          }
        );
      }
    } else if (_modalData.type === ReviewType.SOFT_REJECT) {
      // Revoke Qualification
      if (
        _modalData.form.checkboxAssignQualification &&
        _modalData.form.selectQualification
      ) {
        postWorkerGrant(
          currentWorkerOnReview,
          () => null,
          setLoading,
          onError,
          {
            unit_ids: unitIds,
            qualification_grants: _modalData.form.selectedQualifications,
          }
        );
      }
    } else if (_modalData.type === ReviewType.REJECT) {
      // Revoke Qualification
      if (
        _modalData.form.checkboxUnassignQualification &&
        _modalData.form.selectQualification
      ) {
        postQualificationRevokeWorker(
          _modalData.form.selectQualification,
          currentWorkerOnReview,
          () => null,
          setLoading,
          onError,
          {
            unit_ids: unitIds,
          }
        );
      }
      // Block Worker
      if (_modalData.form.checkboxBanWorker) {
        postWorkerBlock(
          currentWorkerOnReview,
          () => null,
          setLoading,
          onError,
          {
            review_note: _modalData.form.checkboxReviewNote
              ? _modalData.form.reviewNote
              : null,
            unit_ids: unitIds,
          }
        );
      }
    }

    // Try to get next Unit
    setNextUnit();
  }

  function getUnitsIdsByApplyToNext(applyToNext: boolean): string[] {
    let unitIds = [currentUnitOnReview];

    if (applyToNext) {
      unitIds = [...unitIds, ...workerUnits.shift()[1]];
    }

    return unitIds;
  }

  function onModalSubmit() {
    props.setErrors([]);

    let hasErrors = false;

    const unitIds = getUnitsIdsByApplyToNext(modalData.applyToNext);

    if (modalData.type === ReviewType.APPROVE) {
      postUnitsApprove(
        () => onReviewSuccess(modalData, unitIds),
        setLoading,
        onError,
        {
          bonus: modalData.form.checkboxGiveBonus ? modalData.form.bonus : null,
          review_note: modalData.form.checkboxReviewNote
            ? modalData.form.reviewNote
            : null,
          send_to_worker: modalData.form.checkboxReviewNoteSend,
          unit_ids: unitIds,
        }
      );
    } else if (modalData.type === ReviewType.SOFT_REJECT) {
      postUnitsSoftReject(
        () => onReviewSuccess(modalData, unitIds),
        setLoading,
        onError,
        {
          review_note: modalData.form.checkboxReviewNote
            ? modalData.form.reviewNote
            : null,
          send_to_worker: modalData.form.checkboxReviewNoteSend,
          unit_ids: unitIds,
        }
      );
    } else if (modalData.type === ReviewType.REJECT) {
      if (modalData.form.checkboxBanWorker && !modalData.form.reviewNote) {
        hasErrors = true;
        props.setErrors(["'Write Note' is required if you ban Worker"]);
      }

      if (!hasErrors) {
        postUnitsReject(
          () => onReviewSuccess(modalData, unitIds),
          setLoading,
          onError,
          {
            review_note: modalData.form.checkboxReviewNote
              ? modalData.form.reviewNote
              : null,
            send_to_worker: modalData.form.checkboxReviewNoteSend,
            unit_ids: unitIds,
          }
        );
      }
    }

    if (!hasErrors) {
      // Close modal
      setModalShow(false);

      // Save current state of the modal data
      updateModalState(setModalState, modalData.type, modalData);
      setIframeLoaded(false);
    }
  }

  // [RECEIVING WIDGET DATA]
  // ---
  function sendDataToUnitIframe(data: object) {
    const reviewData = {
      REVIEW_DATA: {
        inputs: data["prepared_inputs"],
        outputs: data["outputs"],
      },
    };
    const unitIframe = iframeRef.current;
    unitIframe.contentWindow.postMessage(JSON.stringify(reviewData), "*");
  }
  // ---

  // Effects
  useEffect(() => {
    // Set default title
    setPageTitle("Mephisto - Task Review - Current Task");
    setFinishedTask(false);

    if (task === null) {
      getTask(params.id, setTask, setLoading, onError, null);
    }

    if (units === null) {
      getTaskWorkerUnitsIds(
        params.id,
        onGetTaskWorkerUnitsIdsSuccess,
        setLoading,
        onError
      );
    }
  }, []);

  useEffect(() => {
    if (task) {
      // Update title with current task
      setPageTitle(`Mephisto - Task Review - ${task.name}`);
    }
  }, [task]);

  useEffect(() => {
    if (workerUnits && Object.keys(workerUnits).length) {
      setNextUnit();
    }

    // Redirect back to the tasks page if there's no units to review
    if (workerUnits && Object.keys(workerUnits).length === 0) {
      navigate(urls.client.tasks);
    }
  }, [workerUnits]);

  useEffect(() => {
    if (unitsOnReview && unitsOnReview[1].length) {
      getUnits(setUnits, setLoading, onError, {
        task_id: params.id,
        unit_ids: unitsOnReview[1].join(","),
        completed: "true",
      });
    }
  }, [unitsOnReview]);

  useEffect(() => {
    if (units && currentUnitOnReview) {
      setUnitDetailsMap(() => {
        const map = {};
        units.forEach((item: UnitType) => {
          map[item.id] = item;
        });
        return map;
      });

      getStats(setTaskStats, setLoading, onError, { task_id: params.id });
      getStats(setWorkerStats, setLoading, onError, {
        task_id: params.id,
        worker_id: currentWorkerOnReview,
      });
      getUnitsDetails(setUnitDetails, setLoading, onError, {
        unit_ids: currentUnitOnReview,
      });
    }
  }, [units, currentUnitOnReview]);

  useEffect(() => {
    if (finishedTask === true) {
      getStats(setTaskStats, setLoading, onError, { task_id: params.id });
      getStats(setWorkerStats, setLoading, onError, {
        task_id: params.id,
        worker_id: currentWorkerOnReview,
      });

      setTimeout(() => {
        navigate(urls.client.tasks);
      }, 5000);
    }
  }, [finishedTask]);

  useEffect(() => {
    if (unitDetails) {
      setUnitDetailsMap((oldValue: UnitDetailsMapType) => {
        const map = cloneDeep(oldValue);
        unitDetails.forEach((item: UnitDetailsType) => {
          const prev = map[item.id];
          map[item.id] = { ...prev, ...item };
        });
        return map;
      });
    }
  }, [unitDetails]);

  // [RECEIVING WIDGET DATA]
  // ---
  useEffect(() => {
    if (iframeLoaded && currentUnitDetails?.has_task_source_review) {
      sendDataToUnitIframe(currentUnitDetails);
    }
  }, [currentUnitDetails, iframeLoaded]);
  // ---

  useEffect(() => {
    if (currentUnitDetails) {
      const unitInputs = currentUnitDetails.inputs;
      const unitOutputs = currentUnitDetails.outputs;

      if (typeof unitInputs === "object") {
        setUnitInputsIsJSON(true);
      }

      if (typeof unitOutputs === "object") {
        setUnitResultsIsJSON(true);
      }

      // If Task expressly does not provide a preview template,
      // we just simply show JSON data for the Unit.
      // Change values only one time on loading page to save user choice
      if (currentUnitDetails.has_task_source_review === false) {
        if (inputsVisibility === null) {
          setInputsVisibility(false);
        }
        if (resultsVisibility === null) {
          setResultsVisibility(true);
        }
      }
    }
  }, [currentUnitDetails]);

  if (task === null) {
    return null;
  }

  return (
    <div className={"task"}>
      <TaskHeader
        taskStats={taskStats}
        workerStats={workerStats}
        workerId={unitsOnReview ? currentWorkerOnReview : null}
        loading={loading}
      />

      <div className={"review-board"}>
        <div className={"left-side"}>
          {!finishedTask ? (
            <div className={"review-controls"}>
              <Button
                variant={"success"}
                size={"sm"}
                onClick={!loading && onApproveClick}
                disabled={loading}
              >
                Approve
              </Button>
              <Button
                variant={"warning"}
                size={"sm"}
                onClick={!loading && onSoftRejectClick}
                disabled={loading}
              >
                Soft-Reject
              </Button>
              <Button
                variant={"danger"}
                size={"sm"}
                onClick={!loading && onRejectClick}
                disabled={loading}
              >
                Reject
              </Button>
            </div>
          ) : (
            <div>
              No unreviewed units left for this task. <br />
              Redirecting to the list of tasks.
            </div>
          )}
        </div>

        <div className={"right-side"}>
          {/* Unit info */}
          {unitDetails && currentUnitOnReview && (
            <div className={"info"}>
              {currentUnitDetails && (
                <>
                  <div className={"grey task-name"} title={task.name}>
                    Task name: {task.name}
                  </div>
                  <div className={"grey"}>
                    Worker ID: {currentUnitDetails.worker_id}
                  </div>
                  <div className={"black"}>
                    Unit ID: {currentUnitDetails.id}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={"content"}>
        {/* Preloader when we request tasks */}
        <Preloader loading={loading} />

        {taskIsAutoSubmitted && (
          <div className={"alert alert-warning"} role={"alert"}>
            <b>NOTE</b>: Worker wasn't able to complete the Task in time and it
            was auto-submitted according to the Task settings
          </div>
        )}

        {/* Initial Unit parameters */}
        {currentUnitDetails?.inputs && (
          <InitialParametersCollapsable
            data={currentUnitDetails.inputs}
            open={inputsVisibility}
            isJSON={unitInputsIsJSON}
          />
        )}

        {/* Worker Opinion about Unit */}
        {currentUnitDetails?.metadata?.worker_opinion && (
          <WorkerOpinionCollapsable
            data={currentUnitDetails?.metadata?.worker_opinion}
            onClickOnAttachment={onClickOnWorkerOpinionAttachment}
          />
        )}

        {/* Video Annotator tracks in WebVTT format */}
        {currentUnitDetails?.metadata?.webvtt && (
          <VideoAnnotatorWebVTTCollapsable
            data={currentUnitDetails?.metadata?.webvtt}
            open={false}
          />
        )}

        {currentUnitDetails?.outputs && (
          <>
            {/* Results */}
            <ResultsCollapsable
              data={currentUnitDetails.outputs}
              open={resultsVisibility}
              isJSON={unitResultsIsJSON}
            />

            {/* Completed Unit preview */}
            <div
              className={"unit-preview-container"}
              onClick={(e) => e.preventDefault()}
            >
              {currentUnitDetails.has_task_source_review && (
                <iframe
                  className={"unit-preview-iframe"}
                  src={urls.server.unitReviewHtml(currentUnitOnReview)}
                  id={"unit-preview"}
                  title={"Completed Unit preview"}
                  height={iframeHeight} // Width is always 100% to receive correctly rendered height
                  onLoad={() => setIframeLoaded(true)}
                  ref={iframeRef}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Approve, reject or soft-reject modal */}
      <ReviewModal
        show={modalShow}
        setShow={setModalShow}
        data={modalData}
        setData={setModalData}
        onSubmit={onModalSubmit}
        setErrors={props.setErrors}
        workerId={currentWorkerOnReview}
      />

      {/* Modal to show preview of file fields */}
      <InReviewFileModal
        show={inReviewFileModalShow}
        setShow={setInReviewFileModalShow}
        data={inReviewFileModalData}
        setData={setInReviewFileModalData}
      />
    </div>
  );
}

export default TaskPage;
