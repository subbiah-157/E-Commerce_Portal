import React, { useState } from 'react';

const InvoiceConverter = () => {
  const [bufferInput, setBufferInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');

  const handleConvert = () => {
    try {
      setError('');
      
      // Parse the buffer input
      const bufferData = JSON.parse(bufferInput);
      
      // Validate the buffer structure
      if (!bufferData.data || !Array.isArray(bufferData.data)) {
        throw new Error('Invalid buffer format. Expected {type: "Buffer", data: [...]}');
      }

      // Convert buffer array to Uint8Array
      const uint8Array = new Uint8Array(bufferData.data);
      
      // Create Blob from PDF data
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      
      // Create URL for the PDF
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
    } catch (err) {
      setError('Error converting buffer to PDF: ' + err.message);
      setPdfUrl('');
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'invoice.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setBufferInput('');
    setPdfUrl('');
    setError('');
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Invoice Converter</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="bufferInput" style={{ display: 'block', marginBottom: '8px' }}>
          Paste Invoice Buffer Data:
        </label>
        <textarea
          id="bufferInput"
          value={bufferInput}
          onChange={(e) => setBufferInput(e.target.value)}
          placeholder='Paste buffer data like: {"type":"Buffer","data":[37,80,68,70,...]}'
          rows={8}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleConvert}
          disabled={!bufferInput.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Convert to PDF
        </button>
        
        <button
          onClick={clearAll}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {pdfUrl && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download PDF
            </button>
          </div>

          <div>
            <h3>Invoice Preview:</h3>
            <iframe
              src={pdfUrl}
              title="Invoice Preview"
              width="100%"
              height="600px"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Support Team Instructions:</h4>
        <ol>
          <li>Paste the complete buffer data in the textarea above</li>
          <li>Click "Convert to PDF" to generate the PDF</li>
          <li>View the invoice directly in the preview window</li>
          <li>Use "Download PDF" to save the invoice file</li>
          <li>Share the downloaded PDF with relevant teams as needed</li>
        </ol>
      </div>
    </div>
  );
};

export default InvoiceConverter;