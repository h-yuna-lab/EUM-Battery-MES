import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Button from "../../components/ui/Button";
import { FiX } from "react-icons/fi"; // FiX 아이콘 추가

/* ProductDetail 기반 통일된 디자인 시스템 적용 */
const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.38);
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  width: min(600px, 100%);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.24s ease-out;
`;

const Header = styled.header`
  min-height: 86px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9deea;

  h3 {
    margin: 0;
    color: #202738;
    font-size: 20px;
    font-weight: 700;
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

const FormBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 30px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  margin: 0 0 24px;
  color: #202738;
  font-size: 18px;
  font-weight: 700;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;

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
    padding: 0 16px;
    border: 1px solid #c7cddd;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    background-color: #fff;
    color: #262d3c;
    font-weight: 500;
    box-sizing: border-box;

    &:focus {
      border-color: #084693;
    }
  }
`;

const RowFields = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

const InputWithSuffix = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  input {
    padding-right: 40px;
  }

  span.suffix {
    position: absolute;
    right: 16px;
    font-size: 13px;
    color: #616b7e;
    font-weight: 500;
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

export default function ProductEdit({ isOpen, product, onClose, onSave }) {
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [voltage, setVoltage] = useState("12");
  const [capacity, setCapacity] = useState("0");
  const [unit, setUnit] = useState("EA");

  // 선택된 제품 데이터가 바뀔 때마다 폼 초기화
  useEffect(() => {
    if (product) {
      setProductCode(product.product_code || "");
      setProductName(product.product_name || "");
      setVoltage(product.voltage?.toString() || "12");
      setCapacity(product.capacity_ah?.toString() || "0");
      setUnit(product.unit || "EA");
    }
  }, [product]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    onSave({
      ...product,
      product_code: productCode,
      product_name: productName,
      voltage: Number(voltage),
      capacity_ah: Number(capacity),
      unit: unit,
    });
    onClose();
  };

  return (
    <>
      <DrawerOverlay $isOpen={isOpen} onClick={onClose} />
      <DrawerContainer $isOpen={isOpen}>
        <Header>
          <h3>제품 수정</h3>
          <CloseButton onClick={onClose} aria-label="닫기">
            <FiX />
          </CloseButton>
        </Header>

        <FormBody>
          <Section>
            <SectionTitle>제품 정보 수정</SectionTitle>
            <FormGroup>
              <label>제품 코드</label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                readOnly
              />
            </FormGroup>
            <FormGroup>
              <label>제품명</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </FormGroup>
            <RowFields>
              <FormGroup>
                <label>전압(V)</label>
                <select
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </select>
              </FormGroup>
              <FormGroup>
                <label>용량(Ah)</label>
                <InputWithSuffix>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                  <span className="suffix">Ah</span>
                </InputWithSuffix>
              </FormGroup>
              <FormGroup>
                <label>단위</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="EA">EA</option>
                  <option value="BOX">BOX</option>
                </select>
              </FormGroup>
            </RowFields>
          </Section>
        </FormBody>

        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            취소
          </ActionButton>

          <ActionButton type="button" $primary onClick={handleUpdate}>
            저장
          </ActionButton>
        </Footer>
      </DrawerContainer>
    </>
  );
}
