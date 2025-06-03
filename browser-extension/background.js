// Cross-browser compatibility
const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const isFirefox = typeof browser !== "undefined";

const API_BASE_URL = "http://localhost:3000";
let userPrompts = [];

// Handle messages from popup and content scripts
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message.action);

  if (isFirefox) {
    // Firefox can handle async directly
    handleMessage(message, sender).then(sendResponse);
    return true;
  } else {
    // Chrome V3 needs this pattern
    handleMessage(message, sender).then(sendResponse);
    return true;
  }
});

async function handleMessage(message, sender) {
  switch (message.action) {
    case "checkAuth":
      return await checkAuthentication();
    case "login":
      return await performLogin(message.credentials);
    case "logout":
      return await performLogout();
    case "getPrompts":
      return await getPrompts();
    default:
      return { error: "Unknown action" };
  }
}

// Create context menus when extension starts
browserAPI.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

// Also create context menus when browser starts
browserAPI.runtime.onStartup.addListener(() => {
  createContextMenus();
});

// Handle context menu clicks
browserAPI.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);

  if (info.menuItemId === "refresh-prompts") {
    await loadPromptsForMenu();
    return;
  }

  if (info.menuItemId.startsWith("prompt-")) {
    const promptId = info.menuItemId.replace("prompt-", "");
    const prompt = userPrompts.find((p) => p.id.toString() === promptId);

    if (prompt) {
      await injectPrompt(tab.id, prompt.content);
    }
  }
});

// Universal script injection function
async function injectPrompt(tabId, content) {
  try {
    // Try modern scripting API first (Chrome always, Firefox 128+)
    if (browserAPI.scripting && browserAPI.scripting.executeScript) {
      await browserAPI.scripting.executeScript({
        target: { tabId: tabId },
        func: insertPromptIntoPage,
        args: [content],
      });
    }
    // Fallback to old executeScript API (older Firefox)
    else if (browserAPI.tabs && browserAPI.tabs.executeScript) {
      await browserAPI.tabs.executeScript(tabId, {
        code: `
          (function() {
            const content = ${JSON.stringify(content)};
            ${insertPromptIntoPage.toString()}
            insertPromptIntoPage(content);
          })();
        `,
      });
    } else {
      console.error("No script injection API available");
    }
  } catch (error) {
    console.error("Script injection failed:", error);
  }
}

// Function to be injected into the page
function insertPromptIntoPage(content) {
  // Find the element that was right-clicked (it should be the active element)
  let target = document.activeElement;

  // If active element isn't a text input, find the first visible one
  if (!target || !isTextInput(target)) {
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="url"], textarea, [contenteditable="true"]',
    );
    target = Array.from(inputs).find(
      (input) => input.offsetParent !== null && !input.disabled,
    );
  }

  function isTextInput(element) {
    const tagName = element.tagName.toLowerCase();
    const inputType = element.type ? element.type.toLowerCase() : "";
    return (
      tagName === "textarea" ||
      (tagName === "input" &&
        ["text", "email", "password", "search", "url"].includes(inputType)) ||
      element.contentEditable === "true"
    );
  }

  if (target && isTextInput(target)) {
    target.focus();

    if (
      target.tagName.toLowerCase() === "textarea" ||
      target.tagName.toLowerCase() === "input"
    ) {
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value || "";

      target.value =
        currentValue.substring(0, start) +
        content +
        currentValue.substring(end);
      target.setSelectionRange(start + content.length, start + content.length);

      target.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      // ContentEditable
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(content));
      }
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

async function createContextMenus() {
  // Remove any existing context menus
  await browserAPI.contextMenus.removeAll();

  // Create parent menu
  browserAPI.contextMenus.create({
    id: "ai-prompts",
    title: "AI Prompts",
    contexts: ["editable"],
  });

  // Create loading item initially
  browserAPI.contextMenus.create({
    id: "loading",
    parentId: "ai-prompts",
    title: "Loading prompts...",
    contexts: ["editable"],
    enabled: false,
  });

  // Load prompts and update menu
  await loadPromptsForMenu();
}

async function loadPromptsForMenu() {
  try {
    const authResult = await checkAuthentication();
    if (!authResult.authenticated) {
      updateContextMenuForUnauthenticated();
      return;
    }

    const promptsResult = await getPrompts();
    if (promptsResult.success) {
      userPrompts = promptsResult.prompts;
      updateContextMenuWithPrompts(userPrompts);
    } else {
      updateContextMenuForError();
    }
  } catch (error) {
    console.error("Failed to load prompts for menu:", error);
    updateContextMenuForError();
  }
}

function updateContextMenuForUnauthenticated() {
  browserAPI.contextMenus.removeAll().then(() => {
    browserAPI.contextMenus.create({
      id: "ai-prompts",
      title: "AI Prompts",
      contexts: ["editable"],
    });

    browserAPI.contextMenus.create({
      id: "login-required",
      parentId: "ai-prompts",
      title: "Please login first",
      contexts: ["editable"],
      enabled: false,
    });
  });
}

function updateContextMenuForError() {
  browserAPI.contextMenus.update("loading", {
    title: "Failed to load prompts",
    enabled: false,
  });
}

function updateContextMenuWithPrompts(prompts) {
  browserAPI.contextMenus.removeAll().then(() => {
    // Create parent menu
    browserAPI.contextMenus.create({
      id: "ai-prompts",
      title: "AI Prompts",
      contexts: ["editable"],
    });

    if (prompts.length === 0) {
      browserAPI.contextMenus.create({
        id: "no-prompts",
        parentId: "ai-prompts",
        title: "No prompts found",
        contexts: ["editable"],
        enabled: false,
      });
      return;
    }

    // Add each prompt as a menu item
    prompts.forEach((prompt, index) => {
      const title =
        prompt.title.length > 50
          ? prompt.title.substring(0, 50) + "..."
          : prompt.title;

      browserAPI.contextMenus.create({
        id: `prompt-${prompt.id}`,
        parentId: "ai-prompts",
        title: title,
        contexts: ["editable"],
      });
    });

    // Add refresh option
    browserAPI.contextMenus.create({
      id: "separator",
      parentId: "ai-prompts",
      type: "separator",
      contexts: ["editable"],
    });

    browserAPI.contextMenus.create({
      id: "refresh-prompts",
      parentId: "ai-prompts",
      title: "↻ Refresh prompts",
      contexts: ["editable"],
    });
  });
}

async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const user = await response.json();
      return { authenticated: true, user };
    } else {
      return { authenticated: false };
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return { authenticated: false };
  }
}

async function performLogin(credentials) {
  try {
    const params = new URLSearchParams();
    params.append("username", credentials.username);
    params.append("password", credentials.password);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (response.ok) {
      // After successful login, get user profile
      const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        credentials: "include",
      });

      if (profileResponse.ok) {
        const user = await profileResponse.json();
        return { success: true, user };
      }

      return { success: true, user: { email: credentials.email } };
    } else {
      return { success: false, error: "Login failed" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Network error" };
  }
}

async function performLogout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "GET",
      credentials: "include",
    });

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}

async function getPrompts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompts`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, prompts: data.prompts };
    } else {
      return { success: false, error: "Failed to fetch prompts" };
    }
  } catch (error) {
    console.error("Get prompts error:", error);
    return { success: false, error: "Network error" };
  }
}
