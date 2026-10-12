import { useState } from "react";
import styled from "styled-components";
import { FiSearch } from "react-icons/fi";

const toCssSize = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return typeof value === "number" ? `${value}px` : value;
};

const Container = styled.div`
  width: ${({ $width }) => toCssSize($width, "100%")};

  display: flex;
  align-items: flex-end;
  flex-wrap: ${({ $flexWrap }) => $flexWrap};

  gap: ${({ $gap }) => toCssSize($gap, "12px")};
  padding: ${({ $padding }) => toCssSize($padding, "16px")};

  background: ${({ $background }) => $background};
  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "12px")};

  box-sizing: border-box;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  width: ${({ $fill, $grow, $width }) =>
    $fill || $grow ? "auto" : toCssSize($width, "auto")};
  min-width: ${({ $fill, $width }) =>
    $fill ? "0" : toCssSize($width, "auto")};
  flex: ${({ $fill, $grow, $width }) =>
    $fill
      ? "1 1 0"
      : $grow
        ? `1 1 ${toCssSize($width, "220px")}`
        : "0 0 auto"};
`;

const Label = styled.label`
  font-size: ${({ $fontSize }) => toCssSize($fontSize, "12px")};
  font-weight: 500;
  color: ${({ $color }) => $color};
`;

const Input = styled.input`
  width: 100%;
  height: ${({ $height }) => toCssSize($height, "36px")};

  padding: 0 12px;

  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "6px")};

  outline: none;
  box-sizing: border-box;

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "13px")};
  color: ${({ $color }) => $color};
  background: ${({ $background }) => $background};

  &::placeholder {
    color: ${({ $placeholderColor }) => $placeholderColor};
  }

  &:focus {
    border-color: ${({ $focusColor }) => $focusColor};
    box-shadow: 0 0 0 2px
      ${({ $focusShadow }) => $focusShadow};
  }
`;

const KeywordInputBox = styled.div`
  position: relative;
  width: 100%;

  input {
    padding-right: 38px;
  }

`;

const KeywordSearchButton = styled.button`
  position: absolute;
  top: 50%;
  right: 5px;
  transform: translateY(-50%);

  width: 28px;
  height: 28px;
  padding: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 5px;
  background: transparent;
  color: #7e8796;
  cursor: pointer;

  &:hover {
    background: #eef2f7;
    color: #2563eb;
  }
`;

const Select = styled.select`
  width: 100%;
  height: ${({ $height }) => toCssSize($height, "36px")};

  padding: 0 32px 0 12px;

  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "6px")};

  outline: none;
  box-sizing: border-box;

  font-size: ${({ $fontSize }) => toCssSize($fontSize, "13px")};
  color: ${({ $color }) => $color};
  background: ${({ $background }) => $background};

  cursor: pointer;

  &:focus {
    border-color: ${({ $focusColor }) => $focusColor};
    box-shadow: 0 0 0 2px
      ${({ $focusShadow }) => $focusShadow};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const FlexBreak = styled.div`
  flex-basis: 100%;
  width: 0;
  height: 0;
`;

const SearchButton = styled.button`
  height: ${({ $height }) => toCssSize($height, "36px")};

  padding: 0 20px;

  border: none;
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "6px")};

  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};

  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const ResetButton = styled.button`
  height: ${({ $height }) => toCssSize($height, "36px")};

  padding: 0 16px;

  border: ${({ $border }) => $border};
  border-radius: ${({ $borderRadius }) =>
    toCssSize($borderRadius, "6px")};

  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};

  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;

  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }
`;

