// 디자인 토큰(DESIGN.md) 기반 공용 카드 컴포넌트 - Level 1 elevation
import styled from "styled-components";

const StyledCard = styled.div`
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-gutter);
`;

export default function Card({ children, ...rest }) {
  return <StyledCard {...rest}>{children}</StyledCard>;
}
