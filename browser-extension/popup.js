// Cross-browser compatibility
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const loggedIn = document.getElementById("loggedIn");
  const loading = document.getElementById("loading");
  const authForm = document.getElementById("authForm");
  const errorDiv = document.getElementById("error");
  const userEmail = document.getElementById("userEmail");
  const signupLink = document.getElementById("signupLink");

  // Check if user is already logged in
  await checkAuthStatus();

  // Handle login form submission
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleLogin();
  });

  // Handle logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await handleLogout();
  });

  // Handle signup link click
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    // Open your website's signup page in a new tab
    browserAPI.tabs.create({ url: "http://localhost:3000/signup" });
  });

  async function checkAuthStatus() {
    try {
      const response = await browserAPI.runtime.sendMessage({
        action: "checkAuth",
      });

      if (response.authenticated) {
        showLoggedInState(response.user);
      } else {
        showLoginForm();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      showLoginForm();
    }
  }

  async function handleLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");

    loginBtn.textContent = "Logging in...";
    loginBtn.disabled = true;
    errorDiv.textContent = "";

    try {
      const response = await browserAPI.runtime.sendMessage({
        action: "login",
        credentials: { username, password },
      });

      if (response.success) {
        showLoggedInState(response.user);
      } else {
        errorDiv.textContent = response.error || "Login failed";
      }
    } catch (error) {
      errorDiv.textContent = "Login failed. Please try again.";
    } finally {
      loginBtn.textContent = "Login";
      loginBtn.disabled = false;
    }
  }

  async function handleLogout() {
    try {
      await browserAPI.runtime.sendMessage({ action: "logout" });
      showLoginForm();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  function showLoginForm() {
    loading.style.display = "none";
    loginForm.classList.add("show");
    loggedIn.classList.remove("show");
  }

  function showLoggedInState(user) {
    loading.style.display = "none";
    loginForm.classList.remove("show");
    loggedIn.classList.add("show");
    userEmail.textContent = user.username || user.email || "User";

    loadPrompts();
  }

  async function loadPrompts() {
    try {
      const response = await browserAPI.runtime.sendMessage({
        action: "getPrompts",
      });
      if (response.success) {
        displayPrompts(response.prompts);
      } else {
        document.getElementById("promptsList").textContent =
          "Failed to load prompts";
      }
    } catch (error) {
      document.getElementById("promptsList").textContent =
        "Error loading prompts";
    }
  }

  function displayPrompts(prompts) {
    const container = document.getElementById("promptsList");
    if (prompts.length === 0) {
      container.textContent = "No prompts found";
      return;
    }

    container.innerHTML = prompts
      .map(
        (prompt) => `
      <div style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; margin: 4px 0; cursor: pointer;"
           onclick="insertPrompt('${prompt.content.replace(/'/g, "\\'")}')">
        <strong>${prompt.title}</strong>
        <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
          ${prompt.content.substring(0, 100)}...
        </p>
      </div>
    `,
      )
      .join("");
  }
});
