async function openContainerHome(tab) {
  if (!tab) return;

  const { homes = {} } = await browser.storage.local.get("homes");
  const url = homes[tab.cookieStoreId];

  console.log("Container Homes:", {
    tabId: tab.id,
    cookieStoreId: tab.cookieStoreId,
    configuredUrl: url
  });

  if (!url) {
    console.warn(
      `No home URL configured for container: ${tab.cookieStoreId}`
    );
    return;
  }

  await browser.tabs.update(tab.id, { url });
}

function bindingKey(cookieStoreId, slotNumber) {
  return `${cookieStoreId}:${slotNumber}`;
}

async function getBinding(cookieStoreId, slotNumber) {
  const { bindings = {} } = await browser.storage.session.get("bindings");
  return bindings[bindingKey(cookieStoreId, slotNumber)] ?? null;
}

async function setBinding(cookieStoreId, slotNumber, tabId, url) {
  const { bindings = {} } = await browser.storage.session.get("bindings");
  bindings[bindingKey(cookieStoreId, slotNumber)] = { tabId, url };
  await browser.storage.session.set({ bindings });
}

async function clearBindingsForTab(tabId) {
  const { bindings = {} } = await browser.storage.session.get("bindings");
  let changed = false;

  for (const [key, binding] of Object.entries(bindings)) {
    if (binding.tabId === tabId) {
      delete bindings[key];
      changed = true;
    }
  }

  if (changed) await browser.storage.session.set({ bindings });
}

function matchPatternFor(url) {
  try {
    return `${new URL(url).origin}/*`;
  } catch {
    return null;
  }
}

async function focusTab(tab) {
  await browser.tabs.update(tab.id, { active: true });
  await browser.windows.update(tab.windowId, { focused: true });
}

async function activateSlot(slotNumber, activeTab) {
  if (!activeTab) return;

  const { cookieStoreId } = activeTab;
  const { slots = {} } = await browser.storage.local.get("slots");
  const url = slots[cookieStoreId]?.[slotNumber];

  if (!url) {
    console.warn(
      `No slot ${slotNumber} configured for container: ${cookieStoreId}`
    );
    return;
  }

  const binding = await getBinding(cookieStoreId, slotNumber);

  // Only trust the binding while it still points at the currently configured
  // URL — otherwise a slot that's been repointed at a new app would keep
  // reopening whatever tab the old URL last used.
  if (binding && binding.url === url) {
    try {
      const tab = await browser.tabs.get(binding.tabId);
      await focusTab(tab);
      return;
    } catch {
      // Bound tab is gone (closed, or browser restarted); recover below.
    }
  }

  const matchPattern = matchPatternFor(url);
  const candidates = matchPattern
    ? await browser.tabs.query({ cookieStoreId, url: matchPattern })
    : [];

  if (candidates.length > 0) {
    const [tab] = candidates;
    await setBinding(cookieStoreId, slotNumber, tab.id, url);
    await focusTab(tab);
    return;
  }

  const newTab = await browser.tabs.create({ cookieStoreId, url });
  await setBinding(cookieStoreId, slotNumber, newTab.id, url);
}

browser.commands.onCommand.addListener(async (command) => {
  console.log("Container Homes command received:", command);

  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  if (command === "open-container-homes") {
    await openContainerHome(tab);
    return;
  }

  const slotMatch = /^open-slot-([1-9])$/.exec(command);
  if (slotMatch) {
    await activateSlot(Number(slotMatch[1]), tab);
  }
});

browser.action.onClicked.addListener(openContainerHome);

browser.tabs.onRemoved.addListener((tabId) => {
  clearBindingsForTab(tabId).catch((error) => console.error(error));
});
