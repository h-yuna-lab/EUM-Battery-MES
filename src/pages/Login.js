import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FiAlertCircle,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUser,
} from "react-icons/fi";
import AuthContext from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Page = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(360px, 0.92fr) minmax(480px, 1.08fr);
  background: #f4f7fb;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BrandPanel = styled.section`
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: clamp(36px, 5vw, 72px);
  color: #fff;
  background:
    radial-gradient(circle at 16% 18%, rgba(59, 130, 246, 0.28), transparent 34%),
    linear-gradient(145deg, #172554 0%, #0f172a 58%, #111827 100%);

  &::before,
  &::after {
    content: "";
    position: absolute;
    z-index: -1;
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 50%;
  }

  &::before {
    width: 430px;
    height: 430px;
    right: -210px;
    top: 18%;
  }

  &::after {
    width: 620px;
    height: 620px;
    right: -290px;
    top: 8%;
  }

  @media (max-width: 900px) {
    min-height: auto;
    padding: 28px 24px 36px;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  filter:
      drop-shadow(0 0 3px rgba(255, 255, 255, 0.42))
      drop-shadow(0 0 15px rgba(255, 255, 255, 0.18));

  img {
    display: block;
    width: 80px;
    height: auto;
    object-fit: contain;
    filter:
      brightness(1.18)
      drop-shadow(0 0 1px rgba(255, 255, 255, 0.1))
      drop-shadow(0 0 10px rgba(255, 255, 255, 0.18));
  }
`;

const BrandContent = styled.div`
  max-width: 540px;
  margin: auto 0;
  padding: 48px 0 80px;

  @media (max-width: 900px) {
    padding: 54px 0 20px;
  }
`;

const Eyebrow = styled.p`
  margin-bottom: 18px;
  color: #93c5fd;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const BrandTitle = styled.h1`
  max-width: 500px;
  font-size: clamp(38px, 4vw, 62px);
  font-weight: 700;
  line-height: 1.13;
  letter-spacing: -0.045em;
  word-break: keep-all;

  span { color: #60a5fa; }
`;

const BrandDescription = styled.p`
  max-width: 460px;
  margin-top: 24px;
  color: #cbd5e1;
  font-size: 16px;
  line-height: 1.75;
  word-break: keep-all;

  @media (max-width: 900px) { display: none; }
`;

const Copyright = styled.p`
  color: #64748b;
  font-size: 12px;

  @media (max-width: 900px) { display: none; }
`;

const LoginPanel = styled.section`
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: 48px clamp(24px, 7vw, 112px);
  background:
    linear-gradient(rgba(226, 232, 240, 0.42) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.42) 1px, transparent 1px),
    #f8fafc;
  background-size: 32px 32px;

  @media (max-width: 900px) {
    min-height: auto;
    padding: 48px 24px 64px;
  }
`;

const LoginBox = styled.div`
  width: 100%;
  max-width: 430px;
`;

const Heading = styled.div`
  margin-bottom: 36px;

  h2 {
    color: #0f172a;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.035em;
  }

  p {
    margin-top: 10px;
    color: #64748b;
    font-size: 15px;
    line-height: 1.6;
  }
`;

const Field = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 9px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
`;

const InputWrap = styled.div`
  position: relative;
  color: #94a3b8;

  > svg:first-child {
    position: absolute;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    pointer-events: none;
  }

  &:focus-within { color: #2563eb; }
`;

const Input = styled.input`
  width: 100%;
  height: 54px;
  padding: 0 48px;
  border: 1px solid ${({ $hasError }) => ($hasError ? "#fca5a5" : "#cbd5e1")};
  border-radius: 12px;
  color: #0f172a;
  font-size: 15px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.18s, box-shadow 0.18s;

  &::placeholder { color: #94a3b8; }
  &:hover { border-color: #94a3b8; }
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }
`;

const VisibilityButton = styled.button`
  position: absolute;
  top: 50%;
  right: 10px;
  display: grid;
  width: 36px;
  height: 36px;
  transform: translateY(-50%);
  place-items: center;
  border-radius: 8px;
  color: #64748b;

  &:hover { color: #0f172a; background: #f1f5f9; }
  &:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

const ErrorMessage = styled.p`
  display: flex;
  align-items: center;
  gap: 7px;
  margin: -2px 0 18px;
  padding: 11px 13px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 13px;
  background: #fef2f2;
`;

const SubmitButton = styled.button`
  display: flex;
  width: 100%;
  height: 54px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  background: #2563eb;
  box-shadow: 0 10px 20px -10px rgba(37, 99, 235, 0.75);
  transition: transform 0.18s, background 0.18s, box-shadow 0.18s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #1d4ed8;
    box-shadow: 0 14px 24px -10px rgba(37, 99, 235, 0.8);
  }
  &:active:not(:disabled) { transform: translateY(0); }
  &:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.24); outline-offset: 3px; }
  &:disabled { cursor: not-allowed; opacity: 0.72; }
`;

const Spinner = styled.span`
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const HelpText = styled.p`
  margin-top: 24px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
`;

export default function Login() {
  const { login, restoreSession } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post("/api/mes/auth/login", {
        username,
        password,
      });
      login(response.data);
      await restoreSession();
      navigate("/mes/dashboard");
    } catch (err) {
      setError("사원번호 또는 비밀번호를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <BrandPanel aria-label="서비스 소개">
        <Brand>
          <img src="/eum-battery-sidebar-logo.png" alt="" aria-hidden="true" />
          EUM BATTERY
        </Brand>
        <BrandContent>
          <Eyebrow>Smart Manufacturing System</Eyebrow>
          <BrandTitle>생산의 모든 순간을<br /><span>하나의 흐름</span>으로.</BrandTitle>
          <BrandDescription>
            공정부터 품질, 재고까지 배터리 생산 현황을 실시간으로 연결하고
            더 정확한 의사결정을 지원합니다.
          </BrandDescription>
        </BrandContent>
        <Copyright>© 2026 EUM BATTERY. All rights reserved.</Copyright>
      </BrandPanel>

      <LoginPanel>
        <LoginBox>
          <Heading>
            <h2>생산관리시스템 로그인</h2>
            <p>이음배터리 임직원 전용 시스템입니다.</p>
          </Heading>

          <form onSubmit={handleSubmit} noValidate>
            <Field>
              <Label htmlFor="username">사원번호</Label>
              <InputWrap>
                <FiUser size={19} aria-hidden="true" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  placeholder="사원번호를 입력하세요"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  $hasError={Boolean(error)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                  required
                  autoFocus
                />
              </InputWrap>
            </Field>

            <Field>
              <Label htmlFor="password">비밀번호</Label>
              <InputWrap>
                <FiLock size={19} aria-hidden="true" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  $hasError={Boolean(error)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                  required
                />
                <VisibilityButton
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </VisibilityButton>
              </InputWrap>
            </Field>

            {error && (
              <ErrorMessage id="login-error" role="alert">
                <FiAlertCircle size={16} aria-hidden="true" />
                {error}
              </ErrorMessage>
            )}

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Spinner aria-hidden="true" /> 로그인 중...</>
              ) : (
                <>로그인 <FiArrowRight size={18} aria-hidden="true" /></>
              )}
            </SubmitButton>
          </form>
          <HelpText>계정 관련 문의는 시스템 관리자에게 연락해주세요.</HelpText>
        </LoginBox>
      </LoginPanel>
    </Page>
  );
}