import axiosInstance from "./axiosInstance";

const reportApi = {
  getLots: (params) => axiosInstance.get("/api/mes/report/lots", { params }),
  getSummary: (params) =>
    axiosInstance.get("/api/mes/report/summary", { params }),
  getDailyProduction: (params) =>
    axiosInstance.get("/api/mes/report/daily", { params }),
  getProcessProduction: (params) =>
    axiosInstance.get("/api/mes/report/process", { params }),
};

export default reportApi;
