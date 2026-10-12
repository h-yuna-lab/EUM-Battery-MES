import styled from "styled-components";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

const toCssSize = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return typeof value === "number" ? `${value}px` : value;
};

const PaginationWrapper = styled.nav`
  width: ${({ $width }) => toCssSize($width, "100%")};
  min-height: ${({ $height }) => toCssSize($height, "72px")};

  display: flex;
  align-items: center;
  justify-content: ${({ $justifyContent }) => $justifyContent};
  gap: ${({ $gap }) => toCssSize($gap, "6px")};

  padding: ${({ $padding }) => toCssSize($padding, "12px")};

  background: ${({ $background }) => $background};
  border-top: ${({ $borderTop }) => $borderTop};

  box-sizing: border-box;
`;

const TablePaginationWrapper = styled.div`
  width: ${({ $width }) => toCssSize($width, "100%")};
  overflow: hidden;
  background: ${({ $background }) => $background};
  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) => toCssSize($borderRadius, "0")};
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) => toCssSize($borderRadius, "0")};
`;

const DataTable = styled.table`
  width: 100%;
  min-width: ${({ $minWidth }) =>
    $minWidth === undefined || $minWidth === null
      ? "0"
      : toCssSize($minWidth, "0")};
  border-collapse: collapse;
  table-layout: ${({ $tableLayout }) => $tableLayout};
  font-size: ${({ $fontSize }) => toCssSize($fontSize, "13px")};
`;

const TableHead = styled.th`
  width: ${({ $width }) => toCssSize($width, "auto")};
  height: ${({ $height }) => toCssSize($height, "46px")};
  padding: ${({ $padding }) => $padding};
  border-bottom: 1px solid #e3e7ed;
  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};
  font-weight: 600;
  text-align: ${({ $align }) => $align};
  vertical-align: middle;
  white-space: nowrap;
`;

const TableCell = styled.td`
  height: ${({ $height }) => toCssSize($height, "48px")};
  padding: ${({ $padding }) => $padding};
  border-bottom: 1px solid #e3e7ed;
  color: ${({ $color }) => $color};
  text-align: ${({ $align }) => $align};
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
`;

const TableRow = styled.tr`
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $clickable, $hoverBackground }) =>
      $clickable ? $hoverBackground : "transparent"};
  }

  &:last-child td {
    border-bottom: 0;
  }
`;

const EmptyCell = styled.td`
  height: ${({ $height }) => toCssSize($height, "96px")};
  padding: 24px;
  color: #737b88;
  text-align: center;
`;

const SpacerCell = styled.td`
  height: ${({ $height }) => toCssSize($height, "48px")};
  padding: 0;
  border: 0;
  visibility: hidden;
`;

const PageButton = styled.button`
  width: ${({ $size }) => toCssSize($size, "38px")};
  height: ${({ $size }) => toCssSize($size, "38px")};

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;
  border: ${({ $active, $border }) =>
    $active ? "none" : $border};

  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "6px")};

  background: ${({ $active, $activeBackground, $background }) =>
    $active ? $activeBackground : $background};

  color: ${({ $active, $activeColor, $color }) =>
    $active ? $activeColor : $color};

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "14px")};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};

  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.35 : 1)};

  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({
      disabled,
      $active,
      $hoverBackground,
      $activeBackground,
    }) =>
      disabled
        ? "transparent"
        : $active
        ? $activeBackground
        : $hoverBackground};
  }

  svg {
    width: 17px;
    height: 17px;
  }
`;

