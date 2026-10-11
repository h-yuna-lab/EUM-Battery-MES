import axiosInstance from "./axiosInstance";

const dashboardApi = {
  getDashboard: () => axiosInstance.get("/api/mes/dashboard"),
};

export default dashboardApi;
