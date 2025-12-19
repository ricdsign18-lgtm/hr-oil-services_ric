import React from 'react';
import { AddIcon, ClipBoardIcon } from '../../../../../../assets/icons/Icons';
import './ComprasHeader.css';

const ComprasHeader = ({ activeTab, setActiveTab }) => {
    return (
        <div className="compras-header-container">
            {/* Mobile Dropdown */}
            <div className="ch-mobile-dropdown">
                <label htmlFor="mobile-tab-select" className="ch-mobile-label">Ver:</label>
                <select
                    id="mobile-tab-select"
                    className="ch-mobile-select"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                >
                    <option value="nueva-compra">Nueva Compra</option>
                    <option value="historial">Historial de Compras</option>
                </select>
            </div>

            {/* Desktop Tabs */}
            <div className="ch-tabs-container">
                <button
                    className={`ch-tab-btn ${activeTab === 'nueva-compra' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nueva-compra')}
                >
                    <span className="tab-icon"><AddIcon fill={activeTab === 'nueva-compra' ? 'white' : '#9ca3af'} style={{ width: '20px', height: '20px' }} /></span> Nueva Compra
                </button>

                <button
                    className={`ch-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historial')}
                >
                    <span className="tab-icon"><ClipBoardIcon fill={activeTab === 'historial' ? 'white' : '#9ca3af'} style={{ width: '20px', height: '20px' }} /></span> Historial de Compras
                </button>
            </div>
        </div>
    );
};

export default ComprasHeader;
