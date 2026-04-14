

import React, { useMemo, useCallback } from 'react';
import JoditEditor from "jodit-react";

const JoditEdit = ({ initialContent = "", setInitialContent }) => {
  // Memoize editor configuration to prevent recreation
  const editorConfig = useMemo(() => ({
    readonly: false,
    toolbar: true,
    spellcheck: true,
    language: "en",
    toolbarButtonSize: "medium",
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: true,
    askBeforePasteFromWord: true,
    uploader: {
      insertImageAsBase64URI: true,
    },
    width: "100%",
    minHeight: 400,
    controls: {
      font: {
        command: "fontname",
        list: {
          "'Open Sans',sans-serif": "Open Sans",
          "Helvetica,sans-serif": "Helvetica",
          "Arial,Helvetica,sans-serif": "Arial",
          "Georgia,serif": "Georgia",
          "Impact,Charcoal,sans-serif": "Impact",
          "Tahoma,Geneva,sans-serif": "Tahoma",
          "'Times New Roman',Times,serif": "Times New Roman",
          "Verdana,Geneva,sans-serif": "Verdana",
          "Consolas,monaco,monospace": "Consolas",
        },
      },
    },
  }), []);

  // Memoize change handler
  const handleChange = useCallback((value) => {
    if (setInitialContent) {
      setInitialContent(value);
    }
  }, [setInitialContent]);

  // Memoize blur handler
  const handleBlur = useCallback((value, event) => {
    console.log('Editor blurred:');
  }, []);

  if (!setInitialContent) {
    console.warn('JoditEdit: setInitialContent prop is required');
    return null;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <JoditEditor
        value={initialContent}
        config={editorConfig}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default React.memo(JoditEdit);