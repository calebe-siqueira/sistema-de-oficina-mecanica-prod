import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuração otimizada do Worker
// pdfjs.GlobalWorkerOptions.workerSrc = `//://unpkg.com{pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface OSViewerProps {
  pdfUrl: string;
  scale: number;
  onLoadSuccess?: (numPages: number) => void;
}

export function OsViewer({ pdfUrl, scale, onLoadSuccess }: OSViewerProps): React.JSX.Element {
  const [numPages, setNumPages] = useState<number | null>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
    if (onLoadSuccess) onLoadSuccess(numPages);
  };

  // Cálculo simples e direto de largura responsiva para Mobile-First (KISS)
  const pdfWidth = typeof window !== 'undefined' && window.innerWidth > 450 ? 420 : window.innerWidth - 32;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 pb-8">
      <div className="shadow-lg rounded-md overflow-hidden bg-white border border-slate-200">
        <Document file={pdfUrl} onLoadSuccess={handleDocumentLoadSuccess}>
          {numPages && Array.from(new Array(numPages), (_, index: number) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={scale}
              renderTextLayer={true} // Mantém o texto pesquisável internamente
              renderAnnotationLayer={false}
              width={pdfWidth}
              className="border-b border-slate-100 last:border-none"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
