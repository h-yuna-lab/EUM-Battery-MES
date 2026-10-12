import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi"; // 동일한 닫기 아이콘 사용
import Button from "../../components/ui/Button";

/* Styled Components */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.38);
`;

// 우측 사이드 패널
const Panel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  width: 600px;
  max-width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);
  animation: slideIn 0.24s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: none;
    }
  }
`;

// 헤더 영역
const Header = styled.div`
  min-height: 86px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9deea;
  position: relative;

  h3 {
    margin: 0;
    color: #202738;
    font-size: 20px;
    font-weight: 700;
  }
  p {
    display: none; /* ProcessDetail의 깔끔한 헤더 형태에 맞춰 p태그는 영역에서 숨김 처리 */
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #6f788b;
  font-size: 23px;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    background: #f1f3f8;
  }
`;

// 폼 본문 영역
const Form = styled.form`
  flex: 1;
  overflow-y: auto;
  padding: 32px 30px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

// 그리드 레이아웃 (공정코드 / 순서 / 상태)
const FormGroupRow = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.3fr; /* 줄어든 너비에 맞춰 내부 열 비율 균형 조정 */
  gap: 12px;

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
    gap: 18px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;

  label {
    display: block;
    color: #616b7e;
    font-size: 12px;
    font-weight: 500;
  }
`;

/* 입력 필드 공통 스타일 */
const Input = styled.input`
  width: 100%;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  font-size: 13px;
  color: #262d3c;
  background: #ffffff;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #084693;
  }

  /* 읽기 전용 스타일 */
  ${(props) =>
    props.readOnly &&
    `
      background: #f7f8fd;
      border-color: #c7cddd;
      color: #084693;
      font-weight: 700;
      cursor: not-allowed;
    `}
`;

const Select = styled.select`
  width: 100%;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  font-size: 13px;
  color: #262d3c;
  background: #ffffff;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;

  &:focus {
    border-color: #084693;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 16px;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  font-size: 13px;
  color: #262d3c;
  background: #ffffff;
  outline: none;
  resize: none;
  line-height: 1.5;
  transition: border-color 0.15s;

  &:focus {
    border-color: #084693;
  }
`;

// 하단 푸터 영역
const Footer = styled.footer`
  flex-shrink: 0;
  padding: 16px 24px;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  border-top: 1px solid #dfe3eb;
  background: #fff;
`;

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  flex-shrink: 0;

  border: ${({ $primary }) => ($primary ? "0" : "1px solid #d2d8e1")};
  border-radius: 7px;

  background: ${({ $primary }) => ($primary ? "#0755d9" : "#fff")};
  color: ${({ $primary }) => ($primary ? "#fff" : "#4b5563")};

  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

export default function ProcessEdit({
  isOpen,
  onClose,
  processData,
  onUpdate,
  workers = [],
  equipmentOptions = [],
}) {
  const [formData, setFormData] = useState({
    id: "",
    step_code: "",
    seq: "",
    is_active: "사용",
    step_name: "",
    machine: "설비 선택 (없음)",
    description: "",
    managerEmployeeId: "",
  });

  useEffect(() => {
    if (processData && isOpen) {
      setFormData({
        id: processData.id || "",
        step_code: processData.step_code || "",
        seq: processData.seq !== undefined ? String(processData.seq) : "",
        is_active: processData.is_active ? "사용" : "미사용",
        step_name: processData.step_name || "",
        machine: processData.machine || "설비 선택 (없음)",
        description: processData.description || "",
        managerEmployeeId: processData.managerEmployeeId || "",
      });
    }
  }, [processData, isOpen]);

  // 모달이 열려있지 않으면 렌더링을 차단
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.step_name.trim()) {
      alert("공정 명칭을 입력해주세요.");
      return;
    }

    onUpdate({
      id: formData.id,
      step_code: formData.step_code,
      seq: Number(formData.seq),
      step_name: formData.step_name,
      is_active: formData.is_active === "사용",
      // 백엔드 processStatus 실제 값: 활성은 "사용", 비활성은 삭제(soft delete) API와 동일하게 "INACTIVE"
      processStatus: formData.is_active === "사용" ? "사용" : "INACTIVE",
      machine: formData.machine,
      description: formData.description,
      managerEmployeeId: formData.managerEmployeeId
        ? Number(formData.managerEmployeeId)
        : processData?.managerEmployeeId,
    });

    onClose();
  };

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <Header>
          <h3>공정 수정</h3>
          <p>선택한 공정 마스터 정보를 수정하십시오.</p>
          <CloseButton type="button" onClick={onClose}>
            <FiX />
          </CloseButton>
        </Header>

        <Form id="process-edit-form" onSubmit={handleSubmit}>
          {/* 상단 3개 요소 나란히 배치 */}
          <FormGroupRow>
            <FormGroup>
              <label>공정코드</label>
              <Input
                type="text"
                name="step_code"
                value={formData.step_code}
                readOnly
              />
            </FormGroup>

            <FormGroup>
              <label>순서 (SEQ)</label>
              <Input
                type="text"
                name="seq"
                value={formData.seq}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <label>상태</label>
              <Select
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
              >
                <option value="사용">사용</option>
                <option value="미사용">미사용</option>
              </Select>
            </FormGroup>
          </FormGroupRow>

          {/* 공정명 */}
          <FormGroup>
            <label>공정명</label>
            <Input
              type="text"
              name="step_name"
              placeholder="공정 명칭을 입력하세요"
              value={formData.step_name}
              onChange={handleChange}
              required
            />
          </FormGroup>

          {/* 담당 설비 */}
          <FormGroup>
            <label>담당 설비 (MACHINE)</label>
            <Select
              name="machine"
              value={formData.machine}
              onChange={handleChange}
            >
              <option value="설비 선택 (없음)">설비 선택 (없음)</option>
              {equipmentOptions.map((equipment) => (
                <option key={equipment.value} value={equipment.value}>
                  {equipment.label}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* 공정 설명 */}
          <FormGroup>
            <label>공정 설명</label>
            <TextArea
              name="description"
              placeholder="공정 세부 프로세스 및 품질 주의사항을 작성하세요."
              value={formData.description}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <label>담당자</label>
            <Select
              name="managerEmployeeId"
              value={formData.managerEmployeeId}
              onChange={handleChange}
            >
              {workers.length === 0 ? (
                <option value="">기존 담당자 유지</option>
              ) : (
                workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.employeeName}
                  </option>
                ))
              )}
            </Select>
          </FormGroup>
        </Form>

        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            취소
          </ActionButton>

          <ActionButton type="submit" $primary form="process-edit-form">
            저장
          </ActionButton>
        </Footer>
      </Panel>
    </Backdrop>
  );
}
