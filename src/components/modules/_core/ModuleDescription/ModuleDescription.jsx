import './ModuleDescription.css'

const ModuleDescription = ({ title, description, action }) => {
  return (
    <main className="module-description">
      <section className="module-header-row">
        <h2>{title}</h2>
        {action && <div className="module-action">{action}</div>}
      </section>
      <p>{description}</p>
    </main>
  )
}

export default ModuleDescription