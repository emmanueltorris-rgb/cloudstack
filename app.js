function normalizeSupabaseUrl(value = "") {
  return String(value || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

const appConfig = window.APP_CONFIG || {};
const SUPABASE_URL = normalizeSupabaseUrl(appConfig.supabaseUrl || window.SUPABASE_URL || "");
const SUPABASE_ANON_KEY = String(appConfig.supabaseAnonKey || window.SUPABASE_ANON_KEY || "").trim();

const hasValidSupabaseConfig = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    /^https:\/\/[a-z0-9-]+\.[a-z0-9.-]+\.[a-z]{2,}(?:\/[\w.-]*)*$/i.test(SUPABASE_URL)
);

const supabase = hasValidSupabaseConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const toastEl = document.getElementById("toast");

function showToast(message, type = "success") {
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastEl.className = "toast";
  }, 2500);
}

function formatProjectStatus(label) {
  return (label || "✓ Active Deployment").trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderProjectCard(project) {
  const statusText = formatProjectStatus(project.status_label || "✓ Active Deployment");
  const techTags = Array.isArray(project.tech_stack) ? project.tech_stack : [];
  const topTag = project.top_tag || "Product";
  const subtitle = project.subtitle || "Digital product delivery";
  const description = project.description || "Project details coming soon.";
  const liveUrl = project.live_url ? `<a href="${project.live_url}" target="_blank" rel="noopener noreferrer" class="status-pill">${statusText}</a>` : `<span class="status-pill">${statusText}</span>`;

  return `
    <article class="project-card">
      <div class="card-top">
        <span class="tag-pill">${escapeHtml(topTag)}</span>
        ${liveUrl}
      </div>
      <div>
        <h3>${escapeHtml(project.title)}</h3>
        <div class="project-role">${escapeHtml(subtitle)}</div>
      </div>
      <p>${escapeHtml(description)}</p>
      <div class="tech-stack">
        ${techTags.map((tag) => `<span class="tech-tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

async function loadProjects() {
  const softwareRoot = document.getElementById("software-projects");
  const infrastructureRoot = document.getElementById("infrastructure-projects");

  if (!softwareRoot || !infrastructureRoot) return;

  if (!supabase) {
    softwareRoot.innerHTML = '<p class="empty-state">Supabase configuration is missing. Add your project URL and anon key.</p>';
    infrastructureRoot.innerHTML = '<p class="empty-state">Supabase configuration is missing. Add your project URL and anon key.</p>';
    return;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const softwareProjects = (data || []).filter((project) => project.category === "software");
    const infrastructureProjects = (data || []).filter((project) => project.category === "infrastructure");

    softwareRoot.innerHTML = softwareProjects.length
      ? softwareProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">No software projects available.</p>';

    infrastructureRoot.innerHTML = infrastructureProjects.length
      ? infrastructureProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">No infrastructure projects available.</p>';
  } catch (error) {
    console.error("Failed to load projects:", error);
    showToast("Unable to load portfolio projects.", "error");
    softwareRoot.innerHTML = '<p class="empty-state">Unable to load projects.</p>';
    infrastructureRoot.innerHTML = '<p class="empty-state">Unable to load projects.</p>';
  }
}

async function logVisitor() {
  if (!supabase) return;

  try {
    const ipAddress = await fetchIpAddress();
    const { error } = await supabase.from("visitors").insert([
      {
        ip_address: ipAddress,
        page_visited: window.location.pathname,
        user_agent: navigator.userAgent,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.warn("Visitor logging failed:", error);
  }
}

async function fetchIpAddress() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) return "unknown";
    const data = await response.json();
    return data.ip || "unknown";
  } catch (error) {
    return "unknown";
  }
}

function validateContactForm(form) {
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !subject || !message) {
    showToast("Please complete all contact fields.", "error");
    return null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showToast("Please provide a valid email address.", "error");
    return null;
  }

  return { name, email, subject, message };
}

async function handleContactSubmit(event) {
  event.preventDefault();

  if (!supabase) {
    showToast("Supabase is not configured for contact submissions.", "error");
    return;
  }

  const form = event.currentTarget;
  const payload = validateContactForm(form);
  if (!payload) return;

  try {
    const { error } = await supabase.from("messages").insert([
      {
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
      },
    ]);

    if (error) throw error;

    form.reset();
    showToast("Message sent successfully.", "success");
  } catch (error) {
    console.error("Contact form submission failed:", error);
    showToast("Message could not be sent. Please try again later.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  logVisitor();

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }
});
