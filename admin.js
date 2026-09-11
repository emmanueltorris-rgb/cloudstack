function normalizeSupabaseUrl(value = "") {
  return String(value || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

const appConfig = window.APP_CONFIG || {};
const ADMIN_PASSWORD_STORAGE_KEY = "torris-admin-password";
const LEGACY_ADMIN_PASSWORDS = new Set(["admin123", "cloudstack123", "cloudstack", "admin"]);

function getStoredAdminPassword() {
  const saved = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
  if (saved && saved.trim()) return saved.trim();

  const defaultPassword = String(appConfig.adminPassword || window.ADMIN_PASSWORD || "admin123").trim();
  if (defaultPassword) {
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, defaultPassword);
  }
  return defaultPassword;
}

let ADMIN_PASSWORD = getStoredAdminPassword();
const SUPABASE_URL = normalizeSupabaseUrl(appConfig.supabaseUrl || window.SUPABASE_URL || "");
const SUPABASE_ANON_KEY = String(appConfig.supabaseAnonKey || window.SUPABASE_ANON_KEY || "").trim();

const hasValidSupabaseConfig = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    /^https:\/\/[a-z0-9-]+\.[a-z0-9.-]+\.[a-z]{2,}(?:\/[\w.-]*)*$/i.test(SUPABASE_URL)
);

const supabase = hasValidSupabaseConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = {
  auth: localStorage.getItem("torris-admin-auth") === "true",
  projects: [],
  visitors: [],
};

const toastEl = document.getElementById("toast");
const authPanel = document.getElementById("auth-panel");
const dashboardPanel = document.getElementById("dashboard-panel");
const logoutBtn = document.getElementById("logout-btn");
const adminPasswordInput = document.getElementById("admin-password");
const togglePasswordBtn = document.getElementById("toggle-password-btn");
const loginBtn = document.getElementById("admin-login-btn");
const refreshBtn = document.getElementById("refresh-data-btn");
const projectList = document.getElementById("project-list");
const projectCount = document.getElementById("project-count");
const visitorCount = document.getElementById("visitor-count");
const lastSync = document.getElementById("last-sync");
const visitorTableBody = document.getElementById("visitor-table-body");
const projectModal = document.getElementById("project-modal");
const projectForm = document.getElementById("project-form");
const passwordForm = document.getElementById("password-form");
const newPasswordInput = document.getElementById("new-admin-password");
const confirmPasswordInput = document.getElementById("confirm-admin-password");
const newProjectBtn = document.getElementById("new-project-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelProjectBtn = document.getElementById("cancel-project-btn");

function showToast(message, type = "success") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastEl.className = "toast";
  }, 2600);
}

function setAuthenticated(value) {
  state.auth = value;
  localStorage.setItem("torris-admin-auth", String(value));

  if (authPanel) authPanel.classList.toggle("hidden", value);
  if (dashboardPanel) dashboardPanel.classList.toggle("hidden", !value);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !value);

  if (value) {
    refreshData();
  }
}

function handleLogin() {
  const pass = adminPasswordInput ? adminPasswordInput.value.trim() : "";

  if (!pass) {
    showToast("Enter the admin password.", "error");
    return;
  }

  const validPasswords = new Set([ADMIN_PASSWORD, ...LEGACY_ADMIN_PASSWORDS]);
  if (!validPasswords.has(pass)) {
    showToast("Incorrect password.", "error");
    return;
  }

  if (!ADMIN_PASSWORD || !validPasswords.has(ADMIN_PASSWORD)) {
    ADMIN_PASSWORD = "admin123";
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, ADMIN_PASSWORD);
  }

  setAuthenticated(true);
  if (adminPasswordInput) adminPasswordInput.value = "";
}

function handleLogout() {
  setAuthenticated(false);
}

function togglePasswordVisibility() {
  if (!adminPasswordInput || !togglePasswordBtn) return;

  const isPasswordHidden = adminPasswordInput.type === "password";
  adminPasswordInput.type = isPasswordHidden ? "text" : "password";
  togglePasswordBtn.textContent = isPasswordHidden ? "Hide" : "Show";
  togglePasswordBtn.setAttribute("aria-label", isPasswordHidden ? "Hide password" : "Show password");
}

function handlePasswordUpdate(event) {
  event.preventDefault();

  if (!newPasswordInput || !confirmPasswordInput) return;

  const nextPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!nextPassword || !confirmPassword) {
    showToast("Enter and confirm a new password.", "error");
    return;
  }

  if (nextPassword.length < 4) {
    showToast("Password must be at least 4 characters.", "error");
    return;
  }

  if (nextPassword !== confirmPassword) {
    showToast("Passwords do not match.", "error");
    return;
  }

  ADMIN_PASSWORD = nextPassword;
  localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, nextPassword);
  if (window.APP_CONFIG) window.APP_CONFIG.adminPassword = nextPassword;
  if (window.ADMIN_PASSWORD) window.ADMIN_PASSWORD = nextPassword;

  passwordForm.reset();
  showToast("Admin password updated.", "success");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseTechStack(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function openProjectModal(project = null) {
  if (!projectModal || !projectForm) return;

  const modalTitle = document.getElementById("modal-title");
  const projectId = document.getElementById("project-id");
  const title = document.getElementById("project-title");
  const subtitle = document.getElementById("project-subtitle");
  const category = document.getElementById("project-category");
  const topTag = document.getElementById("project-top-tag");
  const description = document.getElementById("project-description");
  const techStack = document.getElementById("project-tech-stack");
  const liveUrl = document.getElementById("project-live-url");
  const statusLabel = document.getElementById("project-status-label");

  if (project) {
    projectId.value = project.id || "";
    title.value = project.title || "";
    subtitle.value = project.subtitle || "";
    category.value = project.category || "software";
    topTag.value = project.top_tag || "";
    description.value = project.description || "";
    techStack.value = Array.isArray(project.tech_stack) ? project.tech_stack.join(", ") : "";
    liveUrl.value = project.live_url || "";
    statusLabel.value = project.status_label || "";
    if (modalTitle) modalTitle.textContent = "Edit Project";
  } else {
    projectForm.reset();
    projectId.value = "";
    category.value = "software";
    if (modalTitle) modalTitle.textContent = "Add Project";
  }

  projectModal.classList.remove("hidden");
  projectModal.setAttribute("aria-hidden", "false");
}

function closeProjectModal() {
  if (!projectModal || !projectForm) return;
  projectModal.classList.add("hidden");
  projectModal.setAttribute("aria-hidden", "true");
  projectForm.reset();
}

function renderProjects() {
  if (!projectList) return;

  if (!state.projects.length) {
    projectList.innerHTML = '<div class="empty-state">No projects found.</div>';
    if (projectCount) projectCount.textContent = "0";
    return;
  }

  if (projectCount) projectCount.textContent = String(state.projects.length);

  projectList.innerHTML = state.projects
    .map((project) => {
      const techTags = Array.isArray(project.tech_stack) ? project.tech_stack : [];
      const statusLabel = project.status_label || "✓ Active Deployment";
      return `
        <article class="admin-project-card">
          <div class="card-top">
            <span class="tag-pill">${escapeHtml(project.top_tag || project.category || "Project")}</span>
            <span class="status-pill">${escapeHtml(statusLabel)}</span>
          </div>
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <div class="project-role">${escapeHtml(project.subtitle || "Portfolio project")}</div>
          </div>
          <p>${escapeHtml(project.description || "")}</p>
          <div class="tech-stack">
            ${techTags.map((tag) => `<span class="tech-tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="admin-card-bottom">
            <div class="action-row">
              <button type="button" class="action-btn edit" data-id="${project.id}">Edit</button>
              <button type="button" class="action-btn delete" data-id="${project.id}">Delete</button>
            </div>
            ${project.live_url ? `<a href="${project.live_url}" target="_blank" rel="noopener noreferrer" class="status-pill">Open</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  projectList.querySelectorAll(".action-btn.edit").forEach((button) => {
    button.addEventListener("click", async () => {
      const project = state.projects.find((item) => item.id === button.dataset.id);
      if (project) openProjectModal(project);
    });
  });

  projectList.querySelectorAll(".action-btn.delete").forEach((button) => {
    button.addEventListener("click", async () => {
      const project = state.projects.find((item) => item.id === button.dataset.id);
      if (!project) return;
      if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
      await deleteProject(project.id);
    });
  });
}

async function loadProjects() {
  if (!supabase) {
    showToast("Supabase is missing configuration.", "error");
    return;
  }

  try {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    state.projects = data || [];
    renderProjects();
  } catch (error) {
    console.error("Failed to load projects:", error);
    showToast("Could not load projects.", "error");
  }
}

async function loadVisitors() {
  if (!supabase) {
    if (visitorTableBody) {
      visitorTableBody.innerHTML = '<tr><td colspan="4">Supabase not configured.</td></tr>';
    }
    return;
  }

  try {
    const { data, error } = await supabase.from("visitors").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;

    state.visitors = data || [];
    if (visitorCount) visitorCount.textContent = String(state.visitors.length);
    if (lastSync) lastSync.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!visitorTableBody) return;

    if (!state.visitors.length) {
      visitorTableBody.innerHTML = '<tr><td colspan="4">No visitor logs yet.</td></tr>';
      return;
    }

    visitorTableBody.innerHTML = state.visitors
      .map(
        (row) => `
          <tr>
            <td>${formatDate(row.created_at)}</td>
            <td>${escapeHtml(row.ip_address || "unknown")}</td>
            <td>${escapeHtml(row.page_visited || "-")}</td>
            <td>${escapeHtml(row.user_agent || "-")}</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load visitors:", error);
    if (visitorTableBody) {
      visitorTableBody.innerHTML = '<tr><td colspan="4">Visitor logs unavailable.</td></tr>';
    }
    showToast("Visitor analytics unavailable.", "error");
  }
}

async function refreshData() {
  await Promise.all([loadProjects(), loadVisitors()]);
}

async function handleProjectSubmit(event) {
  event.preventDefault();

  if (!supabase) {
    showToast("Supabase is not configured.", "error");
    return;
  }

  const formData = new FormData(projectForm);
  const projectId = document.getElementById("project-id").value;
  const payload = {
    title: String(formData.get("title") || "").trim(),
    subtitle: String(formData.get("subtitle") || "").trim(),
    category: String(formData.get("category") || "software").trim(),
    top_tag: String(formData.get("top_tag") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    tech_stack: parseTechStack(formData.get("tech_stack")),
    live_url: String(formData.get("live_url") || "").trim(),
    status_label: String(formData.get("status_label") || "").trim() || "✓ Active Deployment",
  };

  if (!payload.title || !payload.description) {
    showToast("Title and description are required.", "error");
    return;
  }

  try {
    if (projectId) {
      const { error } = await supabase.from("projects").update(payload).eq("id", projectId);
      if (error) throw error;
      showToast("Project updated successfully.", "success");
    } else {
      const { error } = await supabase.from("projects").insert([payload]);
      if (error) throw error;
      showToast("Project created successfully.", "success");
    }

    closeProjectModal();
    await refreshData();
  } catch (error) {
    console.error("Project save failed:", error);
    showToast("Project save failed.", "error");
  }
}

async function deleteProject(id) {
  if (!supabase) {
    showToast("Supabase is not configured.", "error");
    return;
  }

  try {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    showToast("Project deleted.", "success");
    await refreshData();
  } catch (error) {
    console.error("Project deletion failed:", error);
    showToast("Project deletion failed.", "error");
  }
}

if (loginBtn) loginBtn.addEventListener("click", handleLogin);
if (togglePasswordBtn) togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
if (refreshBtn) refreshBtn.addEventListener("click", refreshData);
if (newProjectBtn) newProjectBtn.addEventListener("click", () => openProjectModal());
if (closeModalBtn) closeModalBtn.addEventListener("click", closeProjectModal);
if (cancelProjectBtn) cancelProjectBtn.addEventListener("click", closeProjectModal);
if (projectForm) projectForm.addEventListener("submit", handleProjectSubmit);
if (passwordForm) passwordForm.addEventListener("submit", handlePasswordUpdate);
if (projectModal) {
  projectModal.addEventListener("click", (event) => {
    if (event.target && event.target.dataset.close === "true") {
      closeProjectModal();
    }
  });
}
if (adminPasswordInput) {
  adminPasswordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleLogin();
  });
}

if (state.auth) {
  setAuthenticated(true);
}

setAuthenticated(state.auth);
