import { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import WorkOrderNewEdit from "./WorkOrderNewEdit";
import WorkOrderDetail from "./WorkOrderDetail";

// 페이지에서 사용하는 아이콘
import { FiCheckCircle, FiClock, FiPlayCircle, FiPlus } from "react-icons/fi";

import CommonPagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SummaryCard from "../../components/ui/SummaryCard";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import FilterDatePicker from "../../components/ui/FilterDatePicker";
import inventoryApi from "../../api/inventory";
import masterApi from "../../api/master";
import productionApi from "../../api/production";
import AuthContext from "../../context/AuthContext";
import { hasMasterWritePermission } from "../../utils/masterPermissions";

// 백엔드 workOrderStatus(WAITING/IN_PROGRESS/COMPLETED) <-> 화면 한글 라벨
const STATUS_LABELS = {
  WAITING: "대기중",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
};

// 날짜 변환 함수
const formatDateTime = (value) => {
  if (!value) return "-";

  return value.replace("T", " ").slice(0, 16);
};

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const calculateProgressRate = (currentQty, targetQty) => {
  const target = toNumber(targetQty);
  if (target <= 0) return 0;

  return Math.min(100, Math.round((toNumber(currentQty) / target) * 100));
};

// WorkOrder 응답(id/bom.product.productName/managerEmployee.employeeName 등)을
// 화면 표시용 행으로 변환. createdAt은 실제 DB 컬럼이 없어 항상 빈 값.
const toWorkOrderRow = (order) => {
  const plannedQty = order.orderQuantity ?? order.targetQty ?? 0;
  const completedQty =
    order.currentQty ?? order.completedQuantity ?? (order.workOrderStatus === "COMPLETED" ? plannedQty : 0);

  return {
    workOrderId: order.id,
    workOrderNo: order.workOrderNo ?? "",
    productId: order.bom?.product?.id,
    productName: order.bom?.product?.productName ?? "",
    plannedQty,
    completedQty,
    progressRate: calculateProgressRate(completedQty, plannedQty),
    worker: order.managerEmployee?.employeeName ?? "",
    dueAt: order.dueDate ?? "",
    workOrderStatus: order.workOrderStatus ?? "",
    status: STATUS_LABELS[order.workOrderStatus] ?? order.workOrderStatus ?? "",
    startedAt: order.actualStartAt ?? null,
    completedAt: order.completedAt ?? null,
    createdAt: null,
  };
};

// 한 페이지에 표시할 개수
const PAGE_SIZE = 8;

// 등록 드로어 기본값 - 백엔드가 managerEmployeeId(세션)/workOrderStatus(WAITING 고정)를
// 자동 처리하므로 폼은 productId/plannedQty/dueAt만 받는다.
const EMPTY_ORDER_FORM = {
  productId: "",
  plannedQty: "",
  dueAt: "",
};

const INITIAL_FILTERS = {
  workOrderNo: "",
  workOrderStatus: "",
};

export default function WorkOrderList() {
  const { user } = useContext(AuthContext);
  const canManage = hasMasterWritePermission(user);

  // 전체 작업지시 목록
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [materialStocksById, setMaterialStocksById] = useState({});
  const [bomItemsByProductId, setBomItemsByProductId] = useState({});
  const [isStockCheckLoading, setIsStockCheckLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 실제 목록에 적용된 검색 조건 (workOrderNo/workOrderStatus는 SearchFilterBar가 관리)
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [dueDate, setDueDate] = useState("");

  // 현재 페이지
  const [page, setPage] = useState(1);

  // 작업지시 등록 사이드 드로어 열림 여부
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 상세 드로어에 표시할 작업지시
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 등록 입력값
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER_FORM);

  const loadOrders = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const response = await productionApi.getWorkOrders();
      setOrders(response.data.map(toWorkOrderRow));
    } catch (error) {
      console.error("작업지시 목록 조회 실패:", error);
      if (!silent) {
        window.alert("작업지시 목록을 불러오지 못했습니다.");
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const loadProducts = async () => {
    try {
      const response = await masterApi.getProducts();
      setProducts(response.data);
    } catch (error) {
      console.warn("제품 목록 조회 실패:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadProducts();
    const intervalId = window.setInterval(() => {
      loadOrders({ silent: true });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setSelectedOrder((currentOrder) => {
      if (!currentOrder) return currentOrder;

      const latestOrder = orders.find(
        (order) => order.workOrderId === currentOrder.workOrderId,
      );

      return latestOrder ?? currentOrder;
    });
  }, [orders]);

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) => String(product.id) === String(orderForm.productId),
      ),
    [products, orderForm.productId],
  );

  useEffect(() => {
    if (!drawerOpen) return;

    let ignore = false;

    const loadMaterialStocks = async () => {
      setIsStockCheckLoading(true);
      try {
        const response = await inventoryApi.getMaterials();
        if (ignore) return;

        setMaterialStocksById(
          Object.fromEntries(
            response.data.map((material) => [
              String(material.id),
              toNumber(material.stock),
            ]),
          ),
        );
      } catch (error) {
        console.error("자재 재고 조회 실패:", error);
        if (!ignore) {
          window.alert("자재 재고를 확인하지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsStockCheckLoading(false);
        }
      }
    };

    loadMaterialStocks();

    return () => {
      ignore = true;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || !selectedProduct?.id || bomItemsByProductId[selectedProduct.id]) {
      return;
    }

    let ignore = false;

    const loadBomItems = async () => {
      setIsStockCheckLoading(true);
      try {
        const response = await masterApi.getBomItems(selectedProduct.id);
        if (ignore) return;

        setBomItemsByProductId((prev) => ({
          ...prev,
          [selectedProduct.id]: response.data,
        }));
      } catch (error) {
        console.error("BOM 조회 실패:", error);
        if (!ignore) {
          window.alert("선택한 제품의 BOM을 확인하지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsStockCheckLoading(false);
        }
      }
    };

    loadBomItems();

    return () => {
      ignore = true;
    };
  }, [drawerOpen, selectedProduct?.id, bomItemsByProductId]);

  const stockValidation = useMemo(() => {
    if (!selectedProduct) {
      return { isBlocked: false, messages: [] };
    }

    if (!selectedProduct.bomId) {
      return {
        isBlocked: true,
        messages: ["선택한 제품에 연결된 BOM이 없어 등록할 수 없습니다."],
      };
    }

    const orderQuantity = toNumber(orderForm.plannedQty);
    if (orderQuantity <= 0) {
      return { isBlocked: false, messages: [] };
    }

    const bomItems = bomItemsByProductId[selectedProduct.id];
    if (!bomItems) {
      return { isBlocked: false, messages: [] };
    }

    if (bomItems.length === 0) {
      return {
        isBlocked: true,
        messages: ["선택한 제품에 등록된 BOM 자재가 없어 등록할 수 없습니다."],
      };
    }

    bomItems
      .map((item) => {
        const requiredQuantity = toNumber(item.requiredQuantity) * orderQuantity;
        const availableQuantity = materialStocksById[String(item.materialId)] ?? 0;

        if (availableQuantity >= requiredQuantity) {
          return null;
        }

        return `${item.materialName} 필요 ${requiredQuantity.toLocaleString("ko-KR")} ${item.unit || ""}, 현재 ${availableQuantity.toLocaleString("ko-KR")} ${item.unit || ""}`;
      })
      .filter(Boolean);

    const requiredByMaterialId = bomItems.reduce((acc, item) => {
      const materialId = String(item.materialId);
      const requiredQuantity = toNumber(item.requiredQuantity) * orderQuantity;
      const existing = acc[materialId] || {
        materialName: item.materialName,
        unit: item.unit || "",
        requiredQuantity: 0,
      };

      acc[materialId] = {
        ...existing,
        requiredQuantity: existing.requiredQuantity + requiredQuantity,
      };
      return acc;
    }, {});

    const groupedShortageMessages = Object.entries(requiredByMaterialId)
      .map(([materialId, item]) => {
        const availableQuantity = materialStocksById[materialId] ?? 0;

        if (availableQuantity >= item.requiredQuantity) {
          return null;
        }

        return `${item.materialName} 필요 ${item.requiredQuantity.toLocaleString("ko-KR")} ${item.unit}, 현재 ${availableQuantity.toLocaleString("ko-KR")} ${item.unit}`;
      })
      .filter(Boolean);

    const visibleShortageMessages = groupedShortageMessages.map((message) =>
      message.startsWith("재고부족:") ? message : `재고부족: ${message}`,
    );

    return {
      isBlocked: visibleShortageMessages.length > 0,
      messages: visibleShortageMessages,
    };
  }, [selectedProduct, orderForm.plannedQty, bomItemsByProductId, materialStocksById]);

  // 상태별 작업지시 개수 계산 (전체 목록 기준, 필터 결과와 무관)
  const counts = useMemo(
    () =>
      Object.fromEntries(
        ["대기중", "진행중", "완료"].map((status) => [
          status,
          orders.filter((item) => item.status === status).length,
        ]),
      ),
    [orders],
  );

  // 검색 조건에 맞는 작업지시만 표시 - 백엔드가 실제 지원하는 3개(workOrderNo/status/dueDate)만
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const keyword = filters.workOrderNo.trim().toLowerCase();

        return (
          (!keyword || order.workOrderNo.toLowerCase().includes(keyword)) &&
          (!filters.workOrderStatus ||
            order.workOrderStatus === filters.workOrderStatus) &&
          (!dueDate || order.dueAt === dueDate)
        );
      }),
    [orders, filters, dueDate],
  );

  // 공용 Pagination이 rows를 페이지별로 나누므로 전체 조회 결과를 전달한다.
  const rows = filtered.map((order, index) => ({
    ...order,

    originalOrder: order,

    no: index + 1,

    orderCell: <OrderNo>{order.workOrderNo}</OrderNo>,

    quantityCell: order.plannedQty.toLocaleString("ko-KR"),

    progressCell: (
      <ProgressCell>
        <ProgressTrack>
          <ProgressFill $rate={order.progressRate} />
        </ProgressTrack>
        <ProgressText>
          {order.progressRate}% ({order.completedQty.toLocaleString("ko-KR")}/
          {order.plannedQty.toLocaleString("ko-KR")})
        </ProgressText>
      </ProgressCell>
    ),

    statusCell: (
      <StatusBadge
        $status={order.status}
        tone={order.status === "완료" ? "success" : "neutral"}
      >
        {order.status}
      </StatusBadge>
    ),

    startCell: order.startedAt
      ? <DateTimeText>{formatDateTime(order.startedAt)}</DateTimeText>
      : "-",

    completedCell: order.completedAt
      ? <DateTimeText>{formatDateTime(order.completedAt)}</DateTimeText>
      : "-",
  }));

  // 표 컬럼 설정 - 수정/삭제 API가 없어 관리 컬럼 없음
  const columns = [
    { key: "no", label: "NO" },
    { key: "orderCell", label: "작업지시 번호" },
    { key: "productName", label: "제품명" },
    { key: "quantityCell", label: "지시 수량", align: "right" },
    { key: "progressCell", label: "진행률", align: "center" },
    { key: "worker", label: "담당자" },
    { key: "dueAt", label: "납기일" },
    { key: "statusCell", label: "상태" },
    { key: "startCell", label: "실제 시작일시" },
    { key: "completedCell", label: "완료일시" },
  ];

  // 등록 드로어 열기
  const openCreateDrawer = () => {
    if (!canManage) return;
    setSelectedOrder(null);
    setOrderForm(EMPTY_ORDER_FORM);
    setDrawerOpen(true);
  };

  // 드로어 닫기
  const closeDrawer = () => {
    setDrawerOpen(false);
    setOrderForm(EMPTY_ORDER_FORM);
  };

  // 선택한 작업지시의 상세 드로어 열기
  const openOrderDetail = (order) => {
    setDrawerOpen(false);
    setSelectedOrder(order);
  };

  // 상세 드로어 닫기
  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  // 작업지시 등록 - bomId/orderQuantity/dueDate만 보낸다(managerEmployeeId는 백엔드가 세션에서 채움)
  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    if (!canManage) return;

    if (isStockCheckLoading) {
      window.alert("자재 재고를 확인하는 중입니다.");
      return;
    }

    if (!selectedProduct?.bomId) {
      window.alert("선택한 제품에 연결된 BOM이 없어 등록할 수 없습니다.");
      return;
    }

    if (stockValidation.isBlocked) {
      window.alert(stockValidation.messages.join("\n"));
      return;
    }

    try {
      await productionApi.createWorkOrder({
        bomId: selectedProduct.bomId,
        orderQuantity: Number(orderForm.plannedQty),
        dueDate: orderForm.dueAt,
      });
      await loadOrders();
      setPage(1);
      closeDrawer();
    } catch (error) {
      console.error("작업지시 등록 실패:", error);
      window.alert(error.response?.data?.message || "작업지시 등록에 실패했습니다.");
    }
  };

  return (
    <Page>
      <Content>
        {/* 페이지 제목과 등록 버튼 */}
        <PageHeader>
          <div>
            <Title>작업 지시 관리</Title>
            <Description>
              실시간 제조 실행 및 공정 스케줄을 관리합니다.
              {isLoading ? " 불러오는 중..." : ""}
            </Description>
          </div>

          {canManage && (
            <HeaderActionButton type="button" onClick={openCreateDrawer}>
              <FiPlus size={16} />
              작업지시 등록
            </HeaderActionButton>
          )}
        </PageHeader>

        {/* 상태별 요약 카드 */}
        <SummaryGrid>
          <StatusSummaryCard
            height={116}
            gap={14}
            icon={<FiCheckCircle />}
            iconBoxSize={50}
            iconSize={24}
            iconBackground="#e5f8ec"
            iconColor="#168853"
            title="완료"
            titleFontSize={13}
            value={counts.완료}
            valueFontSize={25}
          />

          <StatusSummaryCard
            height={116}
            gap={14}
            icon={<FiPlayCircle />}
            iconBoxSize={50}
            iconSize={24}
            iconBackground="#e7f0ff"
            iconColor="#0b57d0"
            title="진행중"
            titleFontSize={13}
            value={counts.진행중}
            valueFontSize={25}
          />

          <StatusSummaryCard
            height={116}
            gap={14}
            icon={<FiClock />}
            iconBoxSize={50}
            iconSize={24}
            iconBackground="#fff4d8"
            iconColor="#d98a00"
            title="대기중"
            titleFontSize={13}
            value={counts.대기중}
            valueFontSize={25}
          />
        </SummaryGrid>

        {/* 검색 및 필터 영역 - 백엔드가 실제 지원하는 workOrderNo/workOrderStatus/dueDate만 */}
        <FilterBlock>
          <FilterTitle>작업지시 검색</FilterTitle>

          <FilterRow>
            <SearchFilterBar
              filters={[
                {
                  name: "workOrderStatus",
                  label: "상태",
                  placeholder: "전체 상태",
                  width: 110,
                  options: [
                    { value: "WAITING", label: "대기중" },
                    { value: "IN_PROGRESS", label: "진행중" },
                    { value: "COMPLETED", label: "완료" },
                  ],
                },
              ]}
              defaultValues={INITIAL_FILTERS}
              keywordName="workOrderNo"
              keywordLabel="작업지시 번호"
              keywordPlaceholder="WO-..."
              keywordWidth={190}
              showDateRange={false}
              showSearchButton={false}
              padding={0}
              border="0"
              background="transparent"
              onChange={(values) => {
                setFilters(values);
                setPage(1);
              }}
              onReset={(values) => {
                setFilters(values);
                setDueDate("");
                setPage(1);
              }}
            />

            <DueDateField>
              <DueDateLabel htmlFor="work-order-filter-due-date">
                납기일
              </DueDateLabel>
              <FilterDatePicker
                id="work-order-filter-due-date"
                value={dueDate}
                onChange={(value) => {
                  setDueDate(value);
                  setPage(1);
                }}
              />
            </DueDateField>
          </FilterRow>
        </FilterBlock>

        {/* 작업지시 표 */}
        <TableCard>
          <TableTop>
            <TableTitle>작업지시 현황</TableTitle>
            <TopResultText>
              조회 결과 <strong>{filtered.length}</strong>건
            </TopResultText>
          </TableTop>
          <TableWrap>
            <CommonPagination
              columns={columns}
              rows={rows}
              currentPage={page}
              totalItems={filtered.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              onRowClick={(row) => openOrderDetail(row.originalOrder)}
              tableProps={{ minWidth: 1380 }}
            />
          </TableWrap>
        </TableCard>
      </Content>

      {/* 작업지시 등록 드로어 */}
      <WorkOrderNewEdit
        open={drawerOpen}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        products={products}
        stockMessages={
          isStockCheckLoading
            ? ["자재 재고를 확인하는 중입니다."]
            : stockValidation.messages
        }
        isSubmitDisabled={isStockCheckLoading || stockValidation.isBlocked}
        onClose={closeDrawer}
        onSubmit={handleSubmitOrder}
      />

      {/* 상세 드로어 */}
      <WorkOrderDetail order={selectedOrder} onClose={closeOrderDetail} />
    </Page>
  );
}

// 페이지 전체 영역
const Page = styled.main`
  min-height: calc(100vh - 98px);
  padding: var(--page-container-padding);
  background: #f6f8fc;
  color: #172033;

`;

// 페이지 최대 너비
const Content = styled.div`
  width: 100%;
`;

// 제목과 등록 버튼 영역
const PageHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--page-section-gap);
  margin-bottom: var(--page-header-content-gap);

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

