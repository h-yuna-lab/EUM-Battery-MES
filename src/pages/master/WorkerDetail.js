import { useEffect } from "react";
import styled from "styled-components";
import { FiUser, FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

export default function WorkerDetail({ worker, onClose, onEdit, canEdit = true }) {
  useEffect(() => {
    if (!worker) return undefined;

    // 드로어가 열린 동안 배경 스크롤을 막고 ESC 키로 닫을 수 있게 처리
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [worker, onClose]);

  if (!worker) return null;

  const active = worker.isActive;

  return (
    <>
      <Backdrop onClick={onClose} />
      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="worker-detail-title"
      >
        <Header>
          <Title id="worker-detail-title">작업자 상세 조회</Title>
          <Close type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </Close>
        </Header>

        <Body>
          <SectionTitle>작업자 정보</SectionTitle>
          <DetailCard>
            <Field>
              <Label>작업자 번호</Label>
              <Value $code>{worker.workerCode}</Value>
            </Field>
            <Field>
              <Label>이름</Label>
              <Value>{worker.workerName}</Value>
            </Field>
            <Field>
              <Label>직급</Label>
              <Value>{worker.role}</Value>
            </Field>
            <Field>
              <Label>출퇴근 상태</Label>
              <Status $active={active}>
                <FiUser />
                {active ? "출근" : "퇴근"}
              </Status>
            </Field>
            <Field>
              <Label>입사일</Label>
              <Value>
                {worker.hiredAt || worker.createdAt?.split(" ")[0] || "-"}
              </Value>
            </Field>
            <Field>
              <Label>등록일시</Label>
              <Value>{worker.createdAt || "-"}</Value>
            </Field>
            <Field>
              <Label>수정일시</Label>
              <Value>{worker.updatedAt || "-"}</Value>
            </Field>
          </DetailCard>
        </Body>

        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            닫기
          </ActionButton>

          {canEdit && (
            <ActionButton type="button" $primary onClick={() => onEdit(worker)}>
              수정
            </ActionButton>
          )}
        </Footer>
      </Drawer>
    </>
  );
}

// 드로어 뒤쪽을 어둡게 덮는 배경, 클릭하면 닫힘
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.38);
`;

// 오른쪽에서 열리는 상세 사이드 드로어
const Drawer = styled.aside`
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

// 드로어 상단 제목과 닫기 버튼 영역
const Header = styled.header`
  min-height: 72px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9deea;
  background: #fff;
`;

// 상세 드로어 제목
const Title = styled.h2`
  margin: 0;
  color: #202738;
  font-size: 18px;
  font-weight: 600;
`;

// 우측 상단 닫기 아이콘 버튼
const Close = styled.button`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #6f788b;
  font-size: 23px;

  &:hover {
    background: #f1f3f8;
  }
`;

// 본문 영역, 내용이 길어질 때 드로어 안에서만 스크롤
const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 28px;
`;

// 정보 묶음의 소제목
const SectionTitle = styled.h3`
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 4px solid #0b57d0;
  color: #202738;
  font-size: 14px;
  font-weight: 600;
`;

const DetailCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 28px;
  padding: 18px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

// 라벨과 값 한 쌍을 감싸는 필드
const Field = styled.div`
  min-width: 0;
`;

// 필드 위쪽의 작은 설명 라벨
const Label = styled.span`
  display: block;
  margin-bottom: 6px;
  color: #8a94a6;
  font-size: 11px;
  font-weight: 600;
`;

// 읽기 전용 값을 input처럼 보여주는 박스
const Value = styled.div`
  min-height: auto;
  padding: 0;
  display: flex;
  align-items: center;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #2a3140;
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 700;
`;

// isActive 값에 따라 출근/퇴근 색상이 바뀌는 상태 박스
const Status = styled(Value)`
  min-height: 24px;
  width: fit-content;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#eff9ef" : "#f3f4f7")};
  color: ${({ $active }) => ($active ? "#27843b" : "#687080")};
  font-size: 12px;
`;

// 하단 버튼 영역, 드로어 아래쪽에 고정된 느낌으로 배치
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
