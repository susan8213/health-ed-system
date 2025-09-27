'use client';

import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <a href="/" className="brand-link">
            智慧醫療管理系統
          </a>
        </div>
        
        <div className="nav-links">
          <a 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            患者搜尋
          </a>
          <a 
            href="/records" 
            className={`nav-link ${pathname === '/records' ? 'active' : ''}`}
          >
            本週記錄
          </a>
        </div>
      </div>
    </nav>
  );
}