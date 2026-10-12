import styled from "styled-components";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

// 목록 화면에서 검색 조건을 일관된 카드/그리드 형태로 배치하는 공용 패널
// columns만 화면별 필드 수에 맞게 전달하고, 내부 Field/Input은 각 도메인이 소유합니다.
const FilterPanel = styled.form`
  display: grid;
  grid-template-columns: ${({ $columns = "repeat(4, minmax(0, 1fr)) auto" }) =>
    $columns};
  align-items: end;
  gap: ${({ $gap = "20px" }) => $gap};
  padding: ${({ $padding = "24px" }) => $padding};
  border: 1px solid #cfd5e2;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1px 2px rgba(35, 50, 80, 0.03);

  @media (max-width: 1050px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    padding: 22px 18px;
  }
`;

export default FilterPanel;

export const FilterField = styled.div`
  width: 100%;
  min-width: 0;
`;

export const FilterLabel = styled.label`
  display: block;
  margin-bottom: 10px;
  color: #4c566a;
  font-size: 12px;
  font-weight: 600;
`;

export const FilterInput = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1px solid #cbd3e1;
  border-radius: 6px;
  background: #f8faff;
  color: #273147;
  font-size: 12px;
  outline: none;
  &::placeholder {
    color: #8c95a7;
  }
  &:focus {
    border-color: #2c67ad;
    box-shadow: 0 0 0 3px rgba(44, 103, 173, 0.1);
  }
`;

export const FilterSelect = styled.select`
  width: 100%;
  height: 42px;
  padding: 0 38px 0 14px;
  border: 1px solid #cbd3e1;
  border-radius: 6px;
  background-color: #f8faff;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23273147' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 12px 8px;
  color: #273147;
  font-size: 12px;
  outline: none;
  appearance: none;
  cursor: pointer;
  &:focus {
    border-color: #2c67ad;
    box-shadow: 0 0 0 3px rgba(44, 103, 173, 0.1);
  }
`;

export function FilterActions({
  onReset,
  submitLabel = "조회",
  $fullRow = false,
}) {
  return (
    <ActionGroup $fullRow={$fullRow}>
      <ResetButton type="button" onClick={onReset}>
        <FiRefreshCw aria-hidden="true" /> 초기화
      </ResetButton>
      <SubmitButton type="submit">
        <FiSearch aria-hidden="true" /> {submitLabel}
      </SubmitButton>
    </ActionGroup>
  );
}

const ActionGroup = styled.div`
  grid-column: ${({ $fullRow }) => ($fullRow ? "1 / -1" : "auto")};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  @media (max-width: 600px) {
    grid-column: 1;
    width: 100%;
  }
`;

const ActionButton = styled.button`
  height: 42px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #cbd3e1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  &:focus-visible {
    outline: 3px solid rgba(44, 103, 173, 0.16);
  }
  @media (max-width: 600px) {
    flex: 1;
  }
`;

const ResetButton = styled(ActionButton)`
  background: #fff;
  color: #4c566a;
  &:hover {
    background: #f5f7fb;
  }
`;

const SubmitButton = styled(ActionButton)`
  min-width: 78px;
  border-color: #084693;
  background: #084693;
  color: #fff;
  &:hover {
    background: #073b7c;
  }
`;
