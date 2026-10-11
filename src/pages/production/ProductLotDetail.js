// 완제품 LOT 상세 drawer 화면
// ProductLotList에서 LOT 행을 클릭하면 lotId를 받아 GET /product-lots/{id}로 직접 조회한다
import { useEffect, useId, useState } from "react";
import styled from "styled-components";
import { FiCheck, FiClock, FiFileText, FiSettings, FiX } from "react-icons/fi";
import productionApi from "../../api/production";

const TABS = [
  // 상세 drawer 안에서 보여줄 탭 목록
  { id: "work", label: "작업 정보" },
  { id: "lot", label: "LOT" },
  { id: "material", label: "자재" },
  { id: "equipment", label: "설비" },
];

// ProductLotList.js와 동일한 실제 lotStatus 값 매핑
const STATUS_LABELS = {
  IN_PROGRESS: "생산중",
  생산완료: "생산완료",
};
const toDisplayStatus = (status) => STATUS_LABELS[status] || status || "-";

// 숫자를 한국식 천 단위 콤마로 보여주기 위한 formatter
// 예: 5000 -> "5,000"
const number = new Intl.NumberFormat("ko-KR");

const formatDateTime = (value) => (value ? String(value).replace("T", " ").slice(0, 16) : "-");

const formatProcessTime = (process) => {
  if (process.startedAt && process.endedAt) {
    return `${process.startedAt} ~ ${process.endedAt}`;
  }
  return process.startedAt || process.endedAt || "-";
};

