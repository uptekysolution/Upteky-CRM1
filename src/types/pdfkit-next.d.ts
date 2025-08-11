declare module 'pdfkit-next' {
  interface PDFDocumentOptions {
    size?: string;
    autoFirstPage?: boolean;
    bufferPages?: boolean;
  }

  export default class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    
    // Font and text methods
    font(fontName: string): this;
    fontSize(size: number): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    text(text: string, options?: any): this;
    text(text: string, x: number, y: number, options?: any): this;
    
    // Layout methods
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    
    // Drawing methods
    stroke(): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(): this;
    
    // Event handling
    on(event: string, callback: (data: any) => void): this;
    
    // Stream handling
    pipe(stream: any): this;
    end(): void;
    
    // Properties
    y: number;
  }
}
