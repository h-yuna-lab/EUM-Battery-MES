// MES 전체 좌측 네비게이션 - 6개 그룹 아코디언 메뉴, activeItem으로 현재 위치 표시
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";
import {
  FiGrid,
  FiDatabase,
  FiActivity,
  FiClipboard,
  FiArchive,
  FiBarChart2,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiUser,
} from "react-icons/fi";
import MemberInfoModal from "./MemberInfoModal";
import PasswordChangeModal from "./PasswordChangeModal";
import AuthContext from "../../context/AuthContext";

const MENU_ITEMS = [
  { key: "대시보드", label: "대시보드", icon: FiGrid, path: "/mes/dashboard" },
  {
    key: "기준정보관리",
    label: "기준정보관리",
    icon: FiDatabase,
    children: [
      { key: "공정", label: "공정", path: "/mes/master/process" },
      { key: "작업자", label: "작업자", path: "/mes/master/worker" },
      { key: "설비", label: "설비", path: "/mes/master/machine" },
      { key: "BOM", label: "BOM", path: "/mes/master/bom" },
      { key: "자재", label: "자재", path: "/mes/master/material" },
      { key: "제품", label: "제품", path: "/mes/master/product" },
    ],
  },
  {
    key: "생산관리",
    label: "생산관리",
    icon: FiActivity,
    children: [
      { key: "작업지시", label: "작업지시", path: "/mes/production/workorders" },
      { key: "완제품LOT", label: "완제품LOT", path: "/mes/production/product-lot" },
    ],
  },
  { key: "품질관리", label: "품질관리", icon: FiClipboard, path: "/mes/quality/test-log" },
  {
    key: "자재/재고관리",
    label: "자재/재고관리",
    icon: FiArchive,
    children: [
      { key: "자재재고", label: "자재재고", path: "/mes/inventory/material-list" },
      { key: "자재입출고이력", label: "자재입출고이력", path: "/mes/inventory/material-tx" },
      { key: "원료LOT", label: "원료LOT", path: "/mes/inventory/material-lot" },
    ],
  },
  { key: "리포트", label: "리포트", icon: FiBarChart2, path: "/mes/report/trace" },
];

const Container = styled.aside`
  width: ${({ $collapsed }) => ($collapsed ? "76px" : "260px")};
  flex-shrink: 0;
  min-height: 100vh;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  padding: 23px 0 22px;
  transition: width 0.16s ease-out;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  padding: 0 ${({ $collapsed }) => ($collapsed ? "12px" : "24px")};
  margin-bottom: 28px;
  align-items: center;
  filter: drop-shadow(0 0 4px rgba(255,255,255,.2));

  .eum {
    color: rgba(255,255,255,.92);
  }
  p {
    max-height: ${({ $collapsed }) => ($collapsed ? "0" : "24px")};
    margin-top: ${({ $collapsed }) => ($collapsed ? "0" : "12px")};
    overflow: hidden;
    opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
    visibility: ${({ $collapsed }) => ($collapsed ? "hidden" : "visible")};
    transform: translateY(${({ $collapsed }) => ($collapsed ? "-3px" : "0")});
    color: rgba(255,255,255,.92);
    font-weight: 600;
    letter-spacing: 2px;
    text-align: center;
    filter: drop-shadow(0 0 4px rgba(255,255,255,.2));
    transition: opacity 0.2s ease, transform 0.24s ease-out;
    transition-delay: ${({ $collapsed }) =>
      $collapsed ? "0s" : "0.1s"};
    /* margin-left: 3px; */
  }
`;

const SidebarDivider = styled.div`
  width: ${({ $collapsed }) =>
    $collapsed ? "44px" : "calc(100% - 48px)"};
  height: 1px;
  margin: 0 auto 17px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.36),
    transparent
  );
`;

const SidebarLogo = styled.img`
  display: block;
  width: ${({ $collapsed }) => ($collapsed ? "44px" : "110px")};
  height: auto;
  object-fit: contain;
  /* filter:
        drop-shadow(0.1px 0 0 #fff)
        drop-shadow(-0.1px 0 0 #fff)
        drop-shadow(0 0.3px 0 #fff)
        drop-shadow(0 -0.3px 0 #fff); */
  filter: brightness(1.18);
  transition: width 0.16s ease-out;
`;

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 ${({ $collapsed }) => ($collapsed ? "10px" : "16px")};
  overflow: visible;
`;

const activeAccent = css`
  background: rgba(37, 99, 235, 0.22);
  color: var(--color-text-inverse);
  border-left-color: var(--sidebar-active);
