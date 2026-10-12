// 품질관리 관련 API 모음 (담당: 나)
// 대상: 검사이력(test-log), 불량이력(defect)
import axiosInstance from "./axiosInstance";

const qualityApi = {
  getInspections: (params) =>
    axiosInstance.get("/api/mes/quality/inspections", { params }),
  getSummary: (params) =>
    axiosInstance.get("/api/mes/quality/summary", { params }),
  getTrend: (params) =>
    axiosInstance.get("/api/mes/quality/trend", { params }),
  getDefects: (params) =>
    axiosInstance.get("/api/mes/quality/defects", { params }),
};

export default qualityApi;
