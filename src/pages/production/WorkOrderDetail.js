import { useEffect } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";

import Badge from "../../components/ui/Badge";

// 날짜 변환 함수
const formatDateTime = (value) => {
  if (!value) return "-";

  return String(value).replace("T", " ").slice(0, 16);
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString("ko-KR");

const progressRate = (order) => {
  const plannedQty = Number(order?.plannedQty ?? 0);
  if (!Number.isFinite(plannedQty) || plannedQty <= 0) return 0;

  const completedQty = Number(order?.completedQty ?? 0);
  return Math.min(100, Math.round((completedQty / plannedQty) * 100));
};

// 작업지시 상세 사이드 드로어
export default function WorkOrderDetail({ order, onClose }) {
  // Escape 닫기 + 배경 스크롤 방지 추가
  useEffect(() => {
    if (!order) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [order, onClose]);

  // 드로어가 닫혀 있거나 선택된 작업지시가 없으면 표시하지 않음
  if (!order) return null;

  return (
    <>
      {/* 드로어 뒤쪽 어두운 배경 */}
      <DrawerBackdrop onClick={onClose} aria-hidden="true" />

      <SideDrawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-order-detail-title"
        aria-describedby="work-order-detail-description"
      >
        {/* 상세 드로어 상단 */}
        <DrawerHeader>
          <div>
            <DrawerTitle id="work-order-detail-title">
              작업지시 상세
            </DrawerTitle>

            <DrawerDescription id="work-order-detail-description">
              선택한 작업지시 정보를 확인합니다.
            </DrawerDescription>
          </div>

          <CloseButton type="button" onClick={onClose} aria-label="닫기">
            <FiX />
          </CloseButton>
        </DrawerHeader>

        {/* 상세 내용 */}
        <DrawerBody>
          <DetailSection>
            <SectionTitle>작업지시 정보</SectionTitle>
            <DetailCard>
              <InfoGrid>
                <InfoItem>
                  <SummaryLabel>작업지시 번호</SummaryLabel>
                  <OrderNumber>{order.workOrderNo}</OrderNumber>
                </InfoItem>

                <InfoItem>
                  <SummaryLabel>상태</SummaryLabel>
                  <StatusBadge $status={order.status}>
                    {order.status || "-"}
                  </StatusBadge>
                </InfoItem>
              </InfoGrid>
            </DetailCard>
          </DetailSection>

          <DetailSection>
            <SectionTitle>기본 정보</SectionTitle>

            <DetailCard>
              <InfoGrid>
                <InfoItem>
                  <DetailLabel>제품명</DetailLabel>
                  <DetailValue>{order.productName || "-"}</DetailValue>
                </InfoItem>

                <InfoItem>
                  <DetailLabel>지시 수량</DetailLabel>
                  <DetailValue>
                    {order.plannedQty !== undefined && order.plannedQty !== null
                      ? `${formatNumber(order.plannedQty)}개`
                      : "-"}
                  </DetailValue>
                </InfoItem>

                <InfoItem>
                  <DetailLabel>진행률</DetailLabel>
                  <ProgressValue>
                    <ProgressTrack>
                      <ProgressFill $rate={progressRate(order)} />
                    </ProgressTrack>
                    <span>
                      {progressRate(order)}% ({formatNumber(order.completedQty)}/
                      {formatNumber(order.plannedQty)})
                    </span>
                  </ProgressValue>
                </InfoItem>

                {/* 현재는 화면용 담당자 값을 표시하고, 백엔드 연결 전 worker_id 추가 여부를 합의 */}
                <InfoItem>
                  <DetailLabel>담당자</DetailLabel>
                  <DetailValue>{order.worker || "-"}</DetailValue>
                </InfoItem>

                <InfoItem>
                  <DetailLabel>납기일</DetailLabel>
                  <DetailValue>{order.dueAt || "-"}</DetailValue>
                </InfoItem>

                <InfoItem>
                  <DetailLabel>실제 시작일시</DetailLabel>
                  <DetailValue>
                    {!order.startedAt ? "아직 시작되지 않음" : formatDateTime(order.startedAt)}
                  </DetailValue>
                </InfoItem>

                <InfoItem>
                  <DetailLabel>완료일시</DetailLabel>
                  <DetailValue>{formatDateTime(order.completedAt)}</DetailValue>
                </InfoItem>

                <InfoItem>
                  <DetailLabel>등록일시</DetailLabel>
                  <DetailValue>{order.createdAt || "-"}</DetailValue>
                </InfoItem>
              </InfoGrid>
            </DetailCard>
          </DetailSection>
        </DrawerBody>

        {/* 상세 드로어 하단 버튼 - 작업지시 수정 API가 없어 닫기만 제공 */}
        <DrawerFooter>
          <CancelButton type="button" onClick={onClose}>
            닫기
          </CancelButton>
        </DrawerFooter>
      </SideDrawer>
    </>
  );
}

// 드로어 뒤쪽 배경
const DrawerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.35);
`;

// 화면 오른쪽 상세 패널
const SideDrawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;

  width: min(600px, 100%);
  height: 100dvh;

  display: flex;
  flex-direction: column;

  background: #f7f9fc;
  box-shadow: -12px 0 36px rgba(15, 23, 42, 0.18);

  animation: detailDrawerOpen 0.25s ease-out;

  @keyframes detailDrawerOpen {
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  min-height: 72px;
  padding: 0 28px;
  border-bottom: 1px solid #e5e9f0;
  background: #fff;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  color: #172033;
  font-size: 18px;
  font-weight: 600;
`;

const DrawerDescription = styled.p`
  margin-top: 6px;
  color: #7a8495;
  font-size: 12px;
  display: none;
`;

// 상세 내용 스크롤 영역
const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 28px;
`;

const SummaryLabel = styled.span`
  display: block;
  margin-bottom: 6px;
  color: #8a94a6;
  font-size: 11px;
  font-weight: 600;
`;

const OrderNumber = styled.strong`
  display: block;
  color: #2a3140;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

// 상태 배지
const StatusBadge = styled(Badge)`
  background: ${(props) =>
    props.$status === "진행중"
      ? "#e7f0ff"
      : props.$status === "완료"
        ? "#dff7e9"
        : "#eef0f5"};

  color: ${(props) =>
    props.$status === "진행중"
      ? "#2563d8"
      : props.$status === "완료"
        ? "#099456"
        : "#687386"};
`;

// 기본 정보 영역
const DetailSection = styled.section`
  & + & {
    margin-top: 24px;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 4px solid #0b57d0;
  color: #172033;
  font-size: 14px;
  font-weight: 600;
`;

const DetailCard = styled.div`
  padding: 18px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 28px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  min-width: 0;
`;

const DetailLabel = styled.div`
  margin-bottom: 6px;
  color: #8a94a6;
  font-size: 11px;
  font-weight: 600;
`;

const DetailValue = styled.div`
  min-width: 0;
  color: #2a3140;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const ProgressValue = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2a3140;
  font-size: 13px;
  font-weight: 700;
`;

const ProgressTrack = styled.span`
  width: 96px;
  height: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 999px;
  background: #e3e8f0;
`;

const ProgressFill = styled.span`
  display: block;
  width: ${({ $rate }) => `${Math.max(0, Math.min(100, $rate))}%`};
  height: 100%;
  border-radius: inherit;
  background: #0755d9;
`;

// 하단 버튼 영역
const DrawerFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  padding: 16px 18px;
  border-top: 1px solid #e5e9f0;
  background: #fff;
`;

const FooterButton = styled.button`
  min-width: 64px;
  height: 36px;
  padding: 0 18px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const CancelButton = styled(FooterButton)`
  border: 1px solid #d1d7e3;
  background: #fff;
  color: #111827;

  &:hover {
    background: #f5f7fa;
  }
`;

// 오른쪽 위 닫기 버튼
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
