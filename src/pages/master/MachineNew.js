import React, { useState } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

export default function MachineNew({ isOpen, onClose, onSave, processes = [] }) {
  const [formData, setFormData] = useState({
    process_id: "",
    processId: "",
    machine_code: "",
    machine_name: "",
    status: "가동",
    use_yn: "Y",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // 기본 form 제출 기능(새로고침) 방지

    // 💡 .trim()을 사용하여 띄어쓰기 공백만 넣어서 우회하는 것을 완벽 차단!
    if (
      !String(formData.processId).trim() ||
      !formData.machine_code.trim() ||
      !formData.machine_name.trim()
    ) {
      alert("모든 필수 입력 항목을 채워주세요.");
      return;
    }

    onSave(formData);

    // 저장 후 모달 닫기 및 폼 초기화
    setFormData({
      process_id: "",
      processId: "",
      machine_code: "",
      machine_name: "",
      status: "가동",
      use_yn: "Y",
    });
    onClose();
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="machine-new-title"
      >
        <Header>
          <Title id="machine-new-title">설비 등록</Title>
          <Close type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </Close>
        </Header>

        {/* 💡 onSubmit 핸들러가 연결되어 있어 form 내부에서 Enter를 눌러도 제출 가능합니다 */}
        <Form id="machine-new-form" onSubmit={handleSubmit}>
          {/* 1. 공정 */}
          <FormGroup>
            <Label>공정</Label>
            <Select
              name="processId"
              value={formData.processId}
              onChange={handleChange}
              required
            >
              <option value="">공정을 선택하세요</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>
                  {process.processCode} / {process.processName}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* 2. 설비코드 */}
          <FormGroup>
            <Label>설비코드</Label>
            <Input
              type="text"
              name="machine_code"
              placeholder="예: MC-001"
              value={formData.machine_code}
              onChange={handleChange}
              required // HTML5 브라우저 검증 활성화
            />
          </FormGroup>

          {/* 3. 설비명 */}
          <FormGroup>
            <Label>설비명</Label>
            <Input
              type="text"
              name="machine_name"
              placeholder="설비 이름을 입력하세요"
              value={formData.machine_name}
              onChange={handleChange}
              required // HTML5 브라우저 검증 활성화
            />
          </FormGroup>

          {/* 4. 설비상태 */}
          <FormGroup>
            <Label>설비상태</Label>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="가동">가동</option>
              <option value="비가동">비가동</option>
              <option value="에러">에러</option>
            </Select>
          </FormGroup>

          {/* 5. 연동여부 */}
          <FormGroup>
            <Label>연동 여부</Label>
            <Select
              name="use_yn"
              value={formData.use_yn}
              onChange={handleChange}
            >
              <option value="Y">연동</option>
              <option value="N">미연동</option>
            </Select>
          </FormGroup>
        </Form>

        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            취소
          </ActionButton>

          <ActionButton type="submit" $primary form="machine-new-form">
            등록
          </ActionButton>
        </Footer>
      </Drawer>
    </>
  );
}

/* ================= Styled Components ================= */
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.38);
`;

const Drawer = styled.aside`
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
  animation: open 0.24s ease-out;

  @keyframes open {
    from {
      transform: translateX(100%);
    }
    to {
      transform: none;
    }
  }
`;

const Header = styled.header`
  min-height: 86px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9deea;
`;

const Title = styled.h2`
  margin: 0;
  color: #202738;
  font-size: 20px;
  font-weight: 700;
`;

const Close = styled.button`
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

const Form = styled.form`
  flex: 1;
  overflow-y: auto;
  padding: 32px 30px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 7px;
  color: #616b7e;
  font-size: 12px;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: #262d3c;
  transition: border-color 0.15s;

  &:focus {
    border-color: #084693;
  }
`;

const Select = styled.select`
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: #262d3c;
  cursor: pointer;
  transition: border-color 0.15s;

  &:focus {
    border-color: #084693;
  }
`;

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
