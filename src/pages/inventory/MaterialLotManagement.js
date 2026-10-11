import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  FiAlertTriangle,
  FiEdit3,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import UiButton from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import SummaryCard from "../../components/ui/SummaryCard";
import inventoryApi from "../../api/inventory";

const EMPTY_SUMMARY = { total: 0, inUse: 0, waiting: 0, defect: 0 };

const STATUS_META = {
  WAITING: { label: "생산 대기", color: "#ad7000", background: "#fff5df" },
  IN_USE: { label: "생산중(투입)", color: "#16925a", background: "#e8f8ef" },
  DEFECT: { label: "재고 소진", color: "#d94852", background: "#fdecee" },
};

const formatNumber = (value) => Number(value).toLocaleString();

const Page = styled.div`min-height: 100%; padding: var(--page-container-padding); box-sizing: border-box; background: #f7f8fa;`;
const Header = styled.header`margin-bottom: var(--page-header-content-gap);`;
const Title = styled.h1`margin: 0; color: var(--page-title-color); font-size: var(--page-title-size); line-height: var(--page-title-line-height); font-weight: var(--page-title-weight); letter-spacing: var(--page-title-letter-spacing);`;
const Description = styled.p`margin: var(--page-title-subtitle-gap) 0 0; color: var(--page-subtitle-color); font-size: var(--page-subtitle-size); font-weight: var(--page-subtitle-weight); line-height: var(--page-subtitle-line-height);`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);
  @media (max-width: 1050px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 620px) { grid-template-columns: 1fr; }
`;

const LotSummaryCard = styled(SummaryCard)`flex-direction: row; align-items: center;`;

const Panel = styled.section`padding: var(--page-panel-padding); background: #fff; border: 1px solid #dce1ea; border-radius: 12px;`;
const PanelTitle = styled.h2`margin: 0 0 14px; color: #292d35; font-size: 16px; font-weight: 600;`;
const FilterPanel = styled(Panel)`margin-bottom: var(--page-section-gap);`;
const TablePanel = styled.section`overflow: hidden; background: #fff; border: 1px solid #dce1ea; border-radius: 12px;`;
const TableTop = styled.div`min-height: 62px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e6ed;`;
const ResultText = styled.span`color: #737b88; font-size: 13px; strong { color: #0755d9; }`;
const StatusBadge = styled.span`
  min-width: 92px; padding: 5px 10px; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  box-sizing: border-box; border-radius: 999px; color: ${({ $status }) => STATUS_META[$status].color};
  background: ${({ $status }) => STATUS_META[$status].background}; font-size: 12px; font-weight: 600;
`;

const LotNumber = styled.strong`color: #174b9c; font-weight: 600;`;

const RateCell = styled.div`width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;`;
const RateTrack = styled.span`width: 70px; height: 7px; overflow: hidden; flex-shrink: 0; background: #e7e9ed; border-radius: 999px;`;
const RateFill = styled.span`display: block; width: ${({ $rate }) => `${Math.min(100, $rate)}%`}; height: 100%; background: ${({ $rate }) => $rate >= 95 ? "#ef4444" : "#0755d9"}; border-radius: inherit;`;
const RateText = styled.span`color: #535b68; font-size: 12px; text-align: center; white-space: nowrap; min-width: 30px;`;
const Overlay = styled.div`position: fixed; inset: 0; z-index: 900; background: rgba(17, 24, 39, 0.46);`;
const Drawer = styled.aside`
  position: fixed; top: 0; right: ${({ $open }) => $open ? "0" : "-600px"}; z-index: 901; width: 600px; max-width: 100%; height: 100vh;
  display: flex; flex-direction: column; background: #f8f9fb; border-left: 1px solid #d8dee9; box-shadow: -8px 0 28px rgba(15, 23, 42, 0.16); transition: right 0.25s ease;
`;
const DrawerHeader = styled.header`min-height: 70px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #dfe3eb;`;
const DrawerTitle = styled.h2`margin: 0; color: #20252d; font-size: 19px;`;
const CloseButton = styled(UiButton)`width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: #505968; cursor: pointer; &:hover { background: #eef1f5; }`;
const DrawerBody = styled.div`flex: 1; overflow-y: auto; padding: 22px 24px 32px;`;
const Section = styled.section`margin-bottom: 22px;`;
const SectionTitle = styled.h3`margin: 0 0 12px; padding-left: 10px; border-left: 3px solid #0755d9; color: #252a32; font-size: 15px;`;
const DetailCard = styled.div`padding: 18px; background: #fff; border: 1px solid #dfe4eb; border-radius: 10px;`;
const DetailGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 24px;`;
const DetailItem = styled.div`min-width: 0; ${({ $full }) => $full && "grid-column: 1 / -1;"}`;
const DetailLabel = styled.span`display: block; margin-bottom: 6px; color: #858d99; font-size: 12px;`;
const DetailValue = styled.strong`color: #252a32; font-size: 14px; font-weight: 600; overflow-wrap: anywhere;`;

