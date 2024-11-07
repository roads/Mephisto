/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import TaskInstructionButton from "../TaskInstructionModal/TaskInstructionButton.jsx";
import "./FormHeaderBlock.css";

function FormHeaderBlock({
  instruction,
  instructionModalOpen,
  setInstructionModalOpen,
  showInstructionAsModal,
  title,
}) {
  return (
    <>
      {(title || instruction) && (
        <div
          className={`
            form-header
            alert
            alert-primary
            ${showInstructionAsModal ? "mt-5 mt-sm-5 mt-lg-0" : ""}
          `}
          role={"alert"}
        >
          {title && (
            <h2
              className={`form-name`}
              dangerouslySetInnerHTML={{ __html: title }}
            ></h2>
          )}

          {/* Show instruction or button that opens a modal with instructions */}
          {showInstructionAsModal ? (
            <>
              {/* Instructions */}
              {title && instruction && <hr />}

              {instruction && (
                <div>
                  For instructions, click "Task Instruction" button in the
                  top-right corner.
                </div>
              )}

              {/* Button (modal in the end of the component) */}
              <TaskInstructionButton
                onClick={() => setInstructionModalOpen(!instructionModalOpen)}
              />
            </>
          ) : (
            <>
              {/* Instructions */}
              {title && instruction && <hr />}

              {instruction && (
                <p
                  className={`form-instruction`}
                  dangerouslySetInnerHTML={{ __html: instruction }}
                ></p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export { FormHeaderBlock };
