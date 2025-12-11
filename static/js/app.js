const API_BASE = '';

async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!res.ok) {
    throw new Error('Invalid email or password');
  }

  const data = await res.json();
  localStorage.setItem('token', data.access_token);
}

async function signup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to sign up');
  }

  return await login(email, password);
}

async function fetchProjects() {
  const token = localStorage.getItem('token');
  if (!token) return [];

  const res = await fetch(`${API_BASE}/api/projects/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load projects');
  }

  return await res.json();
}

async function createProject(payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/projects/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to create project');
  }

  return await res.json();
}

function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/static/login.html';
  }
}

function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = '';
      try {
        await login(email, password);
        window.location.href = '/dashboard';
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signupForm.email.value;
      const password = signupForm.password.value;
      const errorEl = document.getElementById('signup-error');
      errorEl.textContent = '';
      try {
        await signup(email, password);
        window.location.href = '/dashboard';
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }
}

function initDashboard() {
  const projectsList = document.getElementById('projects-list');
  const newProjectBtn = document.getElementById('new-project-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const modal = document.getElementById('project-modal');
  const projectForm = document.getElementById('project-form');
  const cancelProject = document.getElementById('cancel-project');
  const projectError = document.getElementById('project-error');

  if (!projectsList) return;
  requireAuth();

  async function loadProjects() {
    projectsList.innerHTML = '<p>Loading projects…</p>';
    try {
      const projects = await fetchProjects();
      if (!projects.length) {
        projectsList.innerHTML = '<p>No projects yet. Click "Add project" to get started.</p>';
        return;
      }
      projectsList.innerHTML = '';
      projects.forEach((p) => {
        const el = document.createElement('div');
        el.className = 'card-item';
        el.innerHTML = `
          <h3>${p.name}</h3>
          <p><strong>Framework:</strong> ${p.framework}</p>
          ${p.repo_url ? `<p><strong>Repo:</strong> <a href="${p.repo_url}" target="_blank" rel="noopener">${p.repo_url}</a></p>` : ''}
          <p><strong>API style:</strong> ${p.api_style || 'REST'}</p>
          <p class="meta">Created ${new Date(p.created_at).toLocaleString()}</p>
        `;
        projectsList.appendChild(el);
      });
    } catch (err) {
      projectsList.innerHTML = `<p class="error">${err.message}</p>`;
    }
  }

  newProjectBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  cancelProject.addEventListener('click', () => {
    modal.classList.add('hidden');
    projectForm.reset();
    projectError.textContent = '';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  });

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    projectError.textContent = '';
    const formData = new FormData(projectForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      await createProject(payload);
      modal.classList.add('hidden');
      projectForm.reset();
      await loadProjects();
    } catch (err) {
      projectError.textContent = err.message;
    }
  });

  loadProjects();
}

window.addEventListener('DOMContentLoaded', () => {
  initAuthForms();
  initDashboard();
});