// 페이지 제목
const Title = styled.h1`
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  line-height: var(--page-title-line-height);
  font-weight: var(--page-title-weight);
  letter-spacing: var(--page-title-letter-spacing);
`;

// 제목 아래 설명
const Description = styled.p`
  margin-top: var(--page-title-subtitle-gap);
  color: var(--page-subtitle-color);
  font-size: var(--page-subtitle-size);
  font-weight: var(--page-subtitle-weight);
  line-height: var(--page-subtitle-line-height);
`;

// 목록 상단 주요 액션 버튼 공통 규격
const HeaderActionButton = styled(Button)`
  width: 128px;
  height: 40px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
`;

// 상태 요약 카드 배치
const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const StatusSummaryCard = styled(SummaryCard)`
  flex-direction: row;
  align-items: center;
`;

const FilterBlock = styled.div`
  padding: var(--page-panel-padding);
  border: 1px solid #d7dde8;
  border-radius: 12px;
  background: #fff;
  margin-bottom: var(--page-section-gap);
`;

const FilterTitle = styled.h2`
  margin: 0 0 14px;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

// SearchFilterBar와 납기일 단일 필터를 나란히 배치
const FilterRow = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
`;

const DueDateField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 170px;
`;

const DueDateLabel = styled.label`
  color: #64748b;
  font-size: 12px;
