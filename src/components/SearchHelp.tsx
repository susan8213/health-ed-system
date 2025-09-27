'use client';

import { useState } from 'react';

export default function SearchHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="search-help">
      <button 
        className="help-toggle"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        搜尋提示 {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="help-content">
          <div className="help-section">
            <h4>患者姓名/LINE ID 搜尋：</h4>
            <ul>
              <li><strong>單一關鍵字：</strong> "王" - 找到姓名或 LINE ID 中包含「王」的所有患者</li>
              <li><strong>多個關鍵字：</strong> "王 小明" - 找到同時包含「王」和「小明」的患者</li>
              <li><strong>部分匹配：</strong> "王小" - 找到「王小明」、「王小華」等</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>症狀與證候搜尋：</h4>
            <ul>
              <li><strong>空格分隔：</strong> "頭痛 疲勞" - 找到有任一症狀的患者</li>
              <li><strong>逗號分隔：</strong> "頭痛, 疲勞" - 找到有任一症狀的患者</li>
              <li><strong>混合使用：</strong> "頭痛, 疲勞 失眠" - 找到有任一症狀的患者</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>搜尋範例：</h4>
            <ul>
              <li><strong>尋找患者：</strong> "王 小明" (兩個關鍵字都必須匹配)</li>
              <li><strong>尋找症狀：</strong> "頭痛 失眠" (任一症狀)</li>
              <li><strong>尋找證候：</strong> "肝火旺盛" (部分證候匹配)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}