`;

const rowBase = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ $collapsed }) => ($collapsed ? "0" : "12px")};
  width: 100%;
  padding: 12px ${({ $collapsed }) => ($collapsed ? "0" : "12px")};
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  border-radius: var(--radius-md);
  border-left: 2px solid transparent;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--sidebar-text);
  background: transparent;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      &::after {
        content: attr(data-label);
        position: absolute;
        top: 50%;
        left: calc(100% + 12px);
        z-index: 1000;
        padding: 7px 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        background: var(--sidebar-bg);
        box-shadow: 0 6px 18px rgba(2, 6, 23, 0.3);
        color: var(--sidebar-text);
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(-50%) translateX(-4px);
        transition: opacity 0.15s ease, transform 0.15s ease,
          visibility 0.15s ease;
      }

      &:hover::after {
        opacity: 1;
        visibility: visible;
        transform: translateY(-50%) translateX(0);
      }
    `}

  ${(props) => props.$active && activeAccent}
`;

const GroupButton = styled.button`
  ${rowBase}
`;

const GroupLink = styled(Link)`
  ${rowBase}
`;

const GroupLabel = styled.span`
  flex: ${({ $collapsed }) => ($collapsed ? "0 0 0" : "1 1 auto")};
  max-width: ${({ $collapsed }) => ($collapsed ? "0" : "180px")};
  overflow: hidden;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  visibility: ${({ $collapsed }) => ($collapsed ? "hidden" : "visible")};
  transform: translateX(${({ $collapsed }) => ($collapsed ? "-6px" : "0")});
  white-space: nowrap;
  transition: opacity 0.2s ease, transform 0.24s ease-out;
  transition-delay: ${({ $collapsed }) =>
    $collapsed ? "0s" : "0.05s"};
`;

const Chevron = styled(FiChevronRight)`
  flex: 0 0 auto;
  max-width: ${({ $collapsed }) => ($collapsed ? "0" : "16px")};
  margin-left: ${({ $collapsed }) => ($collapsed ? "0" : "auto")};
  overflow: hidden;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  visibility: ${({ $collapsed }) => ($collapsed ? "hidden" : "visible")};
  color: var(--sidebar-text-muted);
  transition: transform 0.15s ease, opacity 0.07s ease;
  transition-delay: ${({ $collapsed }) =>
    $collapsed ? "0s" : "0.1s"};
  transform: rotate(${(props) => (props.$open ? "90deg" : "0deg")});
`;

const SubMenuWrap = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.22s ease, opacity 0.16s ease;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: none;
    `}

  ${(props) =>
    props.$open &&
    css`
      grid-template-rows: 1fr;
      opacity: 1;
    `}
`;

const SubMenu = styled.div`
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 4px 43px;
`;

const SubMenuItem = styled(Link)`
  display: block;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border-left: 2px solid transparent;
  font-size: var(--font-size-sm);
  color: var(--sidebar-text-muted);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--sidebar-text);
  }

  ${(props) =>
    props.$active &&
    css`
      ${activeAccent}
      font-weight: var(--font-weight-medium);
    `}
`;

const MenuGroup = styled.div`
  position: relative;
`;

const CollapsedMenuPanel = styled.div`
  position: absolute;
  top: 0;
  left: calc(100% + 12px);
  z-index: 1100;
  width: 190px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: var(--sidebar-bg);
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.38);

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    right: 100%;
    width: 24px;
    height: calc(100% + 20px);
  }
`;

const CollapsedMenuTitle = styled.div`
  padding: 8px 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-inverse);
  font-size: 13px;
  font-weight: 700;
`;

const CollapsedMenuLink = styled(Link)`
  display: block;
  margin-top: 4px;
  padding: 9px 10px;
  border-radius: 6px;
  color: var(--sidebar-text-muted);
  font-size: 13px;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--sidebar-text);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: rgba(37, 99, 235, 0.24);
      color: var(--color-text-inverse);
      font-weight: 600;
    `}
`;

const ToggleSection = styled.div`
  display: flex;
  flex-direction: ${({ $collapsed }) => ($collapsed ? "column" : "row")};
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "space-between"};
  gap: ${({ $collapsed }) => ($collapsed ? "4px" : "12px")};
  padding: 5px ${({ $collapsed }) => ($collapsed ? "10px" : "18px")} 0;
  transform: translateY(6px);
`;

// 회원 정보 모달을 여는 사용자 영역 버튼
const UserSummary = styled.button`
  min-width: 0;
  flex: 1;
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  color: var(--sidebar-text);
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:focus-visible {
    outline: 2px solid var(--sidebar-active);
    outline-offset: 2px;
  }
`;

const UserIcon = styled.span`
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: var(--sidebar-text-muted);
`;

const UserName = styled.span`
  display: ${({ $collapsed }) => ($collapsed ? "none" : "block")};
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const CollapseButton = styled.button`
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--sidebar-text-muted);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-inverse);
  }

  &:active {
    transform: scale(0.92);
  }

  &:focus-visible {
    outline: 2px solid var(--sidebar-active);
    outline-offset: 2px;
  }
