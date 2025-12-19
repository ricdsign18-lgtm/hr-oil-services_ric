import { useAuth } from '../../../../contexts/AuthContext'
import './DocumentsList.css'

const DocumentsList = ({ documents, moduleId, onView, onDownload }) => {
  const { hasPermission } = useAuth()

  return (
    <div className="documents-list">
      {documents.map((doc, index) => (
        <div key={index} className="document-item">
          <div className="document-icon">📄</div>
          <div className="document-info">
            <div className="document-name">{doc.name}</div>
            <div className="document-meta">
              <span>{doc.type}</span>
              <span>{doc.size}</span>
              <span>{doc.date}</span>
            </div>
          </div>
          <div className="document-actions">
            <button 
              className="btn-outline"
              onClick={() => onView && onView(doc)}
            >
              Ver
            </button>
            {hasPermission(moduleId, 'write') && (
              <button 
                className="btn-outline"
                onClick={() => onDownload && onDownload(doc)}
              >
                Descargar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DocumentsList