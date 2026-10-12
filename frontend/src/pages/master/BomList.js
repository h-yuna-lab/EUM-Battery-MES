import { useCallback, useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import BomEdit from "./BomEdit";
import BomDetail from "./BomDetail";
import Pagination from "../../components/ui/Pagination";
import SummaryCard from "../../components/ui/SummaryCard";
import Button from "../../components/ui/Button";
import masterApi from "../../api/master";
import AuthContext from "../../context/AuthContext";
import NoPermissionText from "../../components/ui/NoPermissionText";
import { hasMasterWritePermission } from "../../utils/masterPermissions";

const toProductCard = (product) => ({
  id: product.id,
  productCode: product.productCode ?? "",
  productName: product.productName ?? "",
  voltage: `${Number(product.voltage ?? 0)}V`,
  capacity: `${Number(product.capacity ?? 0)}Ah`,
});

const toBomRow = (item) => ({
  id: item.id,
  materialId: item.materialId,
  materialCode: item.materialCode,
  materialName: item.materialName,
  requiredQty: Number(item.requiredQuantity ?? 0),
  unit: item.unit,
  inputProcessId: item.inputProcessId,
  process: item.inputProcessName,
});

const toMaterialOption = (material) => ({
  materialId: material.id,
  materialCode: material.materialCode,
  materialName: material.materialName,
  unit: material.unit,
});

const toProcessOption = (process) => ({
  id: process.id,
  processCode: process.processCode,
  processName: process.processName,
});

const toBomSavePayload = (rows) =>
  rows.map((row) => ({
    id: row._isNew ? null : row.id,
    materialId: row.materialId,
    inputProcessId: row.inputProcessId,
    requiredQuantity: Number(row.requiredQty),
  }));

const PAGE_SIZE = 8;

// 완제품 선택, BOM 데이터 변경, 수정/상세 드로어 상태를 관리하는 목록 화면
function Bom() {
  const { user } = useContext(AuthContext);
  const canManage = hasMasterWritePermission(user);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedBomRows, setSelectedBomRows] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 수정/상세 드로어
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBomItem, setSelectedBomItem] = useState(null);

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  const loadMasterOptions = useCallback(async () => {
    try {
      const [productResponse, materialResponse, processResponse] =
        await Promise.all([
          masterApi.getProducts(),
          masterApi.getMaterials(),
          masterApi.getProcesses(),
        ]);

      const productRows = productResponse.data.map(toProductCard);
      setProducts(productRows);
      setMaterials(materialResponse.data.map(toMaterialOption));
      setProcesses(processResponse.data.map(toProcessOption));
      setSelectedProductId((current) => current ?? productRows[0]?.id ?? null);
    } catch (error) {
      console.error("BOM 기준정보 조회 실패:", error);
      window.alert("BOM 기준정보를 불러오지 못했습니다.");
    }
  }, []);

  const loadBomItems = async (productId) => {
    if (!productId) {
      setSelectedBomRows([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await masterApi.getBomItems(productId);
      setSelectedBomRows(response.data.map(toBomRow));
    } catch (error) {
      console.error("BOM 목록 조회 실패:", error);
      window.alert("BOM 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMasterOptions();
  }, [loadMasterOptions]);

  useEffect(() => {
    loadBomItems(selectedProductId);
  }, [selectedProductId]);

  // 다른 완제품을 선택하면 이전 자재의 상세 선택 상태도 함께 초기화
  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setPage(1);
    setIsDetailOpen(false);
    setSelectedBomItem(null);
  };

  // 수정 버튼과 닫기 동작은 수정 드로어의 표시 상태만 변경
  const handleOpenEdit = () => {
    if (!canManage) return;
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  // 수정 드로어에서 받은 BOM 목록을 현재 선택 제품의 데이터로 교체
  const handleBomSave = async (savedRows) => {
    if (!canManage) return;
    try {
      const response = await masterApi.saveBomItems(
        selectedProductId,
        toBomSavePayload(savedRows),
      );
      setSelectedBomRows(response.data.map(toBomRow));
      setIsEditOpen(false);
    } catch (error) {
      console.error("BOM 저장 실패:", error);
      window.alert("BOM 저장에 실패했습니다.");
    }
  };

  // 공용 Table 행의 id로 원본 BOM 자재를 찾아 상세 드로어에 전달
  const handleOpenDetail = (tableRow) => {
    const clickedBomItem = selectedBomRows.find(
      (item) => item.id === tableRow.id,
    );

    if (!clickedBomItem) {
      return;
    }

    setSelectedBomItem(clickedBomItem);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedBomItem(null);
  };

  const handleEditFromDetail = () => {
    if (!canManage) return;
    setIsDetailOpen(false);
    setSelectedBomItem(null);
    setIsEditOpen(true);
  };

  const handleDeleteBomItem = async (item) => {
    if (!canManage) return;
    if (
      !window.confirm(`${item.materialName} 자재를 BOM에서 삭제하시겠습니까?`)
    ) {
      return;
    }

    await handleBomSave(selectedBomRows.filter((row) => row.id !== item.id));
  };

  // 공용 Table이 사용하는 열 정의, key는 아래 bomTableRows의 필드와 대응
  const bomColumns = [
    {
      key: "no",
      width: "70px",
      label: "NO",
    },
    {
      key: "materialCode",
      width: 190,
      label: "자재코드",
    },
    {
      key: "materialName",
      width: 120,
      label: "자재명",
    },
    {
      key: "requiredQty",
      width: 120,
      label: "소요수량",
      align: "center",
    },
    {
      key: "unit",
      width: 100,
      label: "단위",
    },
    {
      key: "process",
      width: 120,
      label: "투입공정",
    },
    {
      key: "management",
      width: "120px",
      label: "관리",
    },
  ];

  // 원본 BOM 데이터를 번호, 배지, 경고 색상이 포함된 테이블 표시 데이터로 변환
  const bomTableRows = selectedBomRows.map((row, index) => ({
    id: row.id,

    no: String(index + 1).padStart(2, "0"),

    materialCode: <CodeText>{row.materialCode}</CodeText>,

    materialName: row.materialName,

    requiredQty: <QuantityText>{Number(row.requiredQty).toFixed(2)}</QuantityText>,

    unit: row.unit,

    process: <ProcessBadge>{row.process}</ProcessBadge>,

    management: canManage ? (
      <Management>
        <IconButton
          type="button"
          aria-label={`${row.materialName} 수정`}
          title="수정"
          onClick={(event) => {
            event.stopPropagation();
            setIsEditOpen(true);
          }}
        >
          <FiEdit2 />
        </IconButton>

        <DeleteButton
          type="button"
          aria-label={`${row.materialName} 삭제`}
          title="삭제"
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteBomItem(row);
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
    <PageContainer>
      {/* 화면 제목과 BOM 수정 진입 버튼 */}
      <PageHeader>
        <div>
          <PageTitle>BOM 관리</PageTitle>

          <PageDescription>
            제품 생산에 필요한 자재 구성 및 표준 소요량을 관리합니다.
          </PageDescription>
        </div>

        {canManage && (
          <HeaderActionButton
            type="button"
            variant="primary"
            onClick={handleOpenEdit}
          >
            <FiEdit2 size={16} />
            BOM 수정
          </HeaderActionButton>
        )}
      </PageHeader>

      {/* 제품 카드를 클릭하면 아래 BOM 테이블의 데이터가 해당 제품 기준 */}
      <ProductSection>
        <SectionTitle>BOM 품목 선택</SectionTitle>

        <ProductList>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              $active={selectedProductId === product.id}
              onClick={() => handleSelectProduct(product.id)}
              title={product.productName}
              value={product.productCode}
              gap={8}
              titleFontSize={14}
              titleFontWeight={600}
              titleColor="#172033"
              valueFontSize={11}
              valueFontWeight={400}
              valueColor={
                selectedProductId === product.id ? "#0b57d0" : "#5d6676"
              }
            />
          ))}
        </ProductList>
      </ProductSection>

      {/* 선택한 제품의 BOM 자재 목록 */}
      <TablePanel>
        <SelectedProductTitle>
          <TitleDot />

          <div>
            <SectionTitleText>BOM 자재 목록</SectionTitleText>
            <SelectedProductName>
              {selectedProduct?.productName}
            </SelectedProductName>
          </div>
          <TableResultText>
            조회 결과 <strong>{selectedBomRows.length}</strong>건
            {isLoading ? " 불러오는 중" : ""}
          </TableResultText>
        </SelectedProductTitle>

        <BomTableArea>
          <QuantityGuide>
            소요수량은 <strong>상위 품목 1개 기준 소요수량</strong>입니다.
          </QuantityGuide>
          <Pagination
            columns={bomColumns}
            rows={bomTableRows}
            currentPage={page}
            totalItems={selectedBomRows.length}
            itemsPerPage={PAGE_SIZE}
            visiblePages={5}
            background="#ffffff"
            borderTop="1px solid #e2e6ed"
            onPageChange={setPage}
            onRowClick={handleOpenDetail}
            tableProps={{
              tableLayout: "fixed",
              headerBackground: "#f1f3f6",
              emptyText: "등록된 BOM 자재가 없습니다.",
            }}
          />
        </BomTableArea>
      </TablePanel>

      {/* 수정 드로어: 저장 결과를 handleBomSave로 받아 목록 상태에 반영. */}
      <BomEdit
        isOpen={isEditOpen}
        product={selectedProduct}
        bomRows={selectedBomRows}
        materialOptions={materials}
        processOptions={processes}
        onClose={handleCloseEdit}
        onSave={handleBomSave}
      />

      {/* 상세 드로어: 테이블에서 클릭한 원본 BOM 자재를 전달 */}
      <BomDetail
        isOpen={isDetailOpen}
        product={selectedProduct}
        bomItem={selectedBomItem}
        onClose={handleCloseDetail}
        onEdit={handleEditFromDetail}
        canEdit={canManage}
      />
    </PageContainer>
  );
}

export default Bom;

// ===== BOM 목록 화면 스타일 =====
// 페이지 전체 배경과 기본 여백을 담당하는 최상위 레이아웃
const PageContainer = styled.div`
  min-height: 100%;
  padding: var(--page-container-padding);
  background: #f7f8fa;
  color: #202530;
`;

// 공용 Table의 기본 테두리/정렬을 BOM 목록 화면에 맞게 덮어씀
const BomTableArea = styled.div`
  width: 100%;

  > div {
    border: 0;
    border-radius: 0;
  }

  table {
    table-layout: fixed;
  }

  /* 공용 Table 내부 헤더 */
  th {
    border-bottom: 1px solid #e3e7ed;
    background: #f1f3f6;
    color: #535b68;
    font-weight: 600;
    text-align: center !important;
    vertical-align: middle !important;
    font-family: "Pretendard", sans-serif;
  }

  /* 표 본문도 좌우·위아래 중앙 정렬 */
  td {
    color: #252a32;
    text-align: center !important;
    vertical-align: middle !important;
    font-family: "Pretendard", sans-serif;
  }

  tbody tr {
    transition: background 0.15s ease;
  }

  tbody tr:hover {
    background: #f6f9ff;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

// 화면 제목 영역과 BOM 수정 버튼을 양 끝에 배치
const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--page-header-content-gap);
`;

// BOM 목록 화면의 주 제목
const PageTitle = styled.h1`
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  line-height: var(--page-title-line-height);
  font-weight: var(--page-title-weight);
  letter-spacing: var(--page-title-letter-spacing);
`;

// 제목 아래에 표시되는 화면 설명 문구
const PageDescription = styled.p`
  margin: var(--page-title-subtitle-gap) 0 0;
  color: var(--page-subtitle-color);
  font-size: var(--page-subtitle-size);
  font-weight: var(--page-subtitle-weight);
  line-height: var(--page-subtitle-line-height);
`;

// 완제품 선택 카드들을 감싸는 흰색 패널
const ProductSection = styled.section`
  padding: var(--page-panel-padding);
  border: 1px solid #d7dde8;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

// 각 콘텐츠 영역의 소제목
const SectionTitle = styled.h2`
  margin: 0 0 16px;
  color: #172033;
  font-size: 15px;
  font-weight: 700;
`;

// 완제품 카드를 5열로 배치하는 그리드
const ProductList = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: var(--page-box-gap);
`;

// 완제품 선택 버튼, $active가 true이면 선택 상태의 파란색으로 표시
const ProductCard = styled(SummaryCard)`
  position: relative;
  min-height: 72px;
  border: 1px solid ${({ $active }) => ($active ? "#9fc2ff" : "#d7dde8")};
  border-radius: 12px;
  background: ${({ $active }) => ($active ? "#eef4ff" : "#ffffff")};
  color: #172033;
  text-align: left;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active
      ? "0 4px 12px rgba(11, 87, 208, 0.12)"
      : "0 1px 3px rgba(15, 23, 42, 0.04)"};

  &::before {
    content: "";
    position: absolute;
    top: 14px;
    bottom: 14px;
    left: 0;
    width: 4px;
    border-radius: 0 999px 999px 0;
    background: ${({ $active }) => ($active ? "#0b57d0" : "transparent")};
  }

  &:hover {
    border-color: #9fc2ff;
    background: #f5f8ff;
  }
`;

// 선택 제품의 BOM 테이블 전체를 감싸는 패널
const TablePanel = styled.section`
  margin-top: var(--page-section-gap);
  overflow: hidden;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

// BOM 테이블 상단에 현재 선택된 제품을 표시하는 제목
const SelectedProductTitle = styled.div`
  display: flex;
  min-height: 64px;
  gap: 10px;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #d7dde8;
`;

// 선택 제품 제목 앞에 표시되는 강조
const TitleDot = styled.span`
  width: 4px;
  height: 34px;
  border-radius: 999px;
  background: #0b57d0;
`;

const SectionTitleText = styled.strong`
  display: block;
  color: #172033;
  font-size: 15px;
  font-weight: 700;
`;

const SelectedProductName = styled.span`
  display: block;
  margin-top: 4px;
  color: #5d6676;
  font-size: 12px;
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

const TableResultText = styled.span`
  margin-left: auto;
  color: #737b88;
  font-size: 13px;

  strong {
    color: #0755d9;
  }
`;

const CodeText = styled.strong`
  color: #174b9c;
  font-size: 13px;
  font-weight: 600;
`;

const QuantityText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
`;

const QuantityGuide = styled.p`
  margin: 0;
  padding: 12px 18px;
  border-bottom: 1px solid #e5e9f0;
  background: #f8faff;
  color: #5d6676;
  font-size: 12px;

  strong {
    color: #172033;
    font-weight: 600;
  }
`;

// 자재가 투입되는 공정을 둥근 태그 형태로 표시
const ProcessBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #eaf2ff;
  color: #3166ac;
  font-size: 12px;
  font-weight: 600;
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