const MiniTable = styled.table`
  width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 8px;
  th, td { padding: 10px 12px; border-bottom: 1px solid #e2e6ed; font-size: 12px; text-align: left; }
  th { background: #eef1f5; color: #59616e; }
  td { background: #fff; color: #2d333b; }
`;

function MaterialLotManagement() {
  const [lots, setLots] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", keyword: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState(null);
  const itemsPerPage = 8;

  const loadLots = async (activeFilters, { silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const [lotsRes, summaryRes] = await Promise.all([
        inventoryApi.getLots(activeFilters),
        inventoryApi.getLotSummary(activeFilters),
      ]);
      setLots(lotsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.warn("원료 LOT 조회 실패:", error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // 필터가 바뀔 때마다 LOT 목록/요약을 함께 조회한다 (lots, lots/summary 동일 필터 지원)
  useEffect(() => {
    setCurrentPage(1);
    loadLots(filters);
    const intervalId = window.setInterval(() => {
      loadLots(filters, { silent: true });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const changeFilters = (values) => { setFilters(values); setCurrentPage(1); };

  const lotColumns = [
    { key: "id", label: "No", width: 70 },
    { key: "inboundAt", label: "입고일자", width: 170 },
    {
      key: "status",
      label: "LOT 상태",
      width: 140,
      render: (status) => <StatusBadge $status={status}><span>⌛</span>{STATUS_META[status].label}</StatusBadge>,
    },
    { key: "lotNo", label: "LOT번호", width: 190, render: (lotNo) => <LotNumber>{lotNo}</LotNumber> },
    { key: "materialCode", label: "자재코드", width: 190 },
    { key: "materialName", label: "자재명", width: 110 },
    { key: "totalStock", label: "총 재고", width: 90, render: formatNumber },
    { key: "consumed", label: "생산투입", width: 90, render: formatNumber },
    {
      key: "consumptionRate",
      label: "자재 소진율",
      width: 170,
      align: "center",
      render: (_, lot) => {
        const rate = lot.consumptionRate;
        return <RateCell><RateTrack><RateFill $rate={rate} /></RateTrack><RateText>{rate}%</RateText></RateCell>;
      },
    },
  ];

  return <>
    <Page>
      <Header><Title>원료 LOT 관리</Title><Description>자재 LOT별 입고, 생산 투입 및 소진 현황을 추적하고 관리합니다.</Description></Header>

      <SummaryGrid>
        <LotSummaryCard height={116} gap={14} icon={<FiEdit3 />} iconBoxSize={50} iconSize={24} iconBackground="#e8efff" iconColor="#0755d9" title="전체 LOT" titleFontSize={13} value={summary.total} valueFontSize={25} />
        <LotSummaryCard height={116} gap={14} icon={<FiRefreshCw />} iconBoxSize={50} iconSize={24} iconBackground="#e8f8ef" iconColor="#18a860" title="생산중(투입)" titleFontSize={13} value={summary.inUse} valueFontSize={25} />
        <LotSummaryCard height={116} gap={14} icon={<span style={{ fontSize: 23 }}>⌛</span>} iconBoxSize={50} iconSize={24} iconBackground="#fff5df" iconColor="#e39400" title="대기중" titleFontSize={13} value={summary.waiting} valueFontSize={25} />
        <LotSummaryCard height={116} gap={14} icon={<FiAlertTriangle />} iconBoxSize={50} iconSize={24} iconBackground="#fdecee" iconColor="#e34b55" title="재고 소진" titleFontSize={13} value={summary.defect} valueFontSize={25} />
      </SummaryGrid>

      <FilterPanel>
        <PanelTitle>원료 LOT 검색</PanelTitle>
        <SearchFilterBar
          defaultValues={filters}
          startDateLabel="시작일"
          endDateLabel="종료일"
          dateWidth={145}
          filters={[{ name: "status", label: "LOT 상태", placeholder: "전체 상태", width: 160, options: [
            { value: "WAITING", label: "생산 대기" }, { value: "IN_USE", label: "생산중(투입)" }, { value: "DEFECT", label: "재고 소진" },
          ] }]}
          keywordLabel="통합 검색"
          keywordPlaceholder="LOT번호 / 자재명 / 자재코드 검색"
          keywordWidth={220}
          flexWrap="nowrap"
          inputHeight={38}
          padding={0}
          border="none"
          showSearchButton={false}
          resetButtonText="초기화"
          onChange={changeFilters}
        />
      </FilterPanel>

      <TablePanel>
        <TableTop><PanelTitle style={{ margin: 0 }}>원료 LOT 현황</PanelTitle><ResultText>조회 결과 <strong>{lots.length}</strong>건</ResultText></TableTop>
        <Pagination
          columns={lotColumns}
          rows={lots}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          visiblePages={5}
          background="#ffffff"
          borderTop="1px solid #e2e6ed"
          onPageChange={setCurrentPage}
          onRowClick={setSelectedLot}
          tableProps={{
            emptyText: isLoading
              ? "원료 LOT을 불러오는 중입니다..."
              : "조건에 맞는 LOT이 없습니다.",
            tableLayout: "fixed",
            headerBackground: "#f1f3f6",
          }}
        />
      </TablePanel>
    </Page>

    {selectedLot && <Overlay onClick={() => setSelectedLot(null)} />}
    <Drawer $open={Boolean(selectedLot)}>{selectedLot && <>
      <DrawerHeader><DrawerTitle>원료 LOT 상세 조회</DrawerTitle><CloseButton type="button" aria-label="상세 닫기" onClick={() => setSelectedLot(null)}><FiX size={22} /></CloseButton></DrawerHeader>
      <DrawerBody>
        <Section><SectionTitle>LOT 정보</SectionTitle><DetailCard><DetailGrid>
          <DetailItem $full><DetailLabel>LOT 번호</DetailLabel><DetailValue>{selectedLot.lotNo}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>LOT 상태</DetailLabel><StatusBadge $status={selectedLot.status}><span>⌛</span>{STATUS_META[selectedLot.status].label}</StatusBadge></DetailItem>
          <DetailItem><DetailLabel>최초 입고일</DetailLabel><DetailValue>{selectedLot.inboundAt}</DetailValue></DetailItem>
        </DetailGrid></DetailCard></Section>
        <Section><SectionTitle>자재 정보</SectionTitle><DetailCard><DetailGrid>
          <DetailItem $full><DetailLabel>자재코드</DetailLabel><DetailValue>{selectedLot.materialCode}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>자재명</DetailLabel><DetailValue>{selectedLot.materialName}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>단위</DetailLabel><DetailValue>{selectedLot.unit}</DetailValue></DetailItem>
        </DetailGrid></DetailCard></Section>
        <Section><SectionTitle>재고 현황</SectionTitle><DetailCard><DetailGrid>
          <DetailItem><DetailLabel>총 입고 수량</DetailLabel><DetailValue>{formatNumber(selectedLot.totalStock)} {selectedLot.unit}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>생산 투입량</DetailLabel><DetailValue>{formatNumber(selectedLot.consumed)} {selectedLot.unit}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>현재고</DetailLabel><DetailValue>{formatNumber(selectedLot.remaining)} {selectedLot.unit}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>소진율</DetailLabel><DetailValue>{selectedLot.consumptionRate}%</DetailValue></DetailItem>
        </DetailGrid></DetailCard></Section>
        <Section><SectionTitle>투입 이력</SectionTitle>
          <MiniTable><thead><tr><th>일시</th><th>제품 LOT</th><th>수량</th></tr></thead><tbody>
            {selectedLot.usages?.length ? selectedLot.usages.map((usage, index) => (
              <tr key={index}><td>{usage.occurredAt}</td><td>{usage.productLotNo}</td><td>{formatNumber(usage.quantity)} {selectedLot.unit}</td></tr>
            )) : <tr><td colSpan="3" style={{ textAlign: "center", color: "#8a929e" }}>투입 이력이 없습니다.</td></tr>}
          </tbody></MiniTable>
        </Section>
        <Section><SectionTitle>최근 상태 변경일</SectionTitle><DetailCard><DetailValue>{selectedLot.updatedAt}</DetailValue></DetailCard></Section>
      </DrawerBody>
    </>}</Drawer>
  </>;
}

export default MaterialLotManagement;