`;

export default function SideBar({ activeItem }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedMenu, setCollapsedMenu] = useState(null);
  const [memberInfoModalOpen, setMemberInfoModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const defaultOpenGroup = MENU_ITEMS.find((item) =>
    item.children?.some((child) => child.key === activeItem)
  )?.key;

  const [openGroups, setOpenGroups] = useState(
    defaultOpenGroup ? [defaultOpenGroup] : []
  );
  const displayName = user?.displayName || user?.employeeName || user?.username || "-";

  const toggleGroup = (key) => {
    setOpenGroups((prev) =>
      prev.includes(key)
        ? prev.filter((groupKey) => groupKey !== key)
        : [...prev, key]
    );
  };

  // 로그아웃: 서버 세션 종료, 인증 정보 초기화, 로그인 화면 이동
  const handleLogout = async () => {
    if (!window.confirm("로그아웃하시겠습니까?")) return;

    await logout();
    setMemberInfoModalOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <Container $collapsed={collapsed}>
      <LogoSection $collapsed={collapsed}>
        <SidebarLogo
          src="/eum-battery-sidebar-logo.png"
          $collapsed={collapsed}
          alt="이음 Battery"
        />
        <p><span className="eum">EUM</span> Battery</p>
      </LogoSection>

      <SidebarDivider $collapsed={collapsed} />

      <Nav $collapsed={collapsed}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            return (
              <GroupLink
                key={item.key}
                to={item.path}
                data-label={item.label}
                $active={activeItem === item.key}
                $collapsed={collapsed}
              >
                <Icon size={18} />
                <GroupLabel $collapsed={collapsed}>{item.label}</GroupLabel>
              </GroupLink>
            );
          }

          const isOpen = openGroups.includes(item.key);
          const isGroupActive = item.children.some(
            (child) => child.key === activeItem
          );

          const isCollapsedMenuOpen = collapsedMenu === item.key;

          return (
            <MenuGroup
              key={item.key}
              onMouseLeave={() => {
                if (collapsed) {
                  setCollapsedMenu(null);
                }
              }}
            >
              <GroupButton
                type="button"
                data-label={item.label}
                aria-expanded={collapsed ? isCollapsedMenuOpen : isOpen}
                onClick={() => {
                  if (collapsed) {
                    setCollapsedMenu((prev) =>
                      prev === item.key ? null : item.key
                    );
                    return;
                  }

                  toggleGroup(item.key);
                }}
                $active={isGroupActive && (collapsed || !isOpen)}
                $collapsed={collapsed}
              >
                <Icon size={18} />
                <GroupLabel $collapsed={collapsed}>{item.label}</GroupLabel>
                <Chevron size={16} $open={isOpen} $collapsed={collapsed} />
              </GroupButton>

              <SubMenuWrap $open={isOpen} $collapsed={collapsed}>
                <SubMenu>
                  {item.children.map((child) => (
                    <SubMenuItem
                      key={child.key}
                      to={child.path}
                      $active={activeItem === child.key}
                    >
                      {child.label}
                    </SubMenuItem>
                  ))}
                </SubMenu>
              </SubMenuWrap>

              {collapsed && isCollapsedMenuOpen && (
                <CollapsedMenuPanel>
                  <CollapsedMenuTitle>{item.label}</CollapsedMenuTitle>
                  {item.children.map((child) => (
                    <CollapsedMenuLink
                      key={child.key}
                      to={child.path}
                      $active={activeItem === child.key}
                      onClick={() => setCollapsedMenu(null)}
                    >
                      {child.label}
                    </CollapsedMenuLink>
                  ))}
                </CollapsedMenuPanel>
              )}
            </MenuGroup>
          );
        })}
      </Nav>

      <ToggleSection $collapsed={collapsed}>
        {/* 신규 회원 정보 버튼: 사용자 영역 전체 클릭 시 모달 표시 */}
        <UserSummary
          type="button"
          title="회원 정보"
          aria-label="회원 정보"
          onClick={() => setMemberInfoModalOpen(true)}
        >
          <UserIcon>
            <FiUser size={17} />
          </UserIcon>
          <UserName $collapsed={collapsed}>{displayName} 님</UserName>
        </UserSummary>

        <CollapseButton
          type="button"
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          onClick={() => {
            setCollapsed((prev) => !prev);
            setCollapsedMenu(null);
          }}
        >
          {collapsed ? (
            <FiChevronsRight size={18} />
          ) : (
            <FiChevronsLeft size={18} />
          )}
        </CollapseButton>
      </ToggleSection>

      {/* 회원 정보 모달: 사번 확인, 로그아웃, 비밀번호 변경 진입 */}
      <MemberInfoModal
        isOpen={memberInfoModalOpen}
        username={user?.username}
        employeeNo={user?.employeeNo}
        employeeName={user?.employeeName}
        displayName={user?.displayName}
        role={user?.role}
        onClose={() => setMemberInfoModalOpen(false)}
        onLogout={handleLogout}
        onEdit={() => {
          setMemberInfoModalOpen(false);
          setPasswordModalOpen(true);
        }}
      />

      {/* 비밀번호 변경 모달: 현재 비밀번호 확인 및 새 비밀번호 저장 */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

    </Container>
  );
}
