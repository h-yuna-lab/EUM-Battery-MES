import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import SummaryCard from "../../components/ui/SummaryCard";
import DonutChart from "../../components/ui/DonutChart";
import Pagination from "../../components/ui/Pagination";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FiSettings, FiAlertTriangle, FiArchive } from "react-icons/fi";
import { MdPrecisionManufacturing } from "react-icons/md";
import dashboardApi from "../../api/dashboard";

const EMPTY_DASHBOARD = {
  kpi: {
    todayProductionQty: 0,
    equipmentRunRate: 0,
    defectRate: 0,
    runningEquipmentCount: 0,
    totalEquipmentCount: 0,
  },
  yield: {
    yieldRate: 0,
    goodQty: 0,
    defectQty: 0,
  },
  hourlyProduction: [],
  defectTypes: [],
  equipmentStatus: [],
  materialStatus: [],
  workerSummary: {
    total: 0,
    working: 0,
  },
  workerStatus: [],
};

const toNumber = (value) => Number(value ?? 0) || 0;

const formatNumber = (value) => toNumber(value).toLocaleString();

const formatRate = (value) => `${toNumber(value).toFixed(1)}%`;

const formatMeasurement = (value, unit) =>
  value === null || value === undefined
    ? "-"
    : `${toNumber(value).toFixed(1)}${unit}`;

const DASHBOARD_TABLE_PROPS = {
  tableLayout: "fixed",
  headerBackground: "#f5f7fa",
};

const DASHBOARD_PAGINATION_PROPS = {
  visiblePages: 3,
  showFirstLast: false,
  background: "#ffffff",
  borderTop: "1px solid var(--color-border)",
};

// 레이아웃 스타일링
const DashboardWrapper = styled.div`
  background-color: var(--color-bg-canvas);
  padding: var(--page-container-padding);
  font-family: var(--font-family-base);
  display: flex;
  flex-direction: column;
  gap: var(--page-section-gap);
`;

const Header = styled.div`
  margin-bottom: 2px;
  h1 {
    margin: 0;
    font-size: var(--page-title-size);
    line-height: var(--page-title-line-height);
    font-weight: var(--page-title-weight);
    letter-spacing: var(--page-title-letter-spacing);
    color: var(--page-title-color);
  }
  p {
    font-size: var(--page-subtitle-size);
    font-weight: var(--page-subtitle-weight);
    line-height: var(--page-subtitle-line-height);
    color: var(--page-subtitle-color);
    margin-top: var(--page-title-subtitle-gap);
  }
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-box-gap);

  @media (max-width: 850px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const DashboardSummaryCard = styled(SummaryCard)`
  flex-direction: row;
  align-items: center;
`;

const getDescriptionColor = (type) => {
  if (type === "danger") return "var(--color-danger)";
  if (type === "success") return "var(--color-success)";
  return "var(--color-neutral)";
};

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--page-box-gap);
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const BoardCard = styled.div`
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--page-panel-padding);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
`;

const YieldCard = styled(BoardCard)`
  display: flex;
  flex-direction: column;
`;

const TableBoardCard = styled(BoardCard)`
  padding-bottom: 18px;
  overflow: hidden;
`;

const CardTitle = styled.div`
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
    color: var(--color-neutral);
  }
`;

const StateBadge = styled.span`
  background-color: ${(props) =>
    props.$type === "run" ? "var(--color-success-bg)" : "var(--color-neutral)"};
  color: ${(props) =>
    props.$type === "run"
      ? "var(--color-success)"
      : "var(--color-text-inverse)"};
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
`;

const MachineNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  div:first-child {
    color: #252a32;
    font-size: 13px;
    font-weight: 600;
  }
  div:last-child {
    color: #737b88;
    font-size: 13px;
    font-weight: 400;
  }
`;

const MaterialCode = styled.strong`
  color: #174b9c;
  font-size: 13px;
  font-weight: 600;
`;

const StockText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
`;

const ChartBox = styled.div`
  width: 100%;
  height: 260px;
