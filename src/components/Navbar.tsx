'use client';

import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';

import React, { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <a href="/" className="brand-link">
            智慧醫療管理系統
          </a>
        </div>

        {/* 漢堡選單按鈕 (mobile) */}
        <button
          className="navbar-toggle"
          aria-label="切換選單"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>

        {/* 桌機選單 */}
        <div className="nav-links nav-links-desktop">
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
        <div className="nav-auth-desktop">
          <AuthButton />
        </div>

        {/* 手機選單 (展開時顯示) */}
        {menuOpen && (
          <div className="nav-mobile-menu">
            <a 
              href="/" 
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              患者搜尋
            </a>
            <a 
              href="/records" 
              className={`nav-link ${pathname === '/records' ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              本週記錄
            </a>
            <div className="nav-auth-mobile">
              <AuthButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}