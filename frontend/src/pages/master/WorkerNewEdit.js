import { useEffect, useState } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

// 등록 폼의 기본값, 수정 모드에서는 선택한 작업자 값으로 덮어씀
const emptyForm = {
  workerCode: "",
  workerName: "",
  hiredAt: "",
  role: "",
  isActive: "true",
};

export default function WorkerNewEdit({
  open,
  worker,
  previewWorkerCode = "",
  onClose,
  onSubmit,
  canManage = false,
}) {
  const [form, setForm] = useState(emptyForm);

  // worker가 있으면 수정 모드, 없으면 신규 등록 모드
  const editing = Boolean(worker);

  useEffect(() => {
    if (!open) return undefined;

    // 드로어가 열릴 때마다 신규/수정 상태에 맞춰 폼 값을 초기화
    setForm(
      worker
        ? {
            workerCode: worker.workerCode,
            workerName: worker.workerName,
            hiredAt: worker.hiredAt,
            role: worker.role,
            isActive: worker.isActive ? "true" : "false",
          }
        : {
            ...emptyForm,
            workerCode: previewWorkerCode,
          },
    );

    // 드로어가 열린 동안 배경 스크롤을 막고 ESC 키로 닫을 수 있게 처리
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, worker, previewWorkerCode, onClose]);

  if (!open) return null;

  const change = ({ target: { name, value } }) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const submit = (event) => {
    event.preventDefault();

    if (
      !form.workerCode.trim() ||
      !form.workerName.trim() ||
      !form.hiredAt ||
      !form.role
    ) {
      return;
    }

    onSubmit({
      ...form,
      workerCode: editing ? worker.workerCode : previewWorkerCode,
      isActive: form.isActive === "true",
    });
  };
  return (
    <>
      <Backdrop onClick={onClose} />
      <Drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="worker-form-title"
      >
        <Header>
          <Title id="worker-form-title">
            작업자 {editing ? "수정" : "등록"}
          </Title>
          <Close type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </Close>
        </Header>

        <Form onSubmit={submit}>
          <Body>
            <SectionTitle>개인정보</SectionTitle>
            <Field>
              <Label htmlFor="workerCode">사원 번호</Label>
              <Input
                id="workerCode"
                type="text"
                value={form.workerCode}
                placeholder="자동 생성"
                disabled
              />
            </Field>
            <Field>
              <Label htmlFor="workerName">사원명</Label>
              <Input
                id="workerName"
                name="workerName"
                value={form.workerName}
                onChange={change}
                placeholder="사원명을 입력하세요"
              />
            </Field>
            <Field>
              <Label htmlFor="hiredAt">입사일</Label>
              <Input
                id="hiredAt"
                type="date"
                name="hiredAt"
                value={form.hiredAt}
                onChange={change}
              />
            </Field>

            <SectionTitle>권한정보</SectionTitle>
            <Field>
              <Label htmlFor="role">직급/권한</Label>
              <Select id="role" name="role" value={form.role} onChange={change}>
                <option value="">권한을 선택하세요</option>
                <option value="관리자">관리자</option>
                <option value="작업자">작업자</option>
              </Select>
            </Field>

            {editing && canManage && (
              <Field>
                <Label htmlFor="isActive">출퇴근 상태</Label>
                <Select
                  id="isActive"
                  name="isActive"
                  value={form.isActive}
                  onChange={change}
                >
                  <option value="true">출근</option>
                  <option value="false">퇴근</option>
                </Select>
              </Field>
            )}
          </Body>

          <Footer>
            <ActionButton type="button" variant="outline" onClick={onClose}>
              취소
            </ActionButton>

            <ActionButton type="submit" $primary>
              {editing ? "저장" : "등록"}
            </ActionButton>
          </Footer>
        </Form>
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

// 오른쪽에서 열리는 등록/수정 사이드 드로어
const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  width: min(600px, 100%);
  height: 100dvh;
  background: #fff;
  display: flex;
  flex-direction: column;
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
  height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9deea;
`;

// 등록/수정 드로어 제목
const Title = styled.h2`
  margin: 0;
  color: #191f2d;
  font-size: 21px;
  font-weight: 700;
`;

// 우측 상단 닫기 아이콘 버튼
const Close = styled.button`
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #4e586b;
  font-size: 22px;

  &:hover {
    background: #f1f3f8;
  }
`;

// 본문과 하단 버튼을 세로로 나누는 form 레이아웃
const Form = styled.form`
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// 폼 입력 영역, 내용이 길어지면 여기서만 스크롤
const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px;
`;

// 개인정보/권한정보 섹션 제목, 왼쪽 파란 막대로 구분
const SectionTitle = styled.h3`
  margin: 0 0 24px;
  padding-left: 13px;
  position: relative;
  color: #202738;
  font-size: 17px;
  font-weight: 600;

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 24px;
    border-radius: 2px;
    background: #0b4aae;
  }

  &:not(:first-child) {
    margin-top: 38px;
  }
`;

// 라벨과 입력 컴포넌트 한 쌍을 감싸는 영역
const Field = styled.div`
  margin-bottom: 24px;
`;

// 입력 필드 위쪽 라벨
const Label = styled.label`
  display: block;
  margin-bottom: 9px;
  color: #485164;
  font-size: 13px;
`;

// input과 select가 같은 높이/테두리를 쓰도록 묶은 공통 스타일
const control = `
  width: 100%;
  height: 46px;
  padding: 0 16px;
  border: 1px solid #7f899e;
  border-radius: 7px;
  background: #f8faff;
  color: #202738;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: #0b4aae;
    box-shadow: 0 0 0 3px rgba(11, 74, 174, 0.1);
  }

  &::placeholder {
    color: #bbc1cb;
  }

  &:disabled {
    border-color: #c7cee0;
    background: #f1f2fb;
    color: #8d929b;
    cursor: not-allowed;
  }
`;

// 텍스트와 날짜 입력에 쓰는 기본 input
const Input = styled.input`
  ${control}
`;

// 권한 선택 select, 기본 화살표 대신 CSS 화살표를 사용
const Select = styled.select`
  ${control}
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, #687386 50%),
    linear-gradient(135deg, #687386 50%, transparent 50%);
  background-position:
    calc(100% - 18px) 20px,
    calc(100% - 13px) 20px;
  background-size: 5px 5px;
  background-repeat: no-repeat;
`;

// 하단 취소/저장 버튼 영역
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