function Pagination({
  currentPage = 1,

  totalItems,
  itemsPerPage = 8,

  onPageChange,

  visiblePages = 5,

  showFirstLast = true,
  showPrevNext = true,

  width = "100%",
  height = 72,
  padding = 12,
  gap = 6,
  justifyContent = "center",

  background = "#ffffff",
  borderTop = "1px solid #e5e7eb",

  buttonSize = 38,
  buttonBorder = "none",
  buttonBorderRadius = 6,

  buttonBackground = "transparent",
  buttonColor = "#374151",

  activeBackground = "#0755d9",
  activeColor = "#ffffff",

  hoverBackground = "#eef2f7",
  fontSize = 14,

  columns,
  rows = [],
  paginateRows = true,
  onRowClick,
  tableProps = {},
  containerWidth = "100%",
  containerBackground = "#ffffff",
  containerBorder = "none",
  containerBorderRadius = 0,

  className,
}) {
  const resolvedTotalItems = totalItems ?? (columns ? rows.length : 0);
  const safeTotalItems = Math.max(Number(resolvedTotalItems) || 0, 0);
  const safeItemsPerPage = Math.max(Number(itemsPerPage) || 1, 1);

  const totalPages = Math.max(
    Math.ceil(safeTotalItems / safeItemsPerPage),
    1
  );

  const safeCurrentPage = Math.min(
    Math.max(Number(currentPage) || 1, 1),
    totalPages
  );

  const safeVisiblePages = Math.max(
    Number(visiblePages) || 1,
    1
  );

  const half = Math.floor(safeVisiblePages / 2);

  let startPage = Math.max(safeCurrentPage - half, 1);
  let endPage = startPage + safeVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(
      endPage - safeVisiblePages + 1,
      1
    );
  }

  const pageNumbers = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pageNumbers.push(page);
  }

  const movePage = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === safeCurrentPage
    ) {
      return;
    }

    onPageChange?.(page);
  };

  const visibleRows = columns && paginateRows
    ? rows.slice(
        (safeCurrentPage - 1) * safeItemsPerPage,
        safeCurrentPage * safeItemsPerPage
      )
    : rows;

  const renderedRowCount = Math.max(visibleRows.length, 1);
  const spacerRowCount = columns && paginateRows
    ? Math.max(safeItemsPerPage - renderedRowCount, 0)
    : 0;

  const {
    minWidth,
    tableLayout = "fixed",
    headerHeight = 46,
    rowHeight = 48,
    cellPadding = "0 20px",
    theadPadding = cellPadding,
    tbodyPadding = cellPadding,
    firstCellPadding = "0 20px 0 25px",
    lastCellPadding = "0 25px 0 20px",
    fontSize: tableFontSize = 13,
    headerBackground = "#f1f3f6",
    headerColor = "#535b68",
    cellColor = "#252a32",
    hoverBackground: tableHoverBackground = "#f6f9ff",
    border: tableBorder = "none",
    borderRadius: tableBorderRadius = 0,
    emptyText = "데이터가 없습니다.",
  } = tableProps;

  const pagination = (
    <PaginationWrapper
      className={columns ? undefined : className}
      aria-label="페이지 이동"
      $width={width}
      $height={height}
      $padding={padding}
      $gap={gap}
      $justifyContent={justifyContent}
      $background={background}
      $borderTop={borderTop}
    >
      {showFirstLast && (
        <PageButton
          type="button"
          aria-label="첫 페이지"
          disabled={safeCurrentPage === 1}
          onClick={() => movePage(1)}
          $size={buttonSize}
          $border={buttonBorder}
          $borderRadius={buttonBorderRadius}
          $background={buttonBackground}
          $color={buttonColor}
          $activeBackground={activeBackground}
          $activeColor={activeColor}
          $hoverBackground={hoverBackground}
          $fontSize={fontSize}
        >
          <FiChevronsLeft />
        </PageButton>
      )}

      {showPrevNext && (
        <PageButton
          type="button"
          aria-label="이전 페이지"
          disabled={safeCurrentPage === 1}
          onClick={() => movePage(safeCurrentPage - 1)}
          $size={buttonSize}
          $border={buttonBorder}
          $borderRadius={buttonBorderRadius}
          $background={buttonBackground}
          $color={buttonColor}
          $activeBackground={activeBackground}
          $activeColor={activeColor}
          $hoverBackground={hoverBackground}
          $fontSize={fontSize}
        >
          <FiChevronLeft />
        </PageButton>
      )}

      {pageNumbers.map((page) => (
        <PageButton
          key={page}
          type="button"
          aria-label={`${page}페이지`}
          aria-current={
            page === safeCurrentPage ? "page" : undefined
          }
          $active={page === safeCurrentPage}
          onClick={() => movePage(page)}
          $size={buttonSize}
          $border={buttonBorder}
          $borderRadius={buttonBorderRadius}
          $background={buttonBackground}
          $color={buttonColor}
          $activeBackground={activeBackground}
          $activeColor={activeColor}
          $hoverBackground={hoverBackground}
          $fontSize={fontSize}
        >
          {page}
        </PageButton>
      ))}

      {showPrevNext && (
        <PageButton
          type="button"
          aria-label="다음 페이지"
          disabled={safeCurrentPage === totalPages}
          onClick={() => movePage(safeCurrentPage + 1)}
          $size={buttonSize}
          $border={buttonBorder}
          $borderRadius={buttonBorderRadius}
          $background={buttonBackground}
          $color={buttonColor}
          $activeBackground={activeBackground}
          $activeColor={activeColor}
          $hoverBackground={hoverBackground}
          $fontSize={fontSize}
        >
          <FiChevronRight />
        </PageButton>
      )}

      {showFirstLast && (
        <PageButton
          type="button"
          aria-label="마지막 페이지"
          disabled={safeCurrentPage === totalPages}
          onClick={() => movePage(totalPages)}
          $size={buttonSize}
          $border={buttonBorder}
          $borderRadius={buttonBorderRadius}
          $background={buttonBackground}
          $color={buttonColor}
          $activeBackground={activeBackground}
          $activeColor={activeColor}
          $hoverBackground={hoverBackground}
          $fontSize={fontSize}
        >
          <FiChevronsRight />
        </PageButton>
      )}
    </PaginationWrapper>
  );

  if (!columns) return pagination;

  return (
    <TablePaginationWrapper
      className={className}
      $width={containerWidth}
      $background={containerBackground}
      $border={containerBorder}
      $borderRadius={containerBorderRadius}
    >
      <TableScroll $border={tableBorder} $borderRadius={tableBorderRadius}>
        <DataTable
          $minWidth={minWidth}
          $tableLayout={tableLayout}
          $fontSize={tableFontSize}
        >
          <thead>
            <tr>
              {columns.map((column, columnIndex) => (
                <TableHead
                  key={column.key}
                  $width={column.width}
                  $height={headerHeight}
                  $padding={
                    column.theadPadding ??
                    column.padding ??
                    (columnIndex === 0
                      ? firstCellPadding
                      : columnIndex === columns.length - 1
                        ? lastCellPadding
                        : undefined) ??
                    theadPadding
                  }
                  $background={headerBackground}
                  $color={headerColor}
                  $align={column.align ?? "center"}
                >
                  {column.label}
                </TableHead>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <EmptyCell colSpan={columns.length} $height={rowHeight}>
                  {emptyText}
                </EmptyCell>
              </tr>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <TableRow
                  key={row.id ?? rowIndex}
                  onClick={() => onRowClick?.(row)}
                  $clickable={Boolean(onRowClick)}
                  $hoverBackground={tableHoverBackground}
                >
                  {columns.map((column, columnIndex) => (
                    <TableCell
                      key={column.key}
                      $height={rowHeight}
                      $padding={
                        column.tbodyPadding ??
                        column.padding ??
                        (columnIndex === 0
                          ? firstCellPadding
                          : columnIndex === columns.length - 1
                            ? lastCellPadding
                            : undefined) ??
                        tbodyPadding
                      }
                      $color={cellColor}
                      $align={column.align ?? "center"}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {Array.from({ length: spacerRowCount }, (_, index) => (
              <tr key={`pagination-spacer-${index}`} aria-hidden="true">
                <SpacerCell colSpan={columns.length} $height={rowHeight}>
                  &nbsp;
                </SpacerCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </TableScroll>
      {pagination}
    </TablePaginationWrapper>
  );
}

export default Pagination;
