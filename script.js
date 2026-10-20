// Global variable for the JSON data path
const storeList = "./storelist.json";

// Initialize the Store List on Document Ready
ready(storeGenerator);

// DOM Ready Function
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// ---- GENERATION START ---- //
// Generate Page
async function storeGenerator() {
  await initializeList();
  addEventHandling();
}

// ---- JSON START ---- //
// Initialize The Store List
async function initializeList() {
  console.log("Initializing store list...");
  
  // Fetch JSON
  const storeData = await fetchStoreData(storeList);
  
  // Find Store List Wrapper
  const wrapper = document.getElementById("store-list");
  
  // Loop through JSON and Populate Store List
  storeData.stores.forEach(state => {
    
    // Build the list items for this state
    const listItems = state.locations.map(location => `
      <li class="editable-list-item" draggable="true">
        <input type="checkbox">
        <span contenteditable="true" class="edit-field store-name">${location.name}</span>
        <span contenteditable="true" class="edit-field store-link">${location.url || ""}</span>
        <button class="delete-btn">×</button>
      </li>
    `).join("");

    // Create the state container
    const container = document.createElement("div");
    container.className = "container state";

    // Fill State Container with Store List
    container.innerHTML = `
      <p class="state-title">
        <input class="state-tick" type="checkbox">
        ${state.state}
      </p>

      <ul class="sortableList">
        ${listItems}
      </ul>

      <div class="form">
        <input type="text" placeholder="Store Name" data-field="storeName">
        <input type="text" placeholder="Store Link" data-field="storeLink">
        <button class="add-btn">Add</button>
      </div>
    `;
    
    // Add State to Store List Wrapper
    wrapper.appendChild(container);
  });
  console.log("List Initialization Complete.");
}

// JSON Fetch Data Function
async function fetchStoreData(jsonData) {
  try {
    const response = await fetch(jsonData);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching store data:", error);
    throw new Error(`Error fetching store data: ${error}`);
  }
}
// ---- JSON END ---- //

// ---- EVENT ATTACHEMENT START ---- //
// Add Event Handling to all list items and buttons
function addEventHandling() {
  console.log("Adding event handling...");
  const lists = document.querySelectorAll('.sortableList');
  const addBtns = document.querySelectorAll('.add-btn');
  const states = document.querySelectorAll('.state-tick');
  states.forEach(attachShopTickEvent);

  // Add drag events to list items
  const listItems = document.querySelectorAll('.sortableList li');
  listItems.forEach(attachShopEvents);

  // Reordering logic
  for (const list of lists) {
    list.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = list.querySelector('.dragging');
      const siblings = [...list.querySelectorAll('li:not(.dragging)')];
      const nextSibling = siblings.find(sib => {
        const rect = sib.getBoundingClientRect();
        return e.clientY <= rect.top + rect.height / 2;
      });
      list.insertBefore(dragging, nextSibling);
    }); 
  }

  // Add new item
  for (const addBtn of addBtns) {
    addBtn.addEventListener('click', (e) => {
      const container = e.target.closest(".container");
      const list = container.querySelector(".sortableList");

      const nameInput = container.querySelector('[data-field="storeName"]');
      const linkInput = container.querySelector('[data-field="storeLink"]');

      const storeName = nameInput.value.trim();
      const storeLink = linkInput.value.trim();

      if (!storeName) {
        alert("Please enter a store name.");
        nameInput.focus();
        return;
      }

      const li = document.createElement("li");
      li.className = "editable-list-item";
      li.draggable = true;
      li.append(
        Object.assign(document.createElement("input"), { type: "checkbox" }),
        Object.assign(document.createElement("span"), {
          className: "edit-field store-name",
          contentEditable: "true",
          textContent: storeName
        }),
        Object.assign(document.createElement("span"), {
          className: "edit-field store-link",
          contentEditable: "true",
          textContent: storeLink
        }),
        Object.assign(document.createElement("button"), {
          className: "delete-btn",
          textContent: "×"
        })
      );

      list.appendChild(li);

      attachShopEvents(li);

      nameInput.value = "";
      linkInput.value = "";
      nameInput.focus();
    });
  }

  // Attach Scripts to Buttons
  document.getElementById("create-storelist-button").addEventListener("click", generateStoreList);
  document.getElementById("copy-storelist-button").addEventListener("click", copyStoreList);
  document.getElementById("tick-all-button").addEventListener("click", tickAll);

  console.log("Event handling added.");
}

