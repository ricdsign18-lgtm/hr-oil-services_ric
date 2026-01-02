import './GestionRutasPermisos.css';
import supabase from '../../../../../api/supaBase';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { ROLES } from '../../../../../config/permissions';
import { EditIcon, DelateIcon } from '../../../../../assets/icons/Icons';
export default function GestionRutasPermisos() {
    const { userData: currentUser } = useAuth();
    const[usuarios, setUsuarios] = useState([]);
    const[error, setError] = useState(null);
    const[loading, setLoading] = useState(true);

    
    useEffect(() => {
        const fetchUsuarios = async () => {
            if (!currentUser) return;

            setLoading(true);
            try {
                // Verificar nivel de acceso (Director/Admin ven todo, Jefes solo su equipo)
                // Usamos la config central ROLES.
                // Si nivel >= 100 -> Ve todo.
                // Si nivel < 100 pero >= 50 -> Ve asignados.
                
                const myRoleLevel = ROLES[currentUser.role]?.level || 0;
                const isAdmin = myRoleLevel >= 100;
                
                let query = supabase.from("users").select("*");

                if (!isAdmin) {
                    // Filtrar por tabla de asignaciones
                     const { data: assignments, error: assignmentError } = await supabase
                        .from("user_assignments")
                        .select("employee_id")
                        .eq("supervisor_id", currentUser.id);

                    if (assignmentError) throw assignmentError;

                    const employeeIds = assignments.map(a => a.employee_id);
                    
                    if (employeeIds.length === 0) {
                        setUsuarios([]);
                        setLoading(false);
                        return; // No tiene empleados
                    }

                    query = query.in('id', employeeIds);
                }

                const { data, error } = await query;

                if(error){
                    setError(error);
                }else{
                    setUsuarios(data);
                }

            } catch (err) {
                console.error("Error fetching users:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchUsuarios();
    }, [currentUser]); 

    const getInitials = (name) => {
    if (!name) return "?";
    // Si es un email, tomamos lo que está antes del @
    if (name.includes('@')) name = name.split('@')[0];
    
    return name
        .split(' ')                 // Divide por espacios
        .map(word => word[0])       // Toma la primera letra de cada palabra
        .slice(0, 2)                // Quédate solo con las 2 primeras
        .join('')                   // Únelas
        .toUpperCase();             // Conviértelas a mayúsculas
}
    /* handleDeleteUser eliminado porque se quitaron las acciones */

    return (
        <section className="container-routes-permissions">
            <h1>Gestión de Usuarios</h1>
            <table className="container-routes-permissions__content">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Última Conexión</th>
                    </tr>
                </thead>
                <tbody> 

                {
                 usuarios.length === 0 ? (
                    <tr>
                        <td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No hay usuarios asignados</td>
                    </tr>
                 ) : (
                 usuarios.map((usuario) => (
                     <tr key={usuario.id}>
                        <td>
                            <article className="user-content">
                                <div className='circle-user'>
                                     {getInitials(usuario.username)}
                                </div>
                                {usuario.username || "No encontrado"}
                            </article>
                         </td>
                         <td>
                             {ROLES[usuario.role]?.label || usuario.role}
                         </td>
                         <td>{usuario.status || "Activo"}</td>
                         <td style={{ textAlign: 'center' }}>
                             {usuario.last_login 
                               ? new Date(usuario.last_login).toLocaleString() 
                               : "Nunca"}
                         </td>
                     </tr>
                 ))
                 )}
                </tbody>
            </table>
        </section>
    );
}