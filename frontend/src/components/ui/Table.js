import styled from "styled-components";

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  color: var(--color-text);
`;

const Th = styled.th`
  padding: 12px 10px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  text-align: ${(props) => props.$align || "left"};
  white-space: nowrap;
`;


const ClickableTr = styled.tr`
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${(props) => (props.$isClickable ? "var(--color-bg-canvas)" : "transparent")} !important;
  }
`;

const Td = styled.td`
  padding: 12px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: ${(props) => props.$align || "left"};
  vertical-align: middle;
`;

const EmptyCell = styled.td`
  padding: 24px 10px;
  color: var(--color-neutral);
  text-align: center;
`;

export default function Table({
  columns = [],
  rows = [],
  emptyMessage = "No data",
  onRowClick,
}) {
  return (
    <TableWrap>
      <StyledTable>
        <thead>
          <tr>
            {columns.map((column) => (
              <Th key={column.key} $align={column.align}>
                {column.label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <ClickableTr 
                key={row.id ?? rowIndex}
                $isClickable={!!onRowClick} // 클릭 이벤트 유무에 따라 스타일 차별화
                onClick={() => onRowClick && onRowClick(row)} // 클릭 시 해당 행의 데이터(row)를 매개변수로 전달
              >
                {columns.map((column) => (
                  <Td key={column.key} $align={column.align}>
                    {row[column.key]}
                  </Td>
                ))}
              </ClickableTr>
            ))
          ) : (
            <tr>
              <EmptyCell colSpan={Math.max(columns.length, 1)}>
                {emptyMessage}
              </EmptyCell>
            </tr>
          )}
        </tbody>
      </StyledTable>
    </TableWrap>
  );
}
