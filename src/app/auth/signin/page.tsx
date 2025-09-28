'use client';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>智慧醫療管理系統</h1>
      <p>請先登入以存取系統</p>
      <button 
        onClick={handleSignIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <Image
          src="/google-logo.svg"
          alt="Google"
          width={20}
          height={20}
        />
        <span style={{ lineHeight: 1 }}>使用 Google 登入</span>
      </button>
    </div>
  );
}