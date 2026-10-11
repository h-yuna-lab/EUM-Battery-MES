import { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import Pagination from "../../components/ui/Pagination";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import Button from "../../components/ui/Button";
import MaterialNewEdit from "./MaterialNewEdit";
import masterApi from "../../api/master";
import AuthContext from "../../context/AuthContext";
import NoPermissionText from "../../components/ui/NoPermissionText";
import { hasMasterWritePermission } from "../../utils/masterPermissions";

const PAGE_SIZE = 8;

const columns = [
  { key: "no", label: "No", width: 60 },
  { key: "codeCell", label: "자재코드", width: 160 },
  { key: "name", label: "자재명", width: 100 },
  { key: "unit", label: "단위", width: 80 },
  { key: "safetyStockCell", label: "안전재고", width: 100 },
  { key: "registeredAt", label: "등록일", width: 140 },
  { key: "management", label: "관리", width: 90 },
];

const getToday = () => new Date().toISOString().slice(0, 10);

const createMaterialCode = (materials) => {
  const maxNumber = materials.reduce((max, material) => {
    const number = Number(material.code?.split("-").pop()) || 0;
    return Math.max(max, number);
  }, 0);

  return `MAT-${getToday().replaceAll("-", "")}-${String(
    maxNumber + 1,
  ).padStart(4, "0")}`;
};

const formatDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const toMaterialRow = (material) => {
  return {
    id: material.id,
    code: material.materialCode ?? material.code ?? "",
    name: material.materialName ?? material.name ?? "",
    unit: material.unit ?? "",
    safetyStock: material.safetyStock ?? 0,
    registeredAt: formatDate(material.registeredAt),
    active: material.active,
  };
};

export default function MaterialList() {
  const { user } = useContext(AuthContext);
  const canManage = hasMasterWritePermission(user);
  const [materials, setMaterials] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    keyword: "",
  });
  const [page, setPage] = useState(1);
  const [isNewEditOpen, setIsNewEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("new");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await masterApi.getMaterials();
      setMaterials(response.data.map(toMaterialRow));
    } catch (error) {
      console.error("자재 목록 조회 실패:", error);
      window.alert("자재 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const filteredMaterials = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return materials.filter(
      (material) =>
        (!filters.startDate || material.registeredAt >= filters.startDate) &&
        (!filters.endDate || material.registeredAt <= filters.endDate) &&
        (!keyword ||
          material.code.toLowerCase().includes(keyword) ||
          material.name.toLowerCase().includes(keyword)),
    );
  }, [filters, materials]);

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleOpenNew = () => {
    if (!canManage) return;
    setEditMode("new");
    setEditingMaterial(null);
    setIsNewEditOpen(true);
  };

  const handleOpenEdit = (material) => {
    if (!canManage) return;
    setEditMode("edit");
    setEditingMaterial(material);
    setIsNewEditOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsNewEditOpen(false);
    setEditingMaterial(null);
  };

  const handleSaveMaterial = async (form) => {
    if (!canManage) return;
    const payload = {
      materialName: form.name,
      unit: form.unit,
      safetyStock: form.safetyStock ?? 0,
    };

    try {
      if (editMode === "edit" && editingMaterial) {
        await masterApi.updateMaterial(editingMaterial.id, payload);
      } else {
        await masterApi.createMaterial({
          materialCode: form.code || createMaterialCode(materials),
          ...payload,
        });
      }

      await loadMaterials();
      handleCloseDrawer();
    } catch (error) {
      console.error("자재 저장 실패:", error);
      window.alert("자재 저장에 실패했습니다.");
    }
  };

  const handleDeleteMaterial = async (material) => {
    if (!canManage) return;
    const confirmed = window.confirm(
      `${material.name} 자재를 삭제하시겠습니까?`,
    );

    if (!confirmed) return;

    try {
      await masterApi.deleteMaterial(material.id);
      await loadMaterials();

      if (filteredMaterials.length % PAGE_SIZE === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
    } catch (error) {
      console.error("자재 삭제 실패:", error);
      window.alert("자재 삭제에 실패했습니다.");
    }
  };

  const rows = filteredMaterials.map((material, index) => ({
    ...material,
    no: index + 1,
    codeCell: <Code>{material.code}</Code>,
    safetyStockCell: Number(material.safetyStock ?? 0).toLocaleString("ko-KR"),
    management: canManage ? (
      <Management>
        <IconButton
          type="button"
          title="수정"
          aria-label={`${material.name} 수정`}
          onClick={(event) => {
            event.stopPropagation();
            handleOpenEdit(material);
          }}
        >
          <FiEdit2 />
        </IconButton>

        <DeleteButton
          type="button"
          title="삭제"
          aria-label={`${material.name} 삭제`}
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteMaterial(material);
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
    <Page>
      <PageHeader>
        <div>
          <Title>자재 관리</Title>
          <Description>
            생산에 사용하는 자재의 기본정보를 등록하고 수정합니다.
          </Description>
        </div>

        {canManage && (
          <HeaderActionButton
            type="button"
            variant="primary"
            onClick={handleOpenNew}
          >
            <FiPlus size={16} />
            신규 자재 등록
          </HeaderActionButton>
        )}
      </PageHeader>

      <FilterPanel>
        <PanelTitle>자재 검색</PanelTitle>

        <SearchFilterBar
          defaultValues={{}}
          startDateLabel="등록기간"
          endDateLabel="종료일"
          dateWidth={160}
          keywordLabel="자재명 / 코드"
          keywordPlaceholder="자재명 또는 자재코드 검색"
          keywordWidth={320}
          padding={0}
          border="none"
          inputHeight={38}
          showSearchButton={false}
          showResetButton
          onChange={handleFilterChange}
        />
      </FilterPanel>

      <TablePanel>
        <TableHeader>
          <TableTitle>자재 목록</TableTitle>

          <Result>
            조회 결과 <strong>{filteredMaterials.length}</strong>건
            {isLoading ? " 불러오는 중" : ""}
          </Result>
        </TableHeader>

        <Pagination
          columns={columns}
          rows={rows}
          currentPage={page}
          totalItems={filteredMaterials.length}
          itemsPerPage={8}
          visiblePages={5}
          background="#ffffff"
          borderTop="1px solid #e2e6ed"
          onPageChange={setPage}
          tableProps={{
            emptyText: "조건에 맞는 자재가 없습니다.",
          }}
        />
      </TablePanel>

      <MaterialNewEdit
        isOpen={isNewEditOpen}
        mode={editMode}
        material={editingMaterial}
        previewCode={createMaterialCode(materials)}
        onClose={handleCloseDrawer}
        onSave={handleSaveMaterial}
      />
    </Page>
  );
}

const Page = styled.main`
  min-height: 100%;
  padding: var(--page-container-padding);
  box-sizing: border-box;
  background: #f7f8fa;
`;

const PageHeader = styled.header`
  margin-bottom: var(--page-header-content-gap);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--page-section-gap);
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

const Panel = styled.section`
  background: #fff;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

const FilterPanel = styled(Panel)`
  margin-bottom: var(--page-section-gap);
  padding: var(--page-panel-padding);
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

const TablePanel = styled(Panel)`
  overflow: hidden;
  table {
    width: 100%;
    table-layout: fixed;
  }
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

const TableTitle = styled.h2`
  margin: 0;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

const Result = styled.span`
  color: #737b88;
  font-size: 13px;

  strong {
    color: #0755d9;
  }
`;

const Code = styled.strong`
  color: #174b9c;
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
