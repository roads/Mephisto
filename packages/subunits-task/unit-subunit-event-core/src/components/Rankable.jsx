import React from "react";
import { useContext } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FlipMove from "react-flip-move";

import useRankable from "./useRankable.jsx";
import { ComponentRegistryContext } from "./ComponentRegistryContext.jsx";

export default function Rankable({
  className,
  items,
  nSelect = 1,
  moveReferences = False,
  onEvents,
  xs = 1,
  md = 1,
  lg = 1,
}) {
  const componentRegistry = useContext(ComponentRegistryContext);
  const { itemState, itemOrder, handleReferenceClick } = useRankable(
    items,
    nSelect,
    moveReferences,
    onEvents
  );

  function sortWithIndices(toSort) {
    for (var i = 0; i < toSort.length; i++) {
      toSort[i] = [toSort[i], i];
    }
    toSort.sort(function (left, right) {
      return left[0] < right[0] ? -1 : 1;
    });
    toSort.sortIndices = [];
    for (var j = 0; j < toSort.length; j++) {
      toSort.sortIndices.push(toSort[j][1]);
      toSort[j] = toSort[j][0];
    }
    return toSort;
  }

  // Determine reorder indices based on item order.
  sortWithIndices(itemOrder);
  const reorderedItems = itemOrder.sortIndices.map((i) => items[i]);

  const itemList = reorderedItems.map((item) => {
    const VariableRankItem = componentRegistry[item.kind];
    if (item.role === "query")
      return (
        <Col key={item.item_index}>
          <VariableRankItem itemInput={item} />
        </Col>
      );
    else
      return (
        <Col key={item.item_index}>
          <VariableRankItem
            itemInput={item}
            referenceState={itemState[item.item_index]}
            onClick={() => handleReferenceClick(item.item_index)}
          />
        </Col>
      );
  });

  return (
    <Row className={`${className}`} xs={xs} md={md} lg={lg}>
      <FlipMove typeName={null}>{itemList}</FlipMove>
    </Row>
  );
}
