export const hasMasterWritePermission = (user) => {
  const username = String(user?.username ?? "").toLowerCase();
  const role = String(user?.role ?? user?.authority ?? "").toUpperCase();

  return (
    username === "admin" ||
    role === "ADMIN" ||
    role === "ROLE_ADMIN" ||
    role === "관리자"
  );
};
