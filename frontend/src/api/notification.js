import axiosInstance from "./axiosInstance";

const notificationApi = {
  getNotifications: () => axiosInstance.get("/api/mes/notifications"),
};

export default notificationApi;
