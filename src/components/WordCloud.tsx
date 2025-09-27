'use client';

import { useEffect, useRef, useCallback } from 'react';

interface WordCloudItem {
  text: string;
  weight: number;
  category?: 'symptom' | 'syndrome';
}

interface WordCloudProps {
  data: WordCloudItem[];
  width?: number;
  height?: number;
}

export default function WordCloud({ 
  data, 
  width = 400, 
  height = 300
}: WordCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // 四等份顏色分級
  // 共用 function: 取得四等份顏色區間
  interface WordCloudColorRange {
    color: string;
    label: string;
    min: number;
    max: number;
  }
  const getWordCloudColorRanges = useCallback((): WordCloudColorRange[] => {
    if (!data.length) return [];
    const colorMap = ['#dc3545', '#007bff', '#6f42c1', '#28a745'];
    const colorLabels = ['紅色', '藍色', '紫色', '綠色'];
    const weights = data.map(item => item.weight).sort((a, b) => a - b);
    const min = weights[0];
    const max = weights[weights.length - 1];
    // 百分比分位數
    function percentile(p: number) {
      if (weights.length === 1) return weights[0];
      const idx = (weights.length - 1) * p;
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      if (lower === upper) return weights[lower];
      return Math.round(weights[lower] + (weights[upper] - weights[lower]) * (idx - lower));
    }
    const p75 = percentile(0.75);
    const p50 = percentile(0.5);
    const p25 = percentile(0.25);
    return [
      { color: colorMap[0], label: colorLabels[0], min: p75, max: max },
      { color: colorMap[1], label: colorLabels[1], min: p50, max: p75 - 1 },
      { color: colorMap[2], label: colorLabels[2], min: p25, max: p50 - 1 },
      { color: colorMap[3], label: colorLabels[3], min: min, max: p25 - 1 },
    ];
  }, [data]);

  const getQuartileColor = useCallback((weight: number) => {
    const ranges = getWordCloudColorRanges();
    const found = ranges.find(r => weight >= r.min && weight <= r.max);
    return found ? found.color : '#28a745';
  }, [getWordCloudColorRanges]);

  // 百分比分位數映射字體大小
  // 可切換用 getWeightFactorByLog(size)
  // 1. 百分比分位數
  function getWeightFactorByPercentile(weight: number) {
    if (!data.length) return 24;
    const weights = data.map(item => item.weight).sort((a, b) => a - b);
    const idx = weights.findIndex(w => w === weight);
    const percent = idx === -1 ? 0 : idx / (weights.length - 1 || 1);
    const minFont = data.length <= 3 ? 48 : data.length <= 6 ? 32 : 18;
    const maxFont = 64;
    return minFont + (maxFont - minFont) * percent;
  }
  // 2. log2 傳統算法
  function getWeightFactorByLog(weight: number) {
    const count = data.length || 1;
    let base = 10 + Math.log2(weight) * 18;
    const scale = 20 / count;
    let result = base * Math.min(1, scale);
    if (count <= 3) {
      result = Math.max(result, 48);
    } else if (count <= 6) {
      result = Math.max(result, 32);
    }
    return result;
  }

  // Tooltip 狀態
  const tooltipRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    tooltip.style.display = 'none';
  }, []);

  useEffect(() => {
    const loadWordCloud = async () => {
      const WordCloudLib = await import('wordcloud');
      if (!canvasRef.current || !data.length) return;
      const canvas = canvasRef.current;

    const list: [string, number][] = [...data.map(item => [item.text, item.weight] as [string, number])];

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      WordCloudLib.default(canvas, {
        list: list,
        gridSize: Math.max(4, Math.round(8 * canvas.width / 1024)),
        weightFactor: (size: number) => getWeightFactorByLog(size),
        fontFamily: 'Microsoft JhengHei, PingFang TC, sans-serif',
        color: (word: string, weight: number) => {
          return getQuartileColor(weight);
        },
        rotateRatio: 0,
        backgroundColor: 'transparent',
        hover: function(...args: any[]) {
          const item = args[0];
          const dimension = args[1];
          const evt = args[2];
          if (canvas.style) {
            canvas.style.cursor = item ? 'pointer' : 'default';
          }
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          if (item && dimension && evt) {
            tooltip.style.display = 'block';
            tooltip.textContent = `${item[0]}：${item[1]} 次`;
            const rect = canvas.getBoundingClientRect();
            tooltip.style.left = `${evt.clientX - rect.left + 10}px`;
            tooltip.style.top = `${evt.clientY - rect.top - 10}px`;
          } else {
            tooltip.style.display = 'none';
          }
        }
      });
    };
    loadWordCloud();
  }, [data, width, height]);

  return (
    <div className="word-cloud-container" style={{ position: 'relative' }}>
      <div style={{ marginBottom: 4, fontSize: 15, lineHeight: 1.6 }}>
        視覺化顯示本週最常見的症狀 • 字體大小反映出現頻率 • 顏色依出現次數區間分級
      </div>
      <div style={{ marginBottom: 8 }}>
        {getWordCloudColorRanges().map((r, idx) => (
          <span key={r.label} style={{ color: r.color, fontWeight: 600, marginRight: 8 }}>
            {r.label}（{r.min}{r.max !== r.min ? `~${r.max}` : ''}次）
          </span>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          maxWidth: '100%',
          height: 'auto',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}
      />
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 15,
          zIndex: 10,
          left: 0,
          top: 0,
          display: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      />
    </div>
  );
}
