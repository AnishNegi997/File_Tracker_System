import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createFile } from '../services/dataService';
import Barcode from '../components/Barcode';

const departments = [
  'Administration',
  'Finance',
  'HR',
  'IT',
  'Procurement',
  'Legal',
];

const importanceLevels = [
  'Routine',
  'Important',
  'Critical',
  'Emergency'
];

export default function CreateFile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [importance, setImportance] = useState('Routine');
  const [isDigital, setIsDigital] = useState(false);
  const [file, setFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [generatedFileId, setGeneratedFileId] = useState('');
  const printRef = useRef();

  // Generate file ID for display
  const generateFileId = () => {
    const currentYear = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `THDC-F-${currentYear}-${timestamp}`;
  };

  // Update file ID when component mounts
  React.useEffect(() => {
    setGeneratedFileId(generateFileId());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a file title');
      return;
    }

    // Map UI importance labels to backend priority values
    const priorityMap = {
      Routine: 'Normal',
      Emergency: 'Urgent',
      Important: 'Important',
      Critical: 'Critical'
    };
    const mappedPriority = priorityMap[importance] || 'Normal';

    const fileData = {
      title: title.trim(),
      department,
      priority: mappedPriority, // backend expects: Normal | Urgent | Important | Critical
      importance, // keep UI label for display/history if needed
      isDigital,
      createdBy: user?.name || 'Unknown User',
      remarks: remarks.trim() || 'File created',
      uploadedFile: file
    };

    try {
      const newFile = await createFile(fileData);
      console.log('File created successfully:', newFile);
      setSuccess(true);
      
      // Redirect to My Files after 2 seconds
      setTimeout(() => {
        navigate('/my-files');
      }, 2000);
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Error creating file: ' + error.message);
    }
  };

  const handlePrint = (e) => {
    e.preventDefault();
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const resetForm = () => {
    setTitle('');
    setDepartment(departments[0]);
    setImportance('Routine');
    setIsDigital(false);
    setFile(null);
    setRemarks('');
    setGeneratedFileId(generateFileId());
  };

  const getImportanceColor = (level) => {
    switch (level) {
      case 'Routine': return 'secondary';
      case 'Important': return 'primary';
      case 'Critical': return 'warning';
      case 'Emergency': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="d-flex align-items-center">
          <button className="btn btn-secondary me-3" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div>
            <h1 className="page-title">Create New File</h1>
            <p className="page-subtitle">Create a new file for tracking</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="content-card">
          <div className="content-card-body">
            <div className="alert alert-success">
              File created successfully! Redirecting to My Files...
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* File Creation Form */}
        <div className="col-8">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="card-title">File Details</h3>
            </div>
            <div className="content-card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">File Title *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Enter file title"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select 
                        className="form-select" 
                        value={department} 
                        onChange={e => setDepartment(e.target.value)} 
                        required
                      >
                        {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Importance Level</label>
                      <select 
                        className="form-select" 
                        value={importance} 
                        onChange={e => setImportance(e.target.value)}
                      >
                        {importanceLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      <div className="text-muted fs-sm mt-1">
                        {importance === 'Routine' && 'Standard files, no time pressure'}
                        {importance === 'Important' && 'Needs attention but not critical'}
                        {importance === 'Critical' && 'High priority, requires immediate action'}
                        {importance === 'Emergency' && 'Urgent matters requiring immediate response'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">File Type</label>
                      <div className="d-flex gap-4">
                        <label className="d-flex align-items-center gap-2">
                          <input 
                            type="radio" 
                            name="fileType" 
                            checked={!isDigital} 
                            onChange={() => setIsDigital(false)}
                          />
                          Physical File
                        </label>
                        <label className="d-flex align-items-center gap-2">
                          <input 
                            type="radio" 
                            name="fileType" 
                            checked={isDigital} 
                            onChange={() => setIsDigital(true)}
                          />
                          Digital File
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isDigital && (
                  <div className="form-group">
                    <label className="form-label">Upload File (optional)</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      onChange={e => setFile(e.target.files[0])} 
                    />
                    {file && (
                      <div className="text-muted fs-sm mt-1">
                        Selected: {file.name}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Remarks (optional)</label>
                  <textarea 
                    className="form-control" 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Add any additional remarks"
                    rows={3}
                  />
                </div>
                
                <div className="d-flex gap-3 mt-4">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Reset Form
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create File
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* File Preview & Barcode */}
        <div className="col-4">
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="card-title">File Preview</h3>
            </div>
            <div className="content-card-body">
              <div className="text-center mb-4">
                <div className="barcode-container">
                  <Barcode value={generatedFileId} />
                </div>
                <div className="fw-bold text-primary mt-2">{generatedFileId}</div>
                <div className="mt-2">
                  <span className={`badge bg-${getImportanceColor(importance)}`}>
                    {importance}
                  </span>
                </div>
              </div>
              
              <div className="file-preview">
                <div className="preview-item">
                  <div className="preview-label">Title</div>
                  <div className="preview-value">{title || 'Enter file title'}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Department</div>
                  <div className="preview-value">{department}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Type</div>
                  <div className="preview-value">{isDigital ? 'Digital' : 'Physical'}</div>
                </div>
                <div className="preview-item">
                  <div className="preview-label">Created By</div>
                  <div className="preview-value">{user?.name || 'Unknown'}</div>
                </div>
              </div>
              
              <div className="mt-4">
                <button type="button" className="btn btn-outline-primary w-100" onClick={handlePrint}>
                  Print Barcode
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print area for barcode label */}
      {printMode && (
        <div ref={printRef} style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: '#fff', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div className="text-center">
            <Barcode value={generatedFileId} />
            <div className="fw-bold mt-2">{generatedFileId}</div>
            <div className="mt-1">
              <span className={`badge bg-${getImportanceColor(importance)}`}>
                {importance}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .barcode-container {
          width: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
        }
        
        .barcode-container svg {
          max-width: 100%;
          height: auto;
        }
        
        .file-preview {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }
        
        .preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-light);
        }
        
        .preview-item:last-child {
          border-bottom: none;
        }
        
        .preview-label {
          font-weight: 500;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .preview-value {
          font-weight: 600;
          color: var(--text-primary);
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }
        
        @media (max-width: 768px) {
          .barcode-container svg {
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
} 