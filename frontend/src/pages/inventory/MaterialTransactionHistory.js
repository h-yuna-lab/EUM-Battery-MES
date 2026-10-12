import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiBox,
  FiRepeat,
  FiX,
} from "react-icons/fi";

import inventoryApi from "../../api/inventory";
import UiButton from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import SummaryCard from "../../components/ui/SummaryCard";

const initialFilters = {
  startDate: "",
  endDate: "",
  type: "",
  keyword: "",
};

const itemsPerPage = 8;

const formatNumber = (value) => Number(value ?? 0).toLocaleString();

const toNumber = (value) => Number(value ?? 0);

const typeLabel = (type) => (type === "INBOUND" ? "자재입고" : "생산투입");

function MaterialTransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    inbound: 0,
    consumption: 0,
    ratio: "0.0",
  });
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestParams = useMemo(
    () => ({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      type: filters.type || undefined,
      keyword: filters.keyword?.trim() || undefined,
    }),
    [filters],
  );

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const [transactionsResponse, summaryResponse] = await Promise.all([
          inventoryApi.getTransactions(requestParams),
          inventoryApi.getTransactionSummary(requestParams),
        ]);

        setTransactions(transactionsResponse.data ?? []);
        setSummary({
          inbound: toNumber(summaryResponse.data?.inbound),
          consumption: toNumber(summaryResponse.data?.consumption),
          ratio: Number(summaryResponse.data?.ratio ?? 0).toFixed(1),
        });
      } catch (error) {
        console.error("자재 입출고 이력 조회 실패:", error);
        window.alert("자재 입출고 이력을 불러오지 못했습니다.");
        setTransactions([]);
        setSummary({ inbound: 0, consumption: 0, ratio: "0.0" });
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [requestParams]);

  const changeFilters = (values) => {
    setFilters(values);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const transactionColumns = [
    { key: "occurredAt", label: "일시", width: 170, align: "center" },
    {
      key: "type",
      label: "구분",
      width: 120,
      align: "center",
      render: (type) => (
        <TypeBadge $type={type}>
          {type === "INBOUND" ? <FiBox /> : <FiArrowUpCircle />}
          {typeLabel(type)}
        </TypeBadge>
      ),
    },
    { key: "materialName", label: "자재명", width: 100, align: "center" },
    {
      key: "productLotNo",
      label: "제품 LOT",
      width: 165,
      align: "center",
      render: (lotNo) => (lotNo === "-" ? "-" : <LotNumber>{lotNo}</LotNumber>),
    },
    {
      key: "materialLotNo",
      label: "자재 LOT 번호",
      width: 190,
      align: "center",
      render: (lotNo) => <LotNumber>{lotNo || "-"}</LotNumber>,
    },
    {
      key: "processName",
      label: "투입 공정",
      width: 120,
      align: "center",
      render: (processName) => processName || "-",
    },
    {
      key: "quantity",
      label: "이동수량",
      width: 90,
      align: "center",
      render: (quantity, item) => (
        <Quantity $type={item.type}>
          {item.type === "INBOUND" ? "+" : "-"}{formatNumber(quantity)}
        </Quantity>
      ),
    },
    { key: "unit", label: "단위", width: 60, align: "center" },
    { key: "worker", label: "작업자", width: 90, align: "center" },
  ];

  return (
    <>
      <Page>
        <Header>
          <Title>자재 입출고 이력 조회</Title>
          <Description>
            자재 LOT별 입고와 생산 투입 내역, 재고 증감 이력을 조회합니다.
          </Description>
        </Header>

        <SummaryGrid>
          <TransactionSummaryCard
            height={116}
            gap={14}
            icon={<FiArrowDownCircle />}
            iconBoxSize={50}
            iconSize={24}
            iconBackground="#e8f8ef"
            iconColor="#18a860"
            title="입고된 자재 수량"
            titleFontSize={13}
            value={formatNumber(summary.inbound)}
            valueFontSize={25}
          />
          <TransactionSummaryCard
            height={116}
            gap={14}
            icon={<FiArrowUpCircle />}
            iconBoxSize={50}
            iconSize={24}
            iconBackground="#fdecee"
            iconColor="#e34b55"
            title="생산 투입"
            titleFontSize={13}
            value={formatNumber(summary.consumption)}
            valueFontSize={25}
          />
          <TransactionSummaryCard
            height={116}
            gap={14}
            icon={<FiRepeat />}
            iconBoxSize={50}
            iconSize={24}
            iconBackground="#e8efff"
            iconColor="#0755d9"
            title="입출고 비율 (투입/입고)"
            titleFontSize={13}
            value={`${summary.ratio}%`}
            valueFontSize={25}
          />
        </SummaryGrid>

        <FilterPanel>
          <PanelTitle>입출고 이력 검색</PanelTitle>
          <SearchFilterBar
            defaultValues={filters}
            startDateLabel="시작일"
            endDateLabel="종료일"
            dateWidth={145}
            filters={[
              {
                name: "type",
                label: "구분",
                placeholder: "전체 구분",
                width: 150,
                options: [
                  { value: "INBOUND", label: "자재입고" },
                  { value: "CONSUMPTION", label: "생산투입" },
                ],
              },
            ]}
            keywordLabel="통합 검색"
            keywordPlaceholder="자재명 / 자재 LOT / 제품 LOT 검색"
            keywordWidth={220}
            flexWrap="nowrap"
            inputHeight={38}
            padding={0}
            border="none"
            showSearchButton={false}
            resetButtonText="초기화"
            onChange={changeFilters}
            onReset={resetFilters}
          />
        </FilterPanel>

        <TablePanel>
          <TableTop>
            <PanelTitle style={{ margin: 0 }}>자재 입출고 이력</PanelTitle>
            <ResultText>
              조회 결과 <strong>{transactions.length}</strong>건
              {isLoading ? " 불러오는 중" : ""}
            </ResultText>
          </TableTop>
          <Pagination
            columns={transactionColumns}
            rows={transactions}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            visiblePages={7}
            background="#ffffff"
            borderTop="1px solid #e2e6ed"
            onPageChange={setCurrentPage}
            onRowClick={setSelectedTransaction}
            tableProps={{
              tableLayout: "fixed",
              headerBackground: "#f1f3f6",
            }}
          />
        </TablePanel>
      </Page>

      {selectedTransaction && (
        <Overlay onClick={() => setSelectedTransaction(null)} />
      )}
      <Drawer $open={Boolean(selectedTransaction)}>
        {selectedTransaction && (
          <>
            <DrawerHeader>
              <DrawerTitle>자재 입출고 이력 상세 조회</DrawerTitle>
              <CloseButton
                type="button"
                aria-label="상세 닫기"
                onClick={() => setSelectedTransaction(null)}
              >
                <FiX size={22} />
              </CloseButton>
            </DrawerHeader>
            <DrawerBody>
              <Section>
                <SectionTitle>입출고 정보</SectionTitle>
                <DetailCard>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>구분</DetailLabel>
                      <TypeBadge $type={selectedTransaction.type}>
                        {selectedTransaction.type === "INBOUND" ? (
                          <FiBox />
                        ) : (
                          <FiArrowUpCircle />
                        )}
                        {typeLabel(selectedTransaction.type)}
                      </TypeBadge>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>일시</DetailLabel>
                      <DetailValue>{selectedTransaction.occurredAt}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>이동 수량</DetailLabel>
                      <DetailValue>
                        {formatNumber(selectedTransaction.quantity)}{" "}
                        {selectedTransaction.unit}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>제품 LOT 번호</DetailLabel>
                      <DetailValue>{selectedTransaction.productLotNo}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>투입 공정</DetailLabel>
                      <DetailValue>
                        {selectedTransaction.processName || "-"}
                        {selectedTransaction.processCode && selectedTransaction.processCode !== "-"
                          ? ` (${selectedTransaction.processCode})`
                          : ""}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem $full>
                      <DetailLabel>자재 LOT 번호</DetailLabel>
                      <DetailValue>{selectedTransaction.materialLotNo}</DetailValue>
                    </DetailItem>
                    <DetailItem $full>
                      <DetailLabel>재고 증감 (Before -> After)</DetailLabel>
                      <DetailValue>
                        {formatNumber(selectedTransaction.beforeStock)} ->{" "}
                        {formatNumber(selectedTransaction.afterStock)}
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </Section>
              <Section>
                <SectionTitle>자재 정보</SectionTitle>
                <DetailCard>
                  <DetailGrid>
                    <DetailItem $full>
                      <DetailLabel>자재코드</DetailLabel>
                      <DetailValue>{selectedTransaction.materialCode}</DetailValue>
                    </DetailItem>
                    <DetailItem $full>
                      <DetailLabel>자재명</DetailLabel>
                      <DetailValue>{selectedTransaction.materialName}</DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </Section>
              <Section>
                <SectionTitle>참조 정보</SectionTitle>
                <DetailCard>
                  <DetailGrid>
                    <DetailItem $full>
                      <DetailLabel>담당자</DetailLabel>
                      <DetailValue>{selectedTransaction.worker}</DetailValue>
                    </DetailItem>
                    <DetailItem $full>
                      <DetailLabel>비고</DetailLabel>
                      <DetailValue>{selectedTransaction.note}</DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailCard>
              </Section>
            </DrawerBody>
          </>
        )}
      </Drawer>
    </>
  );
}

