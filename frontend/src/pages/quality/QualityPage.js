import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  FiCheckCircle,
  FiClipboard,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import UiButton from "../../components/ui/Button";
import SummaryCard from "../../components/ui/SummaryCard";
import Pagination from "../../components/ui/Pagination";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import qualityApi from "../../api/quality";

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_SUMMARY = {
  total: 0,
  ok: 0,
  ng: 0,
  okRate: 0,
  topDefect: "-",
};

const BAR_COLOR = "#dd4c51";

// 공정별 원시 측정값 measurementCode -> 화면 라벨
const MEASUREMENT_LABELS = {
  THICKNESS: "두께",
  ALIGNMENT: "정렬오차",
  CURRENT: "충전전류",
  TORQUE: "체결토크",
  VOLTAGE: "전압",
  CAPACITY: "용량",
  RESISTANCE: "저항",
  WEIGHT: "중량",
};

/* =========================================================
   STYLES
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  > div {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    column-gap: 16px;

    > div:last-child {
      flex: 0 1 100px;
      text-align: left;
    }
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  padding: var(--page-panel-padding);
  background: #ffffff;
  border: 1px solid #d9deea;
  border-radius: 10px;
  box-sizing: border-box;
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: #292d35;
`;

const ChartBox = styled.div`
  width: 100%;
  height: 260px;
`;

const FilterPanel = styled(Panel)`
  margin-bottom: var(--page-section-gap);
`;

const TablePanel = styled(Panel)`
  padding: 0;
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 20px;
`;

const TableTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #282c34;
`;

const ResultBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 5px 9px;
  border-radius: 999px;

  background: ${({ $result }) =>
    $result === "OK" ? "#e8f1ff" : "#fdecec"};

  color: ${({ $result }) =>
    $result === "OK" ? "#0755d9" : "#d92d34"};

  border: 1px solid
    ${({ $result }) =>
      $result === "OK" ? "#bfd4fa" : "#f4c4c7"};

  font-size: 12px;
  font-weight: 600;
`;

const DefectText = styled.span`
  color: #d92d34;
  font-size: 13px;
  font-weight: 600;
`;

const IdentifierText = styled.strong`
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

/* Drawer */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(17, 24, 39, 0.42);
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: ${({ $open }) => ($open ? "0" : "-480px")};
  z-index: 901;

  width: 480px;
  height: 100vh;

  display: flex;
  flex-direction: column;

  background: #f8f9fb;
  border-left: 1px solid #d8dee9;
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.14);

  transition: right 0.25s ease;
`;

const DrawerHeader = styled.div`
  height: 68px;
  padding: 0 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #ffffff;
  border-bottom: 1px solid #dfe3eb;
`;

const DrawerTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;

  font-size: 18px;
  font-weight: 600;
  color: #222831;

  svg {
    color: #0755d9;
  }
`;

const CloseButton = styled(UiButton)`
  width: 36px;
  height: 36px;
  padding: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4b5563;

  cursor: pointer;

  &:hover {
    background: #eef1f5;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 32px;
`;

const DrawerSection = styled.section`
  margin-bottom: 22px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 10px;
  padding-left: 10px;

  border-left: 4px solid #0755d9;

  font-size: 15px;
  font-weight: 600;
  color: #313640;
`;

const DetailCard = styled.div`
  padding: 17px 18px;

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

const DefectCard = styled(DetailCard)`
  border-color: #efc4c7;
  background: #fffafa;
