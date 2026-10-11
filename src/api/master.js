// 기준정보(Master) 관련 API 모음 (담당: 현)
// 대상: process, worker, machine, bom, material(마스터), product
import axiosInstance from "./axiosInstance";

const masterApi = {
  getProducts: (params) => axiosInstance.get("/api/mes/products", { params }),
  getProduct: (id) => axiosInstance.get(`/api/mes/products/${id}`),
  createProduct: (data) => axiosInstance.post("/api/mes/products", data),
  updateProduct: (id, data) => axiosInstance.put(`/api/mes/products/${id}`, data),
  deleteProduct: (id) => axiosInstance.delete(`/api/mes/products/${id}`),

  getMaterials: (params) => axiosInstance.get("/api/mes/materials", { params }),
  getMaterial: (id) => axiosInstance.get(`/api/mes/materials/${id}`),
  createMaterial: (data) => axiosInstance.post("/api/mes/materials", data),
  updateMaterial: (id, data) => axiosInstance.put(`/api/mes/materials/${id}`, data),
  deleteMaterial: (id) => axiosInstance.delete(`/api/mes/materials/${id}`),

  getProcesses: (params) => axiosInstance.get("/api/mes/processes", { params }),
  getProcess: (id) => axiosInstance.get(`/api/mes/processes/${id}`),
  createProcess: (data) => axiosInstance.post("/api/mes/processes", data),
  updateProcess: (id, data) => axiosInstance.put(`/api/mes/processes/${id}`, data),
  deleteProcess: (id) => axiosInstance.delete(`/api/mes/processes/${id}`),

  getEquipment: (params) => axiosInstance.get("/api/mes/equipment", { params }),
  getEquipmentById: (id) => axiosInstance.get(`/api/mes/equipment/${id}`),
  createEquipment: (data) => axiosInstance.post("/api/mes/equipment", data),
  updateEquipment: (id, data) => axiosInstance.put(`/api/mes/equipment/${id}`, data),
  deleteEquipment: (id) => axiosInstance.delete(`/api/mes/equipment/${id}`),

  getWorkers: (params) => axiosInstance.get("/api/mes/workers", { params }),
  getWorker: (id) => axiosInstance.get(`/api/mes/workers/${id}`),
  createWorker: (data) => axiosInstance.post("/api/mes/workers", data),
  updateWorker: (id, data) => axiosInstance.put(`/api/mes/workers/${id}`, data),
  deleteWorker: (id) => axiosInstance.delete(`/api/mes/workers/${id}`),

  getBomItems: (productId) =>
    axiosInstance.get(`/api/mes/products/${productId}/bom-items`),
  saveBomItems: (productId, data) =>
    axiosInstance.put(`/api/mes/products/${productId}/bom-items`, data),
};

export default masterApi;
