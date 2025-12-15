import React, { useState, useEffect } from 'react'
import supabase from '../../../../../../../../api/supaBase'
import { useNotification } from '../../../../../../../../contexts/NotificationContext'
import Modal from '../../../../../../../common/Modal/Modal'

const ProveedoresManager = ({ projectId }) => {
    const { showToast } = useNotification()
    const [proveedores, setProveedores] = useState([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
        tiporif: 'J-',
        rif: '',
        direccion: ''
    })

    const tiposRif = ['J-', 'V-', 'E-', 'P-', 'G-', 'N/A']

    const fetchProveedores = async () => {
        if (!projectId) return
        setLoading(true)
        
     
        let { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .eq('projectid', projectId)
            .order('nombre')

        if (error) {
            console.warn('Error fetching proveedores with projectid:', error)
            
            // Si falla, intentar con 'projectId' (camelCase)
            const { data: dataCamel, error: errorCamel } = await supabase
                .from('proveedores')
                .select('*')
                .eq('projectId', projectId)
                .order('nombre')
            
            if (errorCamel) {
                console.error('Error fetching proveedores (both formats):', errorCamel)
                showToast(`Error al cargar proveedores: ${errorCamel.message || JSON.stringify(errorCamel)}`, 'error')
            } else {
                setProveedores(dataCamel)
            }
        } else {
            setProveedores(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProveedores()
    }, [projectId])

    const handleEdit = (item) => {
        setEditingItem(item)
        setFormData({
            nombre: item.nombre,
            tiporif: item.tiporif,
            rif: item.rif,
            direccion: item.direccion || ''
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este proveedor? Esta acción no se puede deshacer.')) {
            const { error } = await supabase
                .from('proveedores')
                .delete()
                .eq('id', id)

            if (error) {
                showToast('Error al eliminar: ' + error.message, 'error')
            } else {
                showToast('Proveedor eliminado', 'success')
                fetchProveedores()
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.nombre.trim()) return

        try {
            if (editingItem) {
                if (window.confirm('¿Desea guardar los cambios para este proveedor?')) {
                    // Check for duplicates (excluding current item)
                    if (formData.tiporif !== 'N/A') {
                        const { data: existing } = await supabase
                            .from('proveedores')
                            .select('id')
                            .eq('projectid', projectId)
                            .eq('tiporif', formData.tiporif)
                            .eq('rif', formData.rif)
                            .neq('id', editingItem.id)

                        if (existing && existing.length > 0) {
                            showToast('Ya existe otro proveedor con este RIF.', 'error')
                            return
                        }
                    }

                    const { error } = await supabase
                        .from('proveedores')
                        .update({
                            nombre: formData.nombre,
                            tiporif: formData.tiporif,
                            rif: formData.rif,
                            direccion: formData.direccion,
                            updatedat: new Date().toISOString()
                        })
                        .eq('id', editingItem.id)

                    if (error) throw error
                    showToast('Proveedor actualizado', 'success')
                } else {
                    return;
                }
            }
            // Note: Creation is usually done via the Invoice/Purchase forms, but we could allow it here too if needed.
            // For now, the requirement specifically mentioned "modificar". I'll leave creation out to avoid confusion unless requested, 
            // or I can add it. The prompt said "Proveedores: igual que las anteriores solo que su ventana modal tendra para modificar...".
            // It implies management, so maybe creation too? But usually providers are created on the fly.
            // I will stick to Edit/Delete as explicitly requested "modificar Nombre, tipo rif, rif y direccion".

            setIsModalOpen(false)
            setEditingItem(null)
            fetchProveedores()
        } catch (error) {
            showToast('Error: ' + error.message, 'error')
        }
    }

    return (
        <div className="manager-container">
            <div className="manager-header">
                <h3>Gestión de Proveedores</h3>
                {/* <button className="btn-add" onClick={() => {
          setEditingItem(null)
          setFormData({ nombre: '', tiporif: 'J-', rif: '', direccion: '' })
          setIsModalOpen(true)
        }}>
          + Nuevo Proveedor
        </button> */}
                {/* Commented out creation as per specific request focus on modification */}
            </div>

            <div className="items-list">
                {loading ? <p>Cargando...</p> : proveedores.map(prov => (
                    <div key={prov.id} className="list-item">
                        <div style={{ flex: 1 }}>
                            <strong>{prov.nombre}</strong>
                            <br />
                            <small>{prov.tiporif}{prov.rif}</small>
                        </div>
                        <div className="item-actions">
                            <button className="btn-edit" onClick={() => handleEdit(prov)}>Editar</button>
                            <button className="btn-delete" onClick={() => handleDelete(prov.id)}>Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Editar Proveedor"
            >
                <form onSubmit={handleSubmit}>
                    <div className="config-form-group">
                        <label>Nombre / Razón Social</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>

                    <div className="config-form-group">
                        <label>RIF</label>
                        <div className="rif-group">
                            <select
                                className="rif-type"
                                value={formData.tiporif}
                                onChange={(e) => setFormData({ ...formData, tiporif: e.target.value })}
                            >
                                {tiposRif.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input
                                type="text"
                                value={formData.rif}
                                onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                                placeholder="Número de RIF"
                            />
                        </div>
                    </div>

                    <div className="config-form-group">
                        <label>Dirección</label>
                        <input
                            type="text"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-save">Guardar</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default ProveedoresManager