`;

const ProductionLegend = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #535b68;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  i {
    width: 12px;
    height: 12px;
    display: inline-block;
  }
`;

const renderProductionLegend = () => (
  <ProductionLegend>
    <span>
      <i style={{ background: "#0755d9" }} />
      양품
    </span>
    <span>
      <i style={{ background: "#e34b55" }} />
      불량
    </span>
  </ProductionLegend>
);

const ProductionTooltipBox = styled.div`
  padding: 9px 11px;
  background: #ffffff;
  border: 1px solid #d9dee8;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
  color: #252a32;
  font-size: 12px;
  line-height: 1.6;

  strong,
  span {
    display: block;
  }
`;

function ProductionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const good = payload.find((item) => item.dataKey === "good")?.value ?? 0;
  const defect = payload.find((item) => item.dataKey === "defect")?.value ?? 0;

  return (
    <ProductionTooltipBox>
      <strong>{label}</strong>
      <span style={{ color: "#0755d9" }}>양품 : {good}</span>
      <span style={{ color: "#e34b55" }}>불량 : {defect}</span>
    </ProductionTooltipBox>
  );
}

const YieldOverview = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const YieldContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
`;

const YieldRate = styled.strong`
  display: block;
  color: var(--color-primary);
  font-size: 35px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
`;

const YieldLabel = styled.span`
  display: block;
  margin-bottom: 10px;
  color: var(--color-neutral);
  font-size: var(--font-size-xs);
`;

const TargetBadge = styled.span`
  padding: 6px 10px;
  color: var(--color-success);
  background: var(--color-success-bg);
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
`;

const YieldTrack = styled.div`
  position: relative;
  width: 100%;
  height: 12px;
  background: #e8ecf2;
  border-radius: 999px;
  overflow: hidden;
