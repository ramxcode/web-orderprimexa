// profile.js
window._profileTab = window._profileTab || 'profil';

async function renderProfile() {
    let content = `
    <div class="page-header mb-4">
        <h2 class="text-white">Pengaturan Profil</h2>
        <p class="text-muted">Kelola informasi dasar dan keamanan akun Anda.</p>
    </div>

    <div class="d-flex gap-2 mb-4 border-bottom border-secondary pb-3 overflow-auto">
        <button class="btn ${window._profileTab === 'profil' ? 'btn-primary text-white' : 'btn-outline-secondary text-white'} text-nowrap" onclick="profileTab('profil')">
            <i class="fa-solid fa-user me-2"></i>Profil
        </button>
        <button class="btn ${window._profileTab === 'keamanan' ? 'btn-primary text-white' : 'btn-outline-secondary text-white'} text-nowrap" onclick="profileTab('keamanan')">
            <i class="fa-solid fa-shield-halved me-2"></i>Keamanan
        </button>
        <button class="btn ${window._profileTab === 'password' ? 'btn-primary text-white' : 'btn-outline-secondary text-white'} text-nowrap" onclick="profileTab('password')">
            <i class="fa-solid fa-lock me-2"></i>Password
        </button>
    </div>
    `;

    if (window._profileTab === 'profil') {
        content += `
        <div class="row">
            <div class="col-md-4 mb-4">
                <div class="card bg-dark text-white border-secondary h-100">
                    <div class="card-header border-secondary">
                        <h5 class="mb-0">Foto Profil</h5>
                    </div>
                    <div class="card-body text-center d-flex flex-column align-items-center justify-content-center">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-3" style="width: 120px; height: 120px; font-size: 48px; font-weight: bold;">
                            JD
                        </div>
                        <button class="btn btn-outline-primary mb-2">Unggah Foto</button>
                        <small class="text-muted">Format: JPG, PNG, WEBP. Maks 2 MB</small>
                    </div>
                </div>
            </div>
            <div class="col-md-8 mb-4">
                <div class="card bg-dark text-white border-secondary h-100">
                    <div class="card-header border-secondary">
                        <h5 class="mb-0">Informasi Akun</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
                            <input type="text" class="form-control bg-dark text-white border-secondary" value="John Doe" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <div class="input-group">
                                <span class="input-group-text bg-secondary text-white border-secondary"><i class="fa-solid fa-lock"></i></span>
                                <input type="email" class="form-control bg-dark text-white border-secondary" value="john.doe@example.com" readonly>
                                <button class="btn btn-outline-primary" type="button">Ubah Email</button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">No. Telepon</label>
                            <input type="text" class="form-control bg-dark text-white border-secondary" placeholder="08xxxxxxxxxx" value="081234567890">
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Telegram</label>
                            <div class="d-flex flex-wrap align-items-center gap-3 p-3 rounded border border-secondary" style="background-color: #1a222b;">
                                <i class="fa-brands fa-telegram fa-2x text-info"></i>
                                <div class="flex-grow-1">
                                    <div class="fw-bold">Belum terhubung</div>
                                    <small class="text-muted">Hubungkan akun Telegram untuk menerima notifikasi pesanan.</small>
                                </div>
                                <button class="btn btn-outline-info btn-sm">Hubungkan Telegram</button>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary" onclick="profileSave()">Simpan Perubahan</button>
                            <button class="btn btn-outline-secondary" onclick="profileReset()">Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    } else if (window._profileTab === 'keamanan') {
        content += `
        <div class="card bg-dark text-white border-secondary mb-4">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Status Keamanan</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 col-6 mb-3">
                        <div class="d-flex flex-column align-items-center text-center p-3 rounded border border-secondary" style="background-color: #1a222b;">
                            <i class="fa-solid fa-circle-check text-success fa-2x mb-2"></i>
                            <span>Email Terverifikasi</span>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-3">
                        <div class="d-flex flex-column align-items-center text-center p-3 rounded border border-secondary" style="background-color: #1a222b;">
                            <i class="fa-solid fa-circle-check text-success fa-2x mb-2"></i>
                            <span>Telepon Terverifikasi</span>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-3">
                        <div class="d-flex flex-column align-items-center text-center p-3 rounded border border-secondary" style="background-color: #1a222b;">
                            <i class="fa-solid fa-circle-xmark text-danger fa-2x mb-2"></i>
                            <span>Telegram Terhubung</span>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-3">
                        <div class="d-flex flex-column align-items-center text-center p-3 rounded border border-secondary" style="background-color: #1a222b;">
                            <i class="fa-solid fa-circle-xmark text-danger fa-2x mb-2"></i>
                            <span>2FA Aktif</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card bg-dark text-white border-secondary mb-4">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Sesi Login</h5>
            </div>
            <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item bg-transparent text-white border-secondary d-flex flex-wrap justify-content-between align-items-center p-3 gap-2">
                        <div class="d-flex align-items-center gap-3">
                            <i class="fa-solid fa-laptop fa-2x text-muted"></i>
                            <div>
                                <div class="fw-bold">Chrome pada Windows <span class="badge bg-success ms-2">Sesi Ini</span></div>
                                <small class="text-muted">192.168.1.*** • 24 Jul 2026 10:00</small>
                            </div>
                        </div>
                    </li>
                    <li class="list-group-item bg-transparent text-white border-secondary d-flex flex-wrap justify-content-between align-items-center p-3 gap-2">
                        <div class="d-flex align-items-center gap-3">
                            <i class="fa-solid fa-mobile-screen fa-2x text-muted"></i>
                            <div>
                                <div class="fw-bold">Safari pada iPhone</div>
                                <small class="text-muted">114.120.***.*** • 23 Jul 2026 15:30</small>
                            </div>
                        </div>
                        <button class="btn btn-outline-danger btn-sm">Keluar</button>
                    </li>
                </ul>
            </div>
        </div>
        <div class="card bg-dark text-white border-secondary mb-4">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Aktivitas Akun</h5>
            </div>
            <div class="card-body">
                <ul class="list-unstyled mb-0 border-start border-2 border-secondary ms-2 ps-3 position-relative">
                    <li class="mb-4 position-relative">
                        <i class="fa-solid fa-circle text-primary position-absolute bg-dark" style="left: -22px; top: 4px; font-size: 10px;"></i>
                        <div class="fw-bold">Login Berhasil</div>
                        <small class="text-muted">Hari ini, 10:00 • Chrome, Windows</small>
                    </li>
                    <li class="mb-4 position-relative">
                        <i class="fa-solid fa-circle text-secondary position-absolute bg-dark" style="left: -22px; top: 4px; font-size: 10px;"></i>
                        <div class="fw-bold">Password Diubah</div>
                        <small class="text-muted">Kemarin, 14:20 • Chrome, Windows</small>
                    </li>
                    <li class="position-relative">
                        <i class="fa-solid fa-circle text-secondary position-absolute bg-dark" style="left: -22px; top: 4px; font-size: 10px;"></i>
                        <div class="fw-bold">Login Berhasil</div>
                        <small class="text-muted">22 Jul 2026, 09:15 • Safari, iPhone</small>
                    </li>
                </ul>
            </div>
        </div>
        `;
    } else if (window._profileTab === 'password') {
        content += `
        <div class="card bg-dark text-white border-secondary mb-4">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Ubah Password</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Password Saat Ini</label>
                    <div class="input-group">
                        <input type="password" class="form-control bg-dark text-white border-secondary" id="pwd-current">
                        <button class="btn btn-outline-secondary" type="button" onclick="profileTogglePass('pwd-current')"><i class="fa-solid fa-eye"></i></button>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Password Baru</label>
                    <div class="input-group">
                        <input type="password" class="form-control bg-dark text-white border-secondary" id="pwd-new" onkeyup="profileCheckPassword(this)">
                        <button class="btn btn-outline-secondary" type="button" onclick="profileTogglePass('pwd-new')"><i class="fa-solid fa-eye"></i></button>
                    </div>
                    <div class="progress mt-2 bg-secondary" style="height: 5px;">
                        <div id="pwd-strength-bar" class="progress-bar bg-danger" role="progressbar" style="width: 0%; transition: width 0.3s, background-color 0.3s;"></div>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Konfirmasi Password Baru</label>
                    <div class="input-group">
                        <input type="password" class="form-control bg-dark text-white border-secondary" id="pwd-confirm">
                        <button class="btn btn-outline-secondary" type="button" onclick="profileTogglePass('pwd-confirm')"><i class="fa-solid fa-eye"></i></button>
                    </div>
                </div>
                
                <div class="mb-4 p-3 rounded border border-secondary" style="background-color: #1a222b;">
                    <h6 class="mb-3">Persyaratan Password:</h6>
                    <ul class="list-unstyled mb-0">
                        <li class="mb-2"><i id="req-len" class="fa-solid fa-circle text-secondary me-2"></i>Min 8 karakter</li>
                        <li class="mb-2"><i id="req-case" class="fa-solid fa-circle text-secondary me-2"></i>Huruf besar & kecil</li>
                        <li class="mb-2"><i id="req-num" class="fa-solid fa-circle text-secondary me-2"></i>Mengandung angka</li>
                        <li><i id="req-sym" class="fa-solid fa-circle text-secondary me-2"></i>Mengandung simbol (!@#$%)</li>
                    </ul>
                </div>

                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="profileSubmitPassword()">Perbarui Password</button>
                    <button class="btn btn-outline-secondary" onclick="profileReset()">Reset</button>
                </div>
            </div>
        </div>
        `;
    }

    const container = document.getElementById('main-content');
    if (container) {
        container.innerHTML = content;
    }
}

window.profileTab = function(tab) {
    window._profileTab = tab;
    renderProfile();
}

window.profileSave = function() {
    alert('Perubahan profil berhasil disimpan!');
}

window.profileReset = function() {
    renderProfile();
}

window.profileTogglePass = function(id) {
    const el = document.getElementById(id);
    if(el) {
        if(el.type === 'password') {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }
}

window.profileCheckPassword = function(el) {
    const val = el.value;
    
    const reqLen = val.length >= 8;
    const reqCase = /[a-z]/.test(val) && /[A-Z]/.test(val);
    const reqNum = /[0-9]/.test(val);
    const reqSym = /[!@#$%^&*(),.?":{}|<>]/.test(val);

    const setIcon = (id, valid) => {
        const icon = document.getElementById(id);
        if(icon) {
            if(valid) {
                icon.className = 'fa-solid fa-circle-check text-success me-2';
            } else {
                icon.className = 'fa-solid fa-circle text-secondary me-2';
            }
        }
    }

    setIcon('req-len', reqLen);
    setIcon('req-case', reqCase);
    setIcon('req-num', reqNum);
    setIcon('req-sym', reqSym);

    let strength = 0;
    if(reqLen) strength += 25;
    if(reqCase) strength += 25;
    if(reqNum) strength += 25;
    if(reqSym) strength += 25;

    const bar = document.getElementById('pwd-strength-bar');
    if(bar) {
        bar.style.width = strength + '%';
        bar.className = 'progress-bar';
        if(strength === 0) {
            bar.style.width = '0%';
        } else if(strength <= 25) {
            bar.classList.add('bg-danger');
        } else if(strength <= 50) {
            bar.classList.add('bg-warning');
        } else if(strength <= 75) {
            bar.classList.add('bg-success');
        } else {
            bar.classList.add('bg-success');
            bar.style.backgroundColor = '#00ff00'; 
        }
    }
}

window.profileSubmitPassword = function() {
    const pNew = document.getElementById('pwd-new')?.value;
    const pConf = document.getElementById('pwd-confirm')?.value;
    if(pNew && pNew === pConf && pNew.length >= 8) {
        alert('Password berhasil diperbarui!');
    } else {
        alert('Password baru tidak valid atau tidak cocok!');
    }
}
