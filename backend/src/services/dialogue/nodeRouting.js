function hasSlotOverrides(incomingSlots) {
  if (!incomingSlots || typeof incomingSlots !== "object") {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(incomingSlots, "major") ||
    Object.prototype.hasOwnProperty.call(incomingSlots, "admission_method")
  );
}

function resolveNearestValidNodeId(session, flowchart, defaultNodeId) {
  const fallbackNodeId = flowchart.fallbackNode;
  const isFallbackNode =
    fallbackNodeId && fallbackNodeId !== flowchart.startNode
      ? (nodeId) => nodeId === fallbackNodeId
      : () => false;
  const isValidNode = (nodeId) =>
    nodeId && flowchart.nodes[nodeId] && !isFallbackNode(nodeId);

  if (isValidNode(session?.current_node)) {
    return session.current_node;
  }

  const history = Array.isArray(session?.conversation_history)
    ? session.conversation_history
    : [];

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const nodeId = history[i]?.current_node;
    if (isValidNode(nodeId)) {
      return nodeId;
    }
  }

  if (isValidNode(defaultNodeId)) {
    return defaultNodeId;
  }

  return flowchart.startNode;
}

function evaluateDecision(logicGate, slots) {
  if (logicGate === "action_check_suitability") {
    return slots.major && slots.admission_method ? "true" : "false";
  }

  return "false";
}

function resolveActiveNode(node, flowchart, slots) {
  let activeNode = node;
  let guard = 0;

  while (activeNode && guard < 5) {
    if (activeNode.type === "decision") {
      const decisionKey = evaluateDecision(activeNode.logic_gate, slots);
      const nextNodeId = activeNode.next_nodes?.[decisionKey];

      if (!nextNodeId || !flowchart.nodes[nextNodeId]) {
        break;
      }

      activeNode = flowchart.nodes[nextNodeId];
      guard += 1;
      continue;
    }

    if (activeNode.type === "selection") {
      const requiredSlots = Array.isArray(activeNode.required_slots)
        ? activeNode.required_slots
        : [];
      const missingSlots = requiredSlots.filter((slot) => !slots[slot]);

      if (missingSlots.length > 0) {
        break;
      }

      const nextNodes = activeNode.next_nodes || {};
      const nextKeys = Object.keys(nextNodes);

      if (nextKeys.length !== 1) {
        break;
      }

      const nextNodeId = nextNodes[nextKeys[0]];

      if (!nextNodeId || !flowchart.nodes[nextNodeId]) {
        break;
      }

      activeNode = flowchart.nodes[nextNodeId];
      guard += 1;
      continue;
    }

    break;
  }

  return activeNode;
}

module.exports = {
  evaluateDecision,
  hasSlotOverrides,
  resolveActiveNode,
  resolveNearestValidNodeId,
};
