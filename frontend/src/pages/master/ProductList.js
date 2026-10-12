import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import Button from "../../components/ui/Button";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import Pagination from "../../components/ui/Pagination";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import ProductNew from "./ProductNew";
import ProductEdit from "./ProductEdit";
import ProductDetail from "./ProductDetail";
import masterApi from "../../api/master";
import AuthContext from "../../context/AuthContext";
import NoPermissionText from "../../components/ui/NoPermissionText";
import { hasMasterWritePermission } from "../../utils/masterPermissions";

const formatDateTime = (value) => {
  if (!value) return "";
  return String(value).replace("T", " ").slice(0, 16);
};

const toProductRow = (product) => ({
  id: product.id,
  product_code: product.productCode ?? "",
  product_name: product.productName ?? "",
  voltage: Number(product.voltage ?? 0),
  capacity_ah: Number(product.capacity ?? 0),
  unit: product.unit ?? "",
  created_at: formatDateTime(product.createdAt),
  updated_at: formatDateTime(product.updatedAt),
  active: product.active,
});

const toProductCreatePayload = (product) => ({
  productCode: product.product_code,
  productName: product.product_name,
  voltage: product.voltage,
  capacity: product.capacity_ah,
  unit: product.unit,
});

const toProductUpdatePayload = (product) => ({
  productName: product.product_name,
  voltage: product.voltage,
  capacity: product.capacity_ah,
  unit: product.unit,
});

/* Styled Components */
const Container = styled.div`
  min-height: 100%;
  padding: var(--page-container-padding);
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--page-section-gap);
  background: #f7f8fa;
`;

// 페이지 헤더
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;

  .title-group {
    h2 {
      margin: 0;
      font-size: var(--page-title-size);
      line-height: var(--page-title-line-height);
      font-weight: var(--page-title-weight);
      letter-spacing: var(--page-title-letter-spacing);
      color: var(--page-title-color);
    }
    p {
      margin: var(--page-title-subtitle-gap) 0 0;
      font-size: var(--page-subtitle-size);
      font-weight: var(--page-subtitle-weight);
      line-height: var(--page-subtitle-line-height);
      color: var(--page-subtitle-color);
    }
  }
`;

const HeaderActionButton = styled(Button)`
  width: 148px;
  height: 40px;
  padding: 0 16px;
  box-sizing: border-box;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  flex-shrink: 0;
  white-space: nowrap;

  font-size: 13px;
  font-weight: 600;
  line-height: 1;
`;

// Filter 영역을 감싸는 패널 스타일
const StyledFilterPanel = styled.section`
  padding: var(--page-panel-padding);
  background: #ffffff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
  color: #292d35;
`;

// SearchFilterBar 가로 정렬 및 내부 그룹 스타일 정리를 위한 래퍼
const FilterBarWrapper = styled.div`
  width: 100%;

  & > div {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }

  & div[class*="ButtonGroup"],
  & div[class*="button-group"],
  & div:has(> button) {
    display: flex;
    flex-direction: row-reverse;
    gap: 8px;
  }
`;

// 테이블 패널
const TablePanel = styled.section`
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
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

// 제품 코드 스타일 블루 계열 볼드 텍스트 적용
const ProductCodeText = styled.strong`
  color: #174b9c;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
`;

const ProductNameText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
`;

const DateTimeText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
`;

const Management = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const IconButton = styled.button`
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1769d2;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: #edf4ff;
  }
`;

const DeleteButton = styled(IconButton)`
  color: #e55252;

  &:hover {
    background: #fff1f1;
  }
`;

