import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Barcode from '../components/Barcode';
import { getFileForwards } from '../services/dataService';
import { movementsAPI } from '../services/apiService';

export default function FileDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file;
  const forwards = file ? getFileForwards(file.code) : [];
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    const fetchMovements = async () => {
      if (file?.code || file?.fileId) {
        try {
          setLoadingMovements(true);
          const fileCode = file.code || file.fileId;
          const response = await movementsAPI.getByFileId(fileCode);
          if (response.success) {
            setMovements(response.data || []);
          }
        } catch (error) {
          console.error('Error fetching movements:', error);
          setMovements([]);
        } finally {
          setLoadingMovements(false);
        }
      }
    };

    fetchMovements();
  }, [file]);

  if (!file) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning mb-3">No file selected. Please go back and select a file.</div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="file-details-page-container">
      {/* Sticky Header */}
      <div className="file-details-header sticky-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary me-3 back-btn-spaced" onClick={() => navigate(-1)}>&larr; Back</button>
            <h1 className="h3 fw-bold mb-0">File Details</h1>
          </div>
          <div>
            <button 
              className="btn btn-primary me-2" 
              onClick={() => navigate('/send-forward', { state: { file } })}
            >
              📤 Send/Forward
            </button>
            <button className="btn btn-outline-secondary">Print</button>
          </div>
        </div>
      </div>
      <div className="main-content-with-header">
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="mb-3">Metadata</h5>
          <div className="row mb-3">
            <div className="col-md-6 metadata-row"><b>File Code:</b> {file.code || file.fileId || 'N/A'}</div>
            <div className="col-md-6 metadata-row"><b>Title:</b> {file.title || 'N/A'}</div>
            <div className="col-md-6 metadata-row"><b>Department:</b> {file.department || 'N/A'}</div>
            <div className="col-md-6 metadata-row"><b>Status:</b> 
              <span className={`badge ms-2 bg-${
                file.status === 'Released' ? 'success' : 
                file.status === 'On Hold' ? 'warning' : 
                file.status === 'Complete' ? 'info' : 
                file.status === 'Urgent' ? 'danger' : 'primary'
              }`}>
                {file.status || 'N/A'}
              </span>
            </div>
            <div className="col-md-6 metadata-row"><b>Current Holder:</b> {file.currentHolder || 'N/A'}</div>
            <div className="col-md-6 metadata-row"><b>Priority:</b> 
              <span className={`badge ms-2 bg-${
                file.priority === 'Critical' ? 'danger' : 
                file.priority === 'Urgent' ? 'warning' : 
                file.priority === 'Important' ? 'info' : 'secondary'
              }`}>
                {file.priority || 'N/A'}
              </span>
            </div>
            <div className="col-md-6 metadata-row"><b>Type:</b> 
              <span className="badge ms-2 bg-secondary">
                {file.type || 'N/A'}
              </span>
            </div>
            <div className="col-md-6 metadata-row"><b>Created By:</b> {file.createdBy || 'N/A'}</div>
            <div className="col-md-6 metadata-row"><b>Created At:</b> {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'N/A'}</div>
            {file.requisitioner && (
              <div className="col-md-6 metadata-row"><b>Requisitioner:</b> {file.requisitioner}</div>
            )}
            {file.datetime && (
              <div className="col-md-6 metadata-row"><b>Date/Time:</b> {file.datetime}</div>
            )}
            {file.remarks && (
              <div className="col-12 mt-2">
                <b>Remarks:</b> 
                <div className="mt-1 p-2 bg-light rounded border">
                  {file.remarks}
                </div>
              </div>
            )}
          </div>
          <div className="mb-3">
            <b>Barcode:</b>
            <div className="mt-2"><Barcode value={file.code || file.fileId || 'N/A'} /></div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
            <h5 className="mb-0">Movement History</h5>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={() => {
                setLoadingMovements(true);
                const fileCode = file.code || file.fileId;
                movementsAPI.getByFileId(fileCode).then(response => {
                  if (response.success) {
                    setMovements(response.data || []);
                  }
                }).catch(error => {
                  console.error('Error refreshing movements:', error);
                }).finally(() => {
                  setLoadingMovements(false);
                });
              }}
              disabled={loadingMovements}
            >
              {loadingMovements ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </span>
                  Loading...
                </>
              ) : (
                '🔄 Refresh'
              )}
            </button>
          </div>
          {loadingMovements ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Loading movement history...
            </div>
          ) : movements.length > 0 ? (
            <ul className="timeline list-unstyled ms-2">
              {movements.map((movement, idx) => (
                <li key={movement._id || idx} className="mb-3 position-relative ps-5">
                  <span className="position-absolute top-0 start-0 translate-middle p-2 bg-primary border border-light rounded-circle shadow-sm" style={{fontSize: 16}}>
                    {movement.icon || '📋'}
                  </span>
                  <div className="fw-bold mb-1">
                    {movement.action}
                    {movement.recipientName && <span> to <b>{movement.recipientName}</b></span>}
                    {movement.sentBy && <span> by <b>{movement.sentBy}</b></span>}
                  </div>
                  <div className="small text-secondary mb-1">
                    {movement.datetime && new Date(movement.datetime).toLocaleString()}
                  </div>
                  {movement.remarks && (
                    <div className="mb-1">
                      <span className="badge bg-info me-2">Remarks</span> 
                      <span>{movement.remarks}</span>
                    </div>
                  )}
                  {movement.sentThrough && (
                    <div className="small text-muted">
                      <span className="badge bg-secondary me-2">Method</span>
                      {movement.sentThrough}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-secondary py-3">No movement history yet.</div>
          )}

          {/* Forwarding History */}
          {forwards.length > 0 && (
            <>
              <h5 className="mt-4 mb-3">Forwarding History</h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Recipient</th>
                      <th>Sent By</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forwards.map((forward) => (
                      <tr key={forward.id}>
                        <td>{new Date(forward.datetime).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-info">{forward.action}</span>
                        </td>
                        <td>
                          <div><strong>{forward.recipientName}</strong></div>
                          <small className="text-muted">{forward.recipientDepartment}</small>
                        </td>
                        <td>{forward.sentBy}</td>
                        <td>
                          <span className="badge bg-secondary">{forward.sentThrough}</span>
                        </td>
                        <td>
                          <span className={`badge bg-${forward.status === 'Delivered' ? 'success' : forward.status === 'In Transit' ? 'warning' : 'secondary'}`}>
                            {forward.status}
                          </span>
                        </td>
                        <td>
                          {forward.trackingNumber && (
                            <small className="text-muted">{forward.trackingNumber}</small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <style jsx>{`
        .file-details-page-container {
          padding-left: 2.5rem;
          padding-right: 2.5rem;
        }
        @media (max-width: 768px) {
          .file-details-page-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #fff;
          padding-top: 1rem;
          padding-bottom: 1rem;
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
        }
        .main-content-with-header {
          margin-top: 1.5rem;
        }
        .back-btn-spaced {
          margin-left: 1.25rem;
        }
        @media (max-width: 768px) {
          .back-btn-spaced {
            margin-left: 0.5rem;
          }
        }
        .timeline {
          position: relative;
        }
        .timeline li {
          border-left: 2px solid #e9ecef;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .timeline li:last-child {
          border-left: none;
        }
        .timeline li .position-absolute {
          left: -0.5rem;
          background: #007bff !important;
          color: white;
          width: 1rem;
          height: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem !important;
        }
        .metadata-row {
          margin-bottom: 0.75rem;
        }
        .metadata-row b {
          color: #495057;
          font-weight: 600;
        }
        .badge {
          font-size: 0.75rem;
          padding: 0.375rem 0.75rem;
        }
      `}</style>
    </div>
  );
} 