const Page = styled.div`
  min-height: 100%;
  padding: var(--page-container-padding);
  box-sizing: border-box;
  background: #f7f8fa;
`;

const Header = styled.header`
  margin-bottom: var(--page-header-content-gap);
`;

const Title = styled.h1`
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  line-height: var(--page-title-line-height);
  font-weight: var(--page-title-weight);
  letter-spacing: var(--page-title-letter-spacing);
`;

const Description = styled.p`
  margin: var(--page-title-subtitle-gap) 0 0;
  color: var(--page-subtitle-color);
  font-size: var(--page-subtitle-size);
  font-weight: var(--page-subtitle-weight);
  line-height: var(--page-subtitle-line-height);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TransactionSummaryCard = styled(SummaryCard)`
  flex-direction: row;
  align-items: center;
`;

const Panel = styled.section`
  padding: var(--page-panel-padding);
  background: #fff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
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

const TableTop = styled.div`
  min-height: 62px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e6ed;
`;

const ResultText = styled.span`
  color: #737b88;
  font-size: 13px;

  strong {
    color: #0755d9;
  }
`;

const TypeBadge = styled.span`
  min-width: 82px;
  padding: 5px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  border-radius: 999px;
  color: ${({ $type }) => ($type === "INBOUND" ? "#16925a" : "#d94852")};
  background: ${({ $type }) =>
    $type === "INBOUND" ? "#e8f8ef" : "#fdecee"};
  font-size: 12px;
  font-weight: 600;
`;

const LotNumber = styled.strong`
  color: #174b9c;
  font-weight: 600;
`;

const Quantity = styled.strong`
  color: ${({ $type }) => ($type === "INBOUND" ? "#0755d9" : "#d94852")};
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
  right: ${({ $open }) => ($open ? "0" : "-600px")};
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
  color: #20252d;
  font-size: 19px;
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
  padding: 22px 24px 32px;
`;

const Section = styled.section`
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
  overflow-wrap: anywhere;
`;

export default MaterialTransactionHistory;