// Update the state-tick checkbox based on the individual shop checkboxes
function updateStateTick(state) {
  const stateTick = state.querySelector('.state-tick');
  const itemCheckboxes = state.querySelectorAll(
    '.editable-list-item input[type="checkbox"]'
  );

  if (itemCheckboxes.length === 0) {
    // If there are no items, state-tick should be unchecked.
    stateTick.checked = false;
    return;
  }

  const checkedCheckboxes = state.querySelectorAll(
    '.editable-list-item input[type="checkbox"]:checked'
  );

  // If there are checked items, state-tick should be checked.
  // If there are no checked items, state-tick should be unchecked.
  stateTick.checked = checkedCheckboxes.length > 0;
}

// Attach tick event to shop/list item
function attachShopTickEvent(item) {
  item.addEventListener('change', (e) => {
    const state = e.target.closest('.state');
    const stateTick = state.querySelector('.state-tick');
    const itemCheckboxes = state.querySelectorAll(
      '.editable-list-item input[type="checkbox"]'
    );

    // State checkbox changed
    if (e.target.classList.contains('state-tick')) {
      itemCheckboxes.forEach(checkbox => {
        checkbox.checked = stateTick.checked;
      });

      return;
    }

    // Individual shop checkbox changed
    updateStateTick(state);
  });
}

// Attach delete event to shop/list item
function attachShopDeleteEvent(item) {
  item.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) {
      return;
    }

    const state = item.closest('.state');

    // Delete the shop/list item
    item.remove();

    // Update state-tick based on remaining shops
    updateStateTick(state);
  });
}

// Add Shop events to list items
function attachShopEvents(shop) {
  shop.addEventListener('dragstart', () => shop.classList.add('dragging'));
  shop.addEventListener('dragend', () => shop.classList.remove('dragging'));
  attachShopTickEvent(shop);
  attachShopDeleteEvent(shop);
}

// ---- EVENT ATTACHEMENT END ---- //
// ---- GENERATION END ---- //

// ---- GET HTML START ---- //

  
function generateStoreList() {
  const generatedList = createStoreList();

  const textarea = document.getElementById("store-list-textarea");

  // Format the generated HTML for clean copy/paste
  textarea.value = formatStoreListHTML(generatedList);
};


function createStoreList() {
  const source = document.getElementById("store-list");

  const wrapper = document.createElement("div");
  wrapper.className = "store-list-wrapper";

  const header = document.createElement("h2");
  header.className = "store-list-header";
  header.textContent = "Store Listings";

  const storeList = document.createElement("div");
  storeList.className = "store-list";

  const states = source.querySelectorAll(":scope > .state");

  states.forEach((state) => {
    const stateTick = state.querySelector(".state-tick");

    if (!stateTick || !stateTick.checked) {
      return;
    }

    const stateTitle = state.querySelector(".state-title");

    if (!stateTitle) {
      return;
    }

    const stateName = stateTitle.textContent
      .replace(/^[A-Z]{2}\s*:\s*/, "")
      .trim();

    const stateWrapper = document.createElement("div");
    stateWrapper.className = "store-state";

    const stateHeader = document.createElement("div");
    stateHeader.className = "store-state-header";
    stateHeader.textContent = stateName;

    const list = document.createElement("ul");

    const stores = state.querySelectorAll(
      ".sortableList > .editable-list-item"
    );

    stores.forEach((store) => {
      const checkbox = store.querySelector('input[type="checkbox"]');

      if (!checkbox || !checkbox.checked) {
        return;
      }

      const storeName = store.querySelector(".store-name");
      const storeLink = store.querySelector(".store-link");

      if (!storeName) {
        return;
      }

      const li = document.createElement("li");

      const name = storeName.textContent.trim();
      const link = storeLink ? storeLink.textContent.trim() : "";

      if (link) {
        const a = document.createElement("a");

        a.href = link;
        a.textContent = name;

        li.appendChild(a);
      } else {
        li.textContent = name;
      }

      list.appendChild(li);
    });

    // Only include states with selected stores
    if (list.children.length > 0) {
      stateWrapper.appendChild(stateHeader);
      stateWrapper.appendChild(list);
      storeList.appendChild(stateWrapper);
    }
  });

  wrapper.appendChild(header);
  wrapper.appendChild(storeList);

  return wrapper;
}


/**
 * Creates compact, readable HTML for copying and pasting.
 */
function formatStoreListHTML(wrapper) {
  const lines = [];
  
  // Add CSS for the store list
  lines.push('<style type="text/css">');
  lines.push('    .store-list-wrapper {');
  lines.push('        width: 100%;');
  lines.push('        max-width: 1330px;');
  lines.push('        margin: 0 auto;');
  lines.push('        padding: 0 20px;');
  lines.push('    }');
  lines.push('');
  lines.push('    .store-list-header {');
  lines.push('        font-size: 14px;');
  lines.push('        font-weight: 300;');
  lines.push('        text-transform: uppercase;');
  lines.push('        letter-spacing: 1px;');
  lines.push('        margin: 40px 0;');
  lines.push('    }');
  lines.push('');
  lines.push('    .store-list {');
  lines.push('        columns: 3;');
  lines.push('    }');
  lines.push('');
  lines.push('    .store-state {');
  lines.push('        margin-bottom: 40px;');
  lines.push('    }');
  lines.push('');
  lines.push('    .store-state-header {');
  lines.push('        font-weight: 700;');
  lines.push('        font-size: 14px;');
  lines.push('        margin-bottom: 20px;');
  lines.push('        text-transform: uppercase;');
  lines.push('    }');
  lines.push('');
  lines.push('    .store-state li {');
  lines.push('        padding: 15px 0;');
  lines.push('        margin-bottom: 5px;');
  lines.push('    }');
  lines.push('');
  lines.push('    @media only screen and (max-width: 767px) {');
  lines.push('        .store-list {');
  lines.push('            columns: 1;');
  lines.push('        }');
  lines.push('    }');
  lines.push('</style>');
  lines.push('');

  // Add the store list HTML
  lines.push('<div class="store-list-wrapper">');
  lines.push('    <h2 class="store-list-header">Store Listings</h2>');
  lines.push('');
  lines.push('    <div class="store-list">');

  const states = wrapper.querySelectorAll(".store-state");

  states.forEach((state, stateIndex) => {
    const stateHeader = state.querySelector(".store-state-header");
    const stores = state.querySelectorAll("li");

    lines.push('        <div class="store-state">');
    lines.push(
      `            <div class="store-state-header">${escapeHTML(
        stateHeader.textContent
      )}</div>`
    );

    lines.push("            <ul>");

    stores.forEach((store) => {
      const link = store.querySelector("a");

      if (link) {
        lines.push(
          `                <li><a href="${escapeHTML(
            link.getAttribute("href")
          )}">${escapeHTML(link.textContent)}</a></li>`
        );
      } else {
        lines.push(
          `                <li>${escapeHTML(store.textContent)}</li>`
        );
      }
    });

    lines.push("            </ul>");
    lines.push("        </div>");

    // Blank line between states
    if (stateIndex < states.length - 1) {
      lines.push("");
    }
  });

  lines.push("    </div>");
  lines.push("</div>");

  return lines.join("\n");
}


/**
 * Prevents store names or URLs containing special characters
 * from accidentally becoming HTML.
 */
function escapeHTML(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function copyStoreList() {
  const textarea = document.getElementById("store-list-textarea");
  const output = textarea.value;

  if (!output.trim()) {
    showToast("Nothing to copy.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    showToast("Store list copied to clipboard!");
  } catch (error) {
    // Fallback for browsers where Clipboard API isn't available
    textarea.select();
    document.execCommand("copy");
    textarea.setSelectionRange(0, 0);

    showToast("Store list copied to clipboard!");
  }
};


function showToast(message, type = "success") {
  // Remove any existing toast
  const existingToast = document.querySelector(".store-list-toast");

  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = `store-list-toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 2000);
}

async function tickAll() {
  let ticked = document.querySelector("#tick-all-button").getAttribute("data-ticked") === "true";
  if (ticked) {
    document.querySelector("#tick-all-button").textContent = "Untick All";
    document.querySelector("#tick-all-button").setAttribute("data-ticked", "false");
  } else {
    document.querySelector("#tick-all-button").textContent = "Tick All";
    document.querySelector("#tick-all-button").setAttribute("data-ticked", "true");
  }
  const checkboxes = document.querySelectorAll('.editable-list-item input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = ticked;
  });

  const states = document.querySelectorAll('.state');
  states.forEach((state) => {
    updateStateTick(state);
  });
}
// ---- GET HTML END ---- //

// ---- UPDATE JSON STORELIST START ---- //

// ---- UPDATE JSON STORELIST END ---- //