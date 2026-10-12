import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  FiActivity,
  FiCheckCircle,
  FiLayers,
  FiTrendingUp,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import UiButton from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import SummaryCard from "../../components/ui/SummaryCard";
import reportApi from "../../api/report";

const EMPTY_SUMMARY = {
  lotCount: 0,
  planQty: 0,
  actualQty: 0,
  goodQty: 0,
  defectQty: 0,
  achievementRate: 0,
  yieldRate: 0,
};

const toNumber = (value) => Number(value ?? 0) || 0;

const formatNumber = (value) => toNumber(value).toLocaleString();

// 백엔드 status는 workOrderStatus(WAITING/IN_PROGRESS/COMPLETED) 또는 lotStatus(IN_PROGRESS/생산완료) 둘 중 하나
const STATUS_LABELS = {
  WAITING: "대기중",
  IN_PROGRESS: "생산중",
  COMPLETED: "생산완료",
};

const toStatusLabel = (status) => STATUS_LABELS[status] || status || "-";

const createReportParams = (filters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "")
  );

const normalizeQuality = (quality, defectQty) => ({
  result: quality?.result || (defectQty > 0 ? "NG" : "OK"),
  inspectedAt: quality?.inspectedAt || "",
  inspectorName: quality?.inspectorName || "-",
  defectCode: quality?.defectCode || "",
  defectType: quality?.defectType || "",
  defectQty: toNumber(quality?.defectQty ?? defectQty),
  voltage: quality?.voltage ?? "-",
  resistance: quality?.resistance ?? "-",
});

const normalizeReportRow = (lot) => {
  const actualQty = toNumber(lot.actualQty);
  const goodQty = toNumber(lot.goodQty);
  const defectQty = toNumber(lot.defectQty);

  return {
    id: lot.id,
    productionDate: lot.productionDate || "",
    lotNo: lot.lotNo || "",
    productCode: lot.productCode || "",
    productName: lot.productName || "",
    workOrderNo: lot.workOrderNo || "",
    planQty: toNumber(lot.planQty),
    actualQty,
    goodQty,
    defectQty,
    status: lot.status || "",
    equipment: lot.equipment || "",
    yieldRate: toNumber(lot.yieldRate),
    processes: lot.processes ?? [],
    materials: lot.materials ?? [],
    quality: normalizeQuality(lot.quality, defectQty),
  };
};

const normalizeSummary = (summary) => ({
  lotCount: toNumber(summary?.lotCount),
  planQty: toNumber(summary?.planQty),
  actualQty: toNumber(summary?.actualQty),
  goodQty: toNumber(summary?.goodQty),
  defectQty: toNumber(summary?.defectQty),
  achievementRate: toNumber(summary?.achievementRate),
  yieldRate: toNumber(summary?.yieldRate),
});

const uniqueOptions = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    if (!item.value || seen.has(item.value)) {
      return false;
    }

    seen.add(item.value);
    return true;
  });
};

/* =========================================================
   Styled Components
========================================================= */

const Page = styled.div`
  min-height: 100%;
  padding: var(--page-container-padding);
  box-sizing: border-box;
  background: #f7f8fa;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--page-header-content-gap);
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--page-title-subtitle-gap);
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: var(--page-title-size);
  line-height: var(--page-title-line-height);
  font-weight: var(--page-title-weight);
  letter-spacing: var(--page-title-letter-spacing);
  color: var(--page-title-color);
`;

const PageDescription = styled.p`
  margin: 0;
  font-size: var(--page-subtitle-size);
  font-weight: var(--page-subtitle-weight);
  line-height: var(--page-subtitle-line-height);
  color: var(--page-subtitle-color);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 850px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ReportSummaryCard = styled(SummaryCard)`
  flex-direction: row;
  align-items: center;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  padding: var(--page-panel-padding);

  background: #ffffff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;

  font-size: 16px;
  font-weight: 600;
  color: #292d35;
`;

const ChartBox = styled.div`
  width: 100%;
  height: 270px;
`;

const FilterPanel = styled(Panel)`
  margin-bottom: var(--page-section-gap);
`;

const TablePanel = styled.section`
  overflow: hidden;

  background: #ffffff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
`;

const TableTop = styled.div`
  min-height: 62px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid #e2e6ed;
`;

const TableTitle = styled.h2`
  margin: 0;

  font-size: 16px;
  font-weight: 600;
  color: #292d35;
`;

const TableSummary = styled.span`
  font-size: 13px;
  color: #767e8b;

  strong {
    color: #0755d9;
  }
