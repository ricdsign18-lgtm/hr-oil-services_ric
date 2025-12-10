import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import "./ResumeCard.css";

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-tooltip-enhanced">
                <p className="tooltip-label">{data.name}</p>
                <p className="tooltip-value">{data.formattedValue || data.value}</p>
                <div className="tooltip-indicator" style={{ backgroundColor: data.color }}></div>
            </div>
        );
    }
    return null;
};

export const ResumeCard = ({ title, items, icon, chartData, chartConfig, chartType = 'bar' }) => {
    // Map colors to gradient IDs
    const getGradientId = (color) => `gradient-${color.replace('#', '')}`;

    const renderChart = () => {
        if (chartType === 'donut') {
            return (
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={180}>
                <BarChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                    barSize={32}
                >
                    <defs>
                        {chartData.map((entry, index) => (
                            <linearGradient id={getGradientId(entry.color)} x1="0" y1="0" x2="0" y2="1" key={`grad-${index}`}>
                                <stop offset="5%" stopColor={entry.color} stopOpacity={0.9} />
                                <stop offset="95%" stopColor={entry.color} stopOpacity={0.4} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={false} /* Hidden to avoid redundancy with the list/legend */
                        height={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: '#f1f5f9', radius: 4 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#${getGradientId(entry.color)})`}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <article className="resume-card-modern">
            <div className="card-header-modern">
                <div className="icon-wrapper">
                    {icon}
                </div>
                <h4>{title}</h4>
            </div>

            <div className="card-body-modern">
                {/* Chart Section */}
                {chartData && chartData.length > 0 && (
                    <div className="chart-container">
                        {renderChart()}
                        {/* Center Label for Donut */}
                        {chartType === 'donut' && chartConfig?.centerLabel && (
                            <div className="chart-overlay">
                                <span className="chart-center-label">{chartConfig.centerLabel}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Details Section */}
                <div className="details-container">
                    {Array.isArray(items) &&
                        items.filter(item => item.progress === undefined).map((item, index) => (
                            <div
                                className={`detail-row ${item.highlight ? "highlight" : ""} ${item.isNegative ? "negative" : ""}`}
                                key={index}
                            >
                                <div className="detail-info">
                                    <span className="label">
                                        {item.color && <span className="legend-dot" style={{ backgroundColor: item.color }}></span>}
                                        {item.label}
                                    </span>
                                    {item.equivalentValue && (
                                        <span className="sub-value">{item.equivalentValue}</span>
                                    )}
                                </div>
                                <div className="detail-value-wrapper">
                                    <span className="value">{item.value}</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {items.some(i => i.progress !== undefined) && (
                <div className="progress-footer">
                    {items.filter(i => i.progress !== undefined).map((item, idx) => (
                        <div key={idx} className="footer-progress-wrapper">
                            <div className="footer-info-row">
                                <span className="footer-label">{item.label}</span>
                                <span className="footer-value">{item.value}</span>
                            </div>
                            <div className="progress-bar-modern">
                                <div
                                    className="progress-fill-modern"
                                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                                ></div>
                            </div>
                            {item.equivalentValue && (
                                <span className="footer-sub">{item.equivalentValue}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

        </article>
    );
};
