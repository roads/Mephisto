import React from "react";
import { useContext } from "react";

import MotionCol from "./MotionCol.jsx";
import useRankable from "./useRankable.jsx";
import { ComponentRegistryContext } from "./ComponentRegistryContext.jsx";

export default function Rankable({
  items,
  nSelect = 1,
  moveReferences = false,
  onEvents,
  transition = {
    type: "tween",
    duration: 0.2,
    ease: "linear",
  },
}) {
  const componentRegistry = useContext(ComponentRegistryContext);
  const { itemState, reorderedItems, handleReferenceClick } = useRankable(
    items,
    nSelect,
    moveReferences,
    onEvents
  );

  const itemList = reorderedItems.map((item) => {
    const VariableRankItem = componentRegistry[item.kind];
    if (item.role === "query")
      return (
        <MotionCol key={item.item_index} layout transition={transition}>
          <VariableRankItem itemInput={item} />
        </MotionCol>
      );
    else
      return (
        <MotionCol key={item.item_index} layout transition={transition}>
          <VariableRankItem
            itemInput={item}
            referenceState={itemState[item.item_index]}
            onClick={() => handleReferenceClick(item.item_index)}
          />
        </MotionCol>
      );
  });

  return <>{itemList}</>;
}
