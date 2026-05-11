const fs = require("fs");
const env = require("../../config/env");

class FlowchartParserService {
  constructor(flowchartPath = env.flowchartPath) {
    this.flowchartPath = flowchartPath;
    this.cache = null;
  }

  loadFlowchart(forceReload = false) {
    if (this.cache && !forceReload) {
      return this.cache;
    }

    const raw = fs.readFileSync(this.flowchartPath, "utf8");
    const parsed = JSON.parse(raw);
    this.validate(parsed);

    this.cache = this.normalize(parsed);
    return this.cache;
  }

  normalize(flowchart) {
    const nodes = flowchart.nodes || {};
    const startNode = flowchart.startNode || "start";
    const fallbackNode = flowchart.fallbackNode || "start";

    return {
      ...flowchart,
      nodes,
      startNode,
      fallbackNode,
    };
  }

  validate(flowchart) {
    if (!flowchart || typeof flowchart !== "object") {
      throw new Error("flowchart.json must be a valid JSON object");
    }

    if (!flowchart.nodes || typeof flowchart.nodes !== "object") {
      throw new Error("flowchart.json must include a nodes object");
    }

    if (!flowchart.nodes.start) {
      throw new Error("flowchart.json must include a start node");
    }
  }

  getNode(nodeId) {
    const flowchart = this.loadFlowchart();
    return flowchart.nodes[nodeId] || null;
  }

  getStartNodeId() {
    return this.loadFlowchart().startNode;
  }

  getFallbackNodeId() {
    return this.loadFlowchart().fallbackNode;
  }
}

module.exports = new FlowchartParserService();
