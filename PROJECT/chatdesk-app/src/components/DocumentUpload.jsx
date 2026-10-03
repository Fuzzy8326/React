import { useState, useEffect } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function DocumentUpload({ clientId, conversationId, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId) return;

    const q = query(
      collection(db, 'documents'),
      where('clientId', '==', clientId),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDocuments(docs);
    });

    return unsubscribe;
  }, [clientId]);

  function handleFileChange(e) {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  }

  async function handleUpload() {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Simple size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const storageRef = ref(
        storage,
        `documents/${clientId}/${Date.now()}_${file.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(pct);
        },
        (err) => {
          console.error(err);
          setError('Upload failed: ' + err.message);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore (documents collection)
          await addDoc(collection(db, 'documents'), {
            clientId,
            clientName: userProfile.name,
            conversationId: conversationId || null,
            fileName: file.name,
            fileUrl: downloadURL,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: serverTimestamp()
          });

          setFile(null);
          setProgress(0);
          setUploading(false);
          // Reset file input
          document.getElementById('file-input').value = '';
        }
      );
    } catch (err) {
      console.error(err);
      setError('Upload error: ' + err.message);
      setUploading(false);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="document-upload">
      <div className="upload-header">
        <h2>Document Upload</h2>
        <button onClick={onClose} className="btn btn-outline btn-sm">
          Back to Chat
        </button>
      </div>

      <div className="upload-box">
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.xls,.xlsx"
        />
        {file && (
          <p className="selected-file">
            Selected: <strong>{file.name}</strong> ({formatSize(file.size)})
          </p>
        )}
        {error && <div className="error">{error}</div>}
        {uploading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn btn-primary"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      <div className="documents-list">
        <h3>Your Uploaded Documents</h3>
        {documents.length === 0 ? (
          <p className="muted">No documents uploaded yet.</p>
        ) : (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className="document-item">
                <div>
                  <strong>{doc.fileName}</strong>
                  <span className="doc-meta">
                    {formatSize(doc.fileSize)} •{' '}
                    {doc.uploadedAt?.toDate
                      ? doc.uploadedAt.toDate().toLocaleDateString()
                      : 'Just now'}
                  </span>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  View / Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