function SearchFilterBar({
  className,
  filters = [],

  showKeyword = true,
  keywordName = "keyword",
  keywordLabel = "키워드",
  keywordPlaceholder = "검색어를 입력하세요",
  keywordWidth = 354,
  breakBeforeKeyword = false,

  showDateRange = true,
  startDateName = "startDate",
  endDateName = "endDate",
  startDateLabel = "시작일",
  endDateLabel = "종료일",
  filterWidth = 170,

  defaultValues = {},

  width = "100%",
  flexWrap = "wrap",
  padding = 16,
  gap = 12,
  background = "#ffffff",
  border = "1px solid #e2e8f0",
  borderRadius = 12,

  inputHeight = 36,
  inputBorder = "1px solid #cbd5e1",
  inputBorderRadius = 6,
  inputBackground = "#ffffff",
  inputColor = "#1e293b",
  inputFontSize = 13,
  placeholderColor = "#94a3b8",

  labelColor = "#64748b",
  labelFontSize = 12,

  focusColor = "#2563eb",
  focusShadow = "rgba(37, 99, 235, 0.12)",

  showSearchButton = true,
  searchButtonText = "검색",
  searchButtonBackground = "#2563eb",
  searchButtonColor = "#ffffff",

  showResetButton = true,
  resetButtonText = "초기화",

  onChange,
  onSearch,
  onReset,
}) {
  const nonKeywordFieldCount = filters.length + (showDateRange ? 2 : 0);
  const shouldFillFilters = showKeyword && nonKeywordFieldCount >= 5;
  const shouldBreakBeforeKeyword =
    showKeyword && (breakBeforeKeyword || nonKeywordFieldCount >= 4);
  const resolvedKeywordWidth = shouldFillFilters ? 354 : keywordWidth;

  const createInitialValues = () => {
    const values = { ...defaultValues };

    if (showKeyword && values[keywordName] === undefined) {
      values[keywordName] = "";
    }

    if (showDateRange) {
      if (values[startDateName] === undefined) {
        values[startDateName] = "";
      }

      if (values[endDateName] === undefined) {
        values[endDateName] = "";
      }
    }

    filters.forEach((filter) => {
      if (values[filter.name] === undefined) {
        values[filter.name] = filter.defaultValue ?? "";
      }
    });

    return values;
  };

  const [values, setValues] = useState(createInitialValues);

  const handleChange = (event) => {
    const { name, value } = event.target;

    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);
    onChange?.(nextValues);
  };

  const handleSearch = () => {
    onSearch?.(values);
  };

  const handleReset = () => {
    const resetValues = createInitialValues();

    setValues(resetValues);
    onChange?.(resetValues);
    onReset?.(resetValues);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Container
      className={className}
      $width={width}
      $flexWrap={shouldBreakBeforeKeyword ? "wrap" : flexWrap}
      $padding={padding}
      $gap={gap}
      $background={background}
      $border={border}
      $borderRadius={borderRadius}
    >
      {showDateRange && (
        <>
          <Field
            $width={filterWidth}
            $fill={shouldFillFilters}
          >
            <Label
              $color={labelColor}
              $fontSize={labelFontSize}
            >
              {startDateLabel}
            </Label>

            <Input
              type="date"
              name={startDateName}
              value={values[startDateName] || ""}
              onChange={handleChange}
              $height={inputHeight}
              $border={inputBorder}
              $borderRadius={inputBorderRadius}
              $background={inputBackground}
              $color={inputColor}
              $fontSize={inputFontSize}
              $placeholderColor={placeholderColor}
              $focusColor={focusColor}
              $focusShadow={focusShadow}
            />
          </Field>

          <Field
            $width={filterWidth}
            $fill={shouldFillFilters}
          >
            <Label
              $color={labelColor}
              $fontSize={labelFontSize}
            >
              {endDateLabel}
            </Label>

            <Input
              type="date"
              name={endDateName}
              value={values[endDateName] || ""}
              min={values[startDateName] || undefined}
              onChange={handleChange}
              $height={inputHeight}
              $border={inputBorder}
              $borderRadius={inputBorderRadius}
              $background={inputBackground}
              $color={inputColor}
              $fontSize={inputFontSize}
              $placeholderColor={placeholderColor}
              $focusColor={focusColor}
              $focusShadow={focusShadow}
            />
          </Field>
        </>
      )}

      {filters.map((filter) => (
        <Field
          key={filter.name}
          $width={filterWidth}
          $fill={shouldFillFilters}
        >
          <Label
            htmlFor={filter.name}
            $color={labelColor}
            $fontSize={labelFontSize}
          >
            {filter.label}
          </Label>

          <Select
            id={filter.name}
            name={filter.name}
            value={values[filter.name] || ""}
            onChange={handleChange}
            $height={inputHeight}
            $border={inputBorder}
            $borderRadius={inputBorderRadius}
            $background={inputBackground}
            $color={inputColor}
            $fontSize={inputFontSize}
            $focusColor={focusColor}
            $focusShadow={focusShadow}
          >
            <option value="">
              {filter.placeholder ||
                `전체 ${filter.label}`}
            </option>

            {filter.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      ))}

      {shouldBreakBeforeKeyword && <FlexBreak aria-hidden="true" />}

      {showKeyword && (
        <Field
          $width={resolvedKeywordWidth}
          $grow={!shouldBreakBeforeKeyword}
        >
          <Label
            htmlFor={keywordName}
            $color={labelColor}
            $fontSize={labelFontSize}
          >
            {keywordLabel}
          </Label>

          <KeywordInputBox>
            <Input
              id={keywordName}
              type="text"
              name={keywordName}
              value={values[keywordName] || ""}
              placeholder={keywordPlaceholder}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              $height={inputHeight}
              $border={inputBorder}
              $borderRadius={inputBorderRadius}
              $background={inputBackground}
              $color={inputColor}
              $fontSize={inputFontSize}
              $placeholderColor={placeholderColor}
              $focusColor={focusColor}
              $focusShadow={focusShadow}
            />
            <KeywordSearchButton
              type="button"
              aria-label="키워드 검색"
              onClick={handleSearch}
            >
              <FiSearch size={16} />
            </KeywordSearchButton>
          </KeywordInputBox>
        </Field>
      )}

      {(showSearchButton || showResetButton) && (
        <ButtonGroup>
          {showSearchButton && (
            <SearchButton
              type="button"
              onClick={handleSearch}
              $height={inputHeight}
              $borderRadius={inputBorderRadius}
              $background={searchButtonBackground}
              $color={searchButtonColor}
            >
              {searchButtonText}
            </SearchButton>
          )}

          {showResetButton && (
            <ResetButton
              type="button"
              onClick={handleReset}
              $height={inputHeight}
              $border={inputBorder}
              $borderRadius={inputBorderRadius}
              $background={inputBackground}
              $color={inputColor}
            >
              {resetButtonText}
            </ResetButton>
          )}
        </ButtonGroup>
      )}
    </Container>
  );
}

export default SearchFilterBar;
