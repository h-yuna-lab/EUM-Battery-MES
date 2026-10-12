import styled from "styled-components";
import { FiX } from "react-icons/fi";
import Button from "../../components/ui/Button";

// 목록에서 선택한 제품과 BOM 자재의 값을 읽기 전용으로 보여주는 상세 드로어
function BomDetail({
  isOpen,
  product,
  bomItem,
  onClose,
  onEdit,
  canEdit = true,
}) {
  // 열림 상태와 상세 데이터가 모두 준비된 경우에만 드로어를 렌더링
  if (!isOpen || !product || !bomItem) {
    return null;
  }

  // 드로어 내부가 아닌 반투명 배경 자체를 클릭했을 때만 닫음
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <DrawerBackdrop onMouseDown={handleBackdropClick}>
      <DrawerContainer>
        {/* 드로어 제목과 닫기 버튼 */}
        <DrawerHeader>
          <DrawerTitle>BOM 상세</DrawerTitle>

          <CloseButton
            type="button"
            onClick={onClose}
            aria-label="BOM 상세 닫기"
          >
            <FiX size={24} />
          </CloseButton>
        </DrawerHeader>

        <DrawerBody>
          {/* 선택 자재가 속한 완제품의 기본 정보 */}
          <DrawerSection>
            <DrawerSectionTitle>제품 정보</DrawerSectionTitle>

            <DetailCard>
              <InfoGrid>
                <InputGroup>
                  <Label>제품코드</Label>
                  <ReadOnlyInput value={product.productCode} readOnly />
                </InputGroup>

                <InputGroup>
                  <Label>제품명</Label>
                  <ReadOnlyInput value={product.productName} readOnly />
                </InputGroup>

                <InputGroup>
                  <Label>전압(V)</Label>
                  <ReadOnlyInput value={product.voltage} readOnly />
                </InputGroup>

                <InputGroup>
                  <Label>용량(Ah)</Label>
                  <ReadOnlyInput value={product.capacity} readOnly />
                </InputGroup>
              </InfoGrid>
            </DetailCard>
          </DrawerSection>

          {/* 목록에서 클릭한 BOM 자재의 상세 속성 */}
          <DrawerSection>
            <DrawerSectionTitle>자재 정보</DrawerSectionTitle>

            <DetailCard>
              <InfoGrid>
                <InputGroup $full>
                  <Label>자재코드</Label>
                  <ReadOnlyInput value={bomItem.materialCode} readOnly />
                </InputGroup>

                <InputGroup>
                  <Label>자재명</Label>
                  <ReadOnlyInput value={bomItem.materialName} readOnly />
                </InputGroup>

                <InputGroup>
                  <Label>단위</Label>
                  <ReadOnlyInput value={bomItem.unit} readOnly />
                </InputGroup>

                <InputGroup>
                  <Label>표준 소요량</Label>
                  <ReadOnlyInput
                    value={Number(bomItem.requiredQty).toFixed(2)}
                    readOnly
                  />
                </InputGroup>

                <InputGroup $full>
                  <Label>투입공정</Label>
                  <ReadOnlyInput value={bomItem.process} readOnly />
                </InputGroup>
              </InfoGrid>
            </DetailCard>
          </DrawerSection>

          {/* 자주 확인하는 소요량과 투입 공정을 한 번 더 요약 */}
          <DrawerSection>
            <DrawerSectionTitle>소요량 정보</DrawerSectionTitle>

            <SummaryCard>
              <SummaryRow>
                <SummaryLabel>표준 소요량</SummaryLabel>
                <SummaryValue>
                  {Number(bomItem.requiredQty).toFixed(2)} {bomItem.unit}
                </SummaryValue>
              </SummaryRow>

              <SummaryRow>
                <SummaryLabel>투입공정</SummaryLabel>
                <ProcessBadge>{bomItem.process}</ProcessBadge>
              </SummaryRow>
            </SummaryCard>
          </DrawerSection>
        </DrawerBody>

        {/* 상세 화면을 닫거나 바로 BOM 수정 화면으로 이동 */}
        <Footer>
          <ActionButton type="button" variant="outline" onClick={onClose}>
            닫기
          </ActionButton>

          {canEdit && (
            <ActionButton type="button" $primary onClick={onEdit}>
              수정
            </ActionButton>
          )}
        </Footer>
      </DrawerContainer>
    </DrawerBackdrop>
  );
}

