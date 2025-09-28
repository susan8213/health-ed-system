'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // 不需要登入的頁面
  const publicPages = ['/auth/error', '/auth/signin'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    // 如果沒有 session 且不是公開頁面，重定向到登入頁面
    if (status !== "loading" && !session && !isPublicPage) {
      router.push('/auth/signin');
    }
  }, [session, status, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>載入中...</div>
      </div>
    );
  }

  if (!session) {
    // 正在重定向到登入頁面，顯示載入狀態
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>重定向到登入頁面...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthSession({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </SessionProvider>
  );
}
