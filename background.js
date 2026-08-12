async function openContainerHome(tab) {
  if (!tab) return;

  const { homes = {} } = await browser.storage.local.get("homes");
  const url = homes[tab.cookieStoreId];

  console.log("Container Home:", {
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

browser.commands.onCommand.addListener(async (command) => {
  console.log("Container Home command received:", command);

  if (command !== "open-container-home") return;

  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  await openContainerHome(tab);
});

browser.browserAction.onClicked.addListener(openContainerHome);
