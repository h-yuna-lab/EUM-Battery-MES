// 세션/쿠키 인증을 위한 공용 axios 인스턴스
// CRA의 package.json "proxy" 필드로 개발 환경 origin 문제를 해소하므로,
// baseURL은 비워두고 상대경로(/api/...)로 요청한다.
import axios from "axios";

const axiosInstance = axios.create({
  // 세션 쿠키를 요청에 자동으로 포함시킨다 (세션/쿠키 인증 확정 사항)
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 세션 만료(401) 시 공통 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // TODO: 로그인 페이지로 리다이렉트하는 로직은 AuthContext/AuthGuard 완성 후 연결
      console.warn("세션이 만료되었거나 인증되지 않았습니다.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
