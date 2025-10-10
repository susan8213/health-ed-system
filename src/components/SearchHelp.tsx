'use client';

import { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Card from './Card';

export default function SearchHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <CollapsibleSection title="搜尋提示" defaultOpen={false} toggleWidth="20%">
        <Card>
          <Card.Content>
            <div className="column" >
          <div>
            <h4>患者姓名搜尋：</h4>
            <ul>
              <li><strong>單一關鍵字：</strong> "王" - 找到姓名中包含「王」的所有患者</li>
              <li><strong>多個關鍵字：</strong> "王 小明" - 找到包含「王」或「小明」任一個的患者</li>
              <li><strong>部分匹配：</strong> "王小" - 找到「王小明」、「王小華」等</li>
            </ul>
          </div>

          <div>
            <h4>症狀與證候搜尋：</h4>
            <ul>
              <li><strong>空格分隔：</strong> "頭痛 疲勞" - 找到有其中任一症狀的患者</li>
            </ul>
          </div>

          <div>
            <h4>搜尋範例：</h4>
            <ul>
              <li><strong>單純姓名：</strong> "王 小明" - 找到姓名包含「王」或「小明」任一個的患者</li>
              <li><strong>單純症狀：</strong> "頭痛 失眠" - 找到有其中任一症狀的患者</li>
              <li><strong>組合搜尋：</strong> 姓名填「王」+ 症狀填「頭痛」= 找到姓名包含「王」且有「頭痛」症狀的患者</li>
            </ul>
          </div>
            </div>

          </Card.Content>
        </Card>
      </CollapsibleSection>
    </div>
  );
}