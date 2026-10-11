import { useEffect, useState } from "react";
import styled from "styled-components";
import axiosInstance from "../../api/axiosInstance";
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const Label = styled.label`
  color: #555d69;
  font-size: 13px;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  height: 46px;
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid #cbd2df;
  border-radius: 8px;
  outline: none;
  font: inherit;

  &::placeholder {
    color: #9aa2ae;
  }

  &:focus {
    border-color: #0755d9;
    box-shadow: 0 0 0 2px rgba(7, 85, 217, 0.09);
  }
`;

const Guide = styled.p`
  margin: -2px 0 0;
  color: #7b8491;
  font-size: 12px;
`;

const Message = styled.p`
  margin: 0;
  color: ${({ $success }) => ($success ? "#059669" : "#ba1a1a")};
  font-size: 13px;
`;

const ModalActions = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
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

const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  newPasswordConfirm: "",
};

export default function PasswordChangeModal({ isOpen, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isFormComplete =
    form.currentPassword.trim() !== "" &&
    form.newPassword.trim() !== "" &&
    form.newPasswordConfirm.trim() !== "";

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setMessage("");
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword.length < 8 || form.newPassword.length > 20) {
      setSuccess(false);
      setMessage("새 비밀번호는 8~20자로 입력해 주세요.");
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(form.newPassword)) {
      setSuccess(false);
      setMessage("영문, 숫자, 특수문자를 모두 포함해 주세요.");
      return;
    }

    if (form.newPassword !== form.newPasswordConfirm) {
      setSuccess(false);
      setMessage("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await axiosInstance.post("/api/mes/workers/me/password", form);
      setSuccess(true);
      setMessage("비밀번호가 변경되었습니다.");
      setForm(INITIAL_FORM);
    } catch (error) {
      setSuccess(false);
      setMessage(
        error.response?.data?.message ||
          "비밀번호를 변경하지 못했습니다. 다시 시도해 주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Overlay onClick={submitting ? undefined : onClose} />
      <Modal role="dialog" aria-modal="true" aria-labelledby="password-change-title">
        <ModalTitle id="password-change-title">비밀번호 변경</ModalTitle>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="current-password">현재 비밀번호</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={updateField}
              placeholder="현재 비밀번호"
              autoFocus
              required
            />
          </Field>

          <Field>
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={20}
              value={form.newPassword}
              onChange={updateField}
              placeholder="새 비밀번호"
              required
            />
            <Guide>8~20자, 영문·숫자·특수문자를 조합해 주세요.</Guide>
          </Field>

          <Field>
            <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
            <Input
              id="new-password-confirm"
              name="newPasswordConfirm"
              type="password"
              autoComplete="new-password"
              maxLength={20}
              value={form.newPasswordConfirm}
              onChange={updateField}
              placeholder="새 비밀번호 확인"
              required
            />
          </Field>

          {message && (
            <Message role="status" $success={success}>
              {message}
            </Message>
          )}

          <ModalActions>
            <ActionButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </ActionButton>
            <ActionButton
              type="submit"
              disabled={!isFormComplete || submitting || success}
            >
              {submitting ? "변경 중..." : "저장"}
            </ActionButton>
          </ModalActions>
        </Form>
      </Modal>
    </>
  );
}
