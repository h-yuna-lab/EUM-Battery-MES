import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { FiCalendar } from "react-icons/fi";

// 여러 화면의 날짜 필터를 동일한 모양과 동작으로 제공
// 날짜를 필터 조건으로 사용하는 화면에서는 FilterDatePicker를 같이 쓰는 게 베스트

// YYYY-MM-DD 형식 표시
// 숫자만 입력 허용
// 연도 4자리 뒤 - 자동 추가
// 월 2자리 뒤 - 자동 추가
// 실제 존재하는 날짜인지 검증
// 달력 아이콘과 기본 달력 열기
// 공통 테두리·배경·포커스 스타일
// 날짜 선택 결과를 각 페이지의 필터 값으로 전달

const formatDigits = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length < 4) return digits;
  if (digits.length < 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const isRealDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    year >= 1000 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// 숫자 직접 입력과 브라우저 기본 달력 선택을 함께 제공하는 공용 날짜 필터입니다.
export default function FilterDatePicker({ value, onChange, id, ...rest }) {
  const [text, setText] = useState(value || "");
  const nativePickerRef = useRef(null);

  useEffect(() => setText(value || ""), [value]);

  const handleTextChange = (event) => {
    const next = formatDigits(event.target.value);
    setText(next);
    if (isRealDate(next)) onChange(next);
    else if (!next) onChange("");
  };

  const handleBlur = () => {
    if (text.length === 10 && !isRealDate(text)) {
      setText("");
      onChange("");
    }
  };

  const openCalendar = () => {
    const picker = nativePickerRef.current;
    if (picker?.showPicker) picker.showPicker();
    else picker?.click();
  };

  return (
    <DateControl>
      <DateTextInput
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder="YYYY-MM-DD"
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        {...rest}
      />
      <CalendarButton
        type="button"
        onClick={openCalendar}
        aria-label="달력 열기"
      >
        <FiCalendar />
      </CalendarButton>
      <NativeDateInput
        ref={nativePickerRef}
        type="date"
        tabIndex={-1}
        value={isRealDate(text) ? text : ""}
        onChange={(event) => {
          setText(event.target.value);
          onChange(event.target.value);
        }}
        aria-hidden="true"
      />
    </DateControl>
  );
}

const DateControl = styled.div`
  position: relative;
  width: 100%;
  height: 42px;
  border: 1px solid #cbd3e1;
  border-radius: 6px;
  background: #f8faff;
  overflow: hidden;

  &:focus-within {
    border-color: #2c67ad;
    box-shadow: 0 0 0 3px rgba(44, 103, 173, 0.1);
  }
`;

const DateTextInput = styled.input`
  width: 100%;
  height: 100%;
  padding: 0 42px 0 14px;
  border: 0;
  background: transparent;
  color: #273147;
  font-size: 12px;
  outline: none;
  letter-spacing: 0.01em;

  &::placeholder {
    color: #7f899b;
    opacity: 1;
  }
`;

const CalendarButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #172033;
  font-size: 15px;

  &:hover {
    background: rgba(44, 103, 173, 0.07);
  }
`;

const NativeDateInput = styled.input`
  position: absolute;
  right: 8px;
  bottom: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;
