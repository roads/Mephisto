import { useState, useEffect } from "react";

import formatEvent from "./utils.js";

function useRankable(items, nSelect, moveReferences, onEvents) {
  const ELIGIBLE_REFERENCE = 0;
  const INELIGIBLE_REFERENCE = -1;
  const INELIGIBLE_QUERY = -2;

  // Create initial task state detailing what was presented to the user.
  // State tracks all items: query and references.
  function determineInitialItemState(item) {
    if (item.role === "query") {
      return INELIGIBLE_QUERY;
    } else {
      return ELIGIBLE_REFERENCE;
    }
  }
  const initialItemState = items.map(determineInitialItemState);
  const [itemState, setItemState] = useState(initialItemState);

  function determineInitialItemOrder(item) {
    if (item.role === "query") {
      return item.item_index;
    } else {
      return item.item_index;
    }
  }
  const initialItemOrder = items.map(determineInitialItemOrder);
  const [itemOrder, setItemOrder] = useState(initialItemOrder);

  // Create state to track submit button eligibility.
  const [isComplete, setIsComplete] = useState(false);
  const initialEvent = formatEvent({
    kind: "Rankable.initialRender",
    agent: "browser",
    optional_data: {
      item_state: itemState,
      item_order: itemOrder,
      is_complete: isComplete,
    },
  });
  // Add browser-initiated event for initial render.
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function countSelectedReferences(itemState) {
    const isReferenceSelected = itemState.map((x) => x > 0);
    let nSelected = 0;
    for (let i = 0; i < isReferenceSelected.length; i++) {
      if (isReferenceSelected[i]) {
        nSelected += 1;
      }
    }
    return nSelected;
  }

  function determineItemOrder(itemState) {
    var remainingOrder = Math.max.apply(null, itemState);
    const itemOrder = itemState.map((s, i) => {
      if (s === INELIGIBLE_QUERY) {
        return 0;
      } else if (s > 0) {
        return s;
      } else {
        remainingOrder = remainingOrder + 1;
        return remainingOrder;
      }
    });
    return itemOrder;
  }

  function handleReferenceClick(referenceIndex) {
    // Initialize updated states to copy of old state.
    let updatedItemState = [...itemState];
    let nSelected = countSelectedReferences(updatedItemState);

    // Handle different cases.
    if (updatedItemState[referenceIndex] === ELIGIBLE_REFERENCE) {
      // Reference is eligible for selection.
      updatedItemState = updatedItemState.map((s, i) => {
        if (i === referenceIndex) {
          // Update the status of clicked reference.
          return nSelected + 1;
        } else {
          // Return unaltered status of non-clicked reference(s).
          return s;
        }
      });
    } else if (updatedItemState[referenceIndex] > 0) {
      // Reference is selected, unselect and propogate change to other
      // references.
      const selectedRank = updatedItemState[referenceIndex];
      updatedItemState = updatedItemState.map((s, i) => {
        if (i === referenceIndex) {
          // Update the status of clicked reference.
          return 0;
        } else {
          // Update status (if necessary) of non-clicked reference(s).
          if (s > selectedRank) {
            return s - 1; // Shift rank to fill removed selection.
          } else if (s === INELIGIBLE_REFERENCE) {
            return ELIGIBLE_REFERENCE;
          } else {
            return s;
          }
        }
      });
    }

    // Check remaining reference eligibility.
    nSelected = countSelectedReferences(updatedItemState);
    var newIsComplete;
    if (nSelected >= nSelect) {
      newIsComplete = true;
      setIsComplete(newIsComplete);
      updatedItemState = updatedItemState.map((s, i) => {
        if (s === ELIGIBLE_REFERENCE) {
          return INELIGIBLE_REFERENCE;
        } else {
          return s;
        }
      });
    } else {
      newIsComplete = false;
      setIsComplete(newIsComplete);
    }

    setItemState(updatedItemState);

    var updatedItemOrder;
    if (moveReferences) {
      updatedItemOrder = determineItemOrder(updatedItemState);
      setItemOrder(updatedItemOrder);
    } else {
      updatedItemOrder = itemOrder;
    }

    // Append event to history.
    const newEvent = formatEvent({
      kind: "Rankable.handleReferenceClick",
      agent: "user",
      optional_data: {
        item_state: updatedItemState,
        item_order: updatedItemOrder,
        is_complete: newIsComplete,
      },
    });
    onEvents([newEvent]);
  }

  return {
    itemState,
    itemOrder,
    handleReferenceClick,
  };
}

export default useRankable;
