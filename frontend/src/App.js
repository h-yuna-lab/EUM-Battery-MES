import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import GlobalStyle from "./style/GlobalStyle";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./context/AuthGuard";
import Login from "./pages/Login";
import SideBar from "./components/ui/SideBar";
import Header from "./components/ui/Header";
import ProductLotList from "./pages/production/ProductLotList";
import WorkOrderList from "./pages/production/WorkOrderList";
import DashBoard from "./pages/monitoring/Dashboard";
import MachineList from "./pages/master/MachineList";
import ProcessList from "./pages/master/ProcessList";
import ProductList from "./pages/master/ProductList";
import WorkerList from "./pages/master/WorkerList";
import BomList from "./pages/master/BomList";
import MaterialInventory from "./pages/inventory/MaterialInventory";
import MaterialTransactionHistory from "./pages/inventory/MaterialTransactionHistory";
import MaterialLotManagement from "./pages/inventory/MaterialLotManagement";
import QualityPage from "./pages/quality/QualityPage";
import ProductionReport from "./pages/report/ProductionReport";
import MaterialList from "./pages/master/MaterialList";

/* 라우트 경로 -> SideBar activeItem 매핑 */
// 07-21 자재 추가
const PATH_TO_ACTIVE_ITEM = {
  "/mes/dashboard": "대시보드",
  "/mes/master/process": "공정",
  "/mes/master/worker": "작업자",
  "/mes/master/machine": "설비",
  "/mes/master/bom": "BOM",
  "/mes/master/material": "자재",
  "/mes/master/product": "제품",
  "/mes/production/workorders": "작업지시",
  "/mes/production/product-lot": "완제품LOT",
  "/mes/quality/test-log": "품질관리",
  "/mes/inventory/material-list": "자재재고",
  "/mes/inventory/material-tx": "자재입출고이력",
  "/mes/inventory/material-lot": "원료LOT",
  "/mes/report/trace": "리포트",
};

function MesLayout() {
  const location = useLocation();
  const activeItem = PATH_TO_ACTIVE_ITEM[location.pathname];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SideBar activeItem={activeItem} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <GlobalStyle />
      <AuthProvider>
        <Routes>
          {/* ================= 로그인 (공개 페이지) ================= */}
          <Route path="/login" element={<Login />} />

          {/* ================= 인증 보호 영역 ================= */}
          <Route element={<AuthGuard />}>
            <Route
              path="/"
              element={<Navigate to="/mes/dashboard" replace />}
            />

            <Route path="/mes" element={<MesLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />

              {/* 대시보드 (담당: 미) */}
              <Route path="dashboard" element={<DashBoard />} />

              {/* 기준정보 (담당: 현) */}
              <Route path="master">
                <Route path="process" element={<ProcessList />} />
                <Route path="worker" element={<WorkerList />} />
                <Route path="machine" element={<MachineList />} />
                <Route path="bom" element={<BomList />} />
                <Route path="material" element={<MaterialList />} />
                <Route path="product" element={<ProductList />} />
              </Route>

              {/* 생산관리 (담당: 유) */}
              <Route path="production">
                <Route path="workorders" element={<WorkOrderList />} />
                <Route path="product-lot" element={<ProductLotList />} />
              </Route>

              {/* 품질관리 (담당: 나) - DefectLog는 TestLog에 통합됨 */}
              <Route path="quality">
                <Route path="test-log" element={<QualityPage />} />
              </Route>

              {/* 자재/재고관리 (담당: 상) */}
              <Route path="inventory">
                <Route path="material-list" element={<MaterialInventory />} />
                <Route
                  path="material-tx"
                  element={<MaterialTransactionHistory />}
                />
                <Route
                  path="material-lot"
                  element={<MaterialLotManagement />}
                />
              </Route>

              {/* 리포트 (담당: 나) - ProcessLog는 Traceability 상세에 통합됨 */}
              <Route path="report">
                <Route path="trace" element={<ProductionReport />} />
              </Route>
            </Route>
          </Route>

          {/* ================= 나머지 모든 경로 ================= */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
