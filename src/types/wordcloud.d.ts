declare module 'wordcloud' {
  interface WordCloudOptions {
    list: Array<[string, number]>;
    gridSize?: number;
    weightFactor?: (size: number) => number;
    fontFamily?: string;
    color?: string | ((word: string, weight: number) => string);
    rotateRatio?: number;
    backgroundColor?: string;
    click?: (item: [string, number]) => void;
    hover?: (item: [string, number] | undefined) => void;
    drawOutOfBound?: boolean;
    shrinkToFit?: boolean;
  }

  function WordCloud(canvas: HTMLCanvasElement, options: WordCloudOptions): void;
  
  export = WordCloud;
}
