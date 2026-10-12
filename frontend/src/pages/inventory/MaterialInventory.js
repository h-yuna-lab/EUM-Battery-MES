import { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import {
  FiAlertTriangle,
  FiPackage,
  FiPlus,
  FiShield,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import DonutChart from "../../components/ui/DonutChart";
import UiButton from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import SummaryCard from "../../components/ui/SummaryCard";
import inventoryApi from "../../api/inventory";
import AuthContext from "../../context/AuthContext";

const TABLE_COLUMNS = [
  { key: "number", label: "No", width: 70, align: "center" },
  { key: "code", label: "자재 코드", width: 190, align: "center" },
  { key: "name", label: "자재명" },
  { key: "stock", label: "재고", align: "center" },
  { key: "safetyStock", label: "안전재고", align: "center" },
  { key: "unit", label: "단위", width: 70, align: "center" },
  { key: "status", label: "재고 상태", align: "center" },
  { key: "lastInboundAt", label: "최근 입고일자", width: 170, align: "center" },
  { key: "registeredAt", label: "자재등록일자", width: 130, align: "center" },
];

const EMPTY_SUMMARY = { total: 0, safe: 0, warning: 0, danger: 0 };

const formatNumber = (value) => Number(value).toLocaleString();

const Page = styled.div`
  min-height: 100%;
  padding: var(--page-container-padding);
  box-sizing: border-box;
  background: #f7f8fa;
`;

const PageHeader = styled.header`
  margin-bottom: var(--page-header-content-gap);
`;

const PageTitle = styled.h1`
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  line-height: var(--page-title-line-height);
  font-weight: var(--page-title-weight);
  letter-spacing: var(--page-title-letter-spacing);
`;

const PageDescription = styled.p`
  margin: var(--page-title-subtitle-gap) 0 0;
  color: var(--page-subtitle-color);
  font-size: var(--page-subtitle-size);
  font-weight: var(--page-subtitle-weight);
  line-height: var(--page-subtitle-line-height);
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, 1.35fr) minmax(460px, 1fr);
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  padding: var(--page-panel-padding);
  background: #fff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

const ChartPanel = styled(Panel)`
  min-height: 270px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--page-box-gap);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const InventorySummaryCard = styled(SummaryCard)`
  flex-direction: row;
  align-items: center;
`;

const FilterPanel = styled(Panel)`
  margin-bottom: var(--page-section-gap);
`;

const TablePanel = styled.section`
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
`;

const TableHeader = styled.div`
  min-height: 62px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e6ed;
`;

const ResultText = styled.span`
  color: #737b88;
  font-size: 13px;

  strong { color: #0755d9; }
`;

const Code = styled.strong`
  color: #174b9c;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  min-width: 72px;
  padding: 5px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  border-radius: 999px;
  color: ${({ $status }) => $status === "safe" ? "#118951" : $status === "warning" ? "#ad7000" : "#d92d34"};
  background: ${({ $status }) => $status === "safe" ? "#e7f8ee" : $status === "warning" ? "#fff5df" : "#fdebec"};
  font-size: 12px;
  font-weight: 600;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(17, 24, 39, 0.46);
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: ${({ $open }) => $open ? "0" : "-600px"};
  z-index: 901;
  width: 600px;
  max-width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fb;
  border-left: 1px solid #d8dee9;
  box-shadow: -8px 0 28px rgba(15, 23, 42, 0.16);
  transition: right 0.25s ease;
`;

const DrawerHeader = styled.header`
  min-height: 70px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #dfe3eb;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 19px;
  color: #20252d;
`;

const IconButton = styled(UiButton)`
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
  &:hover { background: #eef1f5; }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 22px 24px 30px;
`;

const DetailSection = styled.section`
  margin-bottom: 22px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid #0755d9;
  color: #252a32;
  font-size: 15px;
`;

const DetailCard = styled.div`
  padding: 18px;
  background: #fff;
  border: 1px solid #dfe4eb;
  border-radius: 10px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 24px;
`;

const DetailItem = styled.div`
  min-width: 0;
  ${({ $full }) => $full && "grid-column: 1 / -1;"}
`;

const DetailLabel = styled.span`
  display: block;
  margin-bottom: 6px;
  color: #858d99;
  font-size: 12px;
`;

const DetailValue = styled.strong`
  color: #252a32;
  font-size: 14px;
  font-weight: 600;
`;

const MiniTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 8px;

  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid #e2e6ed;
    font-size: 12px;
    text-align: left;
  }
  th { background: #eef1f5; color: #59616e; }
  td { background: #fff; color: #2d333b; }
`;

const DrawerFooter = styled.footer`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fff;
  border-top: 1px solid #dfe3eb;
`;

const ActionButton = styled(UiButton)`
  height: 40px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: ${({ $primary }) => $primary ? "0" : "1px solid #d2d8e1"};
  border-radius: 7px;
  background: ${({ $primary }) => $primary ? "#0755d9" : "#fff"};
  color: ${({ $primary }) => $primary ? "#fff" : "#4b5563"};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1001;
  width: 410px;
  max-width: calc(100% - 32px);
  padding: 24px;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
`;

const ModalTitle = styled.h2`
  margin: 0 0 20px;
  color: #20252d;
  font-size: 21px;
`;

const MaterialSummary = styled.div`
  margin-bottom: 18px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  background: #f6f7f9;
  border-radius: 8px;
  color: #5f6773;
  font-size: 13px;
  strong { color: #22272f; }
`;

const ModalLabel = styled.label`
  display: block;
  margin-bottom: 7px;
  color: #555d69;
  font-size: 13px;
  font-weight: 600;
`;

const QuantityInput = styled.input`
  width: 100%;
  height: 46px;
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid #cbd2df;
  border-radius: 8px;
  outline: none;
  font-size: 15px;
  &:focus { border-color: #0755d9; box-shadow: 0 0 0 2px rgba(7, 85, 217, 0.09); }
`;

const ModalActions = styled.div`
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

function MaterialInventory() {
  const { user } = useContext(AuthContext);

  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", keyword: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [inboundOpen, setInboundOpen] = useState(false);
  const [inboundQuantity, setInboundQuantity] = useState("");
  const itemsPerPage = 8;

  const loadInventory = async (activeFilters, { silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const [materialsRes, summaryRes] = await Promise.all([
        inventoryApi.getMaterials(activeFilters),
        inventoryApi.getMaterialSummary(activeFilters),
      ]);
      setMaterials(materialsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.warn("자재 재고 조회 실패:", error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // 필터가 바뀔 때마다 목록/요약을 함께 조회한다 (materials, materials/summary 동일 필터 지원)
  useEffect(() => {
    setCurrentPage(1);
    loadInventory(filters);
    const intervalId = window.setInterval(() => {
      loadInventory(filters, { silent: true });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (values) => {
    setFilters(values);
    setCurrentPage(1);
  };

  const closeDrawer = () => {
    setSelectedMaterial(null);
    setInboundOpen(false);
    setInboundQuantity("");
  };

  const openInbound = () => {
    setInboundQuantity("");
    setInboundOpen(true);
  };

  const confirmInbound = async () => {
    const quantity = Number(inboundQuantity);
    if (!selectedMaterial || !Number.isFinite(quantity) || quantity <= 0) return;

    try {
      const response = await inventoryApi.inboundMaterial(selectedMaterial.id, {
        quantity,
        employeeId: user?.employeeId ?? null,
      });
      const updatedMaterial = response.data;

      setMaterials((previous) =>
        previous.map((item) => (item.id === updatedMaterial.id ? updatedMaterial : item))
      );
      setSelectedMaterial(updatedMaterial);
      setInboundOpen(false);
      setInboundQuantity("");

      // 입고로 안전/주의/경고 건수가 바뀔 수 있으므로 요약도 다시 조회
      const summaryRes = await inventoryApi.getMaterialSummary(filters);
      setSummary(summaryRes.data);
    } catch (error) {
      console.warn("자재 입고 처리 실패:", error);
    }
  };

  const statusInfo = (material) => {
    const status = material.status;
    if (status === "safe") return { status, label: "안전", icon: <FiShield /> };
    if (status === "warning") return { status, label: "주의", icon: <FiAlertTriangle /> };
    return { status: "danger", label: "경고", icon: <FiXCircle /> };
  };

  const lotStatusInfo = (status) => {
    if (status === "IN_USE") return { status: "safe", label: "사용중" };
    if (status === "DEFECT") return { status: "danger", label: "재고 소진" };
    return { status: "warning", label: "대기" };
  };

  const tableRows = materials.map((material, index) => {
    const info = statusInfo(material);
    return {
      id: material.id,
      material,
      number: index + 1,
      code: <Code>{material.code}</Code>,
      name: material.name,
      stock: formatNumber(material.stock),
      safetyStock: formatNumber(material.safetyStock),
      unit: material.unit,
      status: <StatusBadge $status={info.status}>{info.icon}{info.label}</StatusBadge>,
      lastInboundAt: material.lastInboundAt,
      registeredAt: material.registeredAt,
    };
  });

  return (
    <>
      <Page>
        <PageHeader>
          <PageTitle>자재 재고 관리</PageTitle>
          <PageDescription>자재별 현재 재고와 안전재고를 비교하고 입고 및 LOT 현황을 관리합니다.</PageDescription>
        </PageHeader>

        <OverviewGrid>
          <ChartPanel>
            <PanelTitle>자재 재고 상태</PanelTitle>
            <DonutChart
              data={[
                { name: "안전", value: summary.safe, color: "#19b968" },
                { name: "주의", value: summary.warning, color: "#f59e0b" },
                { name: "경고", value: summary.danger, color: "#ef4444" },
              ]}
              height={210}
              chartSize={180}
              innerRadius={58}
              outerRadius={78}
              total={summary.total}
              totalLabel="전체 자재"
              legendPosition="right"
              justifyContent="center"
              showTooltip
              valueFormatter={formatNumber}
            />
          </ChartPanel>

          <SummaryGrid>
            <InventorySummaryCard height={128} gap={14} icon={<FiPackage />} iconBoxSize={50} iconSize={24} title="전체 자재" titleFontSize={13} value={summary.total} valueFontSize={25} />
            <InventorySummaryCard height={128} gap={14} icon={<FiShield />} iconBoxSize={50} iconSize={24} iconBackground="#e7f8ee" iconColor="#16a461" title="안전" titleFontSize={13} value={summary.safe} valueFontSize={25} />
            <InventorySummaryCard height={128} gap={14} icon={<FiAlertTriangle />} iconBoxSize={50} iconSize={24} iconBackground="#fff5df" iconColor="#e39400" title="주의" titleFontSize={13} value={summary.warning} valueFontSize={25} />
            <InventorySummaryCard height={128} gap={14} icon={<FiXCircle />} iconBoxSize={50} iconSize={24} iconBackground="#fdebec" iconColor="#d92d34" title="경고(품절)" titleFontSize={13} value={summary.danger} valueFontSize={25} />
          </SummaryGrid>
        </OverviewGrid>

        <FilterPanel>
          <PanelTitle>자재 재고 검색</PanelTitle>
          <SearchFilterBar
            defaultValues={filters}
            startDateLabel="시작일"
            endDateLabel="종료일"
            dateWidth={145}
            filters={[{ name: "status", label: "재고 상태", placeholder: "전체 상태", width: 150, options: [
              { value: "safe", label: "안전" },
              { value: "warning", label: "주의" },
              { value: "danger", label: "경고(품절)" },
            ] }]}
            keywordLabel="통합 검색"
            keywordPlaceholder="자재명 / 자재코드 검색"
            keywordWidth={220}
            flexWrap="nowrap"
            inputHeight={38}
            padding={0}
            border="none"
            showSearchButton={false}
            resetButtonText="초기화"
            onChange={handleFilterChange}
          />
        </FilterPanel>

        <TablePanel>
          <TableHeader>
            <PanelTitle style={{ margin: 0 }}>자재별 재고 현황</PanelTitle>
            <ResultText>조회 결과 <strong>{materials.length}</strong>건</ResultText>
          </TableHeader>
          <Pagination
            columns={TABLE_COLUMNS}
            rows={tableRows}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            visiblePages={5}
            background="#ffffff"
            borderTop="1px solid #e2e6ed"
            onPageChange={setCurrentPage}
            onRowClick={(row) => setSelectedMaterial(row.material)}
            tableProps={{
              emptyText: isLoading
                ? "자재 재고를 불러오는 중입니다..."
                : "조건에 맞는 자재가 없습니다.",
              tableLayout: "fixed",
              headerBackground: "#f1f3f6",
            }}
          />
        </TablePanel>
      </Page>

      {selectedMaterial && <Overlay onClick={closeDrawer} />}
      <Drawer $open={Boolean(selectedMaterial)}>
        {selectedMaterial && <>
          <DrawerHeader><DrawerTitle>자재 재고 상세 조회</DrawerTitle><IconButton type="button" aria-label="상세 닫기" onClick={closeDrawer}><FiX size={22} /></IconButton></DrawerHeader>
          <DrawerBody>
            <DetailSection>
              <SectionTitle>자재 정보</SectionTitle>
              <DetailCard><DetailGrid>
                <DetailItem $full><DetailLabel>자재코드</DetailLabel><DetailValue>{selectedMaterial.code}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>자재명</DetailLabel><DetailValue>{selectedMaterial.name}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>자재등록일자</DetailLabel><DetailValue>{selectedMaterial.registeredAt}</DetailValue></DetailItem>
              </DetailGrid></DetailCard>
            </DetailSection>
            <DetailSection>
              <SectionTitle>재고 정보</SectionTitle>
              <DetailCard><DetailGrid>
                <DetailItem><DetailLabel>현재 재고</DetailLabel><DetailValue>{formatNumber(selectedMaterial.stock)}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>안전재고</DetailLabel><DetailValue>{formatNumber(selectedMaterial.safetyStock)}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>단위</DetailLabel><DetailValue>{selectedMaterial.unit}</DetailValue></DetailItem>
                <DetailItem><DetailLabel>재고 상태</DetailLabel><StatusBadge $status={statusInfo(selectedMaterial).status}>{statusInfo(selectedMaterial).icon}{statusInfo(selectedMaterial).label}</StatusBadge></DetailItem>
                <DetailItem $full><DetailLabel>최근 입고일자</DetailLabel><DetailValue>{selectedMaterial.lastInboundAt}</DetailValue></DetailItem>
              </DetailGrid></DetailCard>
            </DetailSection>
            <DetailSection>
              <SectionTitle>LOT별 재고 현황</SectionTitle>
              <MiniTable>
                <thead><tr><th>LOT 번호</th><th>입고일</th><th>잔량</th><th>상태</th></tr></thead>
                <tbody>
                  {selectedMaterial.lots?.length ? (
                    selectedMaterial.lots.map((lot) => {
                      const info = lotStatusInfo(lot.status);
                      return (
                        <tr key={lot.id}>
                          <td>{lot.lotNo}</td>
                          <td>{lot.inboundAt}</td>
                          <td>{formatNumber(lot.currentQuantity)} {selectedMaterial.unit}</td>
                          <td><StatusBadge $status={info.status}>{info.label}</StatusBadge></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={4}>등록된 LOT이 없습니다.</td></tr>
                  )}
                </tbody>
              </MiniTable>
            </DetailSection>
          </DrawerBody>
          <DrawerFooter><ActionButton type="button" variant="outline" onClick={closeDrawer}>닫기</ActionButton><ActionButton type="button" $primary onClick={openInbound}><FiPlus /> 입고 등록</ActionButton></DrawerFooter>
        </>}
      </Drawer>

      {inboundOpen && selectedMaterial && <><Overlay style={{ zIndex: 1000 }} onClick={() => setInboundOpen(false)} /><Modal role="dialog" aria-modal="true" aria-labelledby="inbound-title">
        <ModalTitle id="inbound-title">자재 입고 처리</ModalTitle>
        <MaterialSummary><span>자재명<br /><strong>{selectedMaterial.name}</strong></span><span>현재고<br /><strong>{formatNumber(selectedMaterial.stock)} {selectedMaterial.unit}</strong></span></MaterialSummary>
        <ModalLabel htmlFor="inbound-quantity">입고 수량 입력</ModalLabel>
        <QuantityInput id="inbound-quantity" type="number" min="1" value={inboundQuantity} placeholder="수량을 입력하세요" onChange={(event) => setInboundQuantity(event.target.value)} onKeyDown={(event) => event.key === "Enter" && confirmInbound()} autoFocus />
        <ModalActions><ActionButton type="button" variant="outline" onClick={() => setInboundOpen(false)}>취소</ActionButton><ActionButton type="button" $primary disabled={!Number(inboundQuantity) || Number(inboundQuantity) <= 0} onClick={confirmInbound}>입고 확정</ActionButton></ModalActions>
      </Modal></>}
    </>
  );
}

export default MaterialInventory;