`;

const YieldFill = styled.div`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: linear-gradient(90deg, #0755d9, #2f80ed);
  border-radius: inherit;
`;

const YieldScale = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--color-neutral);
  font-size: 11px;
`;

const YieldStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
`;

const YieldStat = styled.div`
  padding: 14px;
  background: ${({ $danger }) => ($danger ? "#fff5f5" : "#f3faf6")};
  border: 1px solid ${({ $danger }) => ($danger ? "#f4d3d5" : "#d5eddf")};
  border-radius: 10px;

  span {
    display: block;
    margin-bottom: 6px;
    color: var(--color-neutral);
    font-size: var(--font-size-xs);
  }

  strong {
    color: ${({ $danger }) =>
      $danger ? "var(--color-danger)" : "var(--color-success)"};
    font-size: 20px;
    font-weight: var(--font-weight-bold);
  }
`;

function DashBoard() {
  const [machinePage, setMachinePage] = useState(1);
  const [materialPage, setMaterialPage] = useState(1);
  const [workerPage, setWorkerPage] = useState(1);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);

  // 설비 가동 현황
  const machineColumns = [
    { key: "machineName", label: "설비명", width: "25%" },
    { key: "temp", label: "온도", width: "17%" },
    { key: "humidity", label: "습도", width: "17%" },
    { key: "volt", label: "전압", width: "17%" },
    { key: "status", label: "상태", width: "17%" },
  ];

  // 자재 현황
  const materialColumns = [
    { key: "code", label: "자재 코드", width: 220 },
    { key: "name", label: "자재명", width: 110 },
    { key: "stock", label: "현재 재고" },
    { key: "unit", label: "단위", width: 80 },
  ];

  // 근무자 현황
  const workerColumns = [
    { key: "workerName", label: "근무자", align: "center", width: "50%" },
    { key: "status", label: "출근 여부", align: "center", width: "50%" },
  ];

  useEffect(() => {
    let isMounted = true;
    let hasLoadedOnce = false;

    const loadDashboard = async () => {
      try {
        const { data } = await dashboardApi.getDashboard();
        if (isMounted) {
          setDashboard(data ?? EMPTY_DASHBOARD);
          hasLoadedOnce = true;
        }
      } catch (error) {
        console.error("대시보드 조회 실패:", error);
        if (isMounted && !hasLoadedOnce) {
          setDashboard(EMPTY_DASHBOARD);
        }
      }
    };

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 2000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const kpiData = useMemo(
    () => [
      {
        icon: <FiArchive />,
        iconBackground: "#e8efff",
        iconColor: "#0755d9",
        title: "금일 생산량",
        value: formatNumber(dashboard.kpi?.todayProductionQty),
        subText: "완료 수량",
        subType: "normal",
      },
      {
        icon: <FiSettings />,
        iconBackground: "#e8f8ef",
        iconColor: "#17a964",
        title: "설비 가동률",
        value: formatRate(dashboard.kpi?.equipmentRunRate),
        subText: "정상 운전 중",
        subType: "success",
      },
      {
        icon: <FiAlertTriangle />,
        iconBackground: "#fdecec",
        iconColor: "#d92d34",
        title: "불량",
        value: formatRate(dashboard.kpi?.defectRate),
        subText: "금일 검사 기준",
        subType: "danger",
      },
      {
        icon: <MdPrecisionManufacturing />,
        iconBackground: "#eef1ff",
        iconColor: "#415fd5",
        title: "가동 설비",
        value:
          formatNumber(dashboard.kpi?.runningEquipmentCount) +
          " / " +
          formatNumber(dashboard.kpi?.totalEquipmentCount),
        subText: "온라인",
        subType: "success",
      },
    ],
    [dashboard],
  );

  const machineRows = useMemo(
    () =>
      (dashboard.equipmentStatus ?? []).map((machine) => ({
        id: machine.id,
        machineName: (
          <MachineNameWrapper>
            <div>{machine.equipmentName || "-"}</div>
            <div>{machine.equipmentCode || "-"}</div>
          </MachineNameWrapper>
        ),
        temp: formatMeasurement(machine.temp, "°C"),
        humidity: formatMeasurement(machine.humidity, "%"),
        volt: formatMeasurement(machine.volt, "V"),
        status: (
          <StateBadge $type={machine.running ? "run" : "normal"}>
            {machine.running ? "RUN" : "STOP"}
          </StateBadge>
        ),
      })),
    [dashboard.equipmentStatus],
  );

  const materialRows = useMemo(
    () =>
      (dashboard.materialStatus ?? []).map((material) => ({
        id: material.id,
        code: <MaterialCode>{material.code || "-"}</MaterialCode>,
        name: material.name || "-",
        stock: <StockText>{formatNumber(material.stock)}</StockText>,
        unit: material.unit || "-",
      })),
    [dashboard.materialStatus],
  );

  const workerRows = useMemo(
    () =>
      (dashboard.workerStatus ?? []).map((worker) => ({
        id: worker.id,
        workerName: worker.workerName || "-",
        status: (
          <StateBadge $type={worker.present ? "run" : "normal"}>
            {worker.present ? "출근" : "미출근"}
          </StateBadge>
        ),
      })),
    [dashboard.workerStatus],
  );

  return (
    <DashboardWrapper>
      <Header>
        <h1>대시보드</h1>
        <p>실시간 생산 모니터링 시스템</p>
      </Header>

      {/* 상단 5개 공통 카드 영역 */}
      <KpiGrid>
        {kpiData.map((kpi, idx) => (
          <DashboardSummaryCard
            key={idx}
            icon={kpi.icon}
            title={kpi.title}
            value={kpi.value}
            description={kpi.subText}
            descriptionColor={getDescriptionColor(kpi.subType)}
            height={120}
            gap={14}
            iconBoxSize={50}
            iconSize={24}
            iconBackground={kpi.iconBackground}
            iconColor={kpi.iconColor}
            titleFontSize={13}
            valueFontSize={24}
            descriptionFontSize="var(--font-size-xs)"
            descriptionFontWeight="var(--font-weight-normal)"
          />
        ))}
      </KpiGrid>

      {/* 시간별 생산 현황 및 불량 유형 분석 */}
      <SectionGrid>
        <BoardCard>
          <CardTitle>
            시간별 생산 현황 <span>완제품 양품 / 불량</span>
          </CardTitle>
          <ChartBox>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboard.hourlyProduction ?? []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e8ee"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  stroke="#8a919d"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#8a919d" />
                <Tooltip
                  cursor={{ fill: "rgba(7, 85, 217, 0.05)" }}
                  content={<ProductionTooltip />}
                />
                <Legend content={renderProductionLegend} />
                <Bar
                  dataKey="good"
                  name="양품"
                  fill="#0755d9"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="defect"
                  name="불량"
                  fill="#e34b55"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </BoardCard>

        <BoardCard>
          <CardTitle>불량 유형 분석</CardTitle>
          <DonutChart
            data={dashboard.defectTypes ?? []}
            height={260}
            chartSize={180}
            innerRadius={60}
            outerRadius={80}
            totalLabel="전체 불량"
            justifyContent="center"
            gap={28}
            legendFontSize={14}
            showTooltip
            valueFormatter={(value) => Number(value).toLocaleString()}
          />
        </BoardCard>
      </SectionGrid>

      {/* 설비 가동 현황 및 양품률 */}
      <SectionGrid>
        <TableBoardCard>
          <CardTitle>
            설비 가동 현황 (실시간) <span>센서 데이터 수신중</span>
          </CardTitle>
          <Pagination
            {...DASHBOARD_PAGINATION_PROPS}
            columns={machineColumns}
            rows={machineRows}
            currentPage={machinePage}
            itemsPerPage={3}
            onPageChange={setMachinePage}
            tableProps={DASHBOARD_TABLE_PROPS}
          />
        </TableBoardCard>
        <YieldCard>
          <CardTitle>양품률</CardTitle>
          <YieldContent>
            <YieldOverview>
              <div>
                <YieldLabel>현재 양품률</YieldLabel>
                <YieldRate>{formatRate(dashboard.yield?.yieldRate)}</YieldRate>
              </div>
              <TargetBadge>목표 97.0%</TargetBadge>
            </YieldOverview>

            <YieldTrack
              aria-label={`현재 양품률 ${formatRate(dashboard.yield?.yieldRate)}`}
            >
              <YieldFill $percent={toNumber(dashboard.yield?.yieldRate)} />
            </YieldTrack>
            <YieldScale>
              <span>0%</span>
              <span>100%</span>
            </YieldScale>

            <YieldStats>
              <YieldStat>
                <span>양품 수량</span>
                <strong>{formatNumber(dashboard.yield?.goodQty)}</strong>
              </YieldStat>
              <YieldStat $danger>
                <span>불량 수량</span>
                <strong>{formatNumber(dashboard.yield?.defectQty)}</strong>
              </YieldStat>
            </YieldStats>
          </YieldContent>
        </YieldCard>
      </SectionGrid>

      {/* 최하단 단: 자재 현황 및 근무자 현황 */}
      <SectionGrid style={{ gridTemplateColumns: "3fr 2fr" }}>
        <TableBoardCard>
          <CardTitle>자재 현황 (Inventory Status)</CardTitle>
          <Pagination
            {...DASHBOARD_PAGINATION_PROPS}
            columns={materialColumns}
            rows={materialRows}
            currentPage={materialPage}
            itemsPerPage={3}
            onPageChange={setMaterialPage}
            tableProps={DASHBOARD_TABLE_PROPS}
          />
        </TableBoardCard>

        <TableBoardCard>
          <CardTitle>
            근무자 현황{" "}
            <span style={{ color: "var(--color-primary)" }}>
              총원: {formatNumber(dashboard.workerSummary?.total)} 근무:{" "}
              {formatNumber(dashboard.workerSummary?.working)}
            </span>
          </CardTitle>
          <Pagination
            {...DASHBOARD_PAGINATION_PROPS}
            columns={workerColumns}
            rows={workerRows}
            currentPage={workerPage}
            itemsPerPage={3}
            onPageChange={setWorkerPage}
            tableProps={DASHBOARD_TABLE_PROPS}
          />
        </TableBoardCard>
      </SectionGrid>
    </DashboardWrapper>
  );
}

export default DashBoard;