`;

/* =========================================================
   COMPONENT
========================================================= */

function QualityPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [trendData, setTrendData] = useState([]);
  const [defectData, setDefectData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    result: "",
    defectType: "",
    keyword: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  const itemsPerPage = 8;

  // 필터가 바뀔 때마다 검사이력/요약/추이/불량분포를 함께 조회한다.
  // (4개 엔드포인트 모두 동일한 startDate/endDate/result/defectType/keyword를 지원)
  useEffect(() => {
    let ignore = false;
    setCurrentPage(1);

    const loadQualityData = async () => {
      setIsLoading(true);

      try {
        const [inspectionsRes, summaryRes, trendRes, defectsRes] =
          await Promise.all([
            qualityApi.getInspections(filters),
            qualityApi.getSummary(filters),
            qualityApi.getTrend(filters),
            qualityApi.getDefects(filters),
          ]);

        if (ignore) return;

        setRows(inspectionsRes.data);
        setSummary(summaryRes.data);
        setTrendData(trendRes.data);
        setDefectData(defectsRes.data);
      } catch (error) {
        if (!ignore) {
          console.warn("품질 데이터 조회 실패:", error);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadQualityData();

    return () => {
      ignore = true;
    };
  }, [filters]);

  const qualityColumns = [
    { key: "inspectedAt", label: "검사일시", width: 170, render: (date) => <TableText>{date}</TableText> },
    {
      key: "result",
      label: "판정",
      width: 100,
      render: (result) => (
        <ResultBadge $result={result}>
          {result === "OK" ? <FiCheckCircle /> : <FiXCircle />}
          {result}
        </ResultBadge>
      ),
    },
    {
      key: "defectType",
      label: "불량 유형",
      width: 100,
      render: (defectType, row) => row.result === "NG" ? <DefectText>{defectType}</DefectText> : "-",
    },
    { key: "lotNo", label: "LOT", width: 200, render: (lotNo) => <IdentifierText>{lotNo}</IdentifierText> },
    { key: "productName", label: "제품명", width: 140 },
    { key: "workOrderNo", label: "작업지시", width: 160, render: (workOrderNo) => <IdentifierText>{workOrderNo}</IdentifierText> },
    { key: "processName", label: "공정", width: 100 },
    { key: "machineName", label: "설비", width: 150 },
  ];

  const handleFilterChange = (nextFilters) => {
    setFilters((prev) => ({
      ...nextFilters,
      keyword: prev.keyword,
    }));
    setCurrentPage(1);
  };

  const handleFilterSearch = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleFilterReset = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const openDetail = (row) => {
    setSelectedRow(row);
  };

  const closeDetail = () => {
    setSelectedRow(null);
  };

  return (
    <>
      <Page>
        <PageHeader>
          <TitleArea>
            <PageTitle>품질관리</PageTitle>
            <PageDescription>
              생산 제품의 검사 결과와 불량 이력을 통합 관리합니다.
            </PageDescription>
          </TitleArea>
        </PageHeader>

        <SummaryGrid>
          <SummaryCard
          height={116}
            gap={12}
            icon={<FiClipboard />}
            iconBoxSize={48}
            iconSize={24}
            title="검사 건수"
            titleFontSize={13}
            value={summary.total.toLocaleString()}
            valueFontSize={24}
            description=""
          />

          <SummaryCard
          height={116}
            gap={12}
            icon={<FiCheckCircle />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#e9f2ff"
            iconColor="#0755d9"
            title="OK"
            titleFontSize={13}
            value={summary.ok.toLocaleString()}
            valueFontSize={24}
            description=""
          />

          <SummaryCard
          height={116}
            gap={12}
            icon={<FiXCircle />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#fdebec"
            iconColor="#d92d34"
            title="NG"
            titleFontSize={13}
            value={summary.ng.toLocaleString()}
            valueFontSize={24}
            description=""
          />

          <SummaryCard
          height={116}
            gap={12}
            icon={<span style={{ fontSize: 22 }}>%</span>}
            iconBoxSize={48}
            iconSize={24}
            title="OK 비율"
            titleFontSize={13}
            value={`${summary.okRate}%`}
            valueFontSize={24}
            description=""
          />

          <SummaryCard
          height={116}
            gap={12}
            icon={<FiXCircle />}
            iconBoxSize={48}
            iconSize={24}
            iconBackground="#fdebec"
            iconColor="#d92d34"
            title="최다 불량"
            titleFontSize={13}
            value={summary.topDefect}
            valueFontSize={20}
            description=""
          />
        </SummaryGrid>

        <ChartGrid>
          <Panel>
            <PanelTitle>일자별 OK/NG 추이</PanelTitle>

            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e8ee"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#8a919d"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#8a919d"
                  />
                  <Tooltip cursor={false} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ok"
                    name="OK"
                    stroke="#08a879"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ng"
                    name="NG"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>

          <Panel>
            <PanelTitle>불량 유형 분포</PanelTitle>

            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={defectData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e8ee"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#8a919d"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#8a919d"
                  />
                  <Tooltip cursor={false} />

                  <Bar
                    dataKey="value"
                    name="불량 수량"
                    radius={[5, 5, 0, 0]}
                  >
                    {defectData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={BAR_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
        </ChartGrid>

        <FilterPanel>
          <PanelTitle>검사 이력 검색</PanelTitle>

          <SearchFilterBar
            defaultValues={{
              startDate: "",
              endDate: "",
              result: "",
              defectType: "",
              keyword: "",
            }}
            startDateLabel="시작일"
            endDateLabel="종료일"
            filters={[
              {
                name: "result",
                label: "판정",
                placeholder: "전체 판정",
                options: [
                  { value: "OK", label: "OK" },
                  { value: "NG", label: "NG" },
                ],
              },
              {
                name: "defectType",
                label: "불량 유형",
                placeholder: "불량 유형 전체",
                options: [
                  { value: "두께불량", label: "두께불량" },
                  { value: "정렬불량", label: "정렬불량" },
                  { value: "충전불량", label: "충전불량" },
                  { value: "체결불량", label: "체결불량" },
                  { value: "전압불량", label: "전압불량" },
                  { value: "용량불량", label: "용량불량" },
                  { value: "저항불량", label: "저항불량" },
                  { value: "중량불량", label: "중량불량" },
                ],
              },
            ]}
            keywordLabel="통합 검색"
            keywordPlaceholder="LOT / 작업지시 / 제품 / 공정 / 설비 / 작업자"
            flexWrap="nowrap"
            padding={0}
            border="none"
            borderRadius={0}
            inputHeight={38}
            showSearchButton={false}
            resetButtonText="초기화"
            onChange={handleFilterChange}
            onSearch={handleFilterSearch}
            onReset={handleFilterReset}
          />
        </FilterPanel>

        <TablePanel>
          <TableHeader>
            <TableTitle>검사 이력</TableTitle>
          </TableHeader>

          <Pagination
            columns={qualityColumns}
            rows={rows}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            visiblePages={5}
            borderTop="1px solid #e2e6ee"
            background="#ffffff"
            onPageChange={setCurrentPage}
            onRowClick={openDetail}
            tableProps={{
              tableLayout: "fixed",
              headerBackground: "#f1f3f6",
              headerColor: "#555d6c",
              cellColor: "#22262d",
              hoverBackground: "#f7faff",
              emptyText: isLoading
                ? "검사 이력을 불러오는 중입니다..."
                : "조건에 맞는 검사 이력이 없습니다.",
            }}
          />
        </TablePanel>
      </Page>

      {selectedRow && <Overlay onClick={closeDetail} />}

      <Drawer $open={Boolean(selectedRow)}>
        {selectedRow && (
          <>
            <DrawerHeader>
              <DrawerTitle>
                {selectedRow.result === "NG" ? (
                  <FiXCircle />
                ) : (
                  <FiCheckCircle />
                )}

                {selectedRow.result === "NG"
                  ? "불량 상세"
                  : "검사 상세"}
              </DrawerTitle>

              <CloseButton
                type="button"
                aria-label="상세 닫기"
                onClick={closeDetail}
              >
                <FiX size={22} />
              </CloseButton>
            </DrawerHeader>

            <DrawerBody>
              <DrawerSection>
                <SectionTitle>검사 정보</SectionTitle>

                <DetailCard>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>검사 일시</DetailLabel>
                      <DetailValue>
                        {selectedRow.inspectedAt}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>판정</DetailLabel>
                      <ResultBadge $result={selectedRow.result}>
                        {selectedRow.result}
                      </ResultBadge>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>검사 작업자</DetailLabel>
                      <DetailValue>
                        {selectedRow.workerName}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>작업지시 번호</DetailLabel>
                      <DetailValue>
                        {selectedRow.workOrderNo}
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </DrawerSection>

              <DrawerSection>
                <SectionTitle>LOT 및 제품 정보</SectionTitle>

                <DetailCard>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>LOT 번호</DetailLabel>
                      <DetailValue>{selectedRow.lotNo}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>제품명</DetailLabel>
                      <DetailValue>
                        {selectedRow.productName}
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </DrawerSection>

              <DrawerSection>
                <SectionTitle>공정 및 설비 정보</SectionTitle>

                <DetailCard>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>공정 코드</DetailLabel>
                      <DetailValue>
                        {selectedRow.processCode}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>공정명</DetailLabel>
                      <DetailValue>
                        {selectedRow.processName}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>설비 코드</DetailLabel>
                      <DetailValue>
                        {selectedRow.machineCode}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>설비명</DetailLabel>
                      <DetailValue>
                        {selectedRow.machineName}
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </DrawerSection>

              <DrawerSection>
                <SectionTitle>측정 정보</SectionTitle>

                <DetailCard>
                  {selectedRow.measurements?.length > 0 ? (
                    <DetailGrid>
                      {selectedRow.measurements.map((measurement) => (
                        <DetailItem key={measurement.measurementCode}>
                          <DetailLabel>
                            {MEASUREMENT_LABELS[measurement.measurementCode] || measurement.measurementCode}
                          </DetailLabel>
                          <DetailValue>
                            {measurement.measuredValue}
                            {measurement.unit ? ` ${measurement.unit}` : ""}
                          </DetailValue>
                        </DetailItem>
                      ))}
                    </DetailGrid>
                  ) : (
                    <DetailValue>측정값이 없습니다.</DetailValue>
                  )}
                </DetailCard>
              </DrawerSection>

              {selectedRow.result === "NG" && (
                <DrawerSection>
                  <SectionTitle>불량 정보</SectionTitle>

                  <DefectCard>
                    <DetailGrid>
                      <DetailItem>
                        <DetailLabel>불량 코드</DetailLabel>
                        <DetailValue>
                          {selectedRow.defectCode}
                        </DetailValue>
                      </DetailItem>

                      <DetailItem>
                        <DetailLabel>불량 유형</DetailLabel>
                        <DetailValue>
                          {selectedRow.defectType}
                        </DetailValue>
                      </DetailItem>

                      <DetailItem>
                        <DetailLabel>불량 수량</DetailLabel>
                        <DetailValue>
                          {selectedRow.defectQty}
                        </DetailValue>
                      </DetailItem>

                      <DetailItem>
                        <DetailLabel>최근 발생 시각</DetailLabel>
                        <DetailValue>
                          {selectedRow.inspectedAt}
                        </DetailValue>
                      </DetailItem>
                    </DetailGrid>
                  </DefectCard>
                </DrawerSection>
              )}
            </DrawerBody>
          </>
        )}
      </Drawer>
    </>
  );
}

export default QualityPage;
