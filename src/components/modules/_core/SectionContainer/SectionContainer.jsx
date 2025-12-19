import './SectionContainer.css'

const SectionContainer = ({ title, children, className = '' }) => {
  return (
    <div className={`section-container ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}

export default SectionContainer