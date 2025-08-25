'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
// Load Luckysheet CSS locally from npm package (no CDN dependency)
// Next.js allows CSS imports from node_modules in Client Components
// These imports rely on the package being installed; types may be missing but CSS loads fine
import 'luckysheet/dist/css/luckysheet.css';
import 'luckysheet/dist/plugins/css/pluginsCss.css';
import 'luckysheet/dist/plugins/plugins.css';
import './luckysheet-overrides.css';
// Luckysheet toolbar icon font
import 'luckysheet/dist/assets/iconfont/iconfont.css';
// Type shim for TS to accept dynamic import below
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type LuckysheetModule from 'luckysheet';

interface LuckysheetWrapperProps {
  data: string[][];
  sheetKey: string;
  onDataChange: (data: string[][]) => void;
  setRef: (ref: any) => void;
}

export default forwardRef<any, LuckysheetWrapperProps>(function LuckysheetWrapper(
  { data, sheetKey, onDataChange, setRef },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const luckysheetRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    getSheetData: () => {
      if (luckysheetRef.current && window.luckysheet) {
        try {
          return window.luckysheet.getAllSheets()[0]?.data || [];
        } catch (error) {
          console.error('Error getting sheet data:', error);
          return data;
        }
      }
      return data;
    },
  }));

  useEffect(() => {
    // Dynamically import Luckysheet from npm (no external network)
    const loadLuckysheet = async () => {
      try {
        // Ensure jQuery is available globally for Luckysheet plugins
        const jq: any = await import('jquery');
        (window as any).$ = jq.default ?? jq;
        (window as any).jQuery = jq.default ?? jq;
        // Load mousewheel plugin required by Luckysheet
        await import('jquery-mousewheel');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const mod: any = await import('luckysheet');
        // Some builds export under default, others as module object
        const ls = mod?.default ?? mod;
        if (!ls) throw new Error('Luckysheet module not found');
        (window as any).luckysheet = ls;
        // Load plugin bundle which augments window.luckysheet (requires jQuery)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await import('luckysheet/dist/plugins/js/plugin.js');
        initializeLuckysheet();
      } catch (error) {
        console.error('Error loading Luckysheet:', error);
      }
    };

    const initializeLuckysheet = () => {
      if (!containerRef.current || !window.luckysheet) return;

      try {
        // Guard against double-init (React Strict Mode) and repeated calls
        if (isInitializedRef.current) return;

        // Destroy previous instance if any and clear container DOM
        try {
          window.luckysheet.destroy();
        } catch {}
        try {
          containerRef.current.innerHTML = '';
        } catch {}

        // Convert to 2D matrix format expected by 'data' field
        const matrix = data.map(row => row.map(cell => ({ v: cell ?? '' })));

        const options = {
          container: containerRef.current.id,
          title: `${sheetKey} Leads`,
          lang: 'en',
          data: [{
            name: 'Sheet1',
            color: '',
            index: 0,
            status: 1,
            order: 0,
            hide: 0,
            row: Math.max(data.length, 100),
            column: Math.max(data[0]?.length || 7, 26),
            defaultRowHeight: 25,
            defaultColWidth: 100,
            data: matrix,
            config: {},
            scrollLeft: 0,
            scrollTop: 0,
            luckysheet_select_save: [],
          }],
          showinfobar: false,
          showsheetbar: false,
          showstatisticBar: false,
          enableAddRow: true,
          enableAddCol: true,
          userInfo: false,
          myFolderUrl: '',
          devicePixelRatio: window.devicePixelRatio || 1,
          functionButton: '',
          showformula: true,
          showsheetbarConfig: { add: false, menu: false, drag: false },
        };

        // Initialize Luckysheet
        window.luckysheet.create(options);
        luckysheetRef.current = window.luckysheet;
        isInitializedRef.current = true;

        // Set up event listeners
        if (window.luckysheet.event) {
          window.luckysheet.event.on('cellEditBefore', () => {
            // Trigger data change callback
            setTimeout(() => {
              const currentData = window.luckysheet.getAllSheets()[0]?.data || [];
              onDataChange(currentData);
            }, 100);
          });
        }

        // Store reference
        setRef({
          getSheetData: () => {
            try {
              return window.luckysheet.getAllSheets()[0]?.data || [];
            } catch (error) {
              console.error('Error getting sheet data:', error);
              return data;
            }
          },
        });

      } catch (error) {
        console.error('Error initializing Luckysheet:', error);
      }
    };

    loadLuckysheet();

    return () => {
      // Cleanup
      if (luckysheetRef.current && window.luckysheet) {
        try {
          window.luckysheet.destroy();
        } catch (error) {
          console.error('Error destroying Luckysheet:', error);
        }
      }
      // Remove any leftover toolbar/DOM nodes to prevent duplicates on remount
      try {
        const containerEl = containerRef.current;
        if (containerEl) {
          const toolbarEls = containerEl.querySelectorAll('.luckysheet-toolbar, .luckysheet-wa-editor, .luckysheet-grid-container, .luckysheet-outer-container');
          toolbarEls.forEach(el => el.parentElement?.removeChild(el));
          containerEl.innerHTML = '';
        }
      } catch {}
      isInitializedRef.current = false;
    };
  }, [sheetKey]);

  return (
    <div className="luckysheet-toolbar-wrap w-full">
      <div 
        id={`luckysheet-${sheetKey}`}
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
});

// Extend Window interface for Luckysheet
declare global {
  interface Window {
    luckysheet: any;
  }
}
