import './ContentGrid.css'

const ContentGrid = ({ left, right, reverse = false }) => {
  return (
    <div className={`content-grid ${reverse ? 'reverse' : ''}`}>
      <div className="content-left">
        {left}
      </div>
      <div className="content-right">
        {right}
      </div>
    </div>
  )
}

export default ContentGrid