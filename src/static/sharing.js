export function addActivitySharing(card, name, details) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("activity", name);

  const title = `${name} - Mergington High School`;
  const text = `Join me at ${name}! ${details.description}`;
  const sharing = document.createElement("div");
  sharing.className = "activity-sharing";
  sharing.setAttribute("role", "group");
  sharing.setAttribute("aria-label", `Share ${name}`);

  const label = document.createElement("p");
  label.textContent = "Share with friends:";
  sharing.appendChild(label);

  const actions = document.createElement("div");
  actions.className = "share-actions";
  sharing.appendChild(actions);

  const status = document.createElement("p");
  status.className = "share-status";
  status.setAttribute("role", "status");

  const manualLink = document.createElement("input");
  manualLink.type = "text";
  manualLink.readOnly = true;
  manualLink.value = url.href;
  manualLink.className = "share-link hidden";
  manualLink.setAttribute("aria-label", `Link to ${name}`);

  function showManualLink(message) {
    status.textContent = message;
    manualLink.classList.remove("hidden");
    manualLink.focus();
    manualLink.select();
  }

  function addButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "share-button";
    button.textContent = label;
    button.setAttribute("aria-label", `${label}: ${name}`);
    button.addEventListener("click", onClick);
    actions.appendChild(button);
  }

  if (typeof navigator.share === "function") {
    addButton("Share", async () => {
      try {
        await navigator.share({ title, text, url: url.href });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error sharing activity:", error);
          showManualLink("Sharing failed. Copy the link below instead.");
        }
      }
    });
  }

  const facebookUrl = new URL("https://www.facebook.com/sharer/sharer.php");
  facebookUrl.searchParams.set("u", url.href);
  const whatsappUrl = new URL("https://wa.me/");
  whatsappUrl.searchParams.set("text", `${text} ${url.href}`);

  for (const [label, shareUrl] of [
    ["Facebook", facebookUrl],
    ["WhatsApp", whatsappUrl],
  ]) {
    const link = document.createElement("a");
    link.className = "share-button";
    link.textContent = label;
    link.href = shareUrl.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Share ${name} on ${label} (opens a new tab)`);
    actions.appendChild(link);
  }

  addButton("Copy link", async () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      showManualLink("Select and copy the link below to share this activity.");
      return;
    }

    try {
      await navigator.clipboard.writeText(url.href);
      manualLink.classList.add("hidden");
      status.textContent = "Link copied! Paste it into a message to your friends.";
    } catch (error) {
      console.error("Error copying activity link:", error);
      showManualLink("Could not copy automatically. Copy the link below instead.");
    }
  });

  sharing.append(status, manualLink);
  card.appendChild(sharing);
}
