import { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiUserX,
} from "react-icons/fi";
import SearchFilterBar from "../../components/ui/SearchFilterBar";
import SummaryCard from "../../components/ui/SummaryCard";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import WorkerDetail from "./WorkerDetail";
import WorkerNewEdit from "./WorkerNewEdit";
import masterApi from "../../api/master";
import AuthContext from "../../context/AuthContext";
import NoPermissionText from "../../components/ui/NoPermissionText";
import { hasMasterWritePermission } from "../../utils/masterPermissions";

// 검색 조건 초기값, 초기화 버튼에서 그대로 다시 사용
const emptyFilters = {
  startDate: "",
  endDate: "",
  role: "",
  isActive: "",
  keyword: "",
};

const createWorkerCode = (workers) => {
  const today = new Date().toISOString().slice(2, 10).replaceAll("-", "");

  const maxNumber = workers.reduce((max, worker) => {
    const number = Number(worker.workerCode?.split("-").pop()) || 0;
    return Math.max(max, number);
  }, 0);

  return `W-${today}-${String(maxNumber + 1).padStart(4, "0")}`;
};

const formatDate = (value) => (value ? String(value).slice(0, 10) : "");

const mapWorkerFromApi = (worker) => ({
  id: worker.id,
  workerCode: worker.employeeNo ?? "",
  workerName: worker.employeeName ?? "",
  role: worker.role ?? "",
  isActive: worker.present !== false,
  hiredAt: formatDate(worker.hireDate),
  createdAt: formatDate(worker.hireDate),
  updatedAt: "",
});

const toWorkerPayload = (form) => ({
  employeeName: form.workerName,
  hireDate: form.hiredAt,
  role: form.role,
  present: form.isActive !== false,
});

const PAGE_SIZE = 8;

