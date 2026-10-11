// 생산관리 관련 API 모음 (담당: 유)
// 대상: workOrder(작업지시), lot(완제품 LOT)
// 주의: MaterialTx로 material-lot(원료 LOT, 상 담당)과 연결되므로,
//       Lot 응답 형태는 팀 전체 합의(LOT 데이터 계약)에 맞춰 작성할 것
import axiosInstance from "./axiosInstance";

const productionApi = {
  getWorkOrders: (params) => axiosInstance.get("/api/mes/work-orders", { params }),
  getWorkOrder: (id) => axiosInstance.get(`/api/mes/work-orders/${id}`),
  createWorkOrder: (data) => axiosInstance.post("/api/mes/work-orders", data),

  getProductLots: (params) => axiosInstance.get("/api/mes/product-lots", { params }),
  getProductLot: (id) => axiosInstance.get(`/api/mes/product-lots/${id}`),
};

export default productionApi;
