// 자재/재고관리 관련 API 모음 (담당: 상)
// 대상: material-list(자재 실물 재고), material-tx(자재 트랜잭션), material-lot(원료 LOT)
// 주의: production.js의 Lot(완제품 LOT)과 MaterialTx로 연결되므로,
//       MaterialLot 응답 형태는 팀 전체 합의(LOT 데이터 계약)에 맞춰 작성할 것
import axiosInstance from "./axiosInstance";

const inventoryApi = {
  getMaterials: (params) =>
    axiosInstance.get("/api/mes/inventory/materials", { params }),
  getMaterialSummary: (params) =>
    axiosInstance.get("/api/mes/inventory/materials/summary", { params }),
  inboundMaterial: (materialId, data) =>
    axiosInstance.post(`/api/mes/inventory/materials/${materialId}/inbound`, data),

  getTransactions: (params) =>
    axiosInstance.get("/api/mes/inventory/transactions", { params }),
  getTransactionSummary: (params) =>
    axiosInstance.get("/api/mes/inventory/transactions/summary", { params }),

  getLots: (params) =>
    axiosInstance.get("/api/mes/inventory/lots", { params }),
  getLotSummary: (params) =>
    axiosInstance.get("/api/mes/inventory/lots/summary", { params }),
};

export default inventoryApi;
