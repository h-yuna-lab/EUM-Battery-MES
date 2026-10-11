import { useEffect, useState } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

const EMPTY_FORM = {
  id: "",
  code: "",
  name: "",
  unit: "",
  safetyStock: 0,
};

export default function MaterialNewEdit({
  isOpen,
  mode = "new",
  material,
  previewCode = "",
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && material) {
      setForm({
        id: material.id ?? "",
        code: material.code ?? "",
        name: material.name ?? "",
        unit: material.unit ?? "",
        safetyStock: material.safetyStock ?? 0,
      });
      return;
    }

    setForm({
      id: "",
      code: previewCode,
      name: "",
      unit: "",
      safetyStock: 0,
    });
  }, [isOpen, mode, material, previewCode]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      window.alert("자재명을 입력해주세요.");
      return;
    }

    if (!form.unit) {
      window.alert("단위를 선택해주세요.");
      return;
    }

    const safetyStock = Number(form.safetyStock);
    if (!Number.isFinite(safetyStock) || safetyStock < 0) {
      window.alert("안전재고는 0 이상의 숫자로 입력해주세요.");
      return;
    }

    const savedMaterial = {
      ...material,
      ...form,
      safetyStock,

      id: mode === "edit" ? material?.id : Date.now(),

      code:
        mode === "edit" ? material?.code : previewCode || `MAT-${Date.now()}`,

      registeredAt:
        mode === "edit"
          ? material?.registeredAt
          : new Date().toISOString().slice(0, 10),
    };

    onSave(savedMaterial);
  };

  return (
    <>
      <Overlay onClick={onClose} />

      <Drawer
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "자재 수정" : "신규 자재 등록"}
      >
        <DrawerHeader>
          <DrawerTitle>
            {mode === "edit" ? "자재 수정" : "신규 자재 등록"}
          </DrawerTitle>

          <CloseButton type="button" aria-label="닫기" onClick={onClose}>
            <FiX size={21} />
          </CloseButton>
        </DrawerHeader>

        <Form onSubmit={handleSubmit}>
          <DrawerBody>
            <FormGroup>
              <Label>no (자재 번호)</Label>

              <Input
                type="text"
                value={mode === "edit" ? form.id : ""}
                placeholder="자동 생성"
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>자재 코드</Label>

              <Input
                type="text"
                value={mode === "edit" ? form.code : previewCode}
                placeholder="자동 생성"
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>
                자재명 <Required>*</Required>
              </Label>

              <Input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="자재 이름을 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <Label>
                단위 <Required>*</Required>
              </Label>

              <Select name="unit" value={form.unit} onChange={handleChange}>
                <option value="">단위를 선택하세요</option>
                <option value="EA">EA</option>
                <option value="KG">KG</option>
                <option value="L">L</option>
                <option value="M">M</option>
                <option value="BOX">BOX</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>안전재고</Label>

              <Input
                type="number"
                name="safetyStock"
                value={form.safetyStock}
                min="0"
                step="0.001"
                onChange={handleChange}
                placeholder="안전재고 기준 수량을 입력하세요"
              />
            </FormGroup>
          </DrawerBody>

          <Footer>
            <ActionButton type="button" variant="outline" onClick={onClose}>
              취소
            </ActionButton>

            <ActionButton type="submit" $primary>
              {mode === "edit" ? "저장" : "등록"}
            </ActionButton>
          </Footer>
        </Form>
      </Drawer>
    </>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.35);
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1001;

  width: min(600px, 100%);
  height: 100dvh;

  display: flex;
  flex-direction: column;

  background: #f7f9fc;
  box-shadow: -12px 0 32px rgba(21, 29, 44, 0.2);
  animation: open 0.25s ease-out;

  @keyframes open {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const DrawerHeader = styled.header`
  min-height: 84px;
  padding: 0 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid #cbd3e0;
  background: #fff;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  color: #202630;
  font-size: 26px;
  font-weight: 700;
`;

const CloseButton = styled.button`
  && {
    display: grid;
    width: 36px;
    height: 36px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #262c35;
    font: inherit;
    font-size: 24px;
    line-height: 1;
    appearance: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  &&:hover {
    background: #eef1f6;
  }

  &&:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const Form = styled.form`
  min-height: 0;
  flex: 1;

  display: flex;
  flex-direction: column;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 7px;

  color: #5d6676;
  font-size: 12px;
  font-weight: 500;
`;

const Required = styled.span`
  color: #e5484d;
`;

const Input = styled.input`
  width: 100%;
  height: 47px;
  padding: 0 13px;

  box-sizing: border-box;

  border: 1px solid #c7cee0;
  border-radius: 9px;
  outline: none;

  background: #fff;
  color: #303642;
  font-size: 13px;

  &::placeholder {
    color: #a0a6b1;
  }

  &:focus {
    border-color: #0b57d0;
    box-shadow: 0 0 0 3px rgba(11, 87, 208, 0.1);
  }

  &:disabled {
    background: #f1f2fb;
    color: #8d929b;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  height: 47px;
  padding: 0 13px;

  box-sizing: border-box;

  border: 1px solid #c7cee0;
  border-radius: 9px;
  outline: none;

  background: #ffffff;
  color: #252932;
  font-size: 13px;
  cursor: pointer;

  &:focus {
    border-color: #0b57d0;
    box-shadow: 0 0 0 3px rgba(11, 87, 208, 0.1);
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
