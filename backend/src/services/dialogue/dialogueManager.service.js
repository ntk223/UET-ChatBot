const flowchartParser = require("../flow/flowchartParser.service");
const rasaClient = require("../nlu/rasaClient.service");
const stateRouter = require("../router/stateRouter.service");
const sessionStore = require("../state/sessionStore.service");
const { entitiesToMap } = require("./entityMapper");
const { hasSlotOverrides, resolveActiveNode, resolveNearestValidNodeId } = require("./nodeRouting");
const { parsePayload } = require("./payloadParser");
const { renderNodeResponse } = require("./responseRenderer");
const { shouldResetHistory } = require("./sessionUtils");

class DialogueManagerService {
  async handleIncomingMessage({ senderId, messageText, payloadValue }) {
    const flowchart = flowchartParser.loadFlowchart();
    const initialNodeId = flowchart.startNode;
    const existingSession =
      (await sessionStore.getSession(senderId)) ||
      (await sessionStore.initSession(senderId, initialNodeId));

    const payloadContext = parsePayload(payloadValue);
    const nluResult = await rasaClient.parseMessage(messageText || "");
    const nluEntities = entitiesToMap(nluResult.entities || []);

    const incomingSlots = {
      ...nluEntities,
      ...payloadContext.entities,
    };

    const intent = payloadContext.intent || nluResult.intent?.name || null;
    const shouldReset = shouldResetHistory({
      messageText,
      payloadContext,
      intent,
    });
    const activeSession = shouldReset
      ? { ...existingSession, conversation_history: [] }
      : existingSession;

    const routeResult = stateRouter.resolveNextNode({
      flowchart,
      currentNodeId: activeSession.current_node || initialNodeId,
      intent,
      payload: payloadContext.payloadKey,
    });

    const shouldResetSlots =
      routeResult.reason === "matched_intent_from_start" ||
      routeResult.reason === "matched_payload_from_start";
    const baseSlots = shouldResetSlots ? {} : activeSession.slots_filled;
    const slots = {
      ...baseSlots,
      ...incomingSlots,
    };

    const isFallbackRoute =
      routeResult.reason === "fallback" ||
      routeResult.nextNodeId === flowchart.fallbackNode;
    const nearestValidNodeId = resolveNearestValidNodeId(
      activeSession,
      flowchart,
      initialNodeId
    );
    const shouldReuseCurrentNode = isFallbackRoute && hasSlotOverrides(incomingSlots);
    const resolvedNodeId = shouldReuseCurrentNode
      ? nearestValidNodeId
      : routeResult.nextNodeId;

    let targetNode =
      flowchart.nodes[resolvedNodeId] || flowchart.nodes[flowchart.fallbackNode];

    targetNode = resolveActiveNode(targetNode, flowchart, slots);

    const response = await renderNodeResponse(targetNode, slots);

    const sessionNodeId = isFallbackRoute ? nearestValidNodeId : targetNode.id;
    const savedSession = await sessionStore.saveSession(senderId, {
      ...activeSession,
      current_node: sessionNodeId,
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
      buttons: response.buttons,
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
}

module.exports = new DialogueManagerService();
