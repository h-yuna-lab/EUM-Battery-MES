import { useEffect } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

// ProcessDetail과 동일한 구조로 onEdit을 직접 바인딩합니다.
export default function MachineDetail({
  isOpen,
  onClose,
  selectedMachine,
  onEdit,
  canEdit = true,
}) {
  useEffect(() => {
    if (!isOpen || !selectedMachine) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectedMachine, onClose]);

  if (!isOpen || !selectedMachine) return null;

  return (
    <>
      <Backdrop onClick={onClose} />
      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="machine-detail-title"
      >
        <Header>
          <Title id="machine-detail-title">설비 상세 정보</Title>
          <Close type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </Close>
        </Header>

        <Body>
          <Field>
            <Label>설비 ID</Label>
            <Value $code>{selectedMachine.machine_id}</Value>
          </Field>

          <Field>
            <Label>공정코드</Label>
            <Value>{selectedMachine.process_id}</Value>
          </Field>

          <Field>
            <Label>설비코드</Label>
            <Value>{selectedMachine.machine_code}</Value>
          </Field>

          <Field>
            <Label>설비명</Label>
            <Value>{selectedMachine.machine_name}</Value>
          </Field>

          <Field>
            <Label>설비상태</Label>
            <Value>{selectedMachine.status}</Value>
          </Field>

          <Field>
            <Label>연동 여부</Label>
            <Value>
              {selectedMachine.use_yn === "Y" ? "연동" : "미연동"}
            </Value>
          </Field>

          <Field>
            <Label>메시지</Label>
            <Value>{selectedMachine.message || "-"}</Value>
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

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 30px;
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
