import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BarcodeScanner() {
  const [barcode, setBarcode] = useState('');
  const [scanned, setScanned] = useState(false);
  const navigate = useNavigate();

  const handleScan = (e) => {
    e.preventDefault();
    setScanned(true);
  };

  const handleGoToTrack = () => {
    navigate('/track');
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 500 }}>
      <div className="card shadow-sm p-4 mb-4">
        <h1 className="h4 mb-4 fw-bold">Barcode Scanner</h1>
        <form onSubmit={handleScan} className="mb-4">
          <div className="mb-3">
            <label className="form-label">Scan or Enter Barcode</label>
            <input
              type="text"
              className="form-control"
              placeholder="Scan barcode or enter code manually..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">Scan</button>
          </div>
        </form>
        <div className="card p-3 shadow-sm mb-4 bg-light border-info border-2">
          <h5 className="mb-3">Webcam Scanner (Coming Soon)</h5>
          <div className="text-secondary">Webcam barcode scanning will be available here.</div>
        </div>
        {scanned && (
          <div className="alert alert-success d-flex align-items-center justify-content-between" role="alert">
            <span>Scanned Barcode: <b>{barcode}</b></span>
            <button className="btn btn-outline-success btn-sm ms-3" onClick={handleGoToTrack}>Go to Track Page</button>
          </div>
        )}
      </div>
    </div>
  );
} 