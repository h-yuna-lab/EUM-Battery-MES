import { createGlobalStyle } from "styled-components";
import reset from "styled-reset";

const GlobalStyle = createGlobalStyle`
  ${reset}
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: var(--font-family-base);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-bg-canvas);
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
  }
  :root {
    /* 색상 -- DESIGN.md(확정본) 기준 */
    --color-primary : #2563eb;
    --color-primary-light : #d0e1fb;
    --color-bg : #ffffff;
    --color-bg-canvas : #f7f9fb;
    --color-border : #e2e8f0;
    --color-text : #191c1e;
    --color-text-secondary : #434655;
    --color-text-inverse : #ffffff;
    --color-success : #059669;
    --color-success-bg : #ecfdf5;
    --color-warning : #d97706;
    --color-warning-bg : #fffbeb;
    --color-danger : #ba1a1a;
    --color-danger-bg : #ffdad6;
    --color-neutral : #737686;
    --color-accent-kpi : #4d556b;

    /* 사이드바 전용 (다크 슬레이트) */
    --sidebar-bg : #0f172a;
    --sidebar-text : #e2e8f0;
    --sidebar-text-muted : #94a3b8;
    --sidebar-active : #2563eb;

    /* 타이포그래피 */
    --font-family-base : 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --font-family-mono : 'JetBrains Mono', monospace;

    --font-size-xs : 12px;
    --font-size-sm : 14px;
    --font-size-md : 16px;
    --font-size-lg : 18px;
    --font-size-xl : 24px;
    --font-size-2xl : 32px;
    --font-size-3xl : 48px;

    --font-weight-normal : 400;
    --font-weight-medium : 500;
    --font-weight-semibold : 600;
    --font-weight-bold : 700;

    /* 모든 업무 페이지 상단 헤더에 사용하는 공통 타이포그래피 */
    --page-title-size : 30px;
    --page-title-line-height : 1.2;
    --page-title-weight : 600;
    --page-title-color : #17191d;
    --page-title-letter-spacing : -0.8px;
    --page-subtitle-size : 14px;
    --page-subtitle-weight : 400;
    --page-subtitle-color : #818896;
    --page-subtitle-line-height : 1.5;
    --page-container-padding : 28px 32px 44px;
    --page-title-subtitle-gap : 6px;
    --page-header-content-gap : 22px;
    --page-section-gap : 20px;
    --page-box-gap : 16px;
    --page-panel-padding : 20px 22px;

    /* 모서리 */
    --radius-sm : 0.25rem;
    --radius-md : 0.5rem;
    --radius-lg : 1rem;
    --radius-xl : 1.5rem;
    --radius-full : 9999px;

    /* 간격 */
    --spacing-unit : 4px;
    --spacing-gutter : 24px;
    --spacing-margin-desktop : 32px;
    --spacing-margin-mobile : 16px;
    --container-max : 1440px;

    /* 그림자 */
    --shadow-card : 0px 1px 3px rgba(0, 0, 0, 0.05);
    --shadow-elevated : 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  @media (max-width: 720px) {
    :root {
      --page-container-padding : 24px 16px 40px;
    }
  }
  button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
  }
  input, textarea {
    outline: none;
    border: none;
    font-family: inherit;
    font-size: inherit
  }
  a {
    text-decoration: none;
    color: inherit;
  }
  ul, li {
    list-style: none;
  }
  img {
    max-width: 100%;
    display: block;
  }
  svg:focus {
  outline: none;
  }

  svg *:focus {
  outline: none;
  }
`;

export default GlobalStyle;