`;

// 표 전체 카드
const TableCard = styled.section`
  overflow: hidden;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  background: #fff;
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
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

const TopResultText = styled.span`
  color: #737b88;
  font-size: 13px;

  strong {
    color: #0755d9;
  }
`;

// 표 헤더와 셀 스타일
const TableWrap = styled.div`
  > div {
    border: 0;
    border-radius: 0;
  }

  table {
    width: 100%;
    table-layout: fixed;
  }

  th {
    border-bottom: 1px solid #e3e7ed;
    vertical-align: middle;
    background: #f1f3f6;
    color: #535b68;
    font-weight: 600;
    text-align: center !important;
    white-space: nowrap;
  }

  /* 헤더 사이 구분선 */
  th + th {
    border-left: 0;
  }

  th:first-child {
    width: 6%;
    text-align: center !important;
  }

  th:nth-child(2) {
    width: 16%;
    text-align: center !important;
  }

  th:nth-child(3) {
    width: 14%;
  }

  th:nth-child(4) {
    width: 9%;
  }

  th:nth-child(5) {
    width: 13%;
  }

  th:nth-child(6) {
    width: 9%;
  }

  th:nth-child(7) {
    width: 10%;
  }

  th:nth-child(8) {
    width: 8%;
  }

  th:nth-child(9) {
    width: 13%;
  }

  th:nth-child(10) {
    width: 13%;
  }

  td {
    color: #252a32;
    text-align: center !important;
    vertical-align: middle;
    white-space: nowrap;
  }

  /* 작업지시 번호와 제품명 줄바꿈 */
  td:nth-child(2),
  td:nth-child(3) {
    white-space: normal;
    line-height: 1.45;
    overflow-wrap: anywhere;
    word-break: keep-all;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover {
    background: #f6f9ff;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

`;

// 작업지시 번호
const OrderNo = styled.span`
  color: #174b9c;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
`;

// inventory 테이블과 동일한 한 줄 날짜·시간 형식
const DateTimeText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
`;

const ProgressCell = styled.div`
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const ProgressTrack = styled.span`
  width: min(100%, 94px);
  height: 7px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 999px;
  background: #e3e8f0;
`;

const ProgressFill = styled.span`
  display: block;
  width: ${({ $rate }) => `${Math.max(0, Math.min(100, $rate))}%`};
  height: 100%;
  border-radius: inherit;
  background: #0755d9;
`;

const ProgressText = styled.span`
  color: #535b68;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
`;

// 상태 배지
const StatusBadge = styled(Badge)`
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;

  background: ${(props) =>
    props.$status === "진행중"
      ? "#e7f0ff"
      : props.$status === "완료"
        ? "#dff7e9"
        : "#eef0f5"};

  color: ${(props) =>
    props.$status === "진행중"
      ? "#2563d8"
      : props.$status === "완료"
        ? "#099456"
        : "#687386"};
`;

// 표 하단 영역

// 페이지 이동 버튼 정렬

// 이전/다음 버튼

// 이전/다음/페이지 번호 버튼
