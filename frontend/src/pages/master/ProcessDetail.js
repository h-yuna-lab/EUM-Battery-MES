import React, { useEffect } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

// product 프로퍼티로 공정 데이터를 받아오고, onEdit과 onClose를 처리합니다.
export default function ProcessDetail({
  isOpen,
  product,
  onClose,
  onEdit,
  canEdit = true,
}) {
  useEffect(() => {
    if (!isOpen || !product) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, product, onClose]);

  if (!isOpen || !product) return null;

  return (
    <>
      <Backdrop onClick={onClose} />
      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-detail-title"
      >
        <Header>
          <Title id="process-detail-title">공정 상세 조회</Title>
          <Close type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </Close>
        </Header>

        <Body>
          <SectionTitle>공정 정보</SectionTitle>
          <Field>
            <Label>공정명</Label>
            <Value>{product.step_name}</Value>
          </Field>
          <Field>
            <Label>공정 코드</Label>
            <Value $code>{product.step_code}</Value>
          </Field>

          <Grid>
            <Field>
              <Label>담당 설비</Label>
              <Value>{product.machine || "지정되지 않음"}</Value>
            </Field>
            <Field>
              <Label>담당 작업자</Label>
              <Value>{product.worker || "미지정"}</Value>
            </Field>
          </Grid>

          <Field>
            <Label>사용 여부</Label>
            <Value>{product.is_active ? "사용" : "미사용"}</Value>
          </Field>

          <Field>
            <Label>공정 설명</Label>
            <Value
              style={{
                minHeight: "80px",
                alignItems: "flex-start",
                paddingTop: "12px",
              }}
            >
              {product.description || "등록된 설명이 없습니다."}
            </Value>
          </Field>
        </Body>

        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            닫기
          </ActionButton>

          {canEdit && (
            <ActionButton type="button" $primary onClick={onEdit}>
              수정
            </ActionButton>
          )}
        </Footer>
      </Drawer>
    </>
  );
}

/* Styled Components */
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

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 30px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 24px;
  color: #202738;
  font-size: 18px;
  font-weight: 700;
`;

const Field = styled.div`
  margin-bottom: 18px;
`;

const Label = styled.span`
  display: block;
  margin-bottom: 7px;
  color: #616b7e;
  font-size: 12px;
`;

const Value = styled.div`
  min-height: 42px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border: 1px solid #c7cddd;
  border-radius: 8px;
  background: #f7f8fd;
  color: ${({ $code }) => ($code ? "#084693" : "#262d3c")};
  font-family: ${({ $code }) =>
    $code ? "var(--font-family-mono)" : "inherit"};
  font-size: 13px;
  font-weight: ${({ $code }) => ($code ? 700 : 500)};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 440px) {
    /* 반응형 트리거 시점을 다른 모달 컴포넌트와 동일하게 440px로 수정 */
    grid-template-columns: 1fr;
    gap: 0;
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