export default BomDetail;

// ===== BOM 상세 드로어 스타일 =====
// 화면 전체를 덮는 반투명 배경이며, 상세 드로어를 오른쪽에 정렬
const DrawerBackdrop = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(19, 27, 39, 0.35);
`;

// 오른쪽에서 열리는 BOM 상세 패널의 본체
const DrawerContainer = styled.aside`
  display: flex;
  width: min(600px, 100%);
  height: 100%;
  flex-direction: column;
  background: #f7f9fc;
  box-shadow: -12px 0 32px rgba(21, 29, 44, 0.2);
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

// 상세 제목과 닫기 버튼을 배치하는 드로어 상단 고정 영역
const DrawerHeader = styled.div`
  display: flex;
  height: 72px;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #cbd3e0;
  background: #fff;
`;

// 드로어 상단의 화면 제목
const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

// 드로어 우측 상단의 닫기 아이콘 버튼
const CloseButton = styled.button`
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #262c35;
  cursor: pointer;

  &:hover {
    background: #eef1f6;
  }
`;

// 상세 내용이 길어질 때 세로 스크롤되는 드로어 본문
const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 28px;
`;

// 제품 정보, 자재 정보, 소요량 요약을 나누는 본문 구역
const DrawerSection = styled.section`
  margin-bottom: 24px;
`;

// 파란색 세로선으로 강조한 각 본문 구역의 제목
const DrawerSectionTitle = styled.h3`
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 4px solid #0744a0;
  color: #202630;
  font-size: 14px;
  font-weight: 600;
`;

const DetailCard = styled.div`
  padding: 18px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;

// 상세 항목을 기본 두 열로 배치하는 정보 그리드
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
`;

// 라벨과 값을 묶음, $full이 true이면 그리드의 전체 열을 차지
const InputGroup = styled.div`
  min-width: 0;
  grid-column: ${({ $full }) => ($full ? "1 / -1" : "auto")};
`;

// 읽기 전용 값 위에 표시되는 항목명
const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  color: #8a94a6;
  font-size: 11px;
  font-weight: 600;
`;

// 제품과 자재 값을 변경 불가능한 형태로 보여주는 입력 필드
const ReadOnlyInput = styled.input`
  width: 100%;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  outline: none;
  background: transparent;
  color: #2a3140;
  font-family: "Pretendard", sans-serif;
  font-size: 14px;
  font-weight: 700;
  box-sizing: border-box;
`;

// 소요량과 투입 공정의 핵심 정보를 묶는 요약 카드
const SummaryCard = styled.div`
  overflow: hidden;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;

// 요약 카드 안에서 항목명과 값을 양 끝에 배치하는 한 행
const SummaryRow = styled.div`
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid #e2e7f0;

  &:last-child {
    border-bottom: none;
  }
`;

// 요약 행의 왼쪽에 표시되는 항목명
const SummaryLabel = styled.span`
  color: #5d6676;
  font-size: 13px;
`;

const SummaryValue = styled.strong`
  color: #202630;
  font-size: 14px;
  font-weight: 600;
`;

// 투입 공정을 둥근 태그 형태로 표시
const ProcessBadge = styled.span`
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 20px;
  background: #eaf2ff;
  color: #3166ac;
  font-size: 12px;
`;

// 닫기와 수정 버튼을 담는 드로어 하단 고정 영역
const Footer = styled.footer`
  flex-shrink: 0;
  padding: 16px 24px;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  border-top: 1px solid #dfe3eb;
  background: #fff;
`;

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  flex-shrink: 0;

  border: ${({ $primary }) => ($primary ? "0" : "1px solid #d2d8e1")};
  border-radius: 7px;

  background: ${({ $primary }) => ($primary ? "#0755d9" : "#fff")};
  color: ${({ $primary }) => ($primary ? "#fff" : "#4b5563")};

  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
