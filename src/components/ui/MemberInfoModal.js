import { useEffect } from "react";
import styled from "styled-components";
import { FiUser } from "react-icons/fi";
import Button from "./Button";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(17, 24, 39, 0.46);
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1201;
  width: 410px;
  max-width: calc(100% - 32px);
  padding: 24px;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
`;

const ModalTitle = styled.h2`
  margin: 0 0 20px;
  color: #20252d;
  font-size: 21px;
`;

const MemberSummary = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #f6f7f9;
  border-radius: 8px;
`;

const MemberLabel = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MemberIcon = styled.span`
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e5edfb;
  color: #0755d9;
`;

const LabelText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    color: #20252d;
    font-size: 14px;
    font-weight: 600;
  }

  span {
    color: #7b8491;
    font-size: 12px;
  }
`;

const EmployeeNumber = styled.strong`
  overflow: hidden;
  color: #20252d;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ModalActions = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const RightActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
`;

export default function MemberInfoModal({
  isOpen,
  onClose,
  onEdit,
  onLogout,
  username,
  employeeNo,
  employeeName,
  displayName,
  role,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userDisplayName = displayName || employeeName || username || "-";
  const displayMeta = [employeeNo, role].filter(Boolean).join(" / ");

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-info-title"
      >
        <ModalTitle id="member-info-title">회원 정보</ModalTitle>

        <MemberSummary>
          <MemberLabel>
            <MemberIcon>
              <FiUser size={18} />
            </MemberIcon>
            <LabelText>
              <strong>{userDisplayName}</strong>
              <span>{displayMeta || "로그인 계정"}</span>
            </LabelText>
          </MemberLabel>
          <EmployeeNumber title={username}>{username || "-"}</EmployeeNumber>
        </MemberSummary>

        <ModalActions>
          <ActionButton type="button" variant="danger" onClick={onLogout}>
            로그아웃
          </ActionButton>
          <RightActions>
            <ActionButton type="button" onClick={onEdit}>
              비밀번호 수정
            </ActionButton>
            <ActionButton type="button" variant="outline" onClick={onClose}>
              닫기
            </ActionButton>
          </RightActions>
        </ModalActions>
      </Modal>
    </>
  );
}
