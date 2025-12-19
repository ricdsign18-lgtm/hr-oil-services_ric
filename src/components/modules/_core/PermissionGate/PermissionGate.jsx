import { useAuth } from '../../../../contexts/AuthContext'

const PermissionGate = ({ 
  children, 
  module, 
  action = 'read', 
  fallback = null 
}) => {
  const { hasPermission } = useAuth()

  if (!hasPermission(module, action)) {
    return fallback
  }

  return children
}

export default PermissionGate