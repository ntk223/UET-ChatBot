const admissionRepository = require("../../repositories/admission.repository");
function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "") // Thêm A-Z ở đây để không bị xóa chữ in hoa
    .replace(/\s+/g, " ")
    .trim();
}

class AdmissionDataService {
  async resolveMajor(majorCode) {
    if (!majorCode) {
      return null;
    }
    return admissionRepository.findMajorByCode(normalizeText(majorCode));
  }

  async resolveMethod(methodValue) {
    if (!methodValue) {
      return null;
    }
    return admissionRepository.findAdmissionMethodByName(normalizeText(methodValue));
  }

  async getScoreInfo({ majorCode, methodValue }) {
    const major = await this.resolveMajor(majorCode);
    const method = await this.resolveMethod(methodValue);
    const scoreInfo = await admissionRepository.findLatestAdmissionScore(
      major.id,
      method.id
    );

    return scoreInfo
  }

  async getTuitionInfo({ majorCode }) {
    const major = await this.resolveMajor(majorCode);

    return {
      major,
    };
  }
}

module.exports = new AdmissionDataService();
