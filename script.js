// =============================================================
// 1. Wealth Compound Calculator & Bidirectional Sync System
// =============================================================
const initialDepositInput = document.getElementById('initialDeposit');
const monthlyContributionInput = document.getElementById('monthlyContribution');
const interestRateInput = document.getElementById('interestRate');
const yearsInput = document.getElementById('years');

const initialDepositVal = document.getElementById('initialDepositVal');
const monthlyContributionVal = document.getElementById('monthlyContributionVal');
const interestRateVal = document.getElementById('interestRateVal');
const yearsVal = document.getElementById('yearsVal');

const totalPrincipalMetric = document.getElementById('totalPrincipalMetric');
const totalInterestMetric = document.getElementById('totalInterestMetric');
const totalBalanceMetric = document.getElementById('totalBalanceMetric');

let growthChart;

function formatCurrency(num) {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(num);
}

function calculateCompoundInterest() {
    const P = parseFloat(initialDepositInput.value) || 0;
    const PMT = parseFloat(monthlyContributionInput.value) || 0;
    const annualRate = (parseFloat(interestRateInput.value) || 0) / 100;
    const r = annualRate / 12;
    const totalYears = parseInt(yearsInput.value) || 1;
    const totalMonths = totalYears * 12;

    let labels = [];
    let principalData = [];
    let interestData = [];
    let currentBalance = P;
    let currentPrincipalAccumulated = P;

    labels.push('ปี 0');
    principalData.push(P);
    interestData.push(0);

    for (let m = 1; m <= totalMonths; m++) {
        let interestForMonth = currentBalance * r;
        currentBalance += interestForMonth + PMT;
        currentPrincipalAccumulated += PMT;

        if (m % 12 === 0 || m === totalMonths) {
            const yearLabel = 'ปี ' + Math.ceil(m / 12);
            labels.push(yearLabel);
            principalData.push(Math.round(currentPrincipalAccumulated));
            interestData.push(Math.round(currentBalance - currentPrincipalAccumulated));
        }
    }

    const finalBalance = currentBalance;
    const finalPrincipal = currentPrincipalAccumulated;
    const finalInterest = finalBalance - finalPrincipal;

    totalPrincipalMetric.innerText = formatCurrency(finalPrincipal);
    totalInterestMetric.innerText = formatCurrency(finalInterest);
    totalBalanceMetric.innerText = formatCurrency(finalBalance);

    updateChart(labels, principalData, interestData);
}

function updateChart(labels, principalData, interestData) {
    const totalBalanceData = principalData.map((p, i) => p + interestData[i]);

    if (growthChart) {
        growthChart.data.labels = labels;
        growthChart.data.datasets[0].data = principalData;
        growthChart.data.datasets[1].data = totalBalanceData;
        growthChart.update('none'); 
    } else {
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'เงินต้นสะสม',
                        data: principalData,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        tension: 0.2
                    },
                    {
                        label: 'มูลค่าพอร์ตรวมสุทธิ (เงินต้น + ดอกเบี้ย)',
                        data: totalBalanceData,
                        borderColor: '#00f2ff',
                        borderWidth: 3,
                        backgroundColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(0, 242, 255, 0.15)');
                            gradient.addColorStop(1, 'rgba(0, 242, 255, 0.0)');
                            return gradient;
                        },
                        fill: true,
                        pointBackgroundColor: '#00f2ff',
                        pointHoverRadius: 6,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } } },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return ' ' + context.dataset.label + ': ' + context.raw.toLocaleString('th-TH') + ' ฿';
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.02)' }, ticks: { color: '#94a3b8', font: { family: 'Orbitron' } } },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.02)' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Orbitron' },
                            callback: function(value) {
                                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M ฿';
                                return value.toLocaleString('th-TH') + ' ฿';
                            }
                        }
                    }
                }
            }
        });
    }
}

function linkSliderToInput(slider, boxInput) {
    slider.addEventListener('input', () => {
        boxInput.value = slider.value;
        calculateCompoundInterest();
    });

    boxInput.addEventListener('input', () => {
        let currentVal = parseFloat(boxInput.value);
        const minAttr = parseFloat(slider.min);
        const maxAttr = parseFloat(slider.max);

        if (!isNaN(currentVal)) {
            if (currentVal > maxAttr) currentVal = maxAttr;
            if (currentVal < minAttr) currentVal = minAttr;
            slider.value = currentVal;
        }
        calculateCompoundInterest();
    });
}

linkSliderToInput(initialDepositInput, initialDepositVal);
linkSliderToInput(monthlyContributionInput, monthlyContributionVal);
linkSliderToInput(interestRateInput, interestRateVal);
linkSliderToInput(yearsInput, yearsVal);


// =============================================================
// 2. Real-time TradingView Chart Engine (พร้อมปลดล็อกสัดส่วนแกน Y)
// =============================================================
function renderSP500Widget() {
    new TradingView.widget({
        "autosize": true, 
        "symbol": "VOO",
        "interval": "D",
        "timezone": "Asia/Bangkok",
        "theme": "dark",
        "style": "1",
        "locale": "th",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tv-sp500-chart-container"
    });
}

function renderIndividualStockWidget(targetSymbol) {
    new TradingView.widget({
        "autosize": true, 
        "symbol": targetSymbol,
        "interval": "D",
        "timezone": "Asia/Bangkok",
        "theme": "dark",
        "style": "1",
        "locale": "th",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tv-individual-chart-container"
    });
}

const terminalStockSelect = document.getElementById('terminalStockSelect');
if (terminalStockSelect) {
    terminalStockSelect.addEventListener('change', (e) => {
        const selectedTicker = e.target.value;
        renderIndividualStockWidget(selectedTicker);
    });
}


// =============================================================
// 3. System Initialization
// =============================================================
window.onload = function() {
    initialDepositVal.value = initialDepositInput.value;
    monthlyContributionVal.value = monthlyContributionInput.value;
    interestRateVal.value = interestRateInput.value;
    yearsVal.value = yearsInput.value;

    calculateCompoundInterest();
    
    renderSP500Widget();
    renderIndividualStockWidget(terminalStockSelect.value);
};