export default function WorkerList() {
  const { user } = useContext(AuthContext);
  const canManage = hasMasterWritePermission(user);
  const [workers, setWorkers] = useState([]);
  const [permissionError, setPermissionError] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  // 값이 있으면 상세 사이드 드로어가 열림
  const [selectedWorker, setSelectedWorker] = useState(null);

  // formOpen은 드로어 열림 여부, editingWorker는 등록/수정 모드 구분용
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const loadWorkers = async () => {
    try {
      const { data } = await masterApi.getWorkers();
      setPermissionError(false);
      setWorkers((data ?? []).map(mapWorkerFromApi));
    } catch (error) {
      console.error("작업자 목록 조회 실패", error);
      setPermissionError(error.response?.status === 403);
      setWorkers([]);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const counts = useMemo(
    () => ({
      total: workers.length,
      active: workers.filter((worker) => worker.isActive).length,
      inactive: workers.filter((worker) => !worker.isActive).length,
    }),
    [workers],
  );

  // 검색 조건이 바뀌면 바로 목록에 반영
  const filteredWorkers = useMemo(
    () =>
      workers.filter((worker) => {
        const keyword = filters.keyword.trim().toLowerCase();

        return (
          (!filters.startDate || worker.hiredAt >= filters.startDate) &&
          (!filters.endDate || worker.hiredAt <= filters.endDate) &&
          (!filters.role || worker.role === filters.role) &&
          (filters.isActive === "" ||
            worker.isActive === (filters.isActive === "true")) &&
          (!keyword ||
            worker.workerCode.toLowerCase().includes(keyword) ||
            worker.workerName.toLowerCase().includes(keyword))
        );
      }),
    [workers, filters],
  );

  const openNew = () => {
    if (!canManage) return;
    setEditingWorker(null);
    setFormOpen(true);
  };

  const openEdit = (worker) => {
    if (!canManage) return;
    setSelectedWorker(null);
    setEditingWorker(worker);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingWorker(null);
  };

  const saveWorker = async (form) => {
    if (!canManage) return;
    try {
      if (editingWorker) {
        await masterApi.updateWorker(
          editingWorker.id,
          toWorkerPayload(form),
        );
      } else {
        await masterApi.createWorker(toWorkerPayload(form));
      }

      await loadWorkers();
      closeForm();
    } catch (error) {
      console.error("작업자 저장 실패", error);
      alert("작업자 저장에 실패했습니다. 백엔드 서버와 권한을 확인해 주세요.");
    }
  };

  const removeWorker = async (worker) => {
    if (!canManage) return;
    if (!window.confirm(`${worker.workerName} 작업자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await masterApi.deleteWorker(worker.id);
      await loadWorkers();
      if (selectedWorker?.id === worker.id) {
        setSelectedWorker(null);
      }
    } catch (error) {
      console.error("작업자 삭제 실패", error);
      alert("작업자 삭제에 실패했습니다. 백엔드 서버와 권한을 확인해 주세요.");
    }
  };

  const columns = [
    { key: "no", label: "NO", width: 70, align: "center" },
    { key: "workerCode", label: "사원 번호", width: 170, align: "center" },
    { key: "workerName", label: "사원명", width: 120, align: "center" },
    { key: "role", label: "직급/권한", width: 130, align: "center" },
    { key: "statusView", label: "출퇴근 상태", width: 120, align: "center" },
    { key: "hiredAt", label: "입사일", width: 150, align: "center" },
    { key: "management", label: "관리", width: 120, align: "center" },
  ];

  // 공용 Table에 넘기기 전에 배지와 버튼 UI까지 가공
  const rows = filteredWorkers.map((worker, index) => ({
    ...worker,
    no: index + 1,
    workerCode: <WorkerCode>{worker.workerCode}</WorkerCode>,
    workerName: <WorkerText>{worker.workerName}</WorkerText>,
    role: <WorkerText>{worker.role}</WorkerText>,
    hiredAt: (
      <DateText>
        {worker.hiredAt || worker.createdAt?.split(" ")[0] || "-"}
      </DateText>
    ),
    statusView: (
      <StatusBadge $active={worker.isActive}>
        <StatusDot />
        {worker.isActive ? "출근" : "퇴근"}
      </StatusBadge>
    ),
    management: canManage ? (
      <Management>
        <IconButton
          type="button"
          aria-label={`${worker.workerName} 수정`}
          onClick={(event) => {
            event.stopPropagation();
            openEdit(worker);
          }}
        >
          <FiEdit2 />
        </IconButton>

        <DeleteButton
          type="button"
          aria-label={`${worker.workerName} 삭제`}
          onClick={(event) => {
            event.stopPropagation();
            removeWorker(worker);
          }}
        >
          <FiTrash2 />
        </DeleteButton>
      </Management>
    ) : (
      <NoPermissionText>권한 없음</NoPermissionText>
    ),
  }));

  return (
    <Page>
      <Header>
        <div>
          <Title>작업자 관리</Title>
          <Description>
            시스템에 등록된 작업자 정보와 출퇴근 상태를 관리합니다.
          </Description>
        </div>
        {canManage && (
          <HeaderActionButton type="button" variant="primary" onClick={openNew}>
            <FiPlus size={16} />
            작업자 등록
          </HeaderActionButton>
        )}
      </Header>

      <SummaryGrid>
        <StatusSummaryCard
          height={116}
          gap={14}
          icon={<FiUsers />}
          iconBoxSize={50}
          iconSize={24}
          iconBackground="#e7f0ff"
          iconColor="#0b57d0"
          title="전체 작업자"
          titleFontSize={13}
          value={counts.total}
          valueFontSize={25}
        />

        <StatusSummaryCard
          height={116}
          gap={14}
          icon={<FiUserCheck />}
          iconBoxSize={50}
          iconSize={24}
          iconBackground="#e5f8ec"
          iconColor="#168853"
          title="출근"
          titleFontSize={13}
          value={counts.active}
          valueFontSize={25}
        />

        <StatusSummaryCard
          height={116}
          gap={14}
          icon={<FiUserX />}
          iconBoxSize={50}
          iconSize={24}
          iconBackground="#f0f2f6"
          iconColor="#697386"
          title="퇴근"
          titleFontSize={13}
          value={counts.inactive}
          valueFontSize={25}
        />
      </SummaryGrid>

      <FilterPanel>
        <FilterTitle>작업자 검색</FilterTitle>

        <SearchFilterBar
          filters={[
            {
              name: "role",
              label: "직급/권한",
              placeholder: "전체 권한",
              width: 150,
              options: [
                { value: "관리자", label: "관리자" },
                { value: "작업자", label: "작업자" },
              ],
            },
            {
              name: "isActive",
              label: "출퇴근 상태",
              width: 150,
              options: [
                { value: "true", label: "출근" },
                { value: "false", label: "퇴근" },
              ],
            },
          ]}
          defaultValues={emptyFilters}
          keywordLabel="사원번호/사원명"
          keywordPlaceholder="사원번호 / 사원명 검색"
          startDateLabel="입사일 시작"
          endDateLabel="입사일 종료"
          dateWidth={145}
          inputHeight={38}
          showSearchButton={false}
          padding={0}
          border="none"
          background="transparent"
          onChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
          onReset={() => {
            setFilters(emptyFilters);
            setPage(1);
          }}
        />
      </FilterPanel>

      <TablePanel>
        <TableTop>
          <TableTitle>작업자 현황</TableTitle>
          <TopResultText>
            조회 결과 <strong>{filteredWorkers.length}</strong>건
          </TopResultText>
        </TableTop>
        <Pagination
          columns={columns}
          rows={rows}
          currentPage={page}
          totalItems={filteredWorkers.length}
          itemsPerPage={PAGE_SIZE}
          visiblePages={5}
          background="#ffffff"
          borderTop="1px solid #e2e6ed"
          onPageChange={setPage}
          onRowClick={(worker) =>
            setSelectedWorker(workers.find(({ id }) => id === worker.id))
          }
          tableProps={{
            tableLayout: "fixed",
            headerBackground: "#f1f3f6",
            emptyText: permissionError
              ? "권한이 없습니다."
              : "조건에 맞는 작업자가 없습니다.",
          }}
        />
      </TablePanel>

      <WorkerDetail
        worker={selectedWorker}
        onClose={() => setSelectedWorker(null)}
        onEdit={openEdit}
        canEdit={canManage}
      />
      <WorkerNewEdit
        open={formOpen}
        worker={editingWorker}
        previewWorkerCode={createWorkerCode(workers)}
        onClose={closeForm}
        onSubmit={saveWorker}
        canManage={canManage}
      />
    </Page>
  );
}

// 페이지 전체 여백과 최소 높이를 잡는 바깥 영역
const Page = styled.div`
  width: 100%;
  min-height: 100%;
  padding: var(--page-container-padding);
  box-sizing: border-box;
  background: #f7f8fa;
`;

// 제목 영역과 등록 버튼을 양쪽 끝으로 배치
const Header = styled.div`
  margin-bottom: var(--page-header-content-gap);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--page-section-gap);
`;

// 목록 화면의 메인 제목
const Title = styled.h1`
  margin: 0;
  color: var(--page-title-color);
  font-size: var(--page-title-size);
  line-height: var(--page-title-line-height);
  font-weight: var(--page-title-weight);
  letter-spacing: var(--page-title-letter-spacing);
`;

const Description = styled.p`
  margin: var(--page-title-subtitle-gap) 0 0;
  color: var(--page-subtitle-color);
  font-size: var(--page-subtitle-size);
  font-weight: var(--page-subtitle-weight);
  line-height: var(--page-subtitle-line-height);
`;

const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--page-box-gap);
  margin-bottom: var(--page-section-gap);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StatusSummaryCard = styled(SummaryCard)`
  flex-direction: row;
  align-items: center;
`;

const FilterPanel = styled.section`
  margin-bottom: var(--page-section-gap);
  padding: var(--page-panel-padding);
  border: 1px solid #dce1ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

const FilterTitle = styled.h2`
  margin: 0 0 14px;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

// 작업자 목록 표 전용 정렬, 공용 Table 컴포넌트는 건드리지 않음
const TablePanel = styled.section`
  overflow: hidden;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.04);
`;

const HeaderActionButton = styled(Button)`
  width: 148px;
  height: 40px;
  padding: 0 16px;
  box-sizing: border-box;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  flex-shrink: 0;
  white-space: nowrap;

  font-size: 13px;
  font-weight: 600;
  line-height: 1;
`;
const TableTop = styled.div`
  min-height: 62px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e6ed;
`;

const TableTitle = styled.h2`
  margin: 0;
  color: #292d35;
  font-size: 16px;
  font-weight: 600;
`;

const TopResultText = styled.span`
  color: #737b88;
  font-size: 13px;

  strong {
    color: #0755d9;
  }
`;

// 사원 번호를 강조하기 위한 텍스트 스타일
const WorkerCode = styled.span`
  color: #174b9c;
  font-size: 13px;
  font-weight: 600;
`;

const WorkerText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
`;

const DateText = styled.span`
  color: #252a32;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
`;

// 출근/퇴근 상태를 배지 형태로 보여주는 스타일
const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid ${({ $active }) => ($active ? "#c8e8d2" : "#d6d9e4")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#e8f7ed" : "#eceef5")};
  color: ${({ $active }) => ($active ? "#278a49" : "#616879")};
  font-size: 12px;
  font-weight: 600;
`;

// 상태 배지 앞의 작은 점
const StatusDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
`;

// 수정/삭제 아이콘 버튼을 관리 칸 가운데에 배치
const Management = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

// 수정 아이콘 버튼의 공통 크기와 hover 스타일
const IconButton = styled.button`
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1769d2;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: #edf4ff;
  }
`;

// 삭제 버튼만 위험 동작 느낌이 나도록 붉은 계열로 분리
const DeleteButton = styled(IconButton)`
  color: #e55252;

  &:hover {
    background: #fff1f1;
  }
`;
