import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";
import {
  FilterInput,
  FilterLabel,
  FilterSelect,
} from "../../components/ui/FilterPanel";
import FilterDatePicker from "../../components/ui/FilterDatePicker";

// 작업지시 등록 사이드 드로어 - 백엔드에 수정 API가 없어 등록 전용
export default function WorkOrderNewEdit({
  open,
  orderForm,
  setOrderForm,
  products,
  stockMessages = [],
  isSubmitDisabled = false,
  onClose,
  onSubmit,
}) {
  // 드로어가 닫혀 있으면 화면에 표시하지 않음
  if (!open) return null;

  return (
    <>
      {/* 드로어 뒤쪽 어두운 배경 */}
      <DrawerBackdrop onClick={onClose} />

      {/* 작업지시 등록 드로어 */}
      <SideDrawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-order-drawer-title"
      >
        <DrawerHeader>
          <div>
            <DrawerTitle id="work-order-drawer-title">
              작업지시 등록
            </DrawerTitle>

            <DrawerDescription>새로운 작업지시를 등록합니다.</DrawerDescription>
          </div>

          <CloseButton type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </CloseButton>
        </DrawerHeader>

        <DrawerForm onSubmit={onSubmit}>
          <DrawerBody>
            {/* 제품명 - 선택한 제품의 bomId를 찾아서 등록 시 함께 보낸다 */}
            <Field>
              <Label htmlFor="work-order-product">제품명</Label>

              <SelectControl>
                <DrawerSelect
                  id="work-order-product"
                  required
                  value={orderForm.productId}
                  onChange={(event) =>
                    setOrderForm({
                      ...orderForm,
                      productId: event.target.value,
                    })
                  }
                >
                  <option value="">제품을 선택하세요</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.productName}
                    </option>
                  ))}
                </DrawerSelect>
              </SelectControl>
            </Field>

            {/* 지시 수량 - work_order.order_quantity와 연결 */}
            <Field>
              <Label htmlFor="work-order-quantity">지시 수량</Label>

              <Input
                id="work-order-quantity"
                required
                min="1"
                type="number"
                value={orderForm.plannedQty}
                onChange={(event) =>
                  setOrderForm({
                    ...orderForm,
                    plannedQty: event.target.value,
                  })
                }
                placeholder="예: 1000"
              />
            </Field>

            {/* 납기일 - work_order.due_date와 연결 */}
            <Field>
              <Label htmlFor="work-order-due-date">납기일</Label>

              <FilterDatePicker
                id="work-order-due-date"
                value={orderForm.dueAt}
                onChange={(value) =>
                  setOrderForm({
                    ...orderForm,
                    dueAt: value,
                  })
                }
              />
            </Field>
          </DrawerBody>

          <DrawerFooter>
            {stockMessages.length > 0 && (
              <StockWarning role="alert">
                {stockMessages.map((message) => (
                  <span key={message}>{message}</span>
                ))}
              </StockWarning>
            )}

            <CancelButton type="button" onClick={onClose}>
              취소
            </CancelButton>

            <Button type="submit" disabled={isSubmitDisabled}>
              등록하기
            </Button>
          </DrawerFooter>
        </DrawerForm>
      </SideDrawer>
    </>
  );
}

// 입력 항목
const Field = styled.div`
  min-width: 0;
`;

const Label = FilterLabel;
const Input = FilterInput;

// 드로어 뒤쪽 배경
const DrawerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.35);
`;

// 작업지시 등록·수정 패널
const SideDrawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;

  width: min(600px, 100%);
  height: 100dvh;

  display: flex;
  flex-direction: column;

  background: #fff;
  box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);

  animation: drawerOpen 0.25s ease-out;

  @keyframes drawerOpen {
    from {
      transform: translateX(100%);
    }

    to {
      transform: translateX(0);
    }
  }
`;

// 드로어 제목 영역
const DrawerHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  padding: 24px;
  border-bottom: 1px solid #e5e9f0;
`;

const DrawerTitle = styled.h2`
  font-size: 21px;
  font-weight: 700;
  color: #172033;
`;

const DrawerDescription = styled.p`
  margin-top: 6px;
  color: #7a8495;
  font-size: 12px;
`;

// 입력 폼
const DrawerForm = styled.form`
  min-height: 0;
  flex: 1;

  display: flex;
  flex-direction: column;
`;

// 입력칸 스크롤 영역
const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  gap: 20px;

  padding: 24px;
`;

// 드로어 하단 버튼 영역
const DrawerFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  padding: 18px 24px;
  border-top: 1px solid #e5e9f0;
  background: #fff;
`;

const StockWarning = styled.div`
  min-width: 0;
  margin-right: auto;
  color: #b42318;
  font-size: 12px;
  line-height: 1.45;

  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    overflow-wrap: anywhere;
  }
`;

// 공용 필터와 동일한 화살표를 사용하는 상태 선택창
const SelectControl = styled.div`
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 14px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #172033;
    transform: translateY(-35%);
    pointer-events: none;
  }
`;

const DrawerSelect = styled(FilterSelect)`
  width: 100%;
  height: 42px;
  padding: 0 38px 0 14px;

  border: 1px solid #cbd3e1;
  border-radius: 6px;

  /* background가 아니라 background-color를 사용 */
  background-color: #f8faff;

  /* 브라우저 기본 화살표 숨김 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* 화살표는 SelectControl에 별도로 그려 브라우저별 차이를 없앰 */
  background-image: none;

  color: #273147;
  font-size: 12px;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #2c67ad;
    box-shadow: 0 0 0 3px rgba(44, 103, 173, 0.1);
  }
`;

// 닫기 버튼
const CloseButton = styled.button`
  width: 34px;
  height: 34px;

  display: grid;
  place-items: center;
  flex-shrink: 0;

  padding: 0;
  border: 0;
  border-radius: 7px;

  background: transparent;
  color: #536074;
  font-size: 20px;
  cursor: pointer;

  &:hover {
    background: #f0f2f6;
  }
`;

// 취소 버튼
const CancelButton = styled.button`
  height: 38px;
  padding: 0 16px;

  border: 1px solid #d5dbe6;
  border-radius: 7px;

  background: #fff;
  color: #536074;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }
`;
