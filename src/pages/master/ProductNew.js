import React, { useState } from "react";
import styled from "styled-components";
import Button from "../../components/ui/Button";
import { FiX } from "react-icons/fi";

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
  background: #f7f9fc;
  box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.24s ease-out;
`;

const Header = styled.header`
  height: 84px;
  flex-shrink: 0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #cbd3e0;
  background: #fff;

  h3 {
    margin: 0;
    color: #202738;
    font-size: 26px;
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
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  margin: 0 0 17px;
  padding-left: 11px;
  border-left: 4px solid #0744a0;
  color: #202738;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0;

  label {
    display: block;
    margin-bottom: 7px;
    color: #616b7e;
    font-size: 12px;
  }

  input,
  select {
    width: 100%;
    height: 47px;
    padding: 0 13px;
    border: 1px solid #c7cee0;
    border-radius: 9px;
    font-size: 14px;
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
  grid-template-columns: repeat(${(props) => props.$cols || 2}, 1fr);
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

export default function ProductNew({ isOpen, onClose, onRegister }) {
  // 제품 마스터 기본 정보 State
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [voltage, setVoltage] = useState("12");
  const [capacity, setCapacity] = useState("0");
  const [unit, setUnit] = useState("EA");

  if (!isOpen) return null;

  // 마스터 최종 등록 전송
  const handleSubmit = () => {
    if (!productCode || !productName) {
      alert("제품 코드와 제품명을 모두 입력해주세요.");
      return;
    }

    const payload = {
      product_code: productCode,
      product_name: productName,
      voltage: Number(voltage),
      capacity_ah: Number(capacity),
      unit: unit,
    };

    // 상위 부모 컴포넌트로 데이터 emit 후 드로어 닫기
    onRegister(payload);
    handleDrawerClose();
  };

  // 인풋 초기화하며 닫기
  const handleDrawerClose = () => {
    setProductCode("");
    setProductName("");
    setVoltage("12");
    setCapacity("0");
    setUnit("EA");
    onClose();
  };

  return (
    <>
      <DrawerOverlay $isOpen={isOpen} onClick={handleDrawerClose} />
      <DrawerContainer $isOpen={isOpen}>
        <Header>
          <h3>제품 등록</h3>
          <CloseButton onClick={handleDrawerClose} aria-label="닫기">
            <FiX />
          </CloseButton>
        </Header>

        <FormBody>
          <Section>
            <SectionTitle>제품 정보</SectionTitle>

            <RowFields $cols={2}>
              <FormGroup>
                <label>제품 코드</label>
                <input
                  type="text"
                  placeholder="예: BAT-12V-100AH-LI"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <label>제품명</label>
                <input
                  type="text"
                  placeholder="제품명을 입력하세요"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </FormGroup>
            </RowFields>

            <RowFields $cols={3} style={{ marginTop: "18px" }}>
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
          <ActionButton
            type="button"
            variant="outline"
            onClick={handleDrawerClose}
          >
            취소
          </ActionButton>

          <ActionButton type="button" $primary onClick={handleSubmit}>
            등록
          </ActionButton>
        </Footer>
      </DrawerContainer>
    </>
  );
}
