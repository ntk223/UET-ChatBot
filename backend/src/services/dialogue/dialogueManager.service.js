const flowchartParser = require("../flow/flowchartParser.service");
const rasaClient = require("../nlu/rasaClient.service");
const stateRouter = require("../router/stateRouter.service");
const sessionStore = require("../state/sessionStore.service");
const admissionDataService = require("../integrations/admissionData.service");
const utterances = require("../../templates/utterances");
const responseTemplates = require("../../templates/responseTemplates");

class DialogueManagerService {
  async handleIncomingMessage({ senderId, messageText, payloadValue }) {
    const flowchart = flowchartParser.loadFlowchart();
    const initialNodeId = flowchart.startNode;
    // console.log(flowchart, initialNodeId);
    const existingSession =
      (await sessionStore.getSession(senderId)) ||
      (await sessionStore.initSession(senderId, initialNodeId));

    const payloadContext = this.parsePayload(payloadValue);
    const nluResult = await rasaClient.parseMessage(messageText || "");
    const nluEntities = this.entitiesToMap(nluResult.entities || []);

    // console.log(nluResult, nluEntities);

    const intent = payloadContext.intent || nluResult.intent?.name || null;
    const slots = {
      ...existingSession.slots_filled,
      ...nluEntities,
      ...payloadContext.entities,
    };

    // console.log(slots);

    const routeResult = stateRouter.resolveNextNode({
      flowchart,
      currentNodeId: existingSession.current_node || initialNodeId,
      intent,
      payload: payloadContext.payloadKey,
    });

    let targetNode =
      flowchart.nodes[routeResult.nextNodeId] || flowchart.nodes[flowchart.fallbackNode];

    targetNode = this.resolveDecisionNode(targetNode, flowchart, slots);

    const response = await this.renderNodeResponse(targetNode, slots, flowchart);

    const savedSession = await sessionStore.saveSession(senderId, {
      ...existingSession,
      current_node: targetNode.id,
      slots_filled: slots,
    });

    await sessionStore.appendConversation(senderId, {
      sender: "USER",
      message_text: messageText || payloadValue || "",
      intent,
    });

    await sessionStore.appendConversation(senderId, {
      sender: "BOT",
      message_text: response.bot_says,
      current_node: targetNode.id,
    });

    return {
      ...response,
      metadata: {
        flowchart_id: flowchart.flowchart_id || null,
        current_node: savedSession.current_node,
        intent,
        confidence: nluResult.intent?.confidence ?? null,
        route_reason: routeResult.reason,
      },
    };
  }

  parsePayload(payloadValue) {
    if (!payloadValue || typeof payloadValue !== "string") {
      return { intent: null, entities: {}, payloadKey: null };
    }

    const payload = payloadValue.trim();

    if (!payload.startsWith("/")) {
      return { intent: null, entities: {}, payloadKey: payload };
    }

    const match = payload.match(/^\/([a-zA-Z0-9_]+)(\{.*\})?$/);

    if (!match) {
      return { intent: null, entities: {}, payloadKey: payload };
    }

    let entities = {};

    if (match[2]) {
      try {
        entities = JSON.parse(match[2]);
      } catch (error) {
        entities = {};
      }
    }

    return {
      intent: match[1],
      entities,
      payloadKey: match[1],
    };
  }

  entitiesToMap(entities) {
    return entities.reduce((acc, entity) => {
      if (!entity || !entity.entity) {
        return acc;
      }

      acc[entity.entity] = entity.value;
      return acc;
    }, {});
  }

  resolveDecisionNode(node, flowchart, slots) {
    let activeNode = node;
    let guard = 0;

    while (activeNode && activeNode.type === "decision" && guard < 3) {
      const decisionKey = this.evaluateDecision(activeNode.logic_gate, slots);
      const nextNodeId = activeNode.next_nodes?.[decisionKey];

      if (!nextNodeId || !flowchart.nodes[nextNodeId]) {
        break;
      }

      activeNode = flowchart.nodes[nextNodeId];
      guard += 1;
    }

    return activeNode;
  }

  evaluateDecision(logicGate, slots) {
    if (logicGate === "action_check_suitability") {
      return slots.major && slots.admission_method ? "true" : "false";
    }

    return "false";
  }

  resolveUtterance(node) {
    if (node.utterance && utterances[node.utterance]) {
      return utterances[node.utterance];
    }

    if (node.prompt) {
      return node.prompt;
    }

    return utterances.utter_fallback;
  }

  async renderNodeResponse(node, slots) {
    const requiredSlots = Array.isArray(node.required_slots) ? node.required_slots : [];
    const missingSlots = requiredSlots.filter((slot) => !slots[slot]);

    if (missingSlots.length > 0) {
      return responseTemplates.defaultTemplate({
        text: this.resolveUtterance(node),
        buttons: node.buttons,
      });
    }

    if (node.id === "diem_chuan" || node.utterance === "utter_provide_score_info") {
      const scoreInfo = await admissionDataService.getScoreInfo({
        majorCode: slots.major,
        methodValue: slots.admission_method,
      });
      return responseTemplates.scoreResultTemplate({
        scoreInfo,
        fallbackText: this.resolveUtterance(node),
        buttons: node.buttons,
      });
    }

    if (node.id === "hoc_phi" || node.utterance === "utter_provide_tuition_info") {
      const tuitionInfo = await admissionDataService.getTuitionInfo({
        majorCode: slots.major,
      });

      return responseTemplates.tuitionResultTemplate({
        tuitionInfo,
        fallbackText: this.resolveUtterance(node),
        buttons: node.buttons,
      });
    }

    return responseTemplates.defaultTemplate({
      text: this.resolveUtterance(node),
      buttons: node.buttons,
    });
  }
}

module.exports = new DialogueManagerService();
