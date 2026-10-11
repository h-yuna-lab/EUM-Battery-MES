import { useEffect, useState } from "react";
import styled from "styled-components";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Pagination from "./Pagination";

export const DEFAULT_MATERIAL_OPTIONS = [
  {
    materialCode: "MAT-CELL-01",
    materialName: "Lithium Cell Unit",
    unit: "EA",
  },
  { materialCode: "MAT-BMS-03", materialName: "BMS Module v2", unit: "EA" },
  { materialCode: "MAT-20260209-0001", materialName: "납(Pb)", unit: "KG" },
  { materialCode: "MAT-20260209-0002", materialName: "양극판", unit: "EA" },
  { materialCode: "MAT-20260209-0003", materialName: "음극판", unit: "EA" },
  { materialCode: "MAT-20260209-0004", materialName: "전해액", unit: "L" },
];

export const DEFAULT_PROCESS_OPTIONS = [
  "전극공정",
  "조립공정",
  "주액공정",
  "충전공정",
  "검사공정",
  "패킹공정",
];

export default function BomMaterialEditor({
  rows,
  onChange,
  materialOptions = DEFAULT_MATERIAL_OPTIONS,
  processOptions = DEFAULT_PROCESS_OPTIONS,
  editableRows = false,
  itemsPerPage = 8,
  variant = "default",
}) {
  const [materialCode, setMaterialCode] = useState("");
  const [process, setProcess] = useState("");
  const [quantity, setQuantity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const isCompact = variant === "compact";

  const totalPages = Math.max(Math.ceil(rows.length / itemsPerPage), 1);
  const normalizedProcessOptions = processOptions.map((option) =>
    typeof option === "string"
      ? { id: option, processName: option, processCode: option }
      : option,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const selectedMaterial = materialOptions.find(
    (material) => material.materialCode === materialCode,
  );
  const selectedProcess = normalizedProcessOptions.find(
    (option) => String(option.id) === String(process),
  );

  const addMaterial = () => {
    if (!selectedMaterial || !selectedProcess || Number(quantity) <= 0) {
      alert("자재, 투입 공정 및 소요량을 정확히 설정해주세요.");
      return;
    }
    if (
      rows.some(
        (row) =>
          row.materialCode === materialCode &&
          String(row.inputProcessId ?? row.process) === String(selectedProcess.id),
      )
    ) {
      alert("이미 추가된 자재와 공정 조합입니다.");
      return;
    }

    onChange([
      ...rows,
      {
        id: Date.now(),
        _isNew: true,
        ...selectedMaterial,
        requiredQty: Number(quantity),
        inputProcessId: selectedProcess.id,
        process: selectedProcess.processName,
      },
    ]);
    setCurrentPage(Math.ceil((rows.length + 1) / itemsPerPage));
    setMaterialCode("");
    setProcess("");
    setQuantity("");
  };

  const updateRow = (id, field, value) => {
    if (field === "process") {
      const nextProcess = normalizedProcessOptions.find(
        (option) => String(option.id) === String(value),
      );
      onChange(
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                inputProcessId: nextProcess?.id ?? value,
                process: nextProcess?.processName ?? value,
              }
            : row,
        ),
      );
      return;
    }

    onChange(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const columns = [
    { key: "materialCode", label: "자재 코드", width: 130 },
    { key: "materialName", label: "자재명", width: 130 },
    {
      key: "requiredQty",
      label: "소요량",
      width: 90,
      render: (value, row) =>
        editableRows ? (
          <SmallInput
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(event) =>
              updateRow(row.id, "requiredQty", event.target.value)
            }
          />
        ) : (
          <strong>{Number(value).toFixed(2)}</strong>
        ),
    },
    { key: "unit", label: "단위", width: 65 },
    {
      key: "process",
      label: "투입 공정",
      width: 120,
      render: (value, row) =>
        editableRows ? (
          <SmallSelect
            value={row.inputProcessId ?? value}
            onChange={(event) =>
              updateRow(row.id, "process", event.target.value)
            }
          >
            {normalizedProcessOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.processName}
              </option>
            ))}
          </SmallSelect>
        ) : (
          <Badge>{value}</Badge>
        ),
    },
    {
      key: "management",
      label: "관리",
      width: 65,
      render: (_, row) => (
        <DeleteButton
          type="button"
          aria-label={`${row.materialName} 삭제`}
          onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
        >
          <FiTrash2 />
        </DeleteButton>
      ),
    },
  ];

  return (
    <Editor>
      <Section>
        <SectionTitle $isCompact={isCompact}>BOM 자재 추가</SectionTitle>
        <AddPanel $isCompact={isCompact}>
          <Field>
            <label>자재 선택</label>
            <select
              value={materialCode}
              onChange={(event) => setMaterialCode(event.target.value)}
            >
              <option value="">{isCompact ? "자재 선택" : "자재를 선택하세요"}</option>
              {materialOptions.map((material) => (
                <option
                  key={material.materialCode}
                  value={material.materialCode}
                >
                  {material.materialCode} ({material.materialName})
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <label>투입 공정</label>
            <select
              value={process}
              onChange={(event) => setProcess(event.target.value)}
            >
              <option value="">{isCompact ? "공정 선택" : "투입 공정을 선택하세요"}</option>
              {normalizedProcessOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.processName}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <label>소요량</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
          <AddButton $isCompact={isCompact} type="button" onClick={addMaterial}>
            <FiPlus /> {isCompact ? "추가" : "자재 추가"}
          </AddButton>
        </AddPanel>
      </Section>

      <Section>
        <SectionTitle $isCompact={isCompact}>BOM 리스트</SectionTitle>
        <Pagination
          columns={columns}
          rows={rows}
          currentPage={currentPage}
          totalItems={rows.length}
          itemsPerPage={itemsPerPage}
          visiblePages={5}
          onPageChange={setCurrentPage}
          containerBorder="1px solid #c7cddd"
          containerBorderRadius={8}
          height={54}
          padding={8}
          background="#f7f8fd"
          borderTop="1px solid #dce1ea"
          buttonSize={32}
          tableProps={{
            minWidth: 600,
            headerHeight: 44,
            rowHeight: 44,
            cellPadding: "0 10px",
            fontSize: 12,
            headerBackground: "#eef0f8",
            emptyText: "추가된 자재가 없습니다.",
          }}
        />
      </Section>
    </Editor>
  );
}

const Editor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;
const Section = styled.section``;
const SectionTitle = styled.h3`
  margin: 0 0 18px;
  padding-left: ${({ $isCompact }) => ($isCompact ? "11px" : "0")};
  border-left: ${({ $isCompact }) =>
    $isCompact ? "4px solid #0744a0" : "none"};
  color: #202738;
  font-size: 18px;
  font-weight: 700;
`;
const AddPanel = styled.div`
  display: grid;
  grid-template-columns: ${({ $isCompact }) =>
    $isCompact ? "1.3fr 1.3fr 96px 72px" : "1.35fr 1.35fr 0.8fr auto"};
  gap: 12px;
  align-items: end;
  padding: ${({ $isCompact }) => ($isCompact ? "0" : "20px")};
  border: ${({ $isCompact }) =>
    $isCompact ? "none" : "1px solid #c7cddd"};
  border-radius: 8px;
  background: ${({ $isCompact }) => ($isCompact ? "transparent" : "#f7f8fd")};

  ${({ $isCompact }) =>
    $isCompact &&
    `
      label { display: none; }
    `}
  @media (max-width: 560px) {
    grid-template-columns: 1fr 1fr;
  }
`;
const Field = styled.div`
  label {
    display: block;
    margin-bottom: 7px;
    color: #616b7e;
    font-size: 12px;
  }
  input,
  select {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border: 1px solid #c7cddd;
    border-radius: 8px;
    background: #fff;
    color: #262d3c;
    box-sizing: border-box;
    outline: none;
    &:focus {
      border-color: #084693;
    }
  }
`;
const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 42px;
  padding: ${({ $isCompact }) => ($isCompact ? "0 10px" : "0 18px")};
  border: 0;
  border-radius: 8px;
  background: #0b57d0;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: #0848ad;
  }
`;
const SmallInput = styled.input`
  width: 64px;
  height: 34px;
  padding: 0 6px;
  border: 1px solid #bdc7da;
  border-radius: 5px;
  text-align: center;
  box-sizing: border-box;
`;
const SmallSelect = styled.select`
  width: 100%;
  height: 34px;
  padding: 0 7px;
  border: 1px solid #bdc7da;
  border-radius: 5px;
  background: #fff;
`;
const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  background: #eef0f8;
  color: #084693;
  font-size: 11px;
  font-weight: 700;
`;
const DeleteButton = styled.button`
  display: inline-grid;
  place-items: center;
  padding: 7px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  &:hover {
    background: #fff0f1;
  }
`;
