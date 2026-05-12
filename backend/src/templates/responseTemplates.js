function normalizeButtons(buttons) {
  if (!Array.isArray(buttons)) {
    return [];
  }

  return buttons.map((button) => ({
    title: button.title,
    payload: button.payload,
  }));
}

function scoreResultTemplate({ scoreInfo, fallbackText, buttons }) {
  
  if (!scoreInfo || !scoreInfo.major_name) {
    return {
      bot_says: "Minh chua xac dinh duoc nganh hoc. Ban hay chon lai nganh de minh tra cuu diem chuan.",
      buttons: normalizeButtons(buttons),
    };
  }

  if (!scoreInfo.score) {
    return {
      bot_says: `Hien tai minh chua co diem chuan phu hop cho nganh ${scoreInfo.major_name}.`,
      buttons: normalizeButtons(buttons),
    };
  }

  return {
    bot_says:
      `Diem chuan gan nhat cua nganh ${scoreInfo.major_name} ` +
      `(${scoreInfo.method_name}) la ${Number(scoreInfo.score).toFixed(2)} ` +
      `vao nam ${scoreInfo.year}. To hop: ${scoreInfo.subject_groups}.`,
    buttons: normalizeButtons(buttons),
  };
}

function tuitionResultTemplate({ tuitionInfo, fallbackText, buttons }) {
  if (!tuitionInfo || !tuitionInfo.major) {
    return {
      bot_says: "Minh can ten nganh hoc de tra cuu hoc phi. Ban hay chon nganh truoc nhe.",
      buttons: normalizeButtons(buttons),
    };
  }

  return {
    bot_says:
      `Hoc phi tham khao cua nganh ${tuitionInfo.major.name} la ` +
      `${Number(tuitionInfo.major.tuition_fee).toFixed(2)} trieu VND/nam.`,
    buttons: normalizeButtons(buttons),
  };
}

function defaultTemplate({ text, buttons }) {
  return {
    bot_says: text || "Minh da nhan duoc yeu cau cua ban.",
    buttons: normalizeButtons(buttons),
  };
}


module.exports = {
  scoreResultTemplate,
  tuitionResultTemplate,
  defaultTemplate,
};