`;

const LotNumber = styled.strong`
  display: inline-block;
  color: #174b9c;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
`;

const TableText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 5px 9px;

  border: 1px solid #bfd4fa;
  border-radius: 999px;

  background: #eaf2ff;
  color: #0755d9;

  font-size: 12px;
  font-weight: 600;
`;

const QuantityNg = styled.span`
  color: ${({ $hasDefect }) => ($hasDefect ? "#d92d34" : "#3b424d")};
  font-size: 13px;
  font-weight: ${({ $hasDefect }) => ($hasDefect ? 600 : 400)};
`;

const EmptyMessage = styled.div`
  padding: 60px 20px;
  text-align: center;
  font-size: 14px;
  color: #9198a4;
`;

/* =========================================================
   Drawer
========================================================= */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;

  background: rgba(17, 24, 39, 0.45);
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: ${({ $open }) => ($open ? "0" : "-560px")};
  z-index: 901;

  width: 560px;
  max-width: 100%;
  height: 100vh;

  display: flex;
  flex-direction: column;

  background: #f8f9fb;
  border-left: 1px solid #d8dee9;
  box-shadow: -8px 0 28px rgba(15, 23, 42, 0.15);

  transition: right 0.25s ease;
`;

const DrawerHeader = styled.header`
  min-height: 70px;
  padding: 0 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #ffffff;
  border-bottom: 1px solid #dfe3eb;
`;

const DrawerTitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: #0755d9;
  }
`;

const DrawerTitle = styled.h2`
  margin: 0;

  font-size: 18px;
  font-weight: 600;
  color: #20252d;
`;

const CloseButton = styled(UiButton)`
  width: 36px;
  height: 36px;
  padding: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 0;
  border-radius: 8px;

  background: transparent;
  color: #505968;

  cursor: pointer;

  &:hover {
    background: #eef1f5;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;

  padding: 22px 24px 36px;
`;

const LotHero = styled.section`
  margin-bottom: 22px;
  padding: 20px;

  background: linear-gradient(135deg, #0755d9, #2874ec);
  border-radius: 12px;
  color: #ffffff;
`;

const LotHeroLabel = styled.span`
  display: block;
  margin-bottom: 6px;

  font-size: 12px;
  opacity: 0.8;
`;

const LotHeroNumber = styled.strong`
  display: block;
  margin-bottom: 18px;

  font-size: 20px;
  font-weight: 700;
`;

const LotHeroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const LotHeroItem = styled.div`
  padding: 10px;

  background: rgba(255, 255, 255, 0.12);
  border-radius: 8px;

  span {
    display: block;
    margin-bottom: 4px;

    font-size: 11px;
    opacity: 0.78;
  }

  strong {
    display: block;

    font-size: 14px;
    font-weight: 600;
  }
`;

const DrawerSection = styled.section`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 11px;
  padding-left: 10px;

  border-left: 4px solid #0755d9;

  font-size: 15px;
  font-weight: 600;
  color: #303640;
`;

const DetailCard = styled.div`
  padding: 18px;

  background: #ffffff;
  border: 1px solid #ccd4e2;
  border-radius: 10px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
`;

const DetailItem = styled.div`
  min-width: 0;
`;

const DetailLabel = styled.span`
  display: block;
  margin-bottom: 6px;

  font-size: 12px;
  color: #747c89;
`;

const DetailValue = styled.strong`
  display: block;

  font-size: 14px;
  font-weight: 500;
  color: #222831;

  overflow-wrap: anywhere;
`;

const Timeline = styled.div`
  padding: 18px;

  background: #ffffff;
  border: 1px solid #ccd4e2;
  border-radius: 10px;
`;

const TimelineItem = styled.div`
  position: relative;

  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 12px;

  padding-bottom: 24px;

  &:last-child {
    padding-bottom: 0;
  }

  &:not(:last-child)::before {
    content: "";

    position: absolute;
    top: 20px;
    left: 9px;
    bottom: 0;

    width: 2px;
    background: #d7e2f5;
  }
`;

const TimelineDot = styled.div`
  position: relative;
  z-index: 1;

  width: 20px;
  height: 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  background: ${({ $warning }) => ($warning ? "#fdebec" : "#e7f0ff")};
  color: ${({ $warning }) => ($warning ? "#d92d34" : "#0755d9")};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const TimelineContent = styled.div`
  min-width: 0;
`;

const TimelineTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  margin-bottom: 8px;

  strong {
    font-size: 14px;
    color: #252a32;
  }

  span {
    font-size: 11px;
    color: #7a8391;
  }
`;

const TimelineInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 14px;

  font-size: 12px;
  color: #636c79;
`;

const MiniTable = styled.table`
  width: 100%;

  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 10px 8px;
    border-bottom: 1px solid #e3e7ee;

    text-align: left;
    font-size: 12px;
  }

  th {
    background: #f3f5f8;
    color: #646d7b;
    font-weight: 500;
  }

  td {
    color: #292e36;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const QualityResult = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 5px 9px;

  border-radius: 999px;
  border: 1px solid
    ${({ $result }) => ($result === "OK" ? "#bdd6fa" : "#f2c3c6")};

  background: ${({ $result }) =>
    $result === "OK" ? "#eaf2ff" : "#fdecec"};

  color: ${({ $result }) =>
    $result === "OK" ? "#0755d9" : "#d92d34"};

  font-size: 12px;
  font-weight: 600;
`;

/* =========================================================
   Component
========================================================= */

function ProductionReport() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [dailyChartData, setDailyChartData] = useState([]);
  const [processChartData, setProcessChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    product: "",
    equipment: "",
    process: "",
    keyword: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState(null);

  const itemsPerPage = 8;

  useEffect(() => {
    let isMounted = true;
    const params = createReportParams(filters);

    const loadReport = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [lotsResponse, summaryResponse, dailyResponse, processResponse] =
          await Promise.all([
            reportApi.getLots(params),
            reportApi.getSummary(params),
            reportApi.getDailyProduction(params),
            reportApi.getProcessProduction(params),
          ]);

        if (!isMounted) return;

        setRows((lotsResponse.data ?? []).map(normalizeReportRow));
        setSummary(normalizeSummary(summaryResponse.data));
        setDailyChartData(dailyResponse.data ?? []);
        setProcessChartData(processResponse.data ?? []);
      } catch (error) {
        if (!isMounted) return;

        console.error("생산 리포트 조회 실패:", error);
        setRows([]);
        setSummary(EMPTY_SUMMARY);
        setDailyChartData([]);
        setProcessChartData([]);
        setLoadError("생산 리포트 데이터를 불러오지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const filteredRows = rows;

  const productOptions = useMemo(
    () =>
      uniqueOptions(
        rows.map((row) => ({
          value: row.productCode,
          label: row.productName
            ? `${row.productCode} / ${row.productName}`
            : row.productCode,
        }))
      ),
    [rows]
  );

  const equipmentOptions = useMemo(
    () =>
      uniqueOptions(
        rows
          .flatMap((row) => [
            row.equipment,
            ...row.processes.map((process) => process.equipmentName),
          ])
          .map((equipment) => ({
            value: equipment,
            label: equipment,
          }))
      ),
    [rows]
  );

  const processOptions = useMemo(
    () =>
      uniqueOptions(
        rows.flatMap((row) =>
          row.processes.map((process) => ({
            value: process.processCode,
            label: process.processName
              ? `${process.processCode} / ${process.processName}`
              : process.processCode,
          }))
        )
      ),
    [rows]
  );

  const productionColumns = [
    { key: "productionDate", label: "생산일", width: 120, render: (date) => <TableText>{date}</TableText> },
    { key: "lotNo", label: "LOT 번호", width: 180, render: (lotNo) => <LotNumber>{lotNo}</LotNumber> },
    { key: "productName", label: "제품명", width: 135 },
    { key: "planQty", label: "계획", width: 80, render: (quantity) => <TableText>{formatNumber(quantity)}</TableText> },
    { key: "goodQty", label: "양품", width: 80, render: (quantity) => <TableText>{formatNumber(quantity)}</TableText> },
    {
      key: "defectQty",
      label: "불량",
      width: 80,
      render: (quantity) => <QuantityNg $hasDefect={quantity > 0}>{formatNumber(quantity)}</QuantityNg>,
    },
    { key: "yieldRate", label: "수율", width: 80, render: (rate) => <TableText>{rate}%</TableText> },
    { key: "status", label: "상태", width: 110, render: (status) => <StatusBadge>{toStatusLabel(status)}</StatusBadge> },
  ];

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleOpenDetail = (row) => {
    setSelectedLot(row);
  };

  const handleCloseDetail = () => {
    setSelectedLot(null);
  };

  return (
    <>
      <Page>
        <PageHeader>
          <TitleArea>
            <PageTitle>생산 리포트</PageTitle>

            <PageDescription>
              생산 현황을 조회하고 LOT별 생산·자재·공정 이력을
              추적합니다.
            </PageDescription>
          </TitleArea>
        </PageHeader>

        <SummaryGrid>
          <ReportSummaryCard
            height={116}
            gap={12}
            icon={<FiTrendingUp />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#e8efff"
            iconColor="#0755d9"
            title="계획 대비 달성률"
            titleFontSize={13}
            value={`${summary.achievementRate}%`}
            valueFontSize={24}
          />

          <ReportSummaryCard
            height={116}
            gap={12}
            icon={<FiCheckCircle />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#e8f8ef"
            iconColor="#17a964"
            title="양품"
            titleFontSize={13}
            value={formatNumber(summary.goodQty)}
            valueFontSize={24}
          />

          <ReportSummaryCard
            height={116}
            gap={12}
            icon={<FiXCircle />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#fdecec"
            iconColor="#d92d34"
            title="불량"
            titleFontSize={13}
            value={formatNumber(summary.defectQty)}
            valueFontSize={24}
          />

          <ReportSummaryCard
            height={116}
            gap={12}
            icon={<FiActivity />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#eef1ff"
            iconColor="#415fd5"
            title="수율"
            titleFontSize={13}
            value={`${summary.yieldRate}%`}
            valueFontSize={24}
          />
        </SummaryGrid>

        <ChartGrid>
          <Panel>
            <PanelTitle>일자별 계획/양품</PanelTitle>

            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyChartData}
                  margin={{
                    top: 10,
                    right: 18,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke="#e5e8ee"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#8a919d"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    stroke="#8a919d"
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="plan"
                    name="계획"
                    stroke="#28b979"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="good"
                    name="양품"
                    stroke="#0755d9"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>

          <Panel>
            <PanelTitle>공정별 생산량 / 불량량</PanelTitle>

            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processChartData}
                  margin={{
                    top: 10,
                    right: 16,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke="#e5e8ee"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="process"
                    stroke="#8a919d"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    stroke="#8a919d"
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip cursor={false} />
                  <Legend />

                  <Bar
                    dataKey="output"
                    name="생산량"
                    fill="#0755d9"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="defect"
                    name="불량량"
                    fill="#ef4444"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
        </ChartGrid>

        <FilterPanel>
          <PanelTitle>생산 현황 검색</PanelTitle>

          <SearchFilterBar
            defaultValues={filters}
            startDateLabel="시작일"
            endDateLabel="종료일"
            dateWidth={170}
            filters={[
              {
                name: "product",
                label: "제품",
                placeholder: "전체 제품",
                width: 170,
                options: productOptions,
              },
              {
                name: "equipment",
                label: "설비",
                placeholder: "전체 설비",
                width: 170,
                options: equipmentOptions,
              },
              {
                name: "process",
                label: "공정",
                placeholder: "전체 공정",
                width: 160,
                options: processOptions,
              },
            ]}
            keywordLabel="통합 검색"
            keywordPlaceholder="LOT / 작업지시 / 자재 LOT / 제품명"
            keywordWidth={358}
            inputHeight={38}
            padding={0}
            border="none"
            showSearchButton={false}
            showResetButton
            resetButtonText="초기화"
            onChange={handleFilterChange}
          />
        </FilterPanel>

        <TablePanel>
          <TableTop>
            <TableTitle>LOT별 생산 현황</TableTitle>

            <TableSummary>
              조회 LOT <strong>{summary.lotCount}</strong>건 · 총 양품{" "}
              <strong>
                {formatNumber(summary.goodQty)}
              </strong>
              개
            </TableSummary>
          </TableTop>

          <Pagination
            columns={productionColumns}
            rows={filteredRows}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            visiblePages={5}
            background="#ffffff"
            borderTop="1px solid #e2e6ed"
            onPageChange={setCurrentPage}
            onRowClick={handleOpenDetail}
            tableProps={{
              tableLayout: "fixed",
              headerBackground: "#f1f3f6",
              headerColor: "#555d6b",
              cellColor: "#23272e",
              emptyText: isLoading
                ? "생산 리포트 데이터를 불러오는 중입니다."
                : loadError || "조건에 맞는 생산 현황이 없습니다.",
            }}
          />
        </TablePanel>
      </Page>

      {selectedLot && <Overlay onClick={handleCloseDetail} />}

      <Drawer $open={Boolean(selectedLot)}>
        {selectedLot && (
          <>
            <DrawerHeader>
              <DrawerTitleArea>
                <FiLayers size={20} />
                <DrawerTitle>LOT 추적 상세</DrawerTitle>
              </DrawerTitleArea>

              <CloseButton
                type="button"
                aria-label="상세 닫기"
                onClick={handleCloseDetail}
              >
                <FiX size={22} />
              </CloseButton>
            </DrawerHeader>

            <DrawerBody>
              <LotHero>
                <LotHeroLabel>LOT 번호</LotHeroLabel>
                <LotHeroNumber>{selectedLot.lotNo}</LotHeroNumber>

                <LotHeroGrid>
                  <LotHeroItem>
                    <span>계획</span>
                    <strong>{selectedLot.planQty}</strong>
                  </LotHeroItem>

                  <LotHeroItem>
                    <span>양품</span>
                    <strong>{selectedLot.goodQty}</strong>
                  </LotHeroItem>

                  <LotHeroItem>
                    <span>불량</span>
                    <strong>{selectedLot.defectQty}</strong>
                  </LotHeroItem>
                </LotHeroGrid>
              </LotHero>

              <DrawerSection>
                <SectionTitle>LOT 기본 정보</SectionTitle>

                <DetailCard>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>제품 코드</DetailLabel>
                      <DetailValue>
                        {selectedLot.productCode}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>제품명</DetailLabel>
                      <DetailValue>
                        {selectedLot.productName}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>작업지시 번호</DetailLabel>
                      <DetailValue>
                        {selectedLot.workOrderNo}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>생산일</DetailLabel>
                      <DetailValue>
                        {selectedLot.productionDate}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>계획 수량</DetailLabel>
                      <DetailValue>
                        {selectedLot.planQty}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>수율</DetailLabel>
                      <DetailValue>
                        {selectedLot.yieldRate}%
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </DrawerSection>

              <DrawerSection>
                <SectionTitle>공정 타임라인</SectionTitle>

                <Timeline>
                  {selectedLot.processes.map((process) => {
                    const warning = process.result.includes("NG");

                    return (
                      <TimelineItem
                        key={`${process.processCode}-${process.startedAt}`}
                      >
                        <TimelineDot $warning={warning}>
                          {warning ? (
                            <FiXCircle />
                          ) : (
                            <FiCheckCircle />
                          )}
                        </TimelineDot>

                        <TimelineContent>
                          <TimelineTitle>
                            <strong>
                              {process.processName}
                            </strong>

                            <span>{process.result}</span>
                          </TimelineTitle>

                          <TimelineInfo>
                            <span>
                              공정 코드: {process.processCode}
                            </span>

                            <span>
                              설비: {process.equipmentName}
                            </span>

                            <span>
                              작업자: {process.workerName}
                            </span>

                            <span>
                              {process.startedAt} ~{" "}
                              {process.endedAt}
                            </span>
                          </TimelineInfo>
                        </TimelineContent>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </DrawerSection>

              <DrawerSection>
                <SectionTitle>투입 자재</SectionTitle>

                <DetailCard>
                  {selectedLot.materials.length > 0 ? (
                    <MiniTable>
                      <thead>
                        <tr>
                          <th>자재명</th>
                          <th>자재 LOT</th>
                          <th>투입 수량</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedLot.materials.map((material) => (
                          <tr
                            key={`${material.materialCode}-${material.materialLotNo}`}
                          >
                            <td>{material.materialName}</td>
                            <td>{material.materialLotNo}</td>
                            <td>
                              {material.quantity} {material.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </MiniTable>
                  ) : (
                    <EmptyMessage>
                      등록된 투입 자재가 없습니다.
                    </EmptyMessage>
                  )}
                </DetailCard>
              </DrawerSection>

              <DrawerSection>
                <SectionTitle>품질 및 불량 정보</SectionTitle>

                <DetailCard>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>검사 결과</DetailLabel>

                      <QualityResult
                        $result={selectedLot.quality.result}
                      >
                        {selectedLot.quality.result === "OK" ? (
                          <FiCheckCircle />
                        ) : (
                          <FiXCircle />
                        )}

                        {selectedLot.quality.result}
                      </QualityResult>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>검사 일시</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.inspectedAt}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>검사자</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.inspectorName}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>불량 수량</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.defectQty}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>불량 코드</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.defectCode || "-"}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>불량 유형</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.defectType || "-"}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>측정 전압</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.voltage}V
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>내부 저항</DetailLabel>
                      <DetailValue>
                        {selectedLot.quality.resistance}mΩ
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </DrawerSection>
            </DrawerBody>
          </>
        )}
      </Drawer>
    </>
  );
}

export default ProductionReport;
