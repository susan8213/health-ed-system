'use client';

import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <a href="/" className="brand-link">
            TCM Clinic
          </a>
        </div>
        
        <div className="nav-links">
          <a 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            Patient Search
          </a>
          <a 
            href="/records" 
            className={`nav-link ${pathname === '/records' ? 'active' : ''}`}
          >
            This Week's Records
          </a>
        </div>
      </div>
    </nav>
  );
}