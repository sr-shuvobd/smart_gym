/**
 * Smart Gym Management System
 * Client-side logic for SQL Backend
 */

const API_BASE = 'http://localhost:3000/api';

const SmartGym = {
  keys: {
    USER: 'sgms_user' // Keep user session in sessionStorage
  },

  async init() {
    await this.ensureData();
    this.setupAuth();
    this.setupNavigation();
    await this.renderCurrentPage();
  },

  // API Callers
  async fetchAPI(endpoint, method = 'GET', body = null) {
    const options = { method, headers: {} };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    return await res.json();
  },

  uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  },

  async ensureData() {
    // Backend handles default trainers via /init
    await this.fetchAPI('/init');
  },

  // Auth
  getCurrentUser() {
    return JSON.parse(sessionStorage.getItem(this.keys.USER));
  },

  async login(email, password, role) {
    const response = await this.fetchAPI('/login', 'POST', { email, password, role });
    if (response.success) {
      sessionStorage.setItem(this.keys.USER, JSON.stringify(response.user));
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem(this.keys.USER);
    window.location.href = 'login.html';
  },

  setupAuth() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;

        const success = await this.login(email, password, role);
        if (success) {
          this.toast('Login successful', 'success');
          setTimeout(() => {
            if (role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'index.html';
          }, 1000);
        } else {
          this.toast('Invalid credentials', 'error');
        }
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      // Toggle fields based on role
      const roleSelect = document.getElementById('role');
      const specialtyGroup = document.getElementById('specialtyGroup');
      const planGroup = document.getElementById('planGroup');

      if (roleSelect) {
        roleSelect.addEventListener('change', () => {
          if (roleSelect.value === 'trainer') {
            specialtyGroup.style.display = 'block';
            planGroup.style.display = 'none';
          } else {
            specialtyGroup.style.display = 'none';
            planGroup.style.display = 'block';
          }
        });
      }

      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const age = document.getElementById('age').value;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const contact = document.getElementById('contact').value.trim();
        const role = document.getElementById('role').value;

        if (role === 'member') {
          const plan = document.getElementById('plan').value;
          const start = new Date();
          let expiry = new Date(start);
          if (plan === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
          if (plan === 'quarterly') expiry.setMonth(expiry.getMonth() + 3);
          if (plan === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);

          const newMember = {
            id: this.uid('member'),
            name, age, email, password, contact, plan,
            start: start.toISOString(),
            expiry: expiry.toISOString(),
            active: true
          };

          const res = await this.fetchAPI('/members', 'POST', newMember);
          if (res.error) return this.toast(res.error, 'error');
        } else if (role === 'trainer') {
          const specialty = document.getElementById('specialty').value.trim();
          if (!specialty) return this.toast('Please enter specialty', 'error');

          const newTrainer = {
            id: this.uid('trainer'),
            name, age, email, password, contact, specialty
          };
          const res = await this.fetchAPI('/trainers', 'POST', newTrainer);
          if (res.error) return this.toast(res.error, 'error');
        }

        this.toast('Registration successful! Please login.', 'success');
        registerForm.reset();
        setTimeout(() => window.location.href = 'login.html', 1500);
      });
    }
  },

  setupNavigation() {
    const user = this.getCurrentUser();
    const navContainer = document.querySelector('.site-header nav');

    const homeLink = navContainer.querySelector('a[href="index.html"]');
    const userNav = document.getElementById('user-nav');

    let navHtml = '<a href="index.html">Home</a>';

    if (user && user.role === 'admin') {
      navHtml += `
        <a href="admin.html">Dashboard</a>
        <a href="members.html">Members</a>
        <a href="trainers.html">Trainers</a>
        <a href="plans.html">Plans</a>
        <a href="payments.html">Payments</a>
        <a href="reports.html">Reports</a>
      `;
    } else if (user && user.role === 'member') {
      navHtml += `<a href="payments.html">Payments</a>`;
    } else if (user && user.role === 'trainer') {
      navHtml += `<a href="plans.html">Plans</a>`;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = navHtml;

    while (navContainer.firstChild) {
      if (navContainer.firstChild.id === 'user-nav') break;
      navContainer.removeChild(navContainer.firstChild);
    }

    Array.from(tempDiv.children).forEach(child => {
      navContainer.insertBefore(child, userNav);
    });

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.site-header nav a');
    links.forEach(link => {
      if (link.getAttribute('href') === currentPath) link.classList.add('active');
    });

    if (userNav) {
      if (user) {
        userNav.innerHTML = `
          <span class="badge badge-success" style="margin-right: 1rem;">${user.name} (${user.role})</span>
          <button id="logoutBtn" class="btn btn-sm btn-outline">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        const heroLoginBtn = document.getElementById('hero-login-btn');
        const heroRegBtn = document.getElementById('hero-register-btn');
        if (heroLoginBtn) {
          heroLoginBtn.textContent = 'My Dashboard';
          heroLoginBtn.href = 'index.html';
          heroLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const dash = document.getElementById('userDashboard');
            if (dash) dash.scrollIntoView({ behavior: 'smooth' });
          });
        }
        if (heroRegBtn) heroRegBtn.style.display = 'none';
      } else {
        userNav.innerHTML = `
          <a href="login.html" id="login-link" class="btn btn-sm btn-outline" style="margin-right: 0.5rem;">Login</a>
          <a href="register.html" id="register-link" class="btn btn-sm btn-primary">Register</a>
         `;
      }
    }
  },

  async renderCurrentPage() {
    const path = window.location.pathname;
    const user = this.getCurrentUser();

    const adminPages = ['members.html', 'reports.html', 'admin.html'];
    const trainerPages = ['plans.html'];

    if (adminPages.some(p => path.includes(p))) {
      if (!user || user.role !== 'admin') {
        this.toast('Access Denied. Admins only.', 'error');
        return setTimeout(() => window.location.href = 'index.html', 1500);
      }
    }

    if (trainerPages.some(p => path.includes(p))) {
      if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
        this.toast('Access Denied. Trainers or Admins only.', 'error');
        return setTimeout(() => window.location.href = 'index.html', 1500);
      }
    }

    if (path.includes('members.html')) await this.renderMembersPage();
    if (path.includes('trainers.html')) await this.renderTrainersPage();
    if (path.includes('plans.html')) await this.renderPlansPage();
    if (path.includes('payments.html')) await this.renderPaymentsPage();
    if (path.includes('reports.html')) await this.renderReportsPage();

    if (path.includes('index.html') || path.endsWith('/')) await this.renderDashboard();
  },

  async renderMembersPage() {
    const members = await this.fetchAPI('/members');
    const container = document.getElementById('membersList');
    const select = document.getElementById('memberSelect');
    const user = this.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    if (container) {
      if (members.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No members found.</p>';
      } else {
        const html = `
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Plan</th><th>Expiry</th><th>Status</th>
                ${isAdmin ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${members.map(m => {
          const isExpired = new Date(m.expiry) < new Date();
          return `
                  <tr>
                    <td>${m.name}</td><td>${m.email}</td><td><span class="badge">${m.plan}</span></td>
                    <td>${new Date(m.expiry).toLocaleDateString()}</td>
                    <td><span class="badge ${isExpired ? 'badge-danger' : 'badge-success'}">${isExpired ? 'Expired' : 'Active'}</span></td>
                    ${isAdmin ? `
                    <td>
                      <button class="btn btn-sm btn-outline" onclick="SmartGym.editMember('${m.id}')" style="margin-right: 0.5rem;"><i class="fas fa-edit"></i></button>
                      <button class="btn btn-sm btn-outline" onclick="SmartGym.deleteMember('${m.id}')" style="color: var(--danger-color); border-color: var(--danger-color);"><i class="fas fa-trash"></i></button>
                    </td>
                    ` : ''}
                  </tr>
                `;
        }).join('')}
            </tbody>
          </table>
        `;
        container.innerHTML = html;
      }
    }

    // Dynamic globals to match old HTML logic
    window.SmartGym.editMember = async (id) => {
      const member = members.find(m => m.id === id);
      if (!member) return;

      const newName = prompt('Enter new name:', member.name);
      const newEmail = prompt('Enter new email:', member.email);
      const newPlan = prompt('Enter new plan (monthly/quarterly/yearly):', member.plan);
      
      const updates = {};
      if (newName) updates.name = newName;
      if (newEmail) updates.email = newEmail;
      if (newPlan && ['monthly', 'quarterly', 'yearly'].includes(newPlan)) updates.plan = newPlan;

      await this.fetchAPI(`/members/${id}`, 'PUT', updates);
      this.toast('Member updated', 'success');
      this.renderMembersPage();
    };

    window.SmartGym.deleteMember = async (id) => {
      if (!confirm('Are you sure you want to delete this member?')) return;
      await this.fetchAPI(`/members/${id}`, 'DELETE');
      this.toast('Member deleted', 'success');
      this.renderMembersPage();
    };

    if (select) {
      select.innerHTML = members.length
        ? members.map(m => `<option value="${m.id}">${m.name} (${m.email})</option>`).join('')
        : '<option value="">No members</option>';
    }

    const applyBtn = document.getElementById('applyMemberAction');
    if (applyBtn) {
      const newApplyBtn = applyBtn.cloneNode(true);
      applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
      
      newApplyBtn.addEventListener('click', async () => {
        const memberId = document.getElementById('memberSelect').value;
        const action = document.getElementById('memberAction').value;

        if (!memberId) return this.toast('Please select a member', 'error');

        const member = members.find(m => m.id === memberId);
        if (!member) return;

        let updates = {};
        if (action === 'cancel') {
          updates = { active: false, expiry: new Date().toISOString() };
          this.toast('Membership canceled', 'success');
        } else if (action === 'renew') {
          const now = new Date();
          let expiry = new Date(now);
          if (member.plan === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
          if (member.plan === 'quarterly') expiry.setMonth(expiry.getMonth() + 3);
          if (member.plan === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);

          updates = { active: true, expiry: expiry.toISOString() };
          this.toast('Membership renewed', 'success');
        }

        await this.fetchAPI(`/members/${memberId}`, 'PUT', updates);
        this.renderMembersPage();
      });
    }
  },

  async renderTrainersPage() {
    const trainers = await this.fetchAPI('/trainers');
    const members = await this.fetchAPI('/members');
    const sessions = await this.fetchAPI('/sessions');
    
    const listContainer = document.getElementById('trainersList');
    const user = this.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    if (listContainer) {
      listContainer.innerHTML = trainers.map(t => `
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-user-ninja"></i></div>
          <h3>${t.name}</h3>
          <p class="text-muted">${t.specialty}</p>
          <p class="small">${t.email}</p>
          ${isAdmin ? `
          <div class="mt-4" style="display: flex; gap: 0.5rem; justify-content: center;">
            <button class="btn btn-sm btn-outline" onclick="SmartGym.editTrainer('${t.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-sm btn-outline" onclick="SmartGym.deleteTrainer('${t.id}')" style="color: var(--danger-color); border-color: var(--danger-color);"><i class="fas fa-trash"></i> Delete</button>
          </div>
          ` : ''}
        </div>
      `).join('');
    }

    window.SmartGym.editTrainer = async (id) => {
      const trainer = trainers.find(t => t.id === id);
      if (!trainer) return;

      const newName = prompt('Enter new name:', trainer.name);
      const newSpecialty = prompt('Enter new specialty:', trainer.specialty);
      const newEmail = prompt('Enter new email:', trainer.email);
      
      const updates = {};
      if (newName) updates.name = newName;
      if (newSpecialty) updates.specialty = newSpecialty;
      if (newEmail) updates.email = newEmail;

      await this.fetchAPI(`/trainers/${id}`, 'PUT', updates);
      this.toast('Trainer updated', 'success');
      this.renderTrainersPage();
    };

    window.SmartGym.deleteTrainer = async (id) => {
      if (!confirm('Are you sure you want to delete this trainer?')) return;
      await this.fetchAPI(`/trainers/${id}`, 'DELETE');
      this.toast('Trainer deleted', 'success');
      this.renderTrainersPage();
    };

    const schedMember = document.getElementById('schedMember');
    const schedTrainer = document.getElementById('schedTrainer');

    if (schedMember && schedTrainer) {
      schedMember.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
      schedTrainer.innerHTML = trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    const assignBtn = document.getElementById('assignBtn');
    if (assignBtn) {
      const newAssignBtn = assignBtn.cloneNode(true);
      assignBtn.parentNode.replaceChild(newAssignBtn, assignBtn);

      newAssignBtn.addEventListener('click', async () => {
        const memberId = document.getElementById('schedMember').value;
        const trainerId = document.getElementById('schedTrainer').value;
        const time = document.getElementById('schedTime').value;

        if (!memberId || !trainerId || !time) return this.toast('Please fill all fields', 'error');

        const existing = sessions.find(s => s.trainerId === trainerId && s.time === time);
        if (existing) return this.toast('Trainer is busy at this time', 'error');

        const reqBody = { id: this.uid('sess'), memberId, trainerId, time };
        const res = await this.fetchAPI('/sessions', 'POST', reqBody);
        
        if (res.error) {
           this.toast(res.error, 'error');
        } else {
           this.toast('Session assigned successfully', 'success');
           this.renderTrainersPage();
        }
      });
    }

    this.renderSessionsList(sessions, members, trainers);
  },

  renderSessionsList(sessions, members, trainers) {
    const container = document.getElementById('sessions');
    if (!container) return;

    if (sessions.length === 0) {
      container.innerHTML = '<p class="text-muted">No sessions scheduled.</p>';
      return;
    }

    container.innerHTML = sessions.map(s => {
      const m = members.find(x => x.id === s.memberId) || { name: 'Unknown' };
      const t = trainers.find(x => x.id === s.trainerId) || { name: 'Unknown' };
      return `
        <div class="feature-card" style="padding: 1rem;">
          <strong>${t.name}</strong> with <strong>${m.name}</strong>
          <div class="text-muted small">${new Date(s.time).toLocaleString()}</div>
        </div>
      `;
    }).join('');
  },

  async renderPlansPage() {
    const user = this.getCurrentUser();
    const members = await this.fetchAPI('/members');
    const plans = await this.fetchAPI('/plans');

    if (user && user.role === 'admin') {
      const manageSection = document.getElementById('managePlansSection');
      if (manageSection) {
        manageSection.style.display = 'block';
        // Note: keeping these plans in localStorage or static array since they are static options.
        let mPlans = [
          { id: 'monthly', name: 'Monthly Plan', price: 29.99, desc: 'Full access for 1 month' },
          { id: 'quarterly', name: 'Quarterly Plan', price: 79.99, desc: 'Full access for 3 months' },
          { id: 'yearly', name: 'Yearly Plan', price: 299.99, desc: 'Full access for 1 year' }
        ];
        
        const container = document.getElementById('managePlansList');
        if (container) {
          container.innerHTML = mPlans.map(p => `
            <div class="feature-card" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4>${p.name}</h4>
                <p class="text-muted">$${p.price} - ${p.desc}</p>
              </div>
            </div>
          `).join('');
        }
      }
    }

    const select = document.getElementById('planMember');
    if (select) {
      select.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    const assignBtn = document.getElementById('assignPlan');
    if (assignBtn) {
      const newBtn = assignBtn.cloneNode(true);
      assignBtn.parentNode.replaceChild(newBtn, assignBtn);

      newBtn.addEventListener('click', async () => {
        const memberId = document.getElementById('planMember').value;
        const workout = document.getElementById('workout').value.trim();
        const diet = document.getElementById('diet').value.trim();

        if (!memberId || (!workout && !diet)) return this.toast('Please provide details', 'error');

        const newPlan = { id: this.uid('plan'), memberId, workout, diet, assignedAt: new Date().toISOString() };
        await this.fetchAPI('/plans', 'POST', newPlan);
        this.toast('Plan assigned successfully', 'success');
        this.renderPlansPage();
      });
    }

    const container = document.getElementById('assignedPlans');
    if (container) {
       container.innerHTML = plans.length ? plans.map(p => {
        const m = members.find(x => x.id === p.memberId) || { name: 'Unknown' };
        return `
          <div class="feature-card">
            <h3>${m.name}</h3>
            <div class="mb-2"><strong>Workout:</strong> ${p.workout || '--'}</div>
            <div><strong>Diet:</strong> ${p.diet || '--'}</div>
          </div>
        `;
      }).join('') : '<p class="text-muted">No plans assigned.</p>';
    }
  },

  async renderPaymentsPage() {
    const user = this.getCurrentUser();
    const members = await this.fetchAPI('/members');
    let payments = await this.fetchAPI('/payments');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('msg') === 'success') {
      setTimeout(() => this.toast('Payment completed successfully!', 'success'), 500);
      window.history.replaceState(null, null, window.location.pathname);
    } else if (urlParams.get('msg') === 'fail') {
      setTimeout(() => this.toast('Payment failed', 'error'), 500);
      window.history.replaceState(null, null, window.location.pathname);
    } else if (urlParams.get('msg') === 'cancel') {
      setTimeout(() => this.toast('Payment was cancelled', 'info'), 500);
      window.history.replaceState(null, null, window.location.pathname);
    }

    const recordSection = document.querySelector('.feature-card');
    if (recordSection) {
      recordSection.style.display = 'block';
      const title = recordSection.querySelector('h3');
      if (title) title.textContent = user.role === 'admin' ? 'Record Payment' : 'Make a Payment';
    }

    const select = document.getElementById('payMember');
    if (select) {
      if (user.role === 'member') {
        select.innerHTML = `<option value="${user.id}">${user.name}</option>`;
        select.disabled = true;
        
        const amountDiv = document.getElementById('payAmount').closest('div');
        amountDiv.innerHTML = `
          <label>Select Plan</label>
          <select id="payPlan">
            <option value="" data-amount="">Select a Plan...</option>
            <option value="monthly" data-amount="29.99">Monthly ($29.99)</option>
            <option value="quarterly" data-amount="79.99">Quarterly ($79.99)</option>
            <option value="yearly" data-amount="299.99">Yearly ($299.99)</option>
          </select>
          <input type="hidden" id="payAmount" value="" />
        `;
        document.getElementById('payPlan').addEventListener('change', (e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          document.getElementById('payAmount').value = selectedOption.getAttribute('data-amount');
        });
        
      } else {
        select.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        select.disabled = false;
      }
    }

    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
      const newBtn = payBtn.cloneNode(true);
      payBtn.parentNode.replaceChild(newBtn, payBtn);

      newBtn.onclick = async () => {
        const memberId = document.getElementById('payMember').value;
        const amount = Number(document.getElementById('payAmount').value);
        const method = document.getElementById('payMethod').value;
        
        const planSelect = document.getElementById('payPlan');
        const planId = planSelect ? planSelect.value : '';

        if (!memberId || !amount) return this.toast('Invalid payment details', 'error');
        if (planSelect && !planId) return this.toast('Please select a plan', 'error');

        if (user && user.role === 'admin') {
            const newPayment = { id: window.SmartGym ? window.SmartGym.uid('pay') : `pay_${Date.now()}`, memberId, amount, method, at: new Date().toISOString() };
            await this.fetchAPI('/payments', 'POST', newPayment);
            this.toast('Payment recorded successfully!', 'success');
            if (document.getElementById('payAmount')) document.getElementById('payAmount').value = '';
            this.renderPaymentsPage();
        } else {
            this.toast('Redirecting to secure payment gateway...', 'info');
            const reqBody = { memberId, amount, method, planId };
            const res = await this.fetchAPI('/init-payment', 'POST', reqBody);
            
            if (res.success && res.GatewayPageURL) {
                window.location.href = res.GatewayPageURL;
            } else {
                this.toast(res.message || 'Payment init failed', 'error');
            }
        }
      };
    }

    const container = document.getElementById('transactions');
    if (container) {
      if (user && user.role === 'member') {
        payments = payments.filter(p => p.memberId === user.id);
      }
      if (payments.length === 0) {
        container.innerHTML = '<p class="text-muted">No transactions found.</p>';
      } else {
        container.innerHTML = `
          <table>
            <thead><tr><th>Member</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
            <tbody>
              ${payments.map(p => {
          const m = members.find(x => x.id === p.memberId) || { name: 'Unknown' };
          return `<tr><td>${m.name}</td><td>$${p.amount}</td><td>${p.method}</td><td>${new Date(p.at).toLocaleDateString()}</td></tr>`;
        }).join('')}
            </tbody>
          </table>
        `;
      }
    }
  },

  async renderReportsPage() {
    const [members, payments, sessions, trainers] = await Promise.all([
      this.fetchAPI('/members'),
      this.fetchAPI('/payments'),
      this.fetchAPI('/sessions'),
      this.fetchAPI('/trainers')
    ]);

    const active = members.filter(m => new Date(m.expiry) > new Date()).length;
    const expired = members.length - active;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const matchDOM = (id, val) => document.getElementById(id) && (document.getElementById(id).textContent = val);
    matchDOM('totalMembers', members.length);
    matchDOM('activeMembers', active);
    matchDOM('totalRevenue', `$${totalRevenue.toLocaleString()}`);
    matchDOM('totalSessions', sessions.length);

    const commonOptions = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
    };

    const membershipCtx = document.getElementById('membershipChart');
    if (membershipCtx) {
      new Chart(membershipCtx, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Expired'],
          datasets: [{ data: [active, expired], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: { ...commonOptions, cutout: '70%' }
      });
    }

    const paymentCtx = document.getElementById('paymentChart');
    if (paymentCtx) {
      const monthly = {};
      payments.forEach(p => {
        const month = new Date(p.at).toLocaleString('default', { month: 'short' });
        monthly[month] = (monthly[month] || 0) + p.amount;
      });
      new Chart(paymentCtx, {
        type: 'line',
        data: {
          labels: Object.keys(monthly),
          datasets: [{
            label: 'Revenue', data: Object.values(monthly),
            borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6
          }]
        },
        options: {
          ...commonOptions,
          scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#e2e8f0' } }, x: { grid: { display: false } } }
        }
      });
    }

    const trainerCtx = document.getElementById('trainerChart');
    if (trainerCtx) {
      const counts = trainers.map(t => ({
        name: t.name,
        count: sessions.filter(s => s.trainerId === t.id).length
      }));
      new Chart(trainerCtx, {
        type: 'bar',
        data: {
          labels: counts.map(c => c.name),
          datasets: [{
            label: 'Sessions', data: counts.map(c => c.count),
            backgroundColor: ['#f59e0b', '#8b5cf6', '#ec4899'], borderRadius: 6, barThickness: 30
          }]
        },
        options: {
          ...commonOptions,
          scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#e2e8f0' } }, x: { grid: { display: false } } }
        }
      });
    }
  },

  async renderDashboard() {
    const user = this.getCurrentUser();
    const dashboard = document.getElementById('userDashboard');
    const pricing = document.getElementById('pricing');

    if (pricing) pricing.style.display = user ? 'none' : 'block';

    if (dashboard && user && user.role === 'member') {
      const members = await this.fetchAPI('/members');
      const memberData = members.find(m => m.id === user.id);

      if (memberData) {
        const isExpired = new Date(memberData.expiry) < new Date();
        const plans = await this.fetchAPI('/plans');
        const userPlans = plans.filter(p => p.memberId === user.id);
        const lastPlan = userPlans[userPlans.length - 1];

        dashboard.innerHTML = `
          <div class="features-grid mb-4">
            <div class="feature-card">
              <h3>Membership Status</h3>
              <div class="mb-2">
                <span class="badge ${isExpired ? 'badge-danger' : 'badge-success'}">
                  ${isExpired ? 'Expired' : 'Active'}
                </span>
              </div>
              <p class="text-muted">Expires: ${new Date(memberData.expiry).toLocaleDateString()}</p>
            </div>
            <div class="feature-card">
              <h3>Current Plan</h3>
              <p class="text-muted">Plan Type: <strong>${memberData.plan}</strong></p>
            </div>
            <div class="feature-card">
              <h3>Assigned Workout</h3>
              <p class="text-muted">${lastPlan ? lastPlan.workout : 'No workout assigned yet.'}</p>
            </div>
            <div class="feature-card">
              <h3>Assigned Diet</h3>
              <p class="text-muted">${lastPlan ? lastPlan.diet : 'No diet plan assigned yet.'}</p>
            </div>
          </div>
          
          <h3 class="mb-3">Purchase Plans</h3>
          <div class="features-grid">
             <div class="feature-card text-center">
                <h4>Renew Membership</h4>
                <p>Extend your current plan.</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="window.location.href='payments.html'">Pay Now</button>
             </div>
             <div class="feature-card text-center">
                <h4>Personal Training</h4>
                <p>Book a session with a trainer.</p>
                <button class="btn btn-outline btn-sm mt-2" onclick="alert('Please contact admin to book a trainer.')">Contact Admin</button>
             </div>
          </div>
        `;
        dashboard.style.display = 'block';
      }
    }
  },

  toast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  createToastContainer() {
    const div = document.createElement('div');
    div.className = 'toast-container';
    document.body.appendChild(div);
    return div;
  }
};

window.SmartGym = SmartGym;
document.addEventListener('DOMContentLoaded', () => SmartGym.init());
