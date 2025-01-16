import React from "react";
import { useState } from "react";

import { saveAs } from "file-saver";

function useSelfServeTask(tasks) {
  const [isLanding, setIsLanding] = useState(true);
  const [workerId, setWorkerId] = useState("guest");
  const [taskIndex, setTaskIndex] = useState(0);

  const taskData = tasks[taskIndex];
  const unitInput = taskData.unit;
  var downloadOutput = unitInput.data.download_output;
  if (downloadOutput == undefined) {
    downloadOutput = true;
  }

  const optionList = tasks.map((task, index) => {
    const optionLabel = "Proto-Unit " + index;
    const optionValue = "" + index;
    return (
      <option key={index} value={optionValue}>
        {optionLabel}
      </option>
    );
  });

  function handleLandingSubmit(formData) {
    if (formData.username == "") {
      formData.username = "guest";
    }
    setWorkerId(formData.username);
    setTaskIndex(parseInt(formData.protoUnitId));
    setIsLanding(false);
  }

  function handleTaskSubmit(wrappedUnitOutput) {
    if (downloadOutput) {
      console.log("Submitted.");
      const date = new Date();
      const filename = "unit_" + workerId + "-" + date.toISOString() + ".json";
      const taskOutput = {
        worker_id: workerId,
        unit_id: date.toISOString(),
        assignment_id: "self-serve-task",
        data: {
          inputs: { unit: unitInput },
          outputs: { unit: wrappedUnitOutput.unit },
        },
      };
      var blob = new Blob([JSON.stringify(taskOutput)], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, filename);
    }
  }

  return {
    isLanding,
    optionList,
    taskData,
    handleLandingSubmit,
    handleTaskSubmit,
  };
}

export default useSelfServeTask;
