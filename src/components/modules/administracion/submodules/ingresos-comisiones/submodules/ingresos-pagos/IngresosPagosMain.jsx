// src/components/modules/administracion/submodules/ingresos-comisiones/submodules/ingresos-pagos/IngresosPagosMain.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncome } from '../../../../../../../contexts/IncomeContext'
import { useProjects } from '../../../../../../../contexts/ProjectContext'
import { useNotification } from '../../../../../../../contexts/NotificationContext'
import InvoiceForm from './components/InvoiceForm'
import ClientDeductionsForm from './components/ClientDeductionsForm'
import CompanyDeductionsForm from './components/CompanyDeductionsForm'
import DailySummary from './components/DailySummary'
import InvoicesList from './components/InvoicesList'
import './IngresosPagosMain.css'

const IngresosPagosMain = () => {
  const navigate = useNavigate()
  const { selectedProject } = useProjects()
  const { showToast } = useNotification()
  const { 
    invoices, 
    companyDeductions, 
    addInvoice, 
    addCompanyDeduction,
    getDailyTotals 
  } = useIncome()

  const [activeSection, setActiveSection] = useState('invoice')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyTotals, setDailyTotals] = useState({ totalReceivedBs: 0, totalReceivedUsd: 0 })
  const [exchangeRate, setExchangeRate] = useState(0)

  useEffect(() => {
    if (selectedDate) {
      const totals = getDailyTotals(selectedDate)
      setDailyTotals(totals)
      setExchangeRate(totals.exchangeRate)
    }
  }, [selectedDate, invoices])

  const handleBack = () => {
    navigate('../ingresos-comisiones')
  }

  const handleInvoiceSubmit = async (invoiceData) => {
    try {
      await addInvoice(invoiceData)
      setActiveSection('client-deductions')
      showToast('Factura agregada exitosamente', 'success')
    } catch (error) {
      console.error('Error al agregar factura:', error)
      showToast('Error al guardar la factura', 'error')
    }
  }

  const handleCompanyDeductionSubmit = async (deductionData) => {
    try {
      await addCompanyDeduction(deductionData)
      showToast('Deducción de empresa agregada exitosamente', 'success')
    } catch (error) {
      console.error('Error al agregar deducción:', error)
      showToast('Error al guardar la deducción', 'error')
    }
  }

  return (
    <div className="ingresos-pagos-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Ingresos & Comisiones
      </button>

      <div className="main-header">
        <h1>INGRESOS Y PAGOS RECIBIDOS</h1>
        <p>Proyecto: {selectedProject?.name || 'No seleccionado'}</p>
      </div>

      <div className="navigation-tabs">
        <button 
          className={`tab ${activeSection === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveSection('invoice')}
        >
          📄 Nueva Factura
        </button>
        <button 
          className={`tab ${activeSection === 'client-deductions' ? 'active' : ''}`}
          onClick={() => setActiveSection('client-deductions')}
        >
          💰 Deducciones Cliente
        </button>
        <button 
          className={`tab ${activeSection === 'company-deductions' ? 'active' : ''}`}
          onClick={() => setActiveSection('company-deductions')}
        >
          🏢 Deducciones Empresa
        </button>
        <button 
          className={`tab ${activeSection === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveSection('summary')}
        >
          📊 Resumen Diario
        </button>
        <button 
          className={`tab ${activeSection === 'list' ? 'active' : ''}`}
          onClick={() => setActiveSection('list')}
        >
          📋 Lista Facturas
        </button>
      </div>

      <div className="content-section">
        {activeSection === 'invoice' && (
          <InvoiceForm onSubmit={handleInvoiceSubmit} />
        )}

        {activeSection === 'client-deductions' && (
          <ClientDeductionsForm 
            invoices={invoices}
            selectedDate={selectedDate}
          />
        )}

        {activeSection === 'company-deductions' && (
          <CompanyDeductionsForm 
            dailyTotals={dailyTotals}
            selectedDate={selectedDate}
            onDeductionSubmit={handleCompanyDeductionSubmit}
          />
        )}

        {activeSection === 'summary' && (
          <DailySummary 
            dailyTotals={dailyTotals}
            companyDeductions={companyDeductions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            exchangeRate={exchangeRate}
          />
        )}

        {activeSection === 'list' && (
          <InvoicesList 
            invoices={invoices}
            companyDeductions={companyDeductions} // Pasar deducciones de empresa
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
      </div>
    </div>
  )
}

export default IngresosPagosMain