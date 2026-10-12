// 디자인 토큰(DESIGN.md) 기반 공용 뱃지 컴포넌트 - soft pill 스타일
import styled, { css } from "styled-components";

// DESIGN.md: 성공/경고/위험은 기능적 피드백에만 사용
const toneStyles = {
  success: css`
    background: var(--color-success-bg);
    color: var(--color-success);
  `,
  warning: css`
    background: var(--color-warning-bg);
    color: var(--color-warning);
  `,
  danger: css`
    background: var(--color-danger-bg);
    color: var(--color-danger);
  `,
  neutral: css`
    background: var(--color-bg-canvas);
    color: var(--color-neutral);
  `,
};

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  ${(props) => toneStyles[props.$tone || "neutral"]}
`;

export default function Badge({ children, tone = "neutral", ...rest }) {
  return (
    <StyledBadge $tone={tone} {...rest}>
      {children}
    </StyledBadge>
  );
}
