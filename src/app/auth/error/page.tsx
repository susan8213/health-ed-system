'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: '存取被拒絕',
          message: '您的帳號沒有權限存取此系統。請聯繫管理員以獲取權限。',
          details: '只有授權的帳號才能登入此醫療管理系統。'
        };
      case 'Configuration':
        return {
          title: '設定錯誤',
          message: '系統設定發生錯誤，請稍後再試。',
          details: '如果問題持續發生，請聯繫系統管理員。'
        };
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return {
          title: '登入失敗',
          message: '登入過程中發生錯誤，請重新嘗試。',
          details: '這可能是暫時性問題，請稍後再試。'
        };
      default:
        return {
          title: '發生未知錯誤',
          message: '登入時發生未預期的錯誤。',
          details: '請重新嘗試或聯繫系統管理員。'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '24px',
      padding: '40px',
      textAlign: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px'
        }}>
          ⚠️
        </div>
        
        <h1 style={{ 
          color: '#dc2626', 
          fontSize: '24px', 
          marginBottom: '12px',
          fontWeight: '600'
        }}>
          {errorInfo.title}
        </h1>
        
        <p style={{ 
          color: '#374151', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '8px'
        }}>
          {errorInfo.message}
        </p>
        
        <p style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          {errorInfo.details}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => signIn('google')}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            重新登入
          </button>
          
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            回到首頁
          </button>
        </div>

        {error && (
          <details style={{ marginTop: '24px', textAlign: 'left' }}>
            <summary style={{ 
              color: '#6b7280', 
              fontSize: '12px', 
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              技術細節
            </summary>
            <code style={{ 
              display: 'block',
              background: '#f9fafb',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#374151',
              marginTop: '8px',
              wordBreak: 'break-all'
            }}>
              錯誤代碼: {error}
            </code>
          </details>
        )}
      </div>
    </div>
  );
}
