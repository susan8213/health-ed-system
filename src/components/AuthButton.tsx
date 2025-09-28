'use client';
import { useSession, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span>載入中...</span>;
  }

  if (session) {
    return (
      <div className="auth-btn-group">
        {session.user?.image && (
          <img src={session.user.image} alt="avatar" className="auth-avatar" />
        )}
        <span className="auth-user-name">{session.user?.name || session.user?.email}</span>
        <button onClick={() => signOut()}>
          登出
        </button>
      </div>
    );
  }
  return (
    <span>請使用 Google 登入</span>
  );
}
