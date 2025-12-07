// src/contexts/PersonalContext.jsx
import React, { createContext, useContext, useEffect, useCallback, useMemo } from "react";
import supabase from "../api/supaBase";
import { useProjects } from "./ProjectContext";
import { useNotification } from "./NotificationContext";

const PersonalContext = createContext();

export const usePersonal = () => {
  const context = useContext(PersonalContext);
  if (!context) {
    throw new Error("usePersonal debe ser usado dentro de un PersonalProvider");
  }
  return context;
};

export const PersonalProvider = ({ children }) => {
  const { selectedProject } = useProjects();
  const { addNotification } = useNotification();

  // ========== EMPLEADOS ==========
  const getEmployeesByProject = useCallback(async (projectId = null) => {
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse) {
      console.log("⚠️ PersonalContext: projectId no definido");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("project_id", projectToUse)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformar datos de la base de datos al formato de la app
      const formattedData = data.map((emp) => ({
        id: emp.id,
        projectId: emp.project_id,
        nombre: emp.nombre,
        apellido: emp.apellido,
        cedula: emp.cedula,
        cargo: emp.cargo,
        tipoNomina: emp.tipo_nomina,
        tipoSalario: emp.tipo_salario,
        frecuenciaPago: emp.frecuencia_pago,
        montoSalario: parseFloat(emp.monto_salario),
        montoLey: parseFloat(emp.monto_ley),
        bonificacionEmpresa: parseFloat(emp.bonificacion_empresa),
        porcentajeIslr: parseFloat(emp.porcentaje_islr),
        fechaIngreso: emp.fecha_ingreso,
        montoBaseIvss: parseFloat(emp.monto_base_ivss),
        montoBaseParoForzoso: parseFloat(emp.monto_base_paro_forzoso),
        montoBaseFaov: parseFloat(emp.monto_base_faov),
        montoBaseIslr: parseFloat(emp.monto_base_islr),
        estado: emp.estado || "Activo",
        fechaInactivo: emp.fecha_inactivo,
        fechaReactivacion: emp.fecha_reactivacion,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
      }));

      console.log(
        `👥 PersonalContext: Empleados del proyecto ${projectToUse}:`,
        formattedData.length
      );
      return formattedData;
    } catch (error) {
      console.error("Error cargando empleados:", error);
      return [];
    }
  }, [selectedProject?.id]);

  const addEmployee = useCallback(async (employeeData) => {
    if (!employeeData.projectId) {
      throw new Error("Project ID es requerido");
    }

    console.log("➕ PersonalContext: Agregando nuevo empleado:", employeeData);

    try {
      const { data, error } = await supabase
        .from("employees")
        .insert([
          {
            project_id: employeeData.projectId,
            nombre: employeeData.nombre,
            apellido: employeeData.apellido,
            cedula: employeeData.cedula,
            cargo: employeeData.cargo,
            tipo_nomina: employeeData.tipoNomina,
            tipo_salario: employeeData.tipoSalario,
            frecuencia_pago: employeeData.frecuenciaPago,
            monto_salario: parseFloat(employeeData.montoSalario || 0),
            monto_ley: parseFloat(employeeData.montoLey || 0),
            bonificacion_empresa: parseFloat(
              employeeData.bonificacionEmpresa || 0
            ),
            porcentaje_islr: parseFloat(employeeData.porcentajeIslr || 0),
            fecha_ingreso: employeeData.fechaIngreso,
            monto_base_ivss: parseFloat(employeeData.montoBaseIvss || 0),
            monto_base_paro_forzoso: parseFloat(
              employeeData.montoBaseParoForzoso || 0
            ),
            monto_base_faov: parseFloat(employeeData.montoBaseFaov || 0),
            monto_base_islr: parseFloat(employeeData.montoBaseIslr || 0),

            estado: employeeData.estado || "Activo",
            fecha_inactivo: employeeData.fechaInactivo,
            fecha_reactivacion: employeeData.fechaReactivacion,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Transformar la respuesta
      const newEmployee = {
        id: data.id,
        projectId: data.project_id,
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        cargo: data.cargo,
        tipoNomina: data.tipo_nomina,
        tipoSalario: data.tipo_salario,
        frecuenciaPago: data.frecuencia_pago,
        montoSalario: parseFloat(data.monto_salario),
        montoLey: parseFloat(data.monto_ley),
        bonificacionEmpresa: parseFloat(data.bonificacion_empresa),
        porcentajeIslr: parseFloat(data.porcentaje_islr),
        fechaIngreso: data.fecha_ingreso,
        montoBaseIvss: parseFloat(data.monto_base_ivss),
        montoBaseParoForzoso: parseFloat(data.monto_base_paro_forzoso),
        montoBaseFaov: parseFloat(data.monto_base_faov),
        montoBaseIslr: parseFloat(data.monto_base_islr),

        estado: data.estado || "Activo",
        fechaInactivo: data.fecha_inactivo,
        fechaReactivacion: data.fecha_reactivacion,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log("✅ PersonalContext: Empleado agregado exitosamente");
      addNotification("Empleado agregado exitosamente", "success");
      return newEmployee;
    } catch (error) {
      console.error("Error agregando empleado:", error);
      addNotification("Error al agregar empleado", "error");
      throw error;
    }
  }, [addNotification]);

  const updateEmployee = useCallback(async (id, employeeData) => {
    console.log("✏️ PersonalContext: Actualizando empleado:", id, employeeData);

    try {
      const { data, error } = await supabase
        .from("employees")
        .update({
          nombre: employeeData.nombre,
          apellido: employeeData.apellido,
          cedula: employeeData.cedula,
          cargo: employeeData.cargo,
          tipo_nomina: employeeData.tipoNomina,
          tipo_salario: employeeData.tipoSalario,
          frecuencia_pago: employeeData.frecuenciaPago,
          monto_salario: parseFloat(employeeData.montoSalario || 0),
          monto_ley: parseFloat(employeeData.montoLey || 0),
          bonificacion_empresa: parseFloat(
            employeeData.bonificacionEmpresa || 0
          ),
          porcentaje_islr: parseFloat(employeeData.porcentajeIslr || 0),
          fecha_ingreso: employeeData.fechaIngreso,
          monto_base_ivss: parseFloat(employeeData.montoBaseIvss || 0),
          monto_base_paro_forzoso: parseFloat(
            employeeData.montoBaseParoForzoso || 0
          ),
          monto_base_faov: parseFloat(employeeData.montoBaseFaov || 0),

          monto_base_islr: parseFloat(employeeData.montoBaseIslr || 0),
          estado: employeeData.estado,
          fecha_inactivo: employeeData.fechaInactivo,
          fecha_reactivacion: employeeData.fechaReactivacion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Transformar la respuesta
      const updatedEmployee = {
        id: data.id,
        projectId: data.project_id,
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        cargo: data.cargo,
        tipoNomina: data.tipo_nomina,
        tipoSalario: data.tipo_salario,
        frecuenciaPago: data.frecuencia_pago,
        montoSalario: parseFloat(data.monto_salario),
        montoLey: parseFloat(data.monto_ley),
        bonificacionEmpresa: parseFloat(data.bonificacion_empresa),
        porcentajeIslr: parseFloat(data.porcentaje_islr),
        fechaIngreso: data.fecha_ingreso,
        montoBaseIvss: parseFloat(data.monto_base_ivss),
        montoBaseParoForzoso: parseFloat(data.monto_base_paro_forzoso),
        montoBaseFaov: parseFloat(data.monto_base_faov),
        montoBaseIslr: parseFloat(data.monto_base_islr),

        estado: data.estado || "Activo",
        fechaInactivo: data.fecha_inactivo,
        fechaReactivacion: data.fecha_reactivacion,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log("✅ PersonalContext: Empleado actualizado exitosamente");
      addNotification("Empleado actualizado exitosamente", "success");
      return updatedEmployee;
    } catch (error) {
      console.error("Error actualizando empleado:", error);
      addNotification("Error al actualizar empleado", "error");
      throw error;
    }
  }, [addNotification]);

  const deleteEmployee = useCallback(async (id) => {
    console.log("🗑️ PersonalContext: Eliminando empleado:", id);

    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);

      if (error) throw error;

      console.log("✅ PersonalContext: Empleado eliminado exitosamente");
      addNotification("Empleado eliminado exitosamente", "delete");
      return true;
    } catch (error) {
      console.error("Error eliminando empleado:", error);
      addNotification("Error al eliminar empleado", "error");
      throw error;
    }
  }, [addNotification]);

  const getEmployeeById = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transformar datos
      return {
        id: data.id,
        projectId: data.project_id,
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        cargo: data.cargo,
        tipoNomina: data.tipo_nomina,
        tipoSalario: data.tipo_salario,
        frecuenciaPago: data.frecuencia_pago,
        montoSalario: parseFloat(data.monto_salario),
        montoLey: parseFloat(data.monto_ley),
        bonificacionEmpresa: parseFloat(data.bonificacion_empresa),
        porcentajeIslr: parseFloat(data.porcentaje_islr),
        fechaIngreso: data.fecha_ingreso,
        montoBaseIvss: parseFloat(data.monto_base_ivss),
        montoBaseParoForzoso: parseFloat(data.monto_base_paro_forzoso),
        montoBaseFaov: parseFloat(data.monto_base_faov),
        montoBaseIslr: parseFloat(data.monto_base_islr),

        estado: data.estado || "Activo",
        fechaInactivo: data.fecha_inactivo,
        fechaReactivacion: data.fecha_reactivacion,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Error cargando empleado:", error);
      return null;
    }
  }, []);

  // ========== ASISTENCIAS ==========
  const saveAsistencia = useCallback(async (asistenciaData) => {
    if (!asistenciaData.projectId) {
      throw new Error("Project ID es requerido");
    }

    console.log(
      "📅 PersonalContext: Guardando asistencia:",
      asistenciaData.fecha
    );

    try {
      // 1. Crear o actualizar el registro de asistencia principal
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendances")
        .upsert(
          {
            project_id: asistenciaData.projectId,
            fecha: asistenciaData.fecha,
          },
          {
            onConflict: "project_id,fecha",
          }
        )
        .select()
        .single();

      if (attendanceError) throw attendanceError;

      // 2. Preparar registros individuales
      const records = asistenciaData.registros.map((registro) => ({
        attendance_id: attendance.id,
        employee_id: registro.empleadoId,
        nombre: registro.nombre, // Guardar nombre para fácil acceso
        cedula: registro.cedula, // Guardar cédula para fácil acceso
        cargo: registro.cargo, // Guardar cargo para fácil acceso
        asistio: registro.asistio,
        horas_trabajadas: parseFloat(registro.horasTrabajadas || 0),
        observaciones: registro.observaciones || "",
      }));

      // 3. Eliminar registros existentes para esta fecha
      const { error: deleteError } = await supabase
        .from("attendance_records")
        .delete()
        .eq("attendance_id", attendance.id);

      if (deleteError) throw deleteError;

      // 4. Insertar nuevos registros
      const { error: recordsError } = await supabase
        .from("attendance_records")
        .insert(records);

      if (recordsError) throw recordsError;

      console.log("✅ PersonalContext: Asistencia guardada exitosamente");
      addNotification("Asistencia guardada exitosamente", "success");
      return attendance;
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      addNotification("Error al guardar asistencia", "error");
      throw error;
    }
  }, [addNotification]);

  const getAsistenciaByFechaAndProject = useCallback(async (fecha, projectId = null) => {
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse || !fecha) return null;

    try {
      const { data, error } = await supabase
        .from("attendances")
        .select(`*, attendance_records(*)`)
        .eq("project_id", projectToUse)
        .eq("fecha", fecha)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!data) return null;

      // Transformar datos
      return {
        id: data.id,
        projectId: data.project_id,
        fecha: data.fecha,
        registros: data.attendance_records.map((record) => ({
          id: record.id,
          empleadoId: record.employee_id,
          nombre: record.nombre,
          cedula: record.cedula,
          cargo: record.cargo,
          asistio: record.asistio,
          horasTrabajadas: parseFloat(record.horas_trabajadas),
          observaciones: record.observaciones,
        })),
        timestamp: data.created_at,
      };
    } catch (error) {
      console.error("Error cargando asistencia:", error);
      return null;
    }
  }, [selectedProject?.id]);

  const getAsistenciasByProject = useCallback(async (projectId = null) => {
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse) return [];

    try {
      const { data, error } = await supabase
        .from("attendances")
        .select(`*, attendance_records(*)`)
        .eq("project_id", projectToUse)
        .order("fecha", { ascending: false });

      if (error) throw error;

      // Transformar datos
      const asistencias = data.map((attendance) => ({
        id: attendance.id,
        projectId: attendance.project_id,
        fecha: attendance.fecha,
        registros: attendance.attendance_records.map((record) => ({
          id: record.id,
          empleadoId: record.employee_id,
          nombre: record.nombre,
          cedula: record.cedula,
          cargo: record.cargo,
          asistio: record.asistio,
          horasTrabajadas: parseFloat(record.horas_trabajadas),
          observaciones: record.observaciones,
        })),
        timestamp: attendance.created_at,
      }));

      console.log(
        `📊 PersonalContext: Asistencias del proyecto ${projectToUse}:`,
        asistencias.length
      );
      return asistencias;
    } catch (error) {
      console.error("Error cargando asistencias:", error);
      return [];
    }
  }, [selectedProject?.id]);

  const deleteAsistencia = useCallback(async (id) => {
    console.log("🗑️ PersonalContext: Eliminando asistencia:", id);

    try {
      // Eliminar registros asociados primero (aunque cascade delete debería encargarse, es más seguro)
      const { error: recordsError } = await supabase
        .from("attendance_records")
        .delete()
        .eq("attendance_id", id);

      if (recordsError) throw recordsError;

      // Eliminar el registro principal
      const { error } = await supabase
        .from("attendances")
        .delete()
        .eq("id", id);

      if (error) throw error;

      console.log("✅ PersonalContext: Asistencia eliminada exitosamente");
      addNotification("Asistencia eliminada exitosamente", "delete");
      return true;
    } catch (error) {
      console.error("Error eliminando asistencia:", error);
      addNotification("Error al eliminar asistencia", "error");
      throw error;
    }
  }, [addNotification]);

  // ========== PAGOS ==========
  const savePagos = useCallback(async (paymentData) => {
    if (!paymentData.projectId) {
      throw new Error("Project ID es requerido");
    }

    console.log("💰 PersonalContext: Guardando pagos:", paymentData.fechaPago);

    try {
      // 1. Crear el registro principal del pago
      const { data: payrollPayment, error: paymentError } = await supabase
        .from("payroll_payments")
        .insert([
          {
            project_id: paymentData.projectId,
            fecha_pago: paymentData.fechaPago,
            tasa_cambio: parseFloat(paymentData.tasaCambio),
          },
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Guardar los detalles de cada pago
      const paymentDetails = paymentData.pagos.map((pago) => ({
        payroll_payment_id: payrollPayment.id,
        employee_id: pago.empleado.id,
        dias_trabajados: pago.diasTrabajados,
        cargo: pago.empleado.cargo,
        monto_diario_calculado: parseFloat(pago.montoDiarioCalculado || 0),
        salario_base: parseFloat(pago.salarioBase || 0),
        horas_extras_diurna: parseFloat(pago.horasExtras.diurna || 0),
        horas_extras_nocturna: parseFloat(pago.horasExtras.nocturna || 0),
        total_horas_extras_usd: parseFloat(pago.totalHorasExtrasUSD || 0),
        deducciones_manuales_usd: parseFloat(pago.deduccionesManualesUSD || 0),
        subtotal_usd: parseFloat(pago.subtotalUSD || 0),
        subtotal_bs: parseFloat(pago.subtotalBs || 0),
        deducciones_ley_bs: parseFloat(pago.deduccionesLeyBs || 0),
        desglose_deducciones_ley: pago.desgloseDeduccionesLey || {},
        monto_extra_bs: parseFloat(pago.montoExtraBs || 0),
        monto_extra_usd: parseFloat(pago.montoExtraUSD || 0),
        monto_total_usd: parseFloat(pago.montoTotalUSD || 0),
        total_pagar_bs: parseFloat(pago.totalPagarBs || 0),
        banco_pago: pago.bancoPago || "",
        observaciones: pago.observaciones || "",
      }));

      const { error: detailsError } = await supabase
        .from("payment_details")
        .insert(paymentDetails);

      if (detailsError) throw detailsError;

      console.log("✅ PersonalContext: Pagos guardados exitosamente");
      return payrollPayment;
    } catch (error) {
      console.error("Error guardando pagos:", error);
      throw error;
    }
  }, []);

  const getPagosByProject = useCallback(async (projectId = null) => {
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse) return [];

    try {
      const { data, error } = await supabase
        .from("payroll_payments")
        .select(`*,
          payment_details (*,
            employees (*)
          )`)
        .eq("project_id", projectToUse)
        .order("fecha_pago", { ascending: false });

      if (error) throw error;

      // Transformar datos
      const pagos = data.map((payment) => ({
        id: payment.id,
        projectId: payment.project_id,
        fechaPago: payment.fecha_pago,
        tasaCambio: parseFloat(payment.tasa_cambio),
        pagos: payment.payment_details.map((detail) => ({
          id: detail.id,
          empleado: {
            id: detail.employees.id,
            nombre: detail.employees.nombre,
            apellido: detail.employees.apellido,
            cedula: detail.employees.cedula,
            cargo: detail.employees.cargo,
            tipoNomina: detail.employees.tipo_nomina,
            tipoSalario: detail.employees.tipo_salario,
            frecuenciaPago: detail.employees.frecuencia_pago,
          },
          diasTrabajados: detail.dias_trabajados,
          montoDiarioCalculado: parseFloat(detail.monto_diario_calculado),
          salarioBase: parseFloat(detail.salario_base),
          horasExtras: {
            diurna: parseFloat(detail.horas_extras_diurna),
            nocturna: parseFloat(detail.horas_extras_nocturna),
          },
          totalHorasExtrasUSD: parseFloat(detail.total_horas_extras_usd),
          deduccionesManualesUSD: parseFloat(detail.deducciones_manuales_usd),
          subtotalUSD: parseFloat(detail.subtotal_usd),
          subtotalBs: parseFloat(detail.subtotal_bs),
          deduccionesLeyBs: parseFloat(detail.deducciones_ley_bs),
          desgloseDeduccionesLey: detail.desglose_deducciones_ley,
          montoExtraBs: parseFloat(detail.monto_extra_bs || 0),
          montoExtraUSD: parseFloat(detail.monto_extra_usd || 0),
          montoTotalUSD: parseFloat(detail.monto_total_usd || 0),
          totalPagarBs: parseFloat(detail.total_pagar_bs),
          bancoPago: detail.banco_pago,
          observaciones: detail.observaciones,
        })),
        timestamp: payment.createdAt,
      }));

      console.log(
        `💰 PersonalContext: Pagos del proyecto ${projectToUse}:`,
        pagos.length
      );
      return pagos;
    } catch (error) {
      console.error("Error cargando pagos:", error);
      return [];
    }
  }, [selectedProject?.id]);

  const getPagoById = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from("payroll_payments")
        .select(`*,
          payment_details (*,
            employees (*)
          )`)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transformar datos
      return {
        id: data.id,
        projectId: data.project_id,
        fechaPago: data.fecha_pago,
        tasaCambio: parseFloat(data.tasa_cambio),
        pagos: data.payment_details.map((detail) => ({
          id: detail.id,
          empleado: {
            id: detail.employees.id,
            nombre: detail.employees.nombre,
            apellido: detail.employees.apellido,
            cedula: detail.employees.cedula,
            cargo: detail.employees.cargo,
            tipoNomina: detail.employees.tipo_nomina,
            tipoSalario: detail.employees.tipo_salario,
            frecuenciaPago: detail.employees.frecuencia_pago,
          },
          diasTrabajados: detail.dias_trabajados,
          salarioBase: parseFloat(detail.salario_base),
          horasExtras: {
            diurna: parseFloat(detail.horas_extras_diurna),
            nocturna: parseFloat(detail.horas_extras_nocturna),
          },
          totalHorasExtrasUSD: parseFloat(detail.total_horas_extras_usd),
          deduccionesManualesUSD: parseFloat(detail.deducciones_manuales_usd),
          subtotalUSD: parseFloat(detail.subtotal_usd),
          subtotalBs: parseFloat(detail.subtotal_bs),
          deduccionesLeyBs: parseFloat(detail.deducciones_ley_bs),
          desgloseDeduccionesLey: detail.desglose_deducciones_ley,
          montoExtraBs: parseFloat(detail.monto_extra_bs || 0),
          totalPagarBs: parseFloat(detail.total_pagar_bs),
          bancoPago: detail.banco_pago,
          observaciones: detail.observaciones,
        })),
        timestamp: data.createdAt,
      };
    } catch (error) {
      console.error("Error cargando pago:", error);
      return null;
    }
  }, []);

  const deletePago = useCallback(async (id) => {
    console.log("🗑️ PersonalContext: Eliminando pago:", id);

    try {
      // Eliminar detalles de pago primero (aunque cascade delete debería encargarse)
      const { error: detailsError } = await supabase
        .from("payment_details")
        .delete()
        .eq("payroll_payment_id", id);

      if (detailsError) throw detailsError;

      // Eliminar el registro principal
      const { error } = await supabase
        .from("payroll_payments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      console.log("✅ PersonalContext: Pago eliminado exitosamente");
      addNotification("Pago eliminado exitosamente", "delete");
      return true;
    } catch (error) {
      console.error("Error eliminando pago:", error);
      addNotification("Error al eliminar pago", "error");
      throw error;
    }
  }, [addNotification]);

  // ========== BANCOS ==========
  const getBancos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bancos_empresa")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;

      return data.map((b) => b.nombre);
    } catch (error) {
      console.error("Error cargando bancos:", error);
      return [];
    }
  }, []);

  const addBanco = useCallback(async (nombre) => {
    try {
      const { data, error } = await supabase
        .from("bancos_empresa")
        .insert([{ nombre }])
        .select()
        .single();

      if (error) throw error;

      console.log("✅ PersonalContext: Banco agregado exitosamente");
      return data.nombre;
    } catch (error) {
      console.error("Error agregando banco:", error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    // Empleados
    getEmployeesByProject,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,

    // Asistencias
    saveAsistencia,
    getAsistenciaByFechaAndProject,
    getAsistenciasByProject,
    deleteAsistencia,

    // Pagos
    savePagos,
    getPagosByProject,
    getPagoById,
    deletePago,

    // Bancos
    getBancos,
    addBanco,

  }), [
    getEmployeesByProject,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    saveAsistencia,
    getAsistenciaByFechaAndProject,
    getAsistenciasByProject,
    deleteAsistencia,
    savePagos,
    getPagosByProject,
    getPagoById,
    deletePago,
    getBancos,
    addBanco,
  ]);

  return (
    <PersonalContext.Provider value={value}>
      {children}
    </PersonalContext.Provider>
  );
};
