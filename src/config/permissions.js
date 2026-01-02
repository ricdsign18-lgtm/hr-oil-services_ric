/**
 * Configuración de Roles y Permisos (Sistema de Cargos)
 * 
 * Define la jerarquía de acceso basada en la estructura organizativa.
 * - scope: define a qué módulo principal tiene acceso el rol.
 * - level: define la jerarquía (mayor número = mayor rango).
 * - label: nombre legible del cargo.
 */

export const ROLES = {
  // --- Nivel Directivo (Acceso Total) ---
  DIRECTOR_GENERAL: {
    label: "Director General",
    scope: "*", // Comodín para acceso total
    level: 100,
  },

  // --- Nivel Jefes de Módulo ---
  JEFE_ADMINISTRACION: {
    label: "Jefe de Administración",
    scope: "administracion",
    level: 50,
  },

  JEFE_OPERACIONES: {
    label: "Jefe de Operaciones",
    scope: "operaciones", 
    level: 50,
  },

  JEFE_CONTRATO: {
    label: "Jefe de Contrato",
    scope: "contrato",
    level: 50,
  },

  JEFE_COORDINACIONES: {
    label: "Jefe de Coordinaciones",
    scope: "coordinaciones",
    level: 50,
  },
  
  // --- Nivel Auxiliares (Requieren Aprobación) ---
  AUXILIAR_ADMINISTRACION: {
    label: "Auxiliar de Administración",
    scope: "administracion",
    level: 10,
  },
  AUXILIAR_OPERACIONES: {
    label: "Auxiliar de Operaciones",
    scope: "operaciones",
    level: 10,
  },
  AUXILIAR_CONTRATO: {
    label: "Auxiliar de Contrato",
    scope: "contrato",
    level: 10,
  },
  AUXILIAR_COORDINACIONES: {
    label: "Auxiliar de Coordinaciones",
    scope: "coordinaciones",
    level: 10,
  },
  
  // --- Roles Legacy (para compatibilidad temporal) ---
  admin: {
    label: "Admin (Legacy)",
    scope: "*",
    level: 100
  },
  editor: {
    label: "Editor (Legacy)",
    scope: "administracion", // Asumiendo que editor solía ser admin
    level: 50
  },
  viewer: {
    label: "Viewer (Legacy)",
    scope: "resumen",
    level: 0
  }
};

/**
 * Módulos disponibles en el sistema
 * Se usan para validar el scope
 */
export const MODULES = {
  RESUMEN: "resumen",
  ADMINISTRACION: "administracion",
  OPERACIONES: "operaciones",
  CONTRATO: "contrato",
  COORDINACIONES: "coordinaciones"
};