/* Component Logic */
export default function ProductList() {
  const { user } = useContext(AuthContext);
  const canManage = hasMasterWritePermission(user);
  const [products, setProducts] = useState([]);

  // 검색 필터 State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyword, setKeyword] = useState("");

  const [page, setPage] = useState(1);

  // 모달 제어 State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getProducts();
      setProducts(response.data.map(toProductRow));
    } catch (error) {
      console.error("제품 목록 조회 실패:", error);
      window.alert("제품 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // SearchFilterBar 연동 조회 핸들러
  const handleSearch = (filterValues) => {
    setStartDate(filterValues.startDate || "");
    setEndDate(filterValues.endDate || "");
    setKeyword(filterValues.keyword || "");
    setPage(1);
  };

  // SearchFilterBar 연동 초기화 핸들러
  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setKeyword("");
    setPage(1);
  };

  const handleRegisterClick = () => {
    if (!canManage) return;
    setIsNewOpen(true);
    console.log("제품 등록 모달/드로어 오픈");
  };

  const handleEditClick = (product) => {
    if (!canManage) return;
    setSelectedProduct(product);
    setIsEditOpen(true);
    console.log("제품 수정 호출:", product.product_code);
  };

  const handleDeleteProduct = async (product) => {
    if (!canManage) return;
    if (!window.confirm(`${product.product_name} 제품을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await masterApi.deleteProduct(product.id);
      await loadProducts();
    } catch (error) {
      console.error("제품 삭제 실패:", error);
      window.alert("제품 삭제에 실패했습니다.");
    }
  };

  // 필터링 로직 (조회 버튼을 클릭하여 State가 세팅되었을 때 렌더링되게 설계됨)
  const filteredRows = products.filter((item) => {
    const normalizedKeyword = String(keyword ?? "").toLowerCase();
    const matchKeyword =
      String(item.product_code ?? "")
        .toLowerCase()
        .includes(normalizedKeyword) ||
      String(item.product_name ?? "")
        .toLowerCase()
        .includes(normalizedKeyword);

    const itemDate = String(item.created_at ?? "").split(" ")[0];
    const matchStart = startDate === "" || itemDate >= startDate;
    const matchEnd = endDate === "" || itemDate <= endDate;

    return matchKeyword && matchStart && matchEnd;
  });

  const handleCreateProduct = async (payload) => {
    if (!canManage) return;
    try {
      await masterApi.createProduct(toProductCreatePayload(payload));
      await loadProducts();
      setIsNewOpen(false);
    } catch (error) {
      console.error("제품 등록 실패:", error);
      window.alert("제품 등록에 실패했습니다.");
    }
  };

  const handleUpdateProduct = async (updatedProduct) => {
    if (!canManage) return;
    try {
      await masterApi.updateProduct(
        updatedProduct.id,
        toProductUpdatePayload(updatedProduct),
      );
      await loadProducts();
      setIsEditOpen(false);
    } catch (error) {
      console.error("제품 수정 실패:", error);
      window.alert("제품 수정에 실패했습니다.");
    }
  };

  // Table 컴포넌트에 넘겨줄 컬럼 구조
  const columns = [
    { key: "id", label: "ID", align: "center", width: 70 },
    { key: "product_code", label: "제품 코드", align: "center", width: 150 },
    { key: "product_name", label: "제품명", align: "center", width: 140 },
    { key: "voltage_styled", label: "전압", align: "center", width: 90 },
    { key: "capacity_styled", label: "용량", align: "center", width: 90 },
    { key: "unit", label: "단위", align: "center", width: 80 },
    { key: "created_at", label: "등록일", align: "center", width: 170 },
    { key: "updated_at", label: "수정일", align: "center", width: 170 },
    { key: "management", label: "관리", align: "center", width: 120 },
  ];

  // 데이터 가공 및 컴포넌트 데이터셀 인젝션
  const tableRows = filteredRows.map((row) => ({
    ...row,
    originalProduct: row,
    product_code: <ProductCodeText>{row.product_code}</ProductCodeText>,
    product_name: <ProductNameText>{row.product_name}</ProductNameText>,
    voltage_styled: `${row.voltage}V`,
    capacity_styled: `${row.capacity_ah}Ah`,
    created_at: <DateTimeText>{row.created_at}</DateTimeText>,
    updated_at: <DateTimeText>{row.updated_at}</DateTimeText>,
    management: canManage ? (
      <Management>
        <IconButton
          type="button"
          title="수정"
          aria-label={`${row.product_name} 수정`}
          onClick={(event) => {
            event.stopPropagation();
            handleEditClick(row);
          }}
        >
          <FiEdit2 />
        </IconButton>

        <DeleteButton
          type="button"
          title="삭제"
          aria-label={`${row.product_name} 삭제`}
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteProduct(row);
          }}
        >
          <FiTrash2 />
        </DeleteButton>
      </Management>
    ) : (
      <NoPermissionText>권한 없음</NoPermissionText>
    ),
  }));

  return (
    <Container>
      {/* 상단 타이틀 헤더 영역 */}
      <Header>
        <div className="title-group">
          <h2>제품 관리</h2>
          <p>생산 제품의 기본 규격과 마스터 데이터를 관리하는 시스템입니다.</p>
        </div>
        {canManage && (
          <HeaderActionButton
            type="button"
            variant="primary"
            onClick={handleRegisterClick}
          >
            <FiPlus size={16} />
            제품 등록
          </HeaderActionButton>
        )}
      </Header>

      {/* 공용 SearchFilterBar 적용 영역 */}
      <StyledFilterPanel>
        <PanelTitle>제품 검색</PanelTitle>
        <FilterBarWrapper>
          <SearchFilterBar
            filters={[]} // 추가적인 select 필터가 필요 없으므로 빈 배열로 전달
            showKeyword={true}
            keywordName="keyword"
            keywordLabel="통합 검색"
            keywordPlaceholder="제품코드 / 제품명 검색"
            keywordWidth={280}
            showDateRange={true} // 등록일 필터용 Date Range 사용 선언
            dateLabel="등록일"
            showSearchButton={false}
            onSearch={handleSearch}
            onReset={handleReset}
            inputHeight={38}
            border="none"
            padding={0}
            width="100%"
          />
        </FilterBarWrapper>
      </StyledFilterPanel>

      {/* 테이블 패널 영역 */}
      <TablePanel>
        <TableTop>
          <TableTitle>제품 목록</TableTitle>

          <TableSummary>
            조회 결과 <strong>{tableRows.length}</strong>건
            {isLoading ? " 불러오는 중" : ""}
          </TableSummary>
        </TableTop>

        <Pagination
          columns={columns}
          rows={tableRows}
          currentPage={page}
          totalItems={tableRows.length}
          itemsPerPage={8}
          visiblePages={5}
          background="#ffffff"
          borderTop="1px solid #e2e6ed"
          onPageChange={setPage}
          onRowClick={(row) => {
            setSelectedProduct(row.originalProduct);
            setIsDetailOpen(true);
          }}
          tableProps={{
            tableLayout: "fixed",
            headerBackground: "#f1f3f6",
            emptyText: "조건에 맞는 제품이 없습니다.",
          }}
        />
      </TablePanel>

      <ProductNew
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onRegister={handleCreateProduct}
      />
      <ProductDetail
        isOpen={isDetailOpen}
        product={selectedProduct}
        onClose={() => setIsDetailOpen(false)}
        canEdit={canManage}
        onEdit={() => {
          if (!canManage) return;
          setIsDetailOpen(false);
          setIsEditOpen(true);
        }}
      />
      <ProductEdit
        isOpen={isEditOpen}
        product={selectedProduct}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateProduct}
      />
    </Container>
  );
}
