import './GestionRutasPermisos.css';
import supabase from '../../../../../api/supaBase';
import { useEffect, useState } from 'react';
import { EditIcon, DelateIcon } from '../../../../../assets/icons/Icons';
export default function GestionRutasPermisos() {
    const[usuarios, setUsuarios] = useState([]);
    const[error, setError] = useState(null);
    const[loading, setLoading] = useState(true);

    
    useEffect(() => {
        const fetchUsuarios = async () => {
            const {data, error} = await supabase.from("users").select("*");
            if(error){
                setError(error);
            }else{
                setUsuarios(data);
            }
            setLoading(false);
        }
        fetchUsuarios();
    }, []); 

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
    return (
        <section className="container-routes-permissions">
            <h1>Gestion de Rutas y Permisos</h1>
            <table className="container-routes-permissions__content">
                <thead>
                    <tr>
                        <th>
                            Usuario
                        </th>
                        <th>Estado</th>
                        <th>Ultima Conexion</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody> 

                {
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
                         <td>{usuario.status || "No encontrado"}</td>
                         <td>{usuario.last_login || "No encontrado"}</td>
                         <td>
                            <button>
                                <EditIcon />
                            </button>
                            <button>
                                <DelateIcon />
                            </button>
                         </td>
                     </tr>
                 ))
                }
                </tbody>
            </table>
        </section>
    );
}