// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/pagos-nomina/components/CalculadoraPagos.jsx
import React, { useState, useEffect } from "react";
import { useProjects } from "../../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./CalculadoraPagos.css";

const CalculadoraPagos = ({
  employees,
  asistencias,
  fechaPago,
  tasaCambio,
  onCalcular,
  selectedProject,
}) => {
  const { selectedProject: contextProject } = useProjects();
  const { showToast } = useNotification();
  const project = selectedProject || contextProject;

  const [horasExtras, setHorasExtras] = useState({});
  const [deduccionesManuales, setDeduccionesManuales] = useState({});
  const [adelantosSueldo, setAdelantosSueldo] = useState({});
  const [montoExtraBs, setMontoExtraBs] = useState({});
  const [diasPagoQuincenal, setDiasPagoQuincenal] = useState({});
  const [mitadPagoQuincenal, setMitadPagoQuincenal] = useState({});
  const [bancosPago, setBancosPago] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [pagosCalculados, setPagosCalculados] = useState([]);
  const [diasHabilesMes, setDiasHabilesMes] = useState(0);

  const [diasRealesMes, setDiasRealesMes] = useState(0);
  const [incluirQuincenal, setIncluirQuincenal] = useState(false);
  const [incluirSemanal, setIncluirSemanal] = useState(true);

  // Estado para bancos dinámicos
  // Estado para bancos dinámicos
  const [listaBancos, setListaBancos] = useState([]);
  const [showBancoModal, setShowBancoModal] = useState(false);
  const [nuevoBanco, setNuevoBanco] = useState("");
  const [empleadoBancoPending, setEmpleadoBancoPending] = useState(null);

  // Obtener funciones del contexto
  const { getBancos, addBanco } = usePersonal();

  // Cargar bancos al iniciar
  useEffect(() => {
    const cargarBancos = async () => {
      const bancos = await getBancos();
      setListaBancos(bancos);
    };
    cargarBancos();
  }, [getBancos]);

  const handleBancoChange = (empleadoId, valor) => {
    if (valor === "Otro") {
      setEmpleadoBancoPending(empleadoId);
      setNuevoBanco("");
      setShowBancoModal(true);
    } else {
      setBancosPago((prev) => ({
        ...prev,
        [empleadoId]: valor,
      }));
    }
  };

  const handleAddBanco = async () => {
    if (!nuevoBanco.trim()) {
      showToast("Por favor ingrese el nombre del banco", "warning");
      return;
    }

    if (listaBancos.includes(nuevoBanco.trim())) {
      showToast("Este banco ya existe en la lista", "warning");
      return;
    }

    try {
      const nuevoBancoTrimmed = nuevoBanco.trim();
      await addBanco(nuevoBancoTrimmed);

      // Actualizar lista local
      setListaBancos((prev) => [...prev, nuevoBancoTrimmed].sort());

      if (empleadoBancoPending) {
        setBancosPago((prev) => ({
          ...prev,
          [empleadoBancoPending]: nuevoBancoTrimmed,
        }));
      }

      setShowBancoModal(false);
      setEmpleadoBancoPending(null);
      setNuevoBanco("");
      showToast("Banco agregado exitosamente", "success");
    } catch (error) {
      console.error("Error al agregar banco:", error);
      showToast("Error al agregar el banco", "error");
    }
  };

  const handleCloseBancoModal = () => {
    setShowBancoModal(false);
    setEmpleadoBancoPending(null);
    setNuevoBanco("");
  };


  // CORRECCIÓN: Calcular días hábiles y días reales del mes automáticamente
  // Se basa en el LUNES de la semana de pago para determinar el mes
  useEffect(() => {
    if (fechaPago && !isNaN(new Date(fechaPago).getTime())) {
      const fechaPagoDate = new Date(fechaPago);
      const diaSemana = fechaPagoDate.getDay();

      // Calcular el lunes de la semana (si es domingo (0), restar 6; si es otro, restar diaSemana - 1)
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      const lunesSemana = new Date(fechaPagoDate);
      lunesSemana.setDate(fechaPagoDate.getDate() + diffLunes);

      console.log("Fecha Pago:", fechaPago, "Lunes Referencia:", lunesSemana.toISOString().split('T')[0]);

      // Usar el lunes como fecha de referencia para el mes
      const diasHabiles = calcularDiasHabilesMes(lunesSemana);
      const diasReales = new Date(
        lunesSemana.getFullYear(),
        lunesSemana.getMonth() + 1,
        0
      ).getDate();

      setDiasHabilesMes(diasHabiles);
      setDiasRealesMes(diasReales);
    }
  }, [fechaPago]);



  // Inicializar días de pago quincenal y mitad
  useEffect(() => {
    const initialDias = {};
    const initialMitad = {};
    const initialBancos = {};
    const initialObservaciones = {};
    const initialHorasExtras = {};
    const initialDeducciones = {};
    const initialAdelantos = {};
    const initialMontoExtra = {};

    employees.forEach((emp) => {
      if (emp.frecuenciaPago === "Quincenal") {
        initialDias[emp.id] = diasPagoQuincenal[emp.id] || 15;
        initialMitad[emp.id] = mitadPagoQuincenal[emp.id] || "primera";
      }
      initialBancos[emp.id] = bancosPago[emp.id] || "";
      initialObservaciones[emp.id] = observaciones[emp.id] || "";
      initialHorasExtras[emp.id] = horasExtras[emp.id] || {
        diurna: 0,
        nocturna: 0,
      };
      initialDeducciones[emp.id] = deduccionesManuales[emp.id] || 0;
      initialAdelantos[emp.id] = adelantosSueldo[emp.id] || 0;
      initialMontoExtra[emp.id] = montoExtraBs[emp.id] || 0;
    });
    setDiasPagoQuincenal((prev) => ({ ...prev, ...initialDias }));
    setMitadPagoQuincenal((prev) => ({ ...prev, ...initialMitad }));
    const newBancos = {};
    const newObservaciones = {};
    employees.forEach((emp) => {
      if (!bancosPago[emp.id]) {
        newBancos[emp.id] = "";
      }
      if (!observaciones[emp.id]) {
        newObservaciones[emp.id] = "";
      }
    });

    setBancosPago((prev) => ({ ...prev, ...newBancos }));
    setObservaciones((prev) => ({ ...prev, ...newObservaciones }));
    setHorasExtras((prev) => ({ ...prev, ...initialHorasExtras }));
    setDeduccionesManuales((prev) => ({ ...prev, ...initialDeducciones }));
    setAdelantosSueldo((prev) => ({ ...prev, ...initialAdelantos }));
    setMontoExtraBs((prev) => ({ ...prev, ...initialMontoExtra }));
  }, [employees, fechaPago]);

  // CORRECCIÓN: Función auxiliar para formatear fecha de forma segura
  const formatDateSafe = (date) => {
    if (!date || isNaN(new Date(date).getTime())) {
      return null;
    }
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // CORRECCIÓN PRINCIPAL: Calcular días hábiles del mes (excluyendo sábados y domingos)
  const calcularDiasHabilesMes = (fecha) => {
    if (!fecha || isNaN(new Date(fecha).getTime())) {
      console.error("Fecha inválida para calcular días hábiles:", fecha);
      return 22; // Valor por defecto razonable
    }

    try {
      const date = new Date(fecha);
      const year = date.getFullYear();
      const month = date.getMonth();

      // Primer día del mes
      const primerDiaMes = new Date(year, month, 1);
      // Último día del mes
      const ultimoDiaMes = new Date(year, month + 1, 0);

      let diasHabiles = 0;

      // Recorrer todos los días del mes
      for (
        let dia = new Date(primerDiaMes);
        dia <= ultimoDiaMes;
        dia.setDate(dia.getDate() + 1)
      ) {
        const diaSemana = dia.getDay();
        // Excluir sábados (6) y domingos (0)
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasHabiles++;
        }
      }

      console.log(`Mes ${month + 1}/${year}: ${diasHabiles} días hábiles`);
      return diasHabiles;
    } catch (error) {
      console.error("Error calculando días hábiles del mes:", error);
      return 22; // Valor por defecto
    }
  };

  // CORRECCIÓN: Calcular días trabajados basados en asistencia real para pagos semanales
  const calcularDiasTrabajados = (empleado, fechaPago) => {
    // Validar fecha de pago
    if (!fechaPago || isNaN(new Date(fechaPago).getTime())) {
      console.error("Fecha de pago inválida:", fechaPago);
      return 0;
    }

    const fechaPagoDate = new Date(fechaPago);

    if (empleado.frecuenciaPago === "Semanal") {
      // Calcular semana laboral (sábado a viernes)
      const inicioSemana = new Date(fechaPagoDate);
      const diaSemana = fechaPagoDate.getDay();

      // Ajustar al lunes de la semana del pago y luego retroceder al sábado anterior
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      inicioSemana.setDate(fechaPagoDate.getDate() + diffLunes - 2); // -2 para ir de lunes a sábado

      // Buscar asistencias de esta semana (sábado a viernes)
      let diasAsistidos = 0;
      for (let i = 0; i < 7; i++) {
        // 7 días desde el sábado
        const fechaDia = new Date(inicioSemana);
        fechaDia.setDate(inicioSemana.getDate() + i);
        const fechaStr = formatDateSafe(fechaDia);

        if (!fechaStr) continue;

        // Buscar asistencia de este día
        const asistenciaDia = asistencias.find(
          (a) => a.fecha === fechaStr && a.projectId === project?.id
        );

        if (asistenciaDia) {
          const registroEmpleado = asistenciaDia.registros.find(
            (r) => r.empleadoId === empleado.id
          );
          if (registroEmpleado && registroEmpleado.asistio) {
            diasAsistidos++;
          }
        }
      }

      return diasAsistidos;
    } else if (empleado.frecuenciaPago === "Quincenal") {
      return parseInt(diasPagoQuincenal[empleado.id] || 15);
    }

    return 0;
  };

  // CORRECCIÓN: Calcular lunes de una mitad específica del mes
  const calcularLunesPorMitad = (fecha, mitad) => {
    if (!fecha || isNaN(new Date(fecha).getTime())) {
      console.error("Fecha inválida para calcular lunes por mitad:", fecha);
      return 0;
    }

    try {
      const date = new Date(fecha);
      const year = date.getFullYear();
      const month = date.getMonth();

      let inicioMitad, finMitad;

      if (mitad === "primera") {
        inicioMitad = new Date(year, month, 1);
        finMitad = new Date(year, month, 15);
      } else {
        inicioMitad = new Date(year, month, 16);
        finMitad = new Date(year, month + 1, 0);
      }

      let lunes = 0;
      for (
        let day = new Date(inicioMitad);
        day <= finMitad;
        day.setDate(day.getDate() + 1)
      ) {
        if (day.getDay() === 1) {
          // Lunes
          lunes++;
        }
      }

      console.log(`Mitad ${mitad}: ${lunes} lunes`);
      return lunes;
    } catch (error) {
      console.error("Error calculando lunes por mitad:", error);
      return mitad === "primera" ? 2 : 2; // Valores por defecto razonables
    }
  };

  // CORRECCIÓN: Calcular días de una mitad específica del mes
  const calcularDiasPorMitad = (fecha, mitad) => {
    if (!fecha || isNaN(new Date(fecha).getTime())) {
      console.error("Fecha inválida para calcular días por mitad:", fecha);
      return 0;
    }

    try {
      const date = new Date(fecha);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (mitad === "primera") {
        return 15;
      } else {
        const ultimoDiaMes = new Date(year, month + 1, 0).getDate();
        return ultimoDiaMes - 15;
      }
    } catch (error) {
      console.error("Error calculando días por mitad:", error);
      return mitad === "primera" ? 15 : 15; // Valores por defecto
    }
  };

  // NUEVO: Calcular días a pagar para nómina quincenal basado en asistencia
  const calcularDiasQuincenalesSegunAsistencia = (empleado, mitad) => {
    if (!fechaPago || isNaN(new Date(fechaPago).getTime())) return 15;

    const date = new Date(fechaPago);
    const year = date.getFullYear();
    const month = date.getMonth();

    let inicioMitad, finMitad;
    let diasDefault = 15;

    if (mitad === "primera") {
      inicioMitad = new Date(year, month, 1);
      finMitad = new Date(year, month, 15);
      diasDefault = 15;
    } else {
      inicioMitad = new Date(year, month, 16);
      finMitad = new Date(year, month + 1, 0); // Último día del mes
      diasDefault = finMitad.getDate() - 15;
    }

    let diasAusentes = 0;

    // Iterar por cada día del rango
    for (let d = new Date(inicioMitad); d <= finMitad; d.setDate(d.getDate() + 1)) {
      const fechaStr = formatDateSafe(d);
      if (!fechaStr) continue;

      // Buscar asistencia para este día
      const asistenciaDia = asistencias.find(
        (a) => a.fecha === fechaStr && a.projectId === project?.id
      );

      if (asistenciaDia) {
        const registro = asistenciaDia.registros.find(r => r.empleadoId === empleado.id);
        // Si existe registro y asistio es false, contar como ausente
        if (registro && registro.asistio === false) {
          diasAusentes++;
        }
      }
    }

    return Math.max(0, diasDefault - diasAusentes);
  };

  // NUEVO: Efecto para actualizar días de pago quincenal cuando cambia la asistencia o fecha
  useEffect(() => {
    const newDias = { ...diasPagoQuincenal };
    let changed = false;

    employees.forEach(emp => {
      if (emp.frecuenciaPago === "Quincenal") {
        const mitad = mitadPagoQuincenal[emp.id] || "primera";
        const diasCalculados = calcularDiasQuincenalesSegunAsistencia(emp, mitad);

        // Actualizar si el valor calculado es diferente al actual
        // Nota: Esto sobrescribirá cambios manuales si la asistencia cambia, lo cual es deseado
        if (newDias[emp.id] !== diasCalculados) {
          newDias[emp.id] = diasCalculados;
          changed = true;
        }
      }
    });

    if (changed) {
      setDiasPagoQuincenal(newDias);
    }
  }, [asistencias, fechaPago, mitadPagoQuincenal, employees]);

  // CORRECCIÓN PRINCIPAL: Calcular monto diario diferenciando entre frecuencia semanal y quincenal
  const calcularMontoDiario = (empleado) => {
    // CORRECCIÓN: Incluir Administrativa en nóminas con ley
    if (["Administrativa", "Ejecucion"].includes(empleado.tipoNomina)) {
      const montoLey = parseFloat(empleado.montoLey || 0);
      const bonificacion = parseFloat(empleado.bonificacionEmpresa || 0);
      const totalMensual = montoLey + bonificacion;

      // CORRECCIÓN: Para nóminas con ley, diferenciar por frecuencia de pago
      if (empleado.frecuenciaPago === "Semanal") {
        // Pago semanal: dividir entre días hábiles del mes
        console.log(
          `Nómina ${empleado.tipoNomina
          } (Semanal): ${totalMensual} / ${diasHabilesMes} = ${totalMensual / diasHabilesMes
          }`
        );
        return totalMensual / diasHabilesMes;
      } else {
        // CORRECCIÓN: Pago quincenal: dividir entre días reales del mes
        console.log(
          `Nómina ${empleado.tipoNomina
          } (Quincenal): ${totalMensual} / ${diasRealesMes} = ${totalMensual / diasRealesMes
          }`
        );
        return totalMensual / diasRealesMes;
      }
    } else {
      const montoSalario = parseFloat(empleado.montoSalario || 0);
      switch (empleado.tipoSalario) {
        case "Diario":
          return montoSalario;
        case "Semanal":
          return montoSalario / 5; // 5 días laborales por semana
        case "Mensual":
          // CORRECCIÓN PRINCIPAL: Diferenciar por frecuencia de pago
          if (empleado.frecuenciaPago === "Semanal") {
            // Salario mensual con pago semanal: dividir entre días hábiles del mes
            console.log(
              `Salario mensual (Semanal): ${montoSalario} / ${diasHabilesMes} = ${montoSalario / diasHabilesMes
              }`
            );
            return montoSalario / diasHabilesMes;
          } else {
            // CORRECCIÓN: Salario mensual con pago quincenal: dividir entre días reales del mes
            console.log(
              `Salario mensual (Quincenal): ${montoSalario} / ${diasRealesMes} = ${montoSalario / diasRealesMes
              }`
            );
            return montoSalario / diasRealesMes;
          }
        default:
          return 0;
      }
    }
  };

  // Calcular valor hora
  const calcularValorHora = (empleado) => {
    const montoDiario = calcularMontoDiario(empleado);
    return montoDiario / 8;
  };

  // CORRECCIÓN PRINCIPAL: Calcular deducciones de ley para nóminas administrativas y ejecución
  const calcularDeduccionesLey = (
    empleado,
    montoLeyBs,
    diasTrabajados,
    mitadPago
  ) => {
    if (!["Administrativa", "Ejecucion"].includes(empleado.tipoNomina)) {
      return { total: 0, desglose: {} };
    }

    // Usar valores individuales del empleado
    const montoBaseIvss = parseFloat(empleado.montoBaseIvss || 0);
    const montoBaseParoForzoso = parseFloat(empleado.montoBaseParoForzoso || 0);
    const montoBaseFaov = parseFloat(empleado.montoBaseFaov || 0);
    const montoBaseIslr = parseFloat(empleado.montoBaseIslr || 0);
    const porcentajeIslrIndividual =
      parseFloat(empleado.porcentajeIslr || 0) / 100;

    // CORRECCIÓN: Calcular lunes específicos para la mitad del pago
    const lunesMitad = calcularLunesPorMitad(fechaPago, mitadPago);

    // CORRECCIÓN: Calcular días FAOV específicos para la mitad del pago
    const diasFAOV = calcularDiasPorMitad(fechaPago, mitadPago);
    console.log("diasFAOV", diasFAOV);
    // FÓRMULAS CORRECTAS ACTUALIZADAS:
    const ivss = montoBaseIvss * lunesMitad * 0.04;
    const paroForzoso = montoBaseParoForzoso * lunesMitad * 0.005;
    const faov = (montoBaseFaov / diasRealesMes) * diasFAOV * 0.01;

    // NUEVO FÓRMULA ISLR: (Monto base ISLR / 2) * Tasa * Porcentaje individual
    const islr =
      (montoBaseIslr / 2) *
      parseFloat(tasaCambio || 0) *
      porcentajeIslrIndividual;
    console.log(islr);
    const total = ivss + paroForzoso + faov + islr;

    console.log(`Deducciones para ${empleado.nombre}:`, {
      ivss,
      paroForzoso,
      faov,
      islr,
      lunesMitad,
      diasFAOV,
      montoBaseIvss,
      montoBaseParoForzoso,
      montoBaseFaov,
      montoBaseIslr,
      porcentajeIslrIndividual,
    });

    return {
      total,
      desglose: { ivss, paroForzoso, faov, islr },
    };
  };

  // Calcular pago para un empleado
  const calcularPagoEmpleado = (empleado) => {
    const diasTrabajados = calcularDiasTrabajados(empleado, fechaPago);
    const montoDiario = calcularMontoDiario(empleado);
    console.log(`Calculando para ${empleado.nombre}: montoDiario = ${montoDiario}`);
    const valorHora = calcularValorHora(empleado);
    const mitadPago =
      empleado.frecuenciaPago === "Quincenal"
        ? mitadPagoQuincenal[empleado.id] || "primera"
        : "primera";

    // Calcular salario base
    let salarioBase = montoDiario * diasTrabajados;

    // Calcular horas extras
    const horasExtrasEmpleado = horasExtras[empleado.id] || {
      diurna: 0,
      nocturna: 0,
    };
    const horasDiurna = parseFloat(horasExtrasEmpleado.diurna) || 0;
    const horasNocturna = parseFloat(horasExtrasEmpleado.nocturna) || 0;
    const valorHoraExtraDiurna = valorHora * 1.5;
    const valorHoraExtraNocturna = valorHoraExtraDiurna * 1.3;
    const totalHorasExtrasUSD =
      horasDiurna * valorHoraExtraDiurna +
      horasNocturna * valorHoraExtraNocturna;

    // Deducciones manuales en USD
    const deduccionesManualesUSD = parseFloat(
      deduccionesManuales[empleado.id] || 0
    );

    // Adelantos de sueldo en USD
    const adelantosUSD = parseFloat(adelantosSueldo[empleado.id] || 0);

    // Subtotal en USD (Total a Pagar antes de monto extra)
    // Se restan las deducciones y los adelantos
    const subtotalUSD =
      salarioBase + totalHorasExtrasUSD - deduccionesManualesUSD - adelantosUSD;

    // Convertir a Bs
    const subtotalBs = subtotalUSD * parseFloat(tasaCambio || 0);

    // CORRECCIÓN: Calcular deducciones de ley para nóminas administrativas y ejecución
    let montoLeyBs = 0;
    let deduccionesLeyBs = 0;
    let desgloseDeduccionesLey = {};

    if (["Administrativa", "Ejecucion"].includes(empleado.tipoNomina)) {
      // CORRECCIÓN: Para nóminas con ley, calcular monto ley proporcional según frecuencia
      let montoLeyDiario = 0;
      if (empleado.frecuenciaPago === "Semanal") {
        montoLeyDiario = parseFloat(empleado.montoLey || 0) / diasHabilesMes;
      } else {
        montoLeyDiario = parseFloat(empleado.montoLey || 0) / diasRealesMes;
      }
      montoLeyBs =
        montoLeyDiario * diasTrabajados * parseFloat(tasaCambio || 0);

      const deducciones = calcularDeduccionesLey(
        empleado,
        montoLeyBs,
        diasTrabajados,
        mitadPago
      );
      deduccionesLeyBs = deducciones.total;
      desgloseDeduccionesLey = deducciones.desglose;
    }

    // Monto extra en Bs y su conversión a USD
    const montoExtraEnBs = parseFloat(montoExtraBs[empleado.id] || 0);
    const montoExtraUSD = montoExtraEnBs / parseFloat(tasaCambio || 1);

    // Total a pagar en Bs (SIN incluir monto extra)
    const totalPagarBs = subtotalBs - deduccionesLeyBs;

    // Monto Total en USD (Total a Pagar USD + Monto Extra USD + Adelantos USD)
    // Los adelantos se suman aquí porque son parte del dinero que recibe el empleado (ya recibido)
    const montoTotalUSD = subtotalUSD + montoExtraUSD + adelantosUSD;

    return {
      empleado: {
        ...empleado,
        mitadPagoQuincenal: mitadPagoQuincenal[empleado.id] || "primera",
      },
      diasTrabajados,
      salarioBase,
      horasExtras: { diurna: horasDiurna, nocturna: horasNocturna },
      totalHorasExtrasUSD,
      totalHorasExtrasUSD,
      deduccionesManualesUSD,
      adelantosUSD,
      subtotalUSD,
      subtotalBs,
      deduccionesLeyBs,
      desgloseDeduccionesLey,
      montoExtraBs: montoExtraEnBs,
      montoExtraUSD: montoExtraUSD,
      montoTotalUSD: montoTotalUSD,
      totalPagarBs,
      montoLeyBs,
      valorHora,
      valorHoraExtraDiurna,
      valorHoraExtraNocturna,
      mitadPago: mitadPagoQuincenal[empleado.id] || "primera",
      bancoPago: bancosPago[empleado.id] || "",
      observaciones: observaciones[empleado.id] || "",
      // INFO ADICIONAL PARA DEBUG
      diasHabilesMes: diasHabilesMes,
      diasRealesMes: diasRealesMes,
      montoDiarioCalculado: montoDiario,
    };
  };

  const handleCalcular = () => {
    if (!tasaCambio || parseFloat(tasaCambio) <= 0) {
      showToast("Por favor ingrese una tasa de cambio válida", "warning");
      return;
    }

    if (!fechaPago) {
      showToast("Por favor seleccione una fecha de pago", "warning");
      return;
    }

    // Confirmación antes de proceder
    const confirmar = window.confirm(
      "¿Está seguro de que desea calcular y proceder a guardar los pagos?"
    );

    if (!confirmar) {
      return;
    }

    try {
      // Filtrar empleados según las reglas de visualización
      const empleadosACalcular = employees.filter(emp => {
        // Excluir inactivos
        if (emp.estado === "Inactivo") return false;

        // Excluir quincenales si no está marcado el check
        if (emp.frecuenciaPago === "Quincenal" && !incluirQuincenal) return false;

        // Excluir semanales si no está marcado el check
        if (emp.frecuenciaPago === "Semanal" && !incluirSemanal) return false;

        return true;
      });

      const pagos = empleadosACalcular.map((empleado) => calcularPagoEmpleado(empleado));
      setPagosCalculados(pagos);
      onCalcular(pagos);
    } catch (error) {
      console.error("Error calculando pagos:", error);
      showToast("Error al calcular pagos. Verifique la consola para más detalles.", "error");
    }
  };

  const handleHorasExtrasChange = (empleadoId, tipo, valor) => {
    setHorasExtras((prev) => ({
      ...prev,
      [empleadoId]: {
        ...prev[empleadoId],
        [tipo]: parseFloat(valor) || 0,
      },
    }));
  };

  const handleDeduccionManualChange = (empleadoId, valor) => {
    setDeduccionesManuales((prev) => ({
      ...prev,
      [empleadoId]: parseFloat(valor) || 0,
    }));
  };

  const handleAdelantoChange = (empleadoId, valor) => {
    setAdelantosSueldo((prev) => ({
      ...prev,
      [empleadoId]: parseFloat(valor) || 0,
    }));
  };

  const handleMontoExtraChange = (empleadoId, valor) => {
    setMontoExtraBs((prev) => ({
      ...prev,
      [empleadoId]: parseFloat(valor) || 0,
    }));
  };

  const handleDiasPagoChange = (empleadoId, valor) => {
    const dias = parseInt(valor) || 0;
    setDiasPagoQuincenal((prev) => ({
      ...prev,
      [empleadoId]: dias,
    }));

    if (dias <= 15) {
      setMitadPagoQuincenal((prev) => ({
        ...prev,
        [empleadoId]: "primera",
      }));
    } else {
      setMitadPagoQuincenal((prev) => ({
        ...prev,
        [empleadoId]: "segunda",
      }));
    }
  };

  const handleMitadPagoChange = (empleadoId, mitad) => {
    setMitadPagoQuincenal((prev) => ({
      ...prev,
      [empleadoId]: mitad,
    }));

    // CORRECCIÓN: Validar fecha antes de calcular días del mes
    if (!fechaPago || isNaN(new Date(fechaPago).getTime())) {
      console.error("Fecha inválida para calcular días del mes");
      return;
    }

    if (mitad === "primera") {
      setDiasPagoQuincenal((prev) => ({
        ...prev,
        [empleadoId]: 15,
      }));
    } else {
      setDiasPagoQuincenal((prev) => ({
        ...prev,
        [empleadoId]: diasRealesMes - 15,
      }));
    }
  };

  // Handlers para banco y observaciones


  const handleObservacionesChange = (empleadoId, obs) => {
    setObservaciones((prev) => ({
      ...prev,
      [empleadoId]: obs,
    }));
  };

  // Agrupar empleados por tipo de nómina y frecuencia
  const empleadosPorTipo = {
    operativaSemanal: incluirSemanal ? employees.filter(
      (e) => e.frecuenciaPago === "Semanal" && e.estado !== "Inactivo"
    ) : [],
    operativaEspecialQuincenal: incluirQuincenal ? employees.filter(
      (e) =>
        e.tipoNomina ===
        "Tecnica Operativa Administrativa – Trabajos Especiales" &&
        e.frecuenciaPago === "Quincenal" &&
        e.estado !== "Inactivo"
    ) : [],
    administrativaQuincenal: incluirQuincenal ? employees.filter(
      (e) =>
        (e.tipoNomina === "Administrativa" || e.tipoNomina === "Ejecucion") &&
        e.frecuenciaPago === "Quincenal" &&
        e.estado !== "Inactivo"
    ) : [],
  };

  // Obtener nombre del mes actual (basado en el lunes de la semana)
  const getNombreMesReferencia = () => {
    if (!fechaPago) return "";
    const fechaPagoDate = new Date(fechaPago.replace(/-/g, "/"));
    const diaSemana = fechaPagoDate.getDay();
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunesSemana = new Date(fechaPagoDate);
    lunesSemana.setDate(fechaPagoDate.getDate() + diffLunes);

    return lunesSemana.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  };

  const nombreMes = getNombreMesReferencia();

  return (
    <div className="calculadora-pagos">
      <div className="calculadora-header">
        <h3>
          Calculadora de Pagos -{" "}
          {fechaPago
            ? new Date(fechaPago.replace(/-/g, "/")).toLocaleDateString(
              "es-ES",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )
            : "Fecha no válida"}
        </h3>
        <div className="mes-info">
          <small>
            <strong>{nombreMes}:</strong> {diasRealesMes} días calendario -{" "}
            {diasHabilesMes} días hábiles
          </small>
          <br />

          <br />
          <small style={{ color: "#dc2626", fontWeight: "500" }}>
            📝 <strong>Pago Semanal:</strong> Salario mensual ÷ {diasHabilesMes}{" "}
            días hábiles | <strong>Pago Quincenal:</strong> Salario mensual ÷{" "}
            {diasRealesMes} días
          </small>
        </div>
      </div>

      {/* Toggle para incluir nómina quincenal y semanal */}
      <div className="toggles-container" style={{ margin: "1rem 0", display: "flex", gap: "1rem" }}>
        <div className="toggle-item" style={{ padding: "0.5rem", backgroundColor: "#f3f4f6", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="incluirSemanal"
            checked={incluirSemanal}
            onChange={(e) => setIncluirSemanal(e.target.checked)}
            style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }}
          />
          <label htmlFor="incluirSemanal" style={{ cursor: "pointer", fontWeight: "500", userSelect: "none" }}>
            Incluir Nómina Semanal
          </label>
        </div>

        <div className="toggle-item" style={{ padding: "0.5rem", backgroundColor: "#f3f4f6", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="incluirQuincenal"
            checked={incluirQuincenal}
            onChange={(e) => setIncluirQuincenal(e.target.checked)}
            style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }}
          />
          <label htmlFor="incluirQuincenal" style={{ cursor: "pointer", fontWeight: "500", userSelect: "none" }}>
            Incluir Nómina Quincenal
          </label>
        </div>
      </div>

      {/* Nómina Técnica Operativa (Semanal) */}
      {empleadosPorTipo.operativaSemanal.length > 0 && (
        <div className="nomina-section">

          <h4>
            Nómina Semanal (Técnica Operativa y Otros) - Días según asistencia
          </h4>
          <div className="info-adicional">
            <small>
              💡 <strong>Cálculo para pago semanal:</strong> Salario mensual ÷{" "}
              {diasHabilesMes} días hábiles = Monto diario
            </small>
          </div>
          <div className="employees-pagos-list semanal">
            <div className="list-header-pagos-nomina">
              <span>Empleado</span>
              <span>Días Asist.</span>
              <span>H. Extra D.</span>
              <span>H. Extra N.</span>
              <span>Deduc.($)</span>
              <span>Adel.($)</span>
              <span>Monto Extra (Bs)</span>
              <span>Banco</span>
              <span>Observaciones</span>
            </div>

            {empleadosPorTipo.operativaSemanal.map((empleado) => {
              const horasExtrasEmpleado = horasExtras[empleado.id] || {
                diurna: 0,
                nocturna: 0,
              };
              const deduccionManual = deduccionesManuales[empleado.id] || 0;
              const adelanto = adelantosSueldo[empleado.id] || 0;
              const montoExtra = montoExtraBs[empleado.id] || 0;
              const bancoPago = bancosPago[empleado.id] || "";
              const observacion = observaciones[empleado.id] || "";
              const diasTrabajados = calcularDiasTrabajados(
                empleado,
                fechaPago
              );
              const montoDiario = calcularMontoDiario(empleado);

              return (
                <div key={empleado.id} className="pago-row">
                  <div className="employee-info">
                    <div className="employee-name">
                      {empleado.nombre} {empleado.apellido}
                    </div>
                    <div className="employee-details">
                      <span>C.I. {empleado.cedula}</span>
                      <span>•</span>
                      <span>{empleado.cargo}</span>
                      <br />
                      <small
                        style={{
                          color: "#059669",
                          fontSize: "0.7rem",
                          fontWeight: "500",
                        }}
                      >
                        ${montoDiario.toFixed(2)}/día ($
                        {empleado.montoSalario || "0"} ÷ {diasHabilesMes})
                      </small>
                    </div>
                  </div>

                  <div className="dias-trabajados">{diasTrabajados}</div>

                  <div className="horas-extra-input">
                    <input
                      type="number"
                      value={horasExtrasEmpleado.diurna}
                      onChange={(e) =>
                        handleHorasExtrasChange(
                          empleado.id,
                          "diurna",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div className="horas-extra-input">
                    <input
                      type="number"
                      value={horasExtrasEmpleado.nocturna}
                      onChange={(e) =>
                        handleHorasExtrasChange(
                          empleado.id,
                          "nocturna",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div className="deduccion-manual-input">
                    <input
                      type="number"
                      value={deduccionManual}
                      onChange={(e) =>
                        handleDeduccionManualChange(empleado.id, e.target.value)
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="deduccion-manual-input">
                    <input
                      type="number"
                      value={adelanto}
                      onChange={(e) =>
                        handleAdelantoChange(empleado.id, e.target.value)
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="monto-extra-input">
                    <input
                      type="number"
                      value={montoExtra}
                      onChange={(e) =>
                        handleMontoExtraChange(empleado.id, e.target.value)
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="banco-input">
                    <select
                      value={bancoPago}
                      onChange={(e) =>
                        handleBancoChange(empleado.id, e.target.value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      <option value="FondoComun(BFC)">Fondo Comun(BFC)</option>
                      <option value="Banco de Venezuela">Banco de Venezuela</option>
                      <option value="Banplus">Banplus</option>
                      <option value="Banco Socios">Banco Socios</option>
                      <option value="Banco Plaza">Banco Plaza</option>
                      <option value="Banesco">Banesco</option>
                      <option value="Banco Nacional de Creditos (BNC)">Banco Nacional de Creditos (BNC)</option>
                      <option value="Mercantil">Mercantil</option>
                      <option value="Venezolano de Credito">Venezolano de Credito</option>
                      <option value="Banco Caroni">Banco Caroni</option>
                      <option value="Banco del Caribe">Banco del Caribe</option>

                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="observaciones-input">
                    <input
                      type="text"
                      value={observacion}
                      onChange={(e) =>
                        handleObservacionesChange(empleado.id, e.target.value)
                      }
                      placeholder="Observaciones..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nóminas Quincenales con configuración individual */}
      {[
        ...empleadosPorTipo.operativaEspecialQuincenal,
        ...empleadosPorTipo.administrativaQuincenal,
      ].length > 0 && (
          <div className="nomina-section">
            <h4>Nóminas Quincenales (Configuración Individual)</h4>
            <div className="info-adicional">
              <small>
                💡 <strong>Cálculo para pago quincenal:</strong> Salario mensual ÷{" "}
                {diasRealesMes} días del mes = Monto diario
              </small>
            </div>
            <div className="employees-pagos-list quincenal">
              <div className="list-header-pagos-nomina">
                <span>Empleado</span>
                <span>Tipo Nómina</span>
                <span>Mitad</span>
                <span>Días a Pagar</span>
                <span>H. Extra D.</span>
                <span>H. Extra N.</span>
                <span>Deduc. ($)</span>
                <span>Adel. ($)</span>
                <span>Monto Extra (Bs)</span>
                <span>Banco</span>
                <span>Observaciones</span>
              </div>

              {[
                ...empleadosPorTipo.operativaEspecialQuincenal,
                ...empleadosPorTipo.administrativaQuincenal,
              ].map((empleado) => {
                const horasExtrasEmpleado = horasExtras[empleado.id] || {
                  diurna: 0,
                  nocturna: 0,
                };
                const deduccionManual = deduccionesManuales[empleado.id] || 0;
                const adelanto = adelantosSueldo[empleado.id] || 0;
                const montoExtra = montoExtraBs[empleado.id] || 0;
                const bancoPago = bancosPago[empleado.id] || "";
                const observacion = observaciones[empleado.id] || "";
                const diasPago = diasPagoQuincenal[empleado.id] || 15;
                const mitadPago = mitadPagoQuincenal[empleado.id] || "primera";
                const montoDiario = calcularMontoDiario(empleado);

                // Calcular total mensual para mostrar
                let totalMensual = 0;
                if (
                  ["Administrativa", "Ejecucion"].includes(empleado.tipoNomina)
                ) {
                  totalMensual =
                    parseFloat(empleado.montoLey || 0) +
                    parseFloat(empleado.bonificacionEmpresa || 0);
                } else {
                  totalMensual = parseFloat(empleado.montoSalario || 0);
                }

                return (
                  <div key={empleado.id} className="pago-row">
                    <div className="employee-info">
                      <div className="employee-name">
                        {empleado.nombre} {empleado.apellido}
                      </div>
                      <div className="employee-details">
                        <span>C.I. {empleado.cedula}</span>
                        <span>•</span>
                        <span>{empleado.cargo}</span>
                        <br />
                        <small
                          style={{
                            color: "#dc2626",
                            fontSize: "0.7rem",
                            fontWeight: "500",
                          }}
                        >
                          ${montoDiario.toFixed(2)}/día ($
                          {totalMensual.toFixed(2)} ÷ {diasRealesMes})
                        </small>
                        {/* NUEVO: Mostrar porcentaje ISLR para nóminas con ley */}
                        {["Administrativa", "Ejecucion"].includes(
                          empleado.tipoNomina
                        ) && (
                            <>
                              <br />
                              <small
                                style={{
                                  color: "#7c3aed",
                                  fontSize: "0.7rem",
                                  fontWeight: "500",
                                }}
                              >
                                ISLR: {empleado.porcentajeIslr || "0"}%
                              </small>
                            </>
                          )}
                      </div>
                    </div>

                    <div className="tipo-nomina">
                      <span
                        className={`nomina-badge ${empleado.tipoNomina.replace(
                          /\s+/g,
                          "-"
                        )}`}
                      >
                        {empleado.tipoNomina}
                      </span>
                      {/* CORRECCIÓN: Mostrar para ambas nóminas con ley */}
                      {["Administrativa", "Ejecucion"].includes(
                        empleado.tipoNomina
                      ) && (
                          <small className="deducciones-info">
                            (Con deducciones ley)
                          </small>
                        )}
                    </div>

                    <div className="mitad-pago-input">
                      <select
                        value={mitadPago}
                        onChange={(e) =>
                          handleMitadPagoChange(empleado.id, e.target.value)
                        }
                      >
                        <option value="primera">Primera Mitad</option>
                        <option value="segunda">Segunda Mitad</option>
                      </select>
                    </div>

                    <div className="dias-pago-input">
                      <input
                        type="number"
                        value={diasPago}
                        onChange={(e) =>
                          handleDiasPagoChange(empleado.id, e.target.value)
                        }
                        min="1"
                        max={diasRealesMes}
                      />
                    </div>

                    <div className="horas-extra-input">
                      <input
                        type="number"
                        value={horasExtrasEmpleado.diurna}
                        onChange={(e) =>
                          handleHorasExtrasChange(
                            empleado.id,
                            "diurna",
                            e.target.value
                          )
                        }
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                    </div>

                    <div className="horas-extra-input">
                      <input
                        type="number"
                        value={horasExtrasEmpleado.nocturna}
                        onChange={(e) =>
                          handleHorasExtrasChange(
                            empleado.id,
                            "nocturna",
                            e.target.value
                          )
                        }
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                    </div>

                    <div className="deduccion-manual-input">
                      <input
                        type="number"
                        value={deduccionManual}
                        onChange={(e) =>
                          handleDeduccionManualChange(empleado.id, e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="deduccion-manual-input">
                      <input
                        type="number"
                        value={adelanto}
                        onChange={(e) =>
                          handleAdelantoChange(empleado.id, e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="monto-extra-input">
                      <input
                        type="number"
                        value={montoExtra}
                        onChange={(e) =>
                          handleMontoExtraChange(empleado.id, e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div className="banco-input">
                      <select
                        value={bancoPago}
                        onChange={(e) =>
                          handleBancoChange(empleado.id, e.target.value)
                        }
                      >
                        <option value="">Seleccionar Banco</option>
                        {listaBancos.map((banco) => (
                          <option key={banco} value={banco}>
                            {banco}
                          </option>
                        ))}
                        <option value="Otro">Otro (Agregar Nuevo)</option>
                      </select>
                    </div>

                    <div className="observaciones-input">
                      <input
                        type="text"
                        value={observacion}
                        onChange={(e) =>
                          handleObservacionesChange(empleado.id, e.target.value)
                        }
                        placeholder="Observaciones..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


      <div className="calculadora-actions">
        <button
          className="btn-primary large"
          onClick={handleCalcular}
          disabled={employees.length === 0 || !tasaCambio || !fechaPago}
        >
          🧮 Calcular Pagos
        </button>
      </div>

      {/* Modal para agregar nuevo banco */}
      {showBancoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Agregar Nuevo Banco</h3>
            <div className="form-group">
              <label>Nombre del Banco:</label>
              <input
                type="text"
                value={nuevoBanco}
                onChange={(e) => setNuevoBanco(e.target.value)}
                placeholder="Ej: Banesco"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={handleCloseBancoModal}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddBanco}>
                Agregar y Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculadoraPagos;
