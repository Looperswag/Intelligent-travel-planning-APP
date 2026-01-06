import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface PlanPreviewProps {
  htmlContent: string;
}

export interface PlanPreviewHandle {
  print: () => void;
}

export const PlanPreview = forwardRef<PlanPreviewHandle, PlanPreviewProps>(({ htmlContent }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    print: () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
      }
    }
  }));

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden border border-gray-200">
      <iframe
        ref={iframeRef}
        title="Travel Plan Preview"
        className="w-full h-full"
        sandbox="allow-scripts allow-popups allow-same-origin allow-modals"
      />
    </div>
  );
});

PlanPreview.displayName = 'PlanPreview';