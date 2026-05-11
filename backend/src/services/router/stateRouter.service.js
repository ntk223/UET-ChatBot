class StateRouterService {
  resolveNextNode({ flowchart, currentNodeId, intent, payload }) {
    // console.log(flowchart, currentNodeId, intent, payload);
    const currentNode = flowchart.nodes[currentNodeId] || flowchart.nodes.start;
    const currentTransitions = currentNode.next_nodes || {};

    // console.log(currentNode,"||", currentTransitions);

    if (payload && currentTransitions[payload]) {
      return {
        nextNodeId: currentTransitions[payload],
        reason: "matched_payload",
      };
    }

    if (intent && currentTransitions[intent]) {
      return {
        nextNodeId: currentTransitions[intent],
        reason: "matched_intent",
      };
    }

    if (currentNodeId !== flowchart.startNode) {
      const startNode = flowchart.nodes[flowchart.startNode] || flowchart.nodes.start;
      const startTransitions = startNode.next_nodes || {};

      if (payload && startTransitions[payload]) {
        return {
          nextNodeId: startTransitions[payload],
          reason: "matched_payload_from_start",
        };
      }

      if (intent && startTransitions[intent]) {
        return {
          nextNodeId: startTransitions[intent],
          reason: "matched_intent_from_start",
        };
      }
    }

    return {
      nextNodeId: flowchart.fallbackNode,
      reason: "fallback",
    };
  }
}

module.exports = new StateRouterService();
