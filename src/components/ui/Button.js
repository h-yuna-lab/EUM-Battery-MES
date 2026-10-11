// 디자인 토큰(DESIGN.md) 기반 공용 버튼 컴포넌트
import styled, { css } from "styled-components";

const variantStyles = {
  primary: css`
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    &:hover {
      opacity: 0.9;
    }
  `,
  outline: css`
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    &:hover {
      background: var(--color-primary-light);
    }
  `,
  danger: css`
    background: var(--color-danger);
    color: var(--color-text-inverse);
    border: none;
    &:hover {
      opacity: 0.9;
    }
  `,
};

const StyledButton = styled.button`
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  ${(props) => variantStyles[props.$variant || "primary"]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function Button({
  children,
  variant = "primary",
  ...rest
}) {
  return (
    <StyledButton $variant={variant} {...rest}>
      {children}
    </StyledButton>
  );
}
