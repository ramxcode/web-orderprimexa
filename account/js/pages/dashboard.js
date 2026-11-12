const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatIndonesianDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const d = new Date();
    const dayName = days[d.getDay()];
    const date = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${dayName}, ${date} ${monthName} ${year}`;
};

async function renderDashboard() {
    const user = window._acctUser || { name: 'Guest', balance: 0 };
    const stats = window._acctStats || { total_orders: 0, unpaid_orders: 0, wishlist: 0 };
    
    const html = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Welcome Banner -->
            <div style="background: linear-gradient(135deg, var(--accent), var(--purple, #8b5cf6)); color: white; padding: 24px; border-radius: 12px; position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -30px; right: 40px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: relative; z-index: 1;">
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">${formatIndonesianDate()}</p>
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Halo, ${user.name}!</h2>
                </div>
            </div>

            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(34, 197, 94, 0.1); color: var(--success, #22c55e); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fa-solid fa-wallet"></i>
                    </div>
                    <div>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Saldo</p>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.1rem;">${formatCurrency(user.balance)}</h3>
                    </div>
                </div>

                <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fa-solid fa-bag-shopping"></i>
                    </div>
                    <div>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Total Pesanan</p>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.1rem;">${stats.total_orders}</h3>
                    </div>
                </div>

                <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); color: var(--warning, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <div>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Belum Dibayar</p>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.1rem;">${stats.unpaid_orders}</h3>
                    </div>
                </div>

                <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(236, 72, 153, 0.1); color: #ec4899; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;">Wishlist</p>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.1rem;">${stats.wishlist}</h3>
                    </div>
                </div>
            </div>

            <!-- Recent Orders & Balance History Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <!-- Recent Orders -->
                <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                    <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: var(--text); font-size: 1.1rem;">Pesanan Terbaru</h3>
                        <a href="javascript:void(0)" onclick="navigate('/orders')" style="color: var(--accent); text-decoration: none; font-size: 0.9rem;">Lihat Semua</a>
                    </div>
                    <div style="padding: 32px 16px; text-align: center;">
                        <div style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;">
                            <i class="fa-solid fa-bag-shopping"></i>
                        </div>
                        <p style="color: var(--text-muted); margin: 0 0 16px 0;">Belum ada pesanan</p>
                        <button class="btn btn-primary" onclick="navigate('/')" style="background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Mulai Belanja</button>
                    </div>
                </div>

                <!-- Balance History -->
                <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                    <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: var(--text); font-size: 1.1rem;">Riwayat Saldo</h3>
                        <a href="javascript:void(0)" onclick="navigate('/balance')" style="color: var(--accent); text-decoration: none; font-size: 0.9rem;">Lihat Semua</a>
                    </div>
                    <div style="padding: 32px 16px; text-align: center;">
                        <div style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;">
                            <i class="fa-solid fa-wallet"></i>
                        </div>
                        <p style="color: var(--text-muted); margin: 0;">Belum ada riwayat saldo</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('app-content').innerHTML = html;
}
window.renderDashboard = renderDashboard;
