/**
 * Smart Gym Management System
 * Client-side logic
 */

const SmartGym = {
  keys: {
    USER: 'sgms_user',
    MEMBERS: 'sgms_members',
    TRAINERS: 'sgms_trainers',
    SESSIONS: 'sgms_sessions',
    PLANS: 'sgms_plans',
    PAYMENTS: 'sgms_payments'
  },

  init() {
    this.ensureData();
    this.setupAuth();
    this.setupNavigation();
    this.renderCurrentPage();
  },

  // Data Management
  read(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  },

  ensureData() {
    const trainers = this.read(this.keys.TRAINERS);
    if (trainers.length === 0) {
      const defaults = [
        { id: this.uid('trainer'), name: 'Arif Hasan', specialty: 'Strength', email: 'arif@gym.com', password: 'password' },
        { id: this.uid('trainer'), name: 'Nusrat Jahan', specialty: 'Yoga', email: 'nusrat@gym.com', password: 'password' },
        { id: this.uid('trainer'), name: 'Rafi Ahmed', specialty: 'Cardio', email: 'rafi@gym.com', password: 'password' }
      ];
      this.write(this.keys.TRAINERS, defaults);
    }
  },



  // Auth
  getCurrentUser() {
    return JSON.parse(sessionStorage.getItem(this.keys.USER));
  },

  login(email, password, role) {
    let user = null;
    if (role === 'member') {
      const members = this.read(this.keys.MEMBERS);
      user = members.find(m => m.email === email && m.password === password);
    } else if (role === 'trainer') {
      const trainers = this.read(this.keys.TRAINERS);
      user = trainers.find(t => t.email === email && t.password === password);
    } else if (role === 'admin' && email === 'srs@gmail.com' && password === '1234') {
      user = { name: 'Admin', role: 'admin', email: 'srs@gmail.com' };
    }

    if (user) {
      sessionStorage.setItem(this.keys.USER, JSON.stringify({ ...user, role }));
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
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;

        if (this.login(email, password, role)) {
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

      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const age = document.getElementById('age').value;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const contact = document.getElementById('contact').value.trim();
        const role = document.getElementById('role').value;

        if (role === 'member') {
          const plan = document.getElementById('plan').value;
          const members = this.read(this.keys.MEMBERS);
          if (members.find(m => m.email === email)) {
            this.toast('Email already registered', 'error');
            return;
          }

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

          members.push(newMember);
          this.write(this.keys.MEMBERS, members);
        } else if (role === 'trainer') {
          const specialty = document.getElementById('specialty').value.trim();
          if (!specialty) {
            this.toast('Please enter specialty', 'error');
            return;
          }

          const trainers = this.read(this.keys.TRAINERS);
          if (trainers.find(t => t.email === email)) {
            this.toast('Email already registered', 'error');
            return;
          }

          const newTrainer = {
            id: this.uid('trainer'),
            name, age, email, password, contact, specialty
          };

          trainers.push(newTrainer);
          this.write(this.keys.TRAINERS, trainers);
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

    // Clear existing nav links except Home
    const homeLink = navContainer.querySelector('a[href="index.html"]');
    const userNav = document.getElementById('user-nav');

    // Rebuild Nav based on role
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
      // Members see Payments
      navHtml += `<a href="payments.html">Payments</a>`;
    } else if (user && user.role === 'trainer') {
      // Trainers see Plans
      navHtml += `<a href="plans.html">Plans</a>`;
    } else {
      // Guests
      // No extra links for guests
    }

    // Preserve user-nav div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = navHtml;

    // Clear and append
    while (navContainer.firstChild) {
      if (navContainer.firstChild.id === 'user-nav') break;
      navContainer.removeChild(navContainer.firstChild);
    }

    // Insert new links before user-nav
    Array.from(tempDiv.children).forEach(child => {
      navContainer.insertBefore(child, userNav);
    });

    // Update active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.site-header nav a');
    links.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });

    // Auth buttons
    if (userNav) {
      if (user) {
        userNav.innerHTML = `
          <span class="badge badge-success" style="margin-right: 1rem;">${user.name} (${user.role})</span>
          <button id="logoutBtn" class="btn btn-sm btn-outline">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Hero Buttons Logic
        const heroLoginBtn = document.getElementById('hero-login-btn');
        const heroRegBtn = document.getElementById('hero-register-btn');
        if (heroLoginBtn) {
          heroLoginBtn.textContent = 'My Dashboard';
          heroLoginBtn.href = 'index.html'; // Or just reload/scroll
          heroLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('userDashboard').scrollIntoView({ behavior: 'smooth' });
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

  // Page Renderers
  renderCurrentPage() {
    const path = window.location.pathname;
    const user = this.getCurrentUser();

    // Protection Logic
    // Removed payments.html from restricted list so members can access it
    // Removed plans.html from restricted list so trainers can access it
    const adminPages = ['members.html', 'reports.html', 'admin.html'];
    const trainerPages = ['plans.html'];

    const isProtectedAdmin = adminPages.some(p => path.includes(p));
    const isProtectedTrainer = trainerPages.some(p => path.includes(p));

    if (isProtectedAdmin) {
      if (!user || user.role !== 'admin') {
        this.toast('Access Denied. Admins only.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
      }
    }

    if (isProtectedTrainer) {
      if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
        this.toast('Access Denied. Trainers or Admins only.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
      }
    }

    if (path.includes('members.html')) this.renderMembersPage();
    if (path.includes('trainers.html')) this.renderTrainersPage();
    if (path.includes('plans.html')) this.renderPlansPage();
    if (path.includes('payments.html')) this.renderPaymentsPage();
    if (path.includes('reports.html')) this.renderReportsPage();

    if (path.includes('index.html') || path.endsWith('/')) this.renderDashboard();
  },

  renderMembersPage() {
    const members = this.read(this.keys.MEMBERS);
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
                <th>Name</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Status</th>
                ${isAdmin ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${members.map(m => {
          const isExpired = new Date(m.expiry) < new Date();
          return `
                  <tr>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td><span class="badge">${m.plan}</span></td>
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

    // Edit Member Logic
    this.editMember = (id) => {
      const members = this.read(this.keys.MEMBERS);
      const member = members.find(m => m.id === id);
      if (!member) return;

      const newName = prompt('Enter new name:', member.name);
      if (newName) member.name = newName;

      const newEmail = prompt('Enter new email:', member.email);
      if (newEmail) member.email = newEmail;

      const newPlan = prompt('Enter new plan (monthly/quarterly/yearly):', member.plan);
      if (newPlan && ['monthly', 'quarterly', 'yearly'].includes(newPlan)) member.plan = newPlan;

      this.write(this.keys.MEMBERS, members);
      this.toast('Member updated', 'success');
      this.renderMembersPage();
    };

    // Delete Member Logic
    this.deleteMember = (id) => {
      if (!confirm('Are you sure you want to delete this member?')) return;
      let members = this.read(this.keys.MEMBERS);
      members = members.filter(m => m.id !== id);
      this.write(this.keys.MEMBERS, members);
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
      applyBtn.addEventListener('click', () => {
        const memberId = document.getElementById('memberSelect').value;
        const action = document.getElementById('memberAction').value;

        if (!memberId) {
          this.toast('Please select a member', 'error');
          return;
        }

        const members = this.read(this.keys.MEMBERS);
        const idx = members.findIndex(m => m.id === memberId);

        if (idx === -1) return;

        if (action === 'cancel') {
          members[idx].active = false;
          members[idx].expiry = new Date().toISOString();
          this.toast('Membership canceled', 'success');
        } else if (action === 'renew') {
          const now = new Date();
          const plan = members[idx].plan;
          let expiry = new Date(now);
          if (plan === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
          if (plan === 'quarterly') expiry.setMonth(expiry.getMonth() + 3);
          if (plan === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);

          members[idx].expiry = expiry.toISOString();
          members[idx].active = true;
          this.toast('Membership renewed', 'success');
        }

        this.write(this.keys.MEMBERS, members);
        this.renderMembersPage();
      });
    }
  },

  renderTrainersPage() {
    const trainers = this.read(this.keys.TRAINERS);
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

    // Edit Trainer Logic
    this.editTrainer = (id) => {
      const trainers = this.read(this.keys.TRAINERS);
      const trainer = trainers.find(t => t.id === id);
      if (!trainer) return;

      const newName = prompt('Enter new name:', trainer.name);
      if (newName) trainer.name = newName;

      const newSpecialty = prompt('Enter new specialty:', trainer.specialty);
      if (newSpecialty) trainer.specialty = newSpecialty;

      const newEmail = prompt('Enter new email:', trainer.email);
      if (newEmail) trainer.email = newEmail;

      this.write(this.keys.TRAINERS, trainers);
      this.toast('Trainer updated', 'success');
      this.renderTrainersPage();
    };

    // Delete Trainer Logic
    this.deleteTrainer = (id) => {
      if (!confirm('Are you sure you want to delete this trainer?')) return;
      let trainers = this.read(this.keys.TRAINERS);
      trainers = trainers.filter(t => t.id !== id);
      this.write(this.keys.TRAINERS, trainers);
      this.toast('Trainer deleted', 'success');
      this.renderTrainersPage();
    };

    // Scheduling
    const schedMember = document.getElementById('schedMember');
    const schedTrainer = document.getElementById('schedTrainer');

    if (schedMember && schedTrainer) {
      const members = this.read(this.keys.MEMBERS);
      schedMember.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
      schedTrainer.innerHTML = trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    const assignBtn = document.getElementById('assignBtn');
    if (assignBtn) {
      assignBtn.addEventListener('click', () => {
        const memberId = document.getElementById('schedMember').value;
        const trainerId = document.getElementById('schedTrainer').value;
        const time = document.getElementById('schedTime').value;

        if (!memberId || !trainerId || !time) {
          this.toast('Please fill all fields', 'error');
          return;
        }

        const sessions = this.read(this.keys.SESSIONS);
        if (sessions.some(s => s.trainerId === trainerId && s.time === time)) {
          this.toast('Trainer is busy at this time', 'error');
          return;
        }

        sessions.push({ id: this.uid('sess'), memberId, trainerId, time });
        this.write(this.keys.SESSIONS, sessions);
        this.toast('Session assigned successfully', 'success');
        this.renderSessionsList();
      });
    }
    this.renderSessionsList();
  },

  renderSessionsList() {
    const container = document.getElementById('sessions');
    if (!container) return;

    const sessions = this.read(this.keys.SESSIONS);
    const members = this.read(this.keys.MEMBERS);
    const trainers = this.read(this.keys.TRAINERS);

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

  renderPlansPage() {
    const user = this.getCurrentUser();

    // Admin: Manage Membership Plans
    if (user && user.role === 'admin') {
      const manageSection = document.getElementById('managePlansSection');
      if (manageSection) {
        manageSection.style.display = 'block';

        // Ensure default plans exist
        let plans = this.read('sgms_membership_plans');
        if (plans.length === 0) {
          plans = [
            { id: 'monthly', name: 'Monthly Plan', price: 29.99, desc: 'Full access for 1 month' },
            { id: 'quarterly', name: 'Quarterly Plan', price: 79.99, desc: 'Full access for 3 months' },
            { id: 'yearly', name: 'Yearly Plan', price: 299.99, desc: 'Full access for 1 year' }
          ];
          this.write('sgms_membership_plans', plans);
        }

        const container = document.getElementById('managePlansList');
        if (container) {
          container.innerHTML = plans.map(p => `
            <div class="feature-card" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4>${p.name}</h4>
                <p class="text-muted">$${p.price} - ${p.desc}</p>
              </div>
              <button class="btn btn-sm btn-outline" onclick="SmartGym.editPlan('${p.id}')">Edit</button>
            </div>
          `).join('');
        }

        // Edit Modal Logic (Simplified as prompt/alert for now)
        this.editPlan = (id) => {
          const plans = this.read('sgms_membership_plans');
          const plan = plans.find(p => p.id === id);
          if (!plan) return;

          const newPrice = prompt(`Enter new price for ${plan.name}:`, plan.price);
          if (newPrice !== null && !isNaN(newPrice)) {
            plan.price = Number(newPrice);
            this.write('sgms_membership_plans', plans);
            this.toast('Plan updated successfully', 'success');
            this.renderPlansPage(); // Re-render
          }
        };
      }
    }

    // Existing Logic: Assign Workout/Diet Plans
    const members = this.read(this.keys.MEMBERS);
    const select = document.getElementById('planMember');
    if (select) {
      select.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    const assignBtn = document.getElementById('assignPlan');
    if (assignBtn) {
      assignBtn.addEventListener('click', () => {
        const memberId = document.getElementById('planMember').value;
        const workout = document.getElementById('workout').value.trim();
        const diet = document.getElementById('diet').value.trim();

        if (!memberId || (!workout && !diet)) {
          this.toast('Please provide details', 'error');
          return;
        }

        const plans = this.read(this.keys.PLANS);
        plans.push({ id: this.uid('plan'), memberId, workout, diet, assignedAt: new Date().toISOString() });
        this.write(this.keys.PLANS, plans);
        this.toast('Plan assigned successfully', 'success');
        this.renderAssignedPlans();
      });
    }
    this.renderAssignedPlans();
  },

  renderAssignedPlans() {
    const container = document.getElementById('assignedPlans');
    if (!container) return;

    const plans = this.read(this.keys.PLANS);
    const members = this.read(this.keys.MEMBERS);

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
  },

  renderPaymentsPage() {
    const user = this.getCurrentUser();
    const members = this.read(this.keys.MEMBERS);

    // Show record payment form for everyone, but pre-fill/lock member if user is member
    const recordSection = document.querySelector('.feature-card');
    if (recordSection) {
      recordSection.style.display = 'block';
      const title = recordSection.querySelector('h3');
      if (title) title.textContent = user.role === 'admin' ? 'Record Payment' : 'Make a Payment';
    }

    const select = document.getElementById('payMember');
    if (select) {
      if (user.role === 'member') {
        // Only show self
        select.innerHTML = `<option value="${user.id}">${user.name}</option>`;
        select.disabled = true;
      } else {
        select.innerHTML = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        select.disabled = false;
      }
    }

    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
      // Remove old listeners to prevent duplicates if any (simple way is to clone or just rely on page reload logic)
      // For this simple app, we assume page reload or single init.
      payBtn.onclick = () => {
        const memberId = document.getElementById('payMember').value;
        const amount = Number(document.getElementById('payAmount').value);
        const method = document.getElementById('payMethod').value;

        if (!memberId || !amount) {
          this.toast('Invalid payment details', 'error');
          return;
        }

        const payments = this.read(this.keys.PAYMENTS);
        payments.push({ id: this.uid('pay'), memberId, amount, method, at: new Date().toISOString() });
        this.write(this.keys.PAYMENTS, payments);
        this.toast('Payment successful!', 'success');
        this.renderTransactions();

        // Clear input
        document.getElementById('payAmount').value = '';
      };
    }
    this.renderTransactions();
  },

  renderTransactions() {
    const container = document.getElementById('transactions');
    if (!container) return;

    let payments = this.read(this.keys.PAYMENTS);
    const members = this.read(this.keys.MEMBERS);
    const user = this.getCurrentUser();

    // Filter for member
    if (user && user.role === 'member') {
      payments = payments.filter(p => p.memberId === user.id);
    }

    if (payments.length === 0) {
      container.innerHTML = '<p class="text-muted">No transactions found.</p>';
      return;
    }

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
  },

  renderReportsPage() {
    const members = this.read(this.keys.MEMBERS);
    const payments = this.read(this.keys.PAYMENTS);
    const sessions = this.read(this.keys.SESSIONS);
    const trainers = this.read(this.keys.TRAINERS);

    // Calculate Stats
    const active = members.filter(m => new Date(m.expiry) > new Date()).length;
    const expired = members.length - active;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Update Stats DOM
    const totalMembersEl = document.getElementById('totalMembers');
    const activeMembersEl = document.getElementById('activeMembers');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalSessionsEl = document.getElementById('totalSessions');

    if (totalMembersEl) totalMembersEl.textContent = members.length;
    if (activeMembersEl) activeMembersEl.textContent = active;
    if (totalRevenueEl) totalRevenueEl.textContent = `$${totalRevenue.toLocaleString()}`;
    if (totalSessionsEl) totalSessionsEl.textContent = sessions.length;

    // Common Chart Options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { family: "'Outfit', sans-serif" }
          }
        }
      }
    };

    // Membership Chart
    const membershipCtx = document.getElementById('membershipChart');
    if (membershipCtx) {
      new Chart(membershipCtx, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Expired'],
          datasets: [{
            data: [active, expired],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          ...commonOptions,
          cutout: '70%'
        }
      });
    }

    // Payment Chart
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
            label: 'Revenue',
            data: Object.values(monthly),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              beginAtZero: true,
              grid: { borderDash: [2, 4], color: '#e2e8f0' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // Trainer Chart
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
            label: 'Sessions',
            data: counts.map(c => c.count),
            backgroundColor: ['#f59e0b', '#8b5cf6', '#ec4899'],
            borderRadius: 6,
            barThickness: 30
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              beginAtZero: true,
              grid: { borderDash: [2, 4], color: '#e2e8f0' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  },

  renderDashboard() {
    const user = this.getCurrentUser();
    const dashboard = document.getElementById('userDashboard');
    const pricing = document.getElementById('pricing');

    if (pricing) {
      pricing.style.display = user ? 'none' : 'block';
    }

    if (dashboard && user && user.role === 'member') {
      const members = this.read(this.keys.MEMBERS);
      const memberData = members.find(m => m.id === user.id);

      if (memberData) {
        const isExpired = new Date(memberData.expiry) < new Date();
        const plans = this.read(this.keys.PLANS).filter(p => p.memberId === user.id);
        const lastPlan = plans[plans.length - 1];

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

  // Utilities
  toast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
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

document.addEventListener('DOMContentLoaded', () => SmartGym.init());