window._selectedNominal = 0;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

window.balanceSelectNominal = function(amount) {
    window._selectedNominal = amount;
    const input = document.getElementById('custom-nominal');
    if (input) input.value = '';
    updateSummary();
    renderNominalButtons();
};

window.balanceCustomInput = function(el) {
    let val = el.value.replace(/\D/g, '');
    if (val) {
        val = parseInt(val, 10);
        if (val > 10000000) val = 10000000;
        window._selectedNominal = val;
        el.value = new Intl.NumberFormat('id-ID').format(val);
    } else {
        window._selectedNominal = 0;
        el.value = '';
    }
    renderNominalButtons();
    updateSummary();
};

window.balanceSubmitTopup = function() {
    if (window._selectedNominal < 10000) {
        alert('Minimal top up adalah Rp10.000');
        return;
    }
    alert('Top up sebesar ' + formatCurrency(window._selectedNominal) + ' diproses!');
    // submit logic
};

window.balanceTab = function(tab) {
    const saldoTab = document.getElementById('tab-riwayat-saldo');
    const topupTab = document.getElementById('tab-riwayat-topup');
    const saldoBtn = document.getElementById('btn-tab-saldo');
    const topupBtn = document.getElementById('btn-tab-topup');

    if (tab === 'saldo') {
        saldoTab.style.display = 'block';
        topupTab.style.display = 'none';
        saldoBtn.style.borderBottom = '2px solid var(--accent)';
        saldoBtn.style.color = 'var(--accent)';
        topupBtn.style.borderBottom = 'none';
        topupBtn.style.color = 'var(--text-muted)';
    } else {
        saldoTab.style.display = 'none';
        topupTab.style.display = 'block';
        topupBtn.style.borderBottom = '2px solid var(--accent)';
        topupBtn.style.color = 'var(--accent)';
        saldoBtn.style.borderBottom = 'none';
        saldoBtn.style.color = 'var(--text-muted)';
    }
};

function renderNominalButtons() {
    const container = document.getElementById('nominal-grid');
    if (!container) return;
    
    const nominals = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 5000000];
    
    container.innerHTML = nominals.map(nom => {
        const isActive = window._selectedNominal === nom;
        return `
            <button onclick="balanceSelectNominal(${nom})" style="
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                border: 1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};
                background: ${isActive ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg)'};
                color: ${isActive ? 'var(--accent)' : 'var(--text)'};
                transition: all 0.2s;
            ">
                ${formatCurrency(nom)}
            </button>
        `;
    }).join('');
}

function updateSummary() {
    const amount = window._selectedNominal || 0;
    const methodSelect = document.getElementById('payment-method');
    const method = methodSelect ? methodSelect.value : 'qris';
    
    let fee = 0;
    if (method === 'qris') {
        fee = Math.round(amount * 0.007);
    }
    
    const total = amount + fee;
    
    document.getElementById('summary-nominal').innerText = formatCurrency(amount);
    document.getElementById('summary-fee').innerText = formatCurrency(fee);
    document.getElementById('summary-total').innerText = formatCurrency(total);
    document.getElementById('summary-received').innerText = formatCurrency(amount);
}

async function renderBalance() {
    const user = window._acctUser || { balance: 0 };
    window._selectedNominal = 0;

    const html = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <h2 style="margin: 0; color: var(--text); font-size: 1.5rem;">Saldo & Topup</h2>
            
            <!-- Balance Banner -->
            <div style="background: linear-gradient(135deg, var(--accent), var(--purple, #8b5cf6)); color: white; padding: 32px 24px; border-radius: 12px; position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <p style="margin: 0; font-size: 1rem; opacity: 0.9; margin-bottom: 8px; position: relative; z-index: 1;">Saldo Anda</p>
                <h2 style="margin: 0; font-size: 2.5rem; font-weight: 700; position: relative; z-index: 1;">${formatCurrency(user.balance)}</h2>
            </div>

            <!-- Top Up Card -->
            <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 20px 0; color: var(--text); font-size: 1.2rem;">Top Up Saldo</h3>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 12px; color: var(--text-muted); font-size: 0.9rem;">Pilih Nominal</label>
                    <div id="nominal-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                        <!-- Rendered by JS -->
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem;">Atau Masukkan Nominal</label>
                    <div style="display: flex; align-items: center; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
                        <span style="padding: 12px 16px; background: rgba(0,0,0,0.05); color: var(--text-muted); border-right: 1px solid var(--border);">Rp</span>
                        <input type="text" id="custom-nominal" oninput="balanceCustomInput(this)" placeholder="10.000" style="flex: 1; padding: 12px; border: none; background: transparent; color: var(--text); outline: none; font-size: 1rem;">
                    </div>
                    <small style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px; display: block;">Minimal Rp10.000, Maksimal Rp10.000.000</small>
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem;">Metode Pembayaran</label>
                    <select id="payment-method" onchange="updateSummary()" style="width: 100%; padding: 12px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; outline: none; font-size: 1rem;">
                        <option value="qris">QRIS GatePay (Biaya 0.7%)</option>
                        <option value="balance">Saldo Akun (Gratis)</option>
                    </select>
                </div>

                <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 12px 0; color: var(--text); font-size: 1rem;">Ringkasan</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem;">
                        <span>Nominal</span>
                        <span id="summary-nominal">Rp0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem;">
                        <span>Biaya Admin</span>
                        <span id="summary-fee">Rp0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text); font-weight: 600; font-size: 1rem;">
                        <span>Total Pembayaran</span>
                        <span id="summary-total" style="color: var(--accent);">Rp0</span>
                    </div>
                    <hr style="border: none; border-top: 1px dashed var(--border); margin: 12px 0;">
                    <div style="display: flex; justify-content: space-between; color: var(--text); font-weight: 500; font-size: 0.95rem;">
                        <span>Saldo Diterima</span>
                        <span id="summary-received" style="color: var(--success, #22c55e);">Rp0</span>
                    </div>
                </div>

                <button class="btn btn-primary" onclick="balanceSubmitTopup()" style="width: 100%; background: var(--accent); color: white; border: none; padding: 14px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-wallet"></i> Top Up Sekarang
                </button>
            </div>

            <!-- History Tabs -->
            <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-top: 8px;">
                <div style="display: flex; border-bottom: 1px solid var(--border);">
                    <button id="btn-tab-saldo" onclick="balanceTab('saldo')" style="flex: 1; padding: 16px; background: transparent; border: none; border-bottom: 2px solid var(--accent); color: var(--accent); font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Riwayat Saldo
                    </button>
                    <button id="btn-tab-topup" onclick="balanceTab('topup')" style="flex: 1; padding: 16px; background: transparent; border: none; border-bottom: none; color: var(--text-muted); font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Riwayat Top Up
                    </button>
                </div>

                <div id="tab-riwayat-saldo">
                    <div style="padding: 48px 16px; text-align: center;">
                        <div style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </div>
                        <p style="color: var(--text-muted); margin: 0; font-size: 1.1rem;">Belum ada riwayat saldo</p>
                    </div>
                </div>

                <div id="tab-riwayat-topup" style="display: none;">
                    <div style="padding: 48px 16px; text-align: center;">
                        <div style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </div>
                        <p style="color: var(--text-muted); margin: 0; font-size: 1.1rem;">Belum ada riwayat top up</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('app-content').innerHTML = html;
    
    // Initialize nominal buttons
    setTimeout(() => renderNominalButtons(), 0);
}

window.renderBalance = renderBalance;
