const admissionDataService = require("../integrations/admissionData.service");
const utterances = require("../../templates/utterances");
const responseTemplates = require("../../templates/responseTemplates");

function resolveUtterance(node) {
  if (node.utterance && utterances[node.utterance]) {
    return utterances[node.utterance];
  }

  if (node.prompt) {
    return node.prompt;
  }

  return utterances.utter_fallback;
}

async function renderNodeResponse(node, slots) {
  const requiredSlots = Array.isArray(node.required_slots) ? node.required_slots : [];
  const missingSlots = requiredSlots.filter((slot) => !slots[slot]);

  if (missingSlots.length > 0) {
    return responseTemplates.defaultTemplate({
      text: resolveUtterance(node),
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
      fallbackText: resolveUtterance(node),
      buttons: node.buttons,
    });
  }

  if (node.id === "hoc_phi" || node.utterance === "utter_provide_tuition_info") {
    const tuitionInfo = await admissionDataService.getTuitionInfo({
      majorCode: slots.major,
    });

    return responseTemplates.tuitionResultTemplate({
      tuitionInfo,
      fallbackText: resolveUtterance(node),
      buttons: node.buttons,
    });
  }

  if (node.id === "phuong_thuc") {

  }

  return responseTemplates.defaultTemplate({
    text: resolveUtterance(node),
    buttons: node.buttons,
  });
}

module.exports = {
  renderNodeResponse,
  resolveUtterance,
};
