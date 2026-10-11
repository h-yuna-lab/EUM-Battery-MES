import { useEffect, useState } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import BomMaterialEditor from "../../components/ui/BomMaterialEditor";
import Button from "../../components/ui/Button";

export default function BomEdit({
  isOpen,
  product,
  bomRows,
  materialOptions,
  processOptions,
  onClose,
  onSave,
}) {
  const [editingRows, setEditingRows] = useState([]);

  useEffect(() => {
    if (isOpen) setEditingRows(bomRows.map((row) => ({ ...row })));
  }, [isOpen, bomRows]);

  if (!isOpen || !product) return null;

  const handleSave = () => {
    if (editingRows.some((row) => Number(row.requiredQty) <= 0)) {
      alert("소요량은 0보다 큰 값이어야 합니다.");
      return;
    }
    onSave(
      editingRows.map((row) => ({
        ...row,
        requiredQty: Number(row.requiredQty),
      })),
    );
  };

  return (
    <Backdrop
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <Drawer>
        <Header>
          <h2>BOM 수정</h2>
          <CloseButton type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </CloseButton>
        </Header>
        <Body>
          <ProductSection>
            <SectionTitle>제품 정보</SectionTitle>
            <ProductGrid>
              <Field>
                <label>제품코드</label>
                <input value={product.productCode} readOnly />
              </Field>
              <Field>
                <label>제품명</label>
                <input value={product.productName} readOnly />
              </Field>
              <Field>
                <label>전압(V)</label>
                <input value={product.voltage} readOnly />
              </Field>
              <Field>
                <label>용량(Ah)</label>
                <input value={product.capacity} readOnly />
              </Field>
            </ProductGrid>
          </ProductSection>
          <BomMaterialEditor
            rows={editingRows}
            onChange={setEditingRows}
            materialOptions={materialOptions}
            processOptions={processOptions}
            editableRows
            variant="compact"
          />
        </Body>
        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            취소
          </ActionButton>

          <ActionButton type="button" $primary onClick={handleSave}>
            저장
          </ActionButton>
        </Footer>
      </Drawer>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(19, 27, 39, 0.35);
`;
const Drawer = styled.aside`
  display: flex;
  width: min(600px, 100%);
  height: 100%;
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
const Header = styled.header`
  display: flex;
  height: 84px;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #cbd3e0;
  background: #fff;
  h2 {
    margin: 0;
    font-size: 26px;
  }
`;
const CloseButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #262c35;
  font-size: 24px;
  cursor: pointer;
  &:hover {
    background: #eef1f6;
  }
`;
const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;
const ProductSection = styled.section`
  margin-bottom: 30px;
`;
const SectionTitle = styled.h3`
  margin: 0 0 17px;
  padding-left: 11px;
  border-left: 4px solid #0744a0;
  color: #202630;
  font-size: 18px;
`;
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
`;
const Field = styled.div`
  label {
    display: block;
    margin-bottom: 7px;
    color: #5d6676;
    font-size: 12px;
  }
  input {
    width: 100%;
    height: 47px;
    padding: 0 13px;
    border: 1px solid #c7cee0;
    border-radius: 9px;
    background: #f1f2fb;
    color: #303642;
    box-sizing: border-box;
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
