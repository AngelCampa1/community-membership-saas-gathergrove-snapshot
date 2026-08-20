"use client";

import { useEffect, useRef } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { logger } from '@/lib/logger';

interface GrapesJSEditorProps {
  initialHtml?: string;
  initialJson?: string;
  onChange?: (html: string, json: string) => void;
}

export default function GrapesJSEditor({ 
  initialHtml = '', 
  initialJson = '',
  onChange 
}: GrapesJSEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initEditor = async () => {
      if (!containerRef.current || editorRef.current) return;

      // Dynamically import GrapesJS to avoid SSR issues
      const grapesjs = (await import('grapesjs')).default;
      const newsletter = (await import('grapesjs-preset-newsletter')).default;

      // Initialize GrapesJS editor
      const editor = grapesjs.init({
        container: containerRef.current,
        height: '600px',
        width: 'auto',
        plugins: [newsletter],
        pluginsOpts: {
          newsletter: {
            modalTitleImport: 'Import template',
            // Customize the email preset
            blocks: ['text', 'image', 'button', 'divider', 'spacer'],
            // Add personalization tokens as snippets
            snippets: [
              {
                label: 'Member Name',
                content: '{{member_name}}',
                category: 'Personalization'
              },
              {
                label: 'Club Name',
                content: '{{club_name}}',
                category: 'Personalization'
              },
              {
                label: 'Upcoming Events',
                content: '{{upcoming_events}}',
                category: 'Personalization'
              }
            ]
          }
        },
        storageManager: false, // We'll handle storage manually
        canvas: {
          styles: [
            // Add email-safe CSS
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
          ]
        },
        deviceManager: {
          devices: [
            {
              id: 'desktop',
              name: 'Desktop',
              width: '100%',
            },
            {
              id: 'tablet',
              name: 'Tablet',
              width: '768px',
              widthMedia: '992px',
            },
            {
              id: 'mobile',
              name: 'Mobile',
              width: '320px',
              widthMedia: '480px',
            }
          ]
        },
        assetManager: {
          // Configure asset upload (can be extended with CDN integration)
          upload: false,
        }
      });

      // Load initial content
      if (initialJson) {
        try {
          const projectData = JSON.parse(initialJson);
          editor.loadProjectData(projectData);
        } catch (error) {
          logger.error('ui', 'Error loading GrapesJS JSON template', { error, hasInitialHtml: !!initialHtml });
          if (initialHtml) {
            editor.setComponents(initialHtml);
          }
        }
      } else if (initialHtml) {
        editor.setComponents(initialHtml);
      }

      // Listen for changes
      editor.on('update', () => {
        if (onChange) {
          const html = editor.getHtml();
          const css = editor.getCss();
          const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;
          
          const json = JSON.stringify(editor.getProjectData());
          onChange(fullHtml, json);
        }
      });

      editorRef.current = editor;
    };

    initEditor();

    // Cleanup
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="grapesjs-editor" />;
}