export default function FinishedLotDetailDrawer({ lotId, onClose }) {
  // activeTab은 drawer 안에서 현재 선택된 탭을 기억
  const [activeTab, setActiveTab] = useState("work");
  const [lot, setLot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // drawer 제목과 dialog를 연결하기 위한 접근성 id
  const titleId = useId();

  const inspectionQty = lot?.inspectionCount ?? 0;
  const goodQty = lot?.passCount ?? 0;
  const defectQty = lot?.failCount ?? 0;
  const processes = lot?.processes ?? [];
  const materials = lot?.materials ?? [];
  const finishedAt =
    [...processes].reverse().find((process) => process.endedAt)?.endedAt || "-";

  // 최종 검사 합격률 계산
  // 검사 수량이 0이면 나누기 오류를 피하기 위해 "0.0" 표시
  const passRate = inspectionQty
    ? ((goodQty / inspectionQty) * 100).toFixed(1)
    : "0.0";

  useEffect(() => {
    if (!lotId) {
      setLot(null);
      return undefined;
    }

    // 새 LOT 상세를 열 때마다 첫 탭을 작업 정보로 초기화
    setActiveTab("work");
    setIsLoading(true);

    let ignore = false;
    productionApi
      .getProductLot(lotId)
      .then((response) => {
        if (!ignore) setLot(response.data);
      })
      .catch((error) => {
        console.error("완제품 LOT 상세 조회 실패:", error);
        if (!ignore) {
          window.alert("완제품 LOT 상세를 불러오지 못했습니다.");
          onClose();
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    // drawer 뒤쪽 페이지가 같이 스크롤되지 않게 기존 body overflow 값을 저장
    const previousOverflow = document.body.style.overflow;

    // drawer가 열려 있는 동안 body 스크롤 방지
    document.body.style.overflow = "hidden";

    // ESC 키를 누르면 상세 drawer를 닫는 이벤트 함수
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    // window에 ESC 키 이벤트 등록
    window.addEventListener("keydown", closeOnEscape);

    // drawer가 닫힐 때 실행되는 정리 함수
    // body 스크롤과 keydown 이벤트를 원래대로 복구
    return () => {
      ignore = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  // 선택된 LOT이 없으면 drawer를 화면에 표시하지 않음
  if (!lotId) return null;
  if (isLoading || !lot) {
    return (
      <Layer>
        <Backdrop type="button" aria-label="상세 닫기" onClick={onClose} />
        <Drawer role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <DrawerHeader>
            <HeaderTop>
              <DrawerTitle id={titleId}>완제품 LOT 상세</DrawerTitle>
              <CloseButton type="button" onClick={onClose} aria-label="완제품 LOT 상세 닫기">
                <FiX />
              </CloseButton>
            </HeaderTop>
          </DrawerHeader>
          <Body>불러오는 중...</Body>
        </Drawer>
      </Layer>
    );
  }

  const status = toDisplayStatus(lot.lotStatus);

  return (
    <Layer>
      <Backdrop type="button" aria-label="상세 닫기" onClick={onClose} />
      <Drawer role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <DrawerHeader>
          <HeaderTop>
            <div>
              <TitleRow>
                <DrawerTitle id={titleId}>완제품 LOT 상세</DrawerTitle>
                <CompleteBadge $status={status}>{status}</CompleteBadge>
              </TitleRow>
            </div>
            <CloseButton
              type="button"
              onClick={onClose}
              aria-label="완제품 LOT 상세 닫기"
            >
              <FiX />
            </CloseButton>
          </HeaderTop>
        </DrawerHeader>

        <SummaryWrap>
          <SummaryCard>
            <SummaryLabel>최종 검사 합격률</SummaryLabel>
            <SummaryLine>
              <Rate>{passRate}%</Rate>
              <Counts>
                합격 {number.format(goodQty)} / 불합격{" "}
                {number.format(defectQty)}
              </Counts>
            </SummaryLine>
            <Progress aria-label={`검사 합격률 ${passRate}%`}>
              <ProgressValue
                style={{ width: `${Math.min(Number(passRate), 100)}%` }}
              />
            </Progress>
            <FinishedAt>검사 완료&nbsp; {finishedAt}</FinishedAt>
          </SummaryCard>
        </SummaryWrap>

        <LotInfoWrap>
          <SectionTitle>LOT 기본 정보</SectionTitle>

          <LotInfoCard>
            <LotInfoItem>
              <SmallLabel>제품명</SmallLabel>
              <Value>{lot.productName || "-"}</Value>
            </LotInfoItem>

            <LotInfoItem>
              <SmallLabel>LOT 번호</SmallLabel>
              <Value>{lot.productLotNo || "-"}</Value>
            </LotInfoItem>

            <LotInfoItem>
              <SmallLabel>LOT 상태</SmallLabel>
              <CompleteBadge $status={status}>{status}</CompleteBadge>
            </LotInfoItem>

            <LotInfoItem>
              <SmallLabel>생산일</SmallLabel>
              <Value>{formatDateTime(lot.lotCreatedAt)}</Value>
            </LotInfoItem>
          </LotInfoCard>
        </LotInfoWrap>

        <Tabs role="tablist" aria-label="완제품 LOT 상세 메뉴">
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Tab>
          ))}
        </Tabs>

        <Body>
          {activeTab === "work" && (
            <WorkTab
              lot={lot}
              inspectionQty={inspectionQty}
              goodQty={goodQty}
              defectQty={defectQty}
            />
          )}
          {activeTab === "lot" && <LotTab processes={processes} />}
          {activeTab === "material" && <MaterialTab materials={materials} />}
          {activeTab === "equipment" && <EquipmentTab processes={processes} />}
        </Body>

        <Footer>
          <CloseFooterButton type="button" onClick={onClose}>
            닫기
          </CloseFooterButton>
          <ReportButton type="button" onClick={() => window.print()}>
            <FiFileText /> 성적서 발행
          </ReportButton>
        </Footer>
      </Drawer>
    </Layer>
  );
}

function SectionTitle({ children }) {
  // 각 탭 안에서 반복해서 쓰는 작은 섹션 제목 컴포넌트
  return (
    <SectionHeading>
      <span>{children}</span>
    </SectionHeading>
  );
}

function WorkTab({ lot, inspectionQty, goodQty, defectQty }) {
  // 공정 검사 시작/종료, 작업지시, 검사 수량 요약을 보여주는 탭
  const processes = lot.processes ?? [];
  const startedAt = processes.find((process) => process.startedAt)?.startedAt;
  const endedAt = [...processes].reverse().find((process) => process.endedAt)
    ?.endedAt;
  const workerName = processes.find((process) => process.workerName)?.workerName;

  return (
    <>
      <SectionTitle>공정 검사 이력 정보</SectionTitle>
      <InfoGrid>
        <InfoCard>
          <SmallLabel>검사 시작</SmallLabel>
          <Value>{startedAt || "-"}</Value>
        </InfoCard>
        <InfoCard>
          <SmallLabel>검사 종료</SmallLabel>
          <Value>{endedAt || "-"}</Value>
        </InfoCard>
        <InfoCard>
          <SmallLabel>작업 지시 담당자</SmallLabel>
          <PersonValue>{workerName || "-"}</PersonValue>
        </InfoCard>
        <InfoCard>
          <SmallLabel>작업 지시</SmallLabel>
          <Value>{lot.workOrderNo || "-"}</Value>
        </InfoCard>
      </InfoGrid>
      <SectionTitle>검사 실적 요약</SectionTitle>
      <InspectionGrid>
        <InspectionItem>
          <SmallLabel>검사 수량</SmallLabel>
          <Value>{number.format(inspectionQty)}</Value>
        </InspectionItem>
        <InspectionItem>
          <SmallLabel>합격</SmallLabel>
          <BlueValue>{number.format(goodQty)}</BlueValue>
        </InspectionItem>
        <InspectionItem>
          <SmallLabel>불합격</SmallLabel>
          <RedValue>{number.format(defectQty)}</RedValue>
        </InspectionItem>
      </InspectionGrid>
    </>
  );
}

function LotTab({ processes }) {
  // LOT 추적 탭, 공정 이력을 시간 순서로 보여줌
  return (
    <>
      <SectionTitle>LOT 추적</SectionTitle>
      <Timeline>
        {processes.length === 0 && <EmptyState>공정 이력이 없습니다.</EmptyState>}
        {processes.map((process) => (
          <TimelineRow key={`${process.processCode}-${process.startedAt}`}>
            <TimelineMarker>
              <FiCheck />
            </TimelineMarker>
            <ProcessCard>
              <CardTop>
                <strong>{process.processName || process.processCode || "-"}</strong>
                <PassText>{process.result || "-"}</PassText>
              </CardTop>
              <ProcessMeta>
                <span>
                  <SmallLabel>설비</SmallLabel>
                  {process.equipmentName || "-"}
                </span>
                <span>
                  <SmallLabel>시간</SmallLabel>
                  {formatProcessTime(process)}
                </span>
              </ProcessMeta>
            </ProcessCard>
          </TimelineRow>
        ))}
      </Timeline>
    </>
  );
}

function MaterialTab({ materials }) {
  // 자재 탭, 생산에 사용된 자재 LOT와 투입량을 보여줌
  const materialTypeCount = new Set(
    materials.map((item) => item.materialCode).filter(Boolean),
  ).size;

  return (
    <>
      <SectionTitle>투입 자재</SectionTitle>
      <MaterialSummary>
        <span>
          <SmallLabel>자재 종류</SmallLabel>
          <BigValue>
            {materialTypeCount}<em>종</em>
          </BigValue>
        </span>
        <span>
          <SmallLabel>자재 LOT</SmallLabel>
          <BigValue>
            {materials.length}<em>개</em>
          </BigValue>
        </span>
      </MaterialSummary>
      <Stack>
        {materials.length === 0 && <EmptyState>투입 자재 이력이 없습니다.</EmptyState>}
        {materials.map((item) => (
          <MaterialCard key={`${item.materialCode}-${item.materialLotNo}`}>
            <CardTop>
              <strong>{item.materialName || "-"}</strong>
              <Amount>
                {number.format(Number(item.quantity ?? 0))}{" "}
                <small>{item.unit}</small>
              </Amount>
            </CardTop>
            <MaterialLot>
              <span>자재 LOT</span> {item.materialLotNo || "-"}
            </MaterialLot>
            <TimeLine>
              {item.materialCode || "-"}
            </TimeLine>
          </MaterialCard>
        ))}
      </Stack>
    </>
  );
}

function EquipmentTab({ processes }) {
  // 설비 탭, LOT 생산에 사용된 설비 목록을 보여줌
  const equipmentRows = processes.filter(
    (process) => process.equipmentCode || process.equipmentName,
  );

  return (
    <>
      <SectionTitle>
        사용 설비 <HeadingCount>{equipmentRows.length}대</HeadingCount>
      </SectionTitle>
      <Stack>
        {equipmentRows.length === 0 && <EmptyState>사용 설비 이력이 없습니다.</EmptyState>}
        {equipmentRows.map((item) => (
          <EquipmentCard key={`${item.processCode}-${item.equipmentCode || item.equipmentName}`}>
            <EquipmentTop>
              <MachineIcon>
                <FiSettings />
              </MachineIcon>
              <MachineName>
                <strong>{item.equipmentCode || item.equipmentName || "-"}</strong>
                <span>
                  {[item.equipmentName, item.processName || item.processCode]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </span>
              </MachineName>
              <DoneBadge>{item.result || "-"}</DoneBadge>
            </EquipmentTop>
            <TimeLine>
              <FiClock /> {formatProcessTime(item)}
            </TimeLine>
          </EquipmentCard>
        ))}
      </Stack>
    </>
  );
}

// 상세 drawer와 어두운 배경을 화면 전체에 띄우는 최상위 레이어
const Layer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
`;
// drawer 바깥 영역 클릭하면 상세 화면을 닫는 배경 버튼
const Backdrop = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.38);
  cursor: default;
`;
// 오른쪽에서 열리는 실제 상세 패널
const Drawer = styled.aside`
  position: absolute;
  top: 0;
  right: 0;
  width: min(600px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f9fc;
  color: #1d2738;
  box-shadow: -12px 0 30px rgba(15, 23, 42, 0.14);
  animation: slideIn 0.22s ease-out;
  @keyframes slideIn {
    from {
      transform: translateX(28px);
      opacity: 0.5;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
// drawer 상단 제목 영역
const DrawerHeader = styled.header`
  min-height: 72px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #dce2ec;
  background: #fff;
`;
// 제목/LOT 정보와 닫기 버튼을 양쪽으로 배치
const HeaderTop = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`;
// "완제품 LOT 상세" 제목과 상태 배지를 한 줄
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
// drawer의 큰 제목 텍스트
const DrawerTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.025em;
`;
// LOT 상태를 보여주는 배지 상태값에 따라 색상이 바뀜
const CompleteBadge = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 5px 12px;
  border-radius: 999px;
  background: ${({ $status }) =>
    $status === "생산완료" || $status === "입고완료"
      ? "#ddf8e8"
      : $status === "출하대기"
        ? "#e7f1ff"
        : "#eef1f5"};
  color: ${({ $status }) =>
    $status === "생산완료" || $status === "입고완료"
      ? "#168957"
      : $status === "출하대기"
        ? "#1767bf"
        : "#697286"};
  font-size: 12px;
  font-weight: 650;
`;
// drawer 우측 상단 닫기 버튼
const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: #5f6b7d;
  font-size: 20px;
  border-radius: 6px;
  &:hover {
    background: #f1f4f8;
  }
`;
// 검사 합격률 요약 카드를 감싸는 여백 영역
const SummaryWrap = styled.div`
  padding: 20px 28px 0;
`;
// 최종 검사 합격률, 수량, 진행바를 담는 요약 카드
const SummaryCard = styled.section`
  padding: 14px 16px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 요약 카드의 작은 라벨 텍스트
const SummaryLabel = styled.div`
  color: #8a94a6;
  font-size: 12px;
  font-weight: 600;
`;
// 합격률 숫자와 합격/불합격 수량을 한 줄에 배치
const SummaryLine = styled.div`
  margin-top: 4px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;
// 합격률 퍼센트 값을 크게 보여줌
const Rate = styled.strong`
  color: #2a3140;
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
`;
// 합격/불합격 수량 요약 텍스트
const Counts = styled.strong`
  color: #5d6676;
  font-size: 12px;
  white-space: nowrap;
`;
// 합격률 진행바의 바탕
const Progress = styled.div`
  height: 8px;
  margin-top: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #dce4f3;
`;
// 합격률 진행바에서 실제 채워지는 파란색 막대
const ProgressValue = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #0b57d0;
`;
// 검사 완료 시간을 표시하는 작은 텍스트
const FinishedAt = styled.div`
  margin-top: 8px;
  font-family: var(--font-family-base);
  color: #39455a;
  font-size: 12px;
  font-weight: 600;
`;

const LotInfoWrap = styled.section`
  padding: 18px 28px 0;
`;

const LotInfoCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 28px;
  padding: 18px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const LotInfoItem = styled.div`
  min-width: 0;
`;

// 작업 정보/LOT/자재/설비 탭 버튼들을 담는 탭 영역
const Tabs = styled.div`
  height: 48px;
  margin: 16px 28px 0;
  padding: 0;
  display: flex;
  align-items: stretch;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
  overflow: hidden;
`;
// 각 탭 버튼, 선택된 탭은 파란색 글자와 아래 선으로 표시
const Tab = styled.button`
  position: relative;
  flex: 1;
  padding: 0 10px;
  color: ${({ $active }) => ($active ? "#074c9d" : "#586478")};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  &::after {
    display: none;
  }
  background: ${({ $active }) => ($active ? "#eef4ff" : "#fff")};
`;
// 탭을 눌렀을 때 바뀌는 상세 내용 영역 내용이 길면 세로 스크롤이 생김
const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 28px 28px;
`;
// 각 탭 내부의 섹션 제목
const SectionHeading = styled.h3`
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 4px solid #0b57d0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #273143;
  font-size: 14px;
  font-weight: 600;
  svg {
    color: #657187;
  }
  &:not(:first-child) {
    margin-top: 26px;
  }
`;
// 섹션 제목 옆에 붙는 개수 표시
const HeadingCount = styled.span`
  margin-left: 8px;
  color: #748094;
  font-size: 12px;
  font-weight: 500;
`;
// 작업 정보 탭에서 시작/종료/담당자/작업지시 카드를 2열로 배치
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;
// 작업 정보 한 칸짜리 카드
const InfoCard = styled.div`
  min-height: 68px;
  padding: 16px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 카드 안의 작은 항목명 라벨
const SmallLabel = styled.span`
  display: block;
  margin-bottom: 7px;
  color: #8a94a6;
  font-size: 12px;
  font-weight: 600;
`;
// 카드 안의 실제 값 텍스트
const Value = styled.strong`
  display: block;
  color: #202a3c;
  font-family: var(--font-family-base);
  font-size: 13px;
  font-weight: 700;
`;

const PersonValue = styled(Value)`
  font-family: var(--font-family-base);
  font-weight: 700;
`;
// 검사 수량/합격/불합격 3개 값을 가로로 보여주는 영역
const InspectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 검사 실적 요약의 각 칸
const InspectionItem = styled.div`
  padding: 14px 8px;
  text-align: center;
  &:not(:last-child) {
    border-right: 1px solid #d6dce8;
  }
  ${SmallLabel} {
    margin-bottom: 8px;
  }
`;
// 합격 수량처럼 파란색으로 강조할 값
const BlueValue = styled(Value)`
  color: #074d9f;
`;
// 불합격 수량처럼 빨간색으로 강조할 값
const RedValue = styled(Value)`
  color: #c53d3d;
`;
// LOT 탭에서 공정 흐름을 시간순으로 보여주는 타임라인 영역
const Timeline = styled.div`
  margin-top: 2px;
`;
// 타임라인의 한 줄, 다음 줄과 이어지는 세로선을 만듬
const TimelineRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 28px 1fr;
  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 9px;
    top: 20px;
    bottom: -10px;
    width: 1px;
    background: #b8c4d5;
  }
  &:not(:last-child) {
    padding-bottom: 12px;
  }
`;
// 타임라인 왼쪽의 체크 아이콘 원
const TimelineMarker = styled.div`
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #0752a8;
  color: #fff;
  font-size: 12px;
`;
// 타임라인 오른쪽에 붙는 공정 정보 카드
const ProcessCard = styled.div`
  padding: 14px 16px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 카드 상단에서 이름과 상태/수량을 양쪽으로 배치
const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  strong {
    font-size: 12px;
    font-weight: 650;
  }
`;
// 공정 완료 PASS 텍스트
const PassText = styled.span`
  color: #168953;
  font-size: 12px;
  font-weight: 750;
`;
// 공정 카드 안의 설비/시간 메타 정보를 2열로 보여줌
const ProcessMeta = styled.div`
  margin-top: 9px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  color: #273143;
  font-family: var(--font-family-base);
  font-size: 12px;
  ${SmallLabel} {
    margin-bottom: 4px;
    font-family: var(--font-family-base);
  }
`;
// 자재 탭 상단의 자재 종류/자재 LOT 개수 요약 박스
const MaterialSummary = styled.div`
  margin-bottom: 14px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 자재 요약 박스 안의 큰 숫자 값
const BigValue = styled.strong`
  font-size: 17px;
  font-weight: 600;
  em {
    margin-left: 5px;
    font-style: normal;
    color: #687387;
    font-size: 12px;
    font-weight: 500;
  }
`;
// 자재 카드나 설비 카드를 세로로 쌓는 영역
const Stack = styled.div`
  display: grid;
  gap: 10px;
`;

const EmptyState = styled.div`
  padding: 20px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
  color: #7a8495;
  font-size: 13px;
  text-align: center;
`;

// 자재 탭에서 원자재 하나를 표시하는 카드
const MaterialCard = styled.div`
  padding: 15px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 투입 자재 수량과 단위 표시
const Amount = styled.span`
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 650;
  small {
    color: #647084;
    font-size: 12px;
  }
`;
// 자재 LOT 번호를 표시하는 텍스트
const MaterialLot = styled.div`
  margin-top: 8px;
  color: #0753a8;
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 650;
  span {
    margin-right: 8px;
    color: #69758a;
    font-family: var(--font-family-base);
  }
`;
// 자재 투입 시간이나 설비 사용 시간처럼 시간 정보를 보여주는 줄
const TimeLine = styled.div`
  margin-top: 10px;
  padding-top: 9px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-top: 1px solid #dce2ea;
  color: #4e5a6d;
  font-family: var(--font-family-base);
  font-size: 12px;
`;
// 설비 탭에서 설비 하나를 표시하는 카드
const EquipmentCard = styled.div`
  padding: 12px 14px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: #fff;
`;
// 설비 카드 상단의 아이콘/설비명/상태 배지를 가로 배치
const EquipmentTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
// 설비 카드 왼쪽의 설비 아이콘 박스
const MachineIcon = styled.div`
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #eef1f5;
  color: #536075;
  font-size: 17px;
`;
// 설비 코드와 설비명을 세로로 표시
const MachineName = styled.div`
  flex: 1;
  min-width: 0;
  strong {
    display: block;
    font-size: 12px;
    font-weight: 700;
  }
  span {
    display: block;
    margin-top: 3px;
    color: #647084;
    font-size: 12px;
  }
`;
// 설비 공정 완료 상태를 보여주는 작은 배지
const DoneBadge = styled.span`
  padding: 4px 7px;
  border-radius: 3px;
  background: #dcf8e8;
  color: #168957;
  font-size: 12px;
  font-weight: 650;
`;
// drawer 하단의 버튼 영역
const Footer = styled.footer`
  padding: 16px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #dce2ec;
  background: #fff;
`;

const FooterButton = styled.button`
  height: 36px;
  padding: 0 18px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
`;

const CloseFooterButton = styled(FooterButton)`
  border: 1px solid #d1d7e3;
  background: #fff;
  color: #111827;

  &:hover {
    background: #f5f7fa;
  }
`;
// 성적서 발행 버튼
const ReportButton = styled(FooterButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #0b57d0;
  background: #0b57d0;
  color: #fff;
  &:hover {
    background: #084693;
  }
`;
