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

const DEFAULT_PROJECTS = [
  {
    title: "LearnCode",
    subtitle: "Lead Developer (Solo Project)",
    category: "software",
    description:
      "A sleek, fully functional peer learning platform designed for tech students to share notes, tutorials, and collaborate asynchronously.",
    top_tag: "React + PostgreSQL",
    tech_stack: ["React", "Vite", "Tailwind CSS", "GoBackend (Fiber)"],
    status_label: "✓ Dashboard & Live Link",
    live_url: "#",
  },
  {
    title: "HotelBook",
    subtitle: "Full-Stack Developer",
    category: "software",
    description:
      "Complete hotel booking and management system with seamless authentication flow and integrated M-Pesa STK Push payment gateway for instant confirmations.",
    top_tag: "Full-Stack",
    tech_stack: ["React", "Tailwind CSS", "Firebase / SQL", "Express", "M-Pesa API"],
    status_label: "✓ Backend Deployed",
    live_url: "#",
  },
  {
    title: "Interactive Voting Poll",
    subtitle: "Frontend & State Architect (Group Project)",
    category: "software",
    description:
      "Modern voting and polling web application with core state management and component architecture to keep user votes accurate across sessions.",
    top_tag: "React + State Management",
    tech_stack: ["React", "Tailwind CSS", "Zustand", "State Management"],
    status_label: "✓ Completed & Preserved",
    live_url: "#",
  },
  {
    title: "Plantshop",
    subtitle: "Developer",
    category: "software",
    description:
      "E-commerce lab assignment focused on mastering React hooks, managing local cart states, and building responsive UI layouts.",
    top_tag: "React / Labs",
    tech_stack: ["React", "Zustand", "Context API"],
    status_label: "✓ Completed",
    live_url: "#",
  },
  {
    title: "Client VPN Routing",
    subtitle: "Infrastructure Engineer",
    category: "infrastructure",
    description:
      "Deploying secure, isolated virtual private networks on client-edge routers to protect business data traffic and optimize local routing configurations.",
    top_tag: "Infrastructure",
    tech_stack: ["MikroTik RouterOS", "VPN Setup", "Linux", "Edge Deployment"],
    status_label: "✓ Active Deployment",
    live_url: "#",
  },
  {
    title: "Starlink Commercial Architecture",
    subtitle: "Infrastructure Designer & Implementer",
    category: "infrastructure",
    description:
      "Designing customized, high-capacity wireless architectures for recreational parks and hospitality environments with smart bandwidth capping, client isolation, and M-Pesa billing.",
    top_tag: "Enterprise Infrastructure",
    tech_stack: ["Starlink Gen 2/3", "MikroTik Gateway", "PoE Switching", "Access Points", "M-Pesa Integration"],
    status_label: "✓ Production Ready",
    live_url: "#",
  },
  {
    title: "Managed Wi-Fi Infrastructure & Network Deployments",
    subtitle: "Network Architect & Deployment Engineer",
    category: "infrastructure",
    description:
      "Expanding high-speed connectivity across the Narok region through end-to-end local Wi-Fi architecture. Specialized in deploying managed access points, optimizing channel interference, and establishing secure guest/private network segregation.",
    top_tag: "WiFi Infrastructure",
    tech_stack: ["Managed Access Points", "Bandwidth Management", "Channel Optimization", "Network Segregation", "Commercial Deployment"],
    status_label: "✓ Active Operations",
    live_url: "#",
  },
  {
    title: "Full-Spectrum CCTV Surveillance Systems",
    subtitle: "Security Systems Designer & Implementer",
    category: "infrastructure",
    description:
      "Designing and deploying end-to-end security surveillance solutions across Narok. Handling all camera topologies, including High-Definition IP systems, Analog HD-TVI systems, Smart PTZ tracking cameras, and off-grid Solar/Wireless setups.",
    top_tag: "Security Infrastructure",
    tech_stack: ["HD-IP Cameras", "Analog HD-TVI", "Smart PTZ Control", "Solar/Wireless", "NVR/DVR Setup", "Remote Tracking"],
    status_label: "✓ Multiple Deployments",
    live_url: "#",
  },
];

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

function renderSeedProjects() {
  const softwareRoot = document.getElementById("software-projects");
  const infrastructureRoot = document.getElementById("infrastructure-projects");

  if (!softwareRoot || !infrastructureRoot) return;

  const softwareProjects = DEFAULT_PROJECTS.filter((project) => project.category === "software");
  const infrastructureProjects = DEFAULT_PROJECTS.filter((project) => project.category === "infrastructure");

  softwareRoot.innerHTML = softwareProjects.map(renderProjectCard).join("");
  infrastructureRoot.innerHTML = infrastructureProjects.map(renderProjectCard).join("");
}

async function loadProjects() {
  const softwareRoot = document.getElementById("software-projects");
  const infrastructureRoot = document.getElementById("infrastructure-projects");

  if (!softwareRoot || !infrastructureRoot) return;

  const fallbackProjects = DEFAULT_PROJECTS;

  if (!supabase) {
    const softwareProjects = fallbackProjects.filter((project) => project.category === "software");
    const infrastructureProjects = fallbackProjects.filter((project) => project.category === "infrastructure");

    softwareRoot.innerHTML = softwareProjects.length
      ? softwareProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">No software projects available.</p>';

    infrastructureRoot.innerHTML = infrastructureProjects.length
      ? infrastructureProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">No infrastructure projects available.</p>';
    return;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const projectSource = data && data.length ? data : fallbackProjects;
    const softwareProjects = projectSource.filter((project) => project.category === "software");
    const infrastructureProjects = projectSource.filter((project) => project.category === "infrastructure");

    softwareRoot.innerHTML = softwareProjects.length
      ? softwareProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">No software projects available.</p>';

    infrastructureRoot.innerHTML = infrastructureProjects.length
      ? infrastructureProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">No infrastructure projects available.</p>';
  } catch (error) {
    console.error("Failed to load projects:", error);
    const softwareProjects = fallbackProjects.filter((project) => project.category === "software");
    const infrastructureProjects = fallbackProjects.filter((project) => project.category === "infrastructure");

    softwareRoot.innerHTML = softwareProjects.length
      ? softwareProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">Unable to load projects.</p>';

    infrastructureRoot.innerHTML = infrastructureProjects.length
      ? infrastructureProjects.map(renderProjectCard).join("")
      : '<p class="empty-state">Unable to load projects.</p>';
    showToast("Using default portfolio data.", "error");
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
  renderSeedProjects();
  loadProjects();
  logVisitor();

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }
});
