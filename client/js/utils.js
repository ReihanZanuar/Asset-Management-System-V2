// Utility functions for UI

// Format date to readable string
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format currency (Rupiah)
function formatCurrency(amount) {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Custom confirmation dialog (modern alternative to window.confirm)
function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.style.animation = 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Create modal content
        const content = document.createElement('div');
        content.className = 'bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-6 max-w-md w-full border border-outline-variant dark:border-slate-700 shadow-2xl';
        content.style.animation = 'slideInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Icon based on type
        const icon = options.type === 'danger' ? '⚠️' : 'ℹ️';
        const iconColor = options.type === 'danger' ? 'text-critical-rose dark:text-red-400' : 'text-primary dark:text-blue-400';
        
        content.innerHTML = `
            <div class="flex items-start gap-4 mb-6">
                <span class="${iconColor} text-3xl">${icon}</span>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-on-surface dark:text-white mb-2">
                        ${options.title || 'Konfirmasi'}
                    </h3>
                    <p class="text-sm text-on-surface-variant dark:text-gray-400">
                        ${message}
                    </p>
                </div>
            </div>
            <div class="flex gap-3">
                <button id="confirm-cancel" class="flex-1 px-4 py-2.5 bg-surface-container dark:bg-slate-700 hover:bg-surface-container-high dark:hover:bg-slate-600 text-on-surface dark:text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95">
                    ${options.cancelText || 'Batal'}
                </button>
                <button id="confirm-ok" class="flex-1 px-4 py-2.5 ${options.type === 'danger' ? 'bg-critical-rose hover:bg-critical-rose/90' : 'bg-primary-container hover:bg-primary'} text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95">
                    ${options.confirmText || 'OK'}
                </button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add CSS animations with smooth easing
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { 
                from { opacity: 0; } 
                to { opacity: 1; } 
            }
            @keyframes slideInScale { 
                from { 
                    transform: translateY(-30px) scale(0.95); 
                    opacity: 0; 
                } 
                to { 
                    transform: translateY(0) scale(1); 
                    opacity: 1; 
                } 
            }
        `;
        document.head.appendChild(style);
        
        // Handle button clicks with smooth exit
        const cleanup = (result) => {
            modal.style.animation = 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) reverse';
            content.style.animation = 'slideInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1) reverse';
            setTimeout(() => {
                modal.remove();
                style.remove();
                resolve(result);
            }, 200);
        };
        
        document.getElementById('confirm-ok').onclick = () => cleanup(true);
        document.getElementById('confirm-cancel').onclick = () => cleanup(false);
        modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
        
        // Focus OK button
        setTimeout(() => document.getElementById('confirm-ok').focus(), 100);
    });
}

// Show loading spinner
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loader.innerHTML = `
        <div class="bg-slate-800 p-6 rounded-lg">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
}

// Get status badge class
function getStatusBadgeClass(status) {
    const classes = {
        'available': 'bg-green-500/20 text-green-400',
        'borrowed': 'bg-blue-500/20 text-blue-400',
        'maintenance': 'bg-yellow-500/20 text-yellow-400',
        'damaged': 'bg-red-500/20 text-red-400',
        'returned': 'bg-green-500/20 text-green-400',
        'overdue': 'bg-red-500/20 text-red-400'
    };
    return classes[status] || 'bg-gray-500/20 text-gray-400';
}

// Download Excel file from API
async function downloadExcel(endpoint, filename) {
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        // Get blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        hideLoading();
        showToast('Export berhasil! File sedang diunduh...', 'success');
    } catch (error) {
        console.error('Download error:', error);
        hideLoading();
        showToast('Export gagal. Silakan coba lagi.', 'error');
    }
}

// Export for use in pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatDate, formatCurrency, showToast, showLoading, hideLoading, getStatusBadgeClass, confirm, downloadExcel };
}
