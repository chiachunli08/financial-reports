// Financial Reports Data
// This file will be automatically updated by stock_analyzer.py

const reportsData = {
    lastUpdated: new Date().toISOString(),
    stocks: []
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const reportsGrid = document.getElementById('reportsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadReportsData();
    setupEventListeners();
});

// Load reports data from data.json
async function loadReportsData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        reportsData.lastUpdated = data.lastUpdated;
        reportsData.stocks = data.stocks;
        updateStats();
        renderReports();
    } catch (error) {
        console.error('Error loading reports:', error);
        reportsGrid.innerHTML = '<div class="empty-state">載入報告失敗</div>';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', debounce(() => {
        renderReports();
    }, 300));

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderReports();
        });
    });
}

// Update statistics
function updateStats() {
    const stocks = reportsData.stocks;
    const totalStocks = stocks.length;
    const avgScore = totalStocks > 0
        ? (stocks.reduce((sum, s) => sum + s.cbsScore, 0) / totalStocks).toFixed(1)
        : '--';
    const qualityStocks = stocks.filter(s => s.cbsScore >= 80).length;

    document.getElementById('totalStocks').textContent = totalStocks;
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('qualityStocks').textContent = qualityStocks;

    // Update last updated time
    const lastUpdated = new Date(reportsData.lastUpdated);
    document.getElementById('lastUpdated').textContent =
        lastUpdated.toLocaleDateString('zh-TW') + ' ' + lastUpdated.toLocaleTimeString('zh-TW');
}

// Render reports
function renderReports() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;

    let filteredStocks = reportsData.stocks.filter(stock => {
        const matchesSearch =
            stock.symbol.toLowerCase().includes(searchTerm) ||
            stock.name.toLowerCase().includes(searchTerm);

        let matchesFilter = true;
        if (activeFilter !== 'all') {
            const score = stock.cbsScore;
            switch (activeFilter) {
                case 'excellent':
                    matchesFilter = score >= 80;
                    break;
                case 'good':
                    matchesFilter = score >= 60 && score < 80;
                    break;
                case 'average':
                    matchesFilter = score >= 40 && score < 60;
                    break;
                case 'poor':
                    matchesFilter = score < 40;
                    break;
            }
        }

        return matchesSearch && matchesFilter;
    });

    // Sort by date (newest first)
    filteredStocks.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredStocks.length === 0) {
        reportsGrid.innerHTML = '<div class="empty-state">沒有找到符合的報告</div>';
        return;
    }

    reportsGrid.innerHTML = filteredStocks.map(stock => createReportCard(stock)).join('');
}

// Create report card HTML
function createReportCard(stock) {
    const scoreClass = getScoreClass(stock.cbsScore);
    const scoreEmoji = getScoreEmoji(stock.cbsScore);
    const formattedDate = new Date(stock.date).toLocaleDateString('zh-TW');

    return `
        <div class="report-card" onclick="window.location.href='stocks/${stock.symbol}.html'">
            <div class="stock-header">
                <span class="stock-symbol">${stock.symbol}</span>
                <div class="cbs-score ${scoreClass}">${stock.cbsScore}</div>
            </div>
            <div class="stock-name">${stock.name}</div>
            <div class="report-meta">
                <span class="report-date">${formattedDate}</span>
                <span class="view-report">查看詳情 →</span>
            </div>
        </div>
    `;
}

// Get CSS class based on score
function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
}

// Get emoji based on score
function getScoreEmoji(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
