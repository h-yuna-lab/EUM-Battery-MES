import React from 'react';
import styled from 'styled-components';

const TempCard = styled.div`
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow-card);
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
`;

const CardValue = styled.div`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
`;

const CardSub = styled.div`
  font-size: var(--font-size-xs);
  color: ${props => props.$type === 'danger' ? 'var(--color-danger)' : props.$type === 'success' ? 'var(--color-success)' : 'var(--color-neutral)'};
`;

export default function KpiCard({ icon, title, value, subText, subType }) {
  return (
    <TempCard>
      <CardTop>
        <span>{title}</span>
        <div>{icon}</div>
      </CardTop>
      <CardValue>{value}</CardValue>
      <CardSub $type={subType}>{subText}</CardSub>
    </TempCard>
  );
}