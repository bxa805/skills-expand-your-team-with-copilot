import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";
import { addActivitySharing } from "../static/sharing.js";

class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = "";
    this.textContent = "";
    this.classList = {
      add: (name) => { this.className += ` ${name}`; },
      remove: (name) => {
        this.className = this.className.split(" ").filter((item) => item !== name).join(" ");
      },
      contains: (name) => this.className.split(" ").includes(name),
    };
  }

  appendChild(child) { this.children.push(child); }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  click() { return this.listeners.click(); }
}

const name = "Arts & Crafts / Friends";
const details = {
  description: "Make art together!",
  participants: ["student@example.edu"],
};

beforeEach(() => {
  mock.restoreAll();
  globalThis.window = {
    location: { href: "https://school.example/static/index.html?old=value#old" },
  };
  globalThis.document = { createElement: (tag) => new Element(tag) };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {},
  });
});

function render() {
  const card = new Element("div");
  addActivitySharing(card, name, details);
  const sharing = card.children[0];
  const actions = sharing.children[1].children;
  return {
    actions,
    button: (label) => actions.find((action) => action.textContent === label),
    status: sharing.children[2],
    manualLink: sharing.children[3],
  };
}

test("social links share only the selected activity with correctly encoded names", () => {
  const { actions, button } = render();
  const facebook = new URL(button("Facebook").href);
  const activityUrl = new URL(facebook.searchParams.get("u"));
  assert.equal(activityUrl.searchParams.get("activity"), name);
  assert.equal(activityUrl.searchParams.get("old"), null);
  assert.equal(activityUrl.hash, "");
  assert.equal(activityUrl.pathname, "/static/index.html");
  const whatsapp = new URL(button("WhatsApp").href);
  assert.equal(whatsapp.searchParams.get("text"), `Join me at ${name}! ${details.description} ${activityUrl.href}`);
  assert.ok(!whatsapp.href.includes("student"));
  for (const link of actions.filter((action) => action.tag === "a")) {
    assert.equal(link.target, "_blank");
    assert.equal(link.rel, "noopener noreferrer");
  }
  assert.equal(button("Share"), undefined);
});

test("copying reports success only after the clipboard write succeeds", async () => {
  let copied;
  navigator.clipboard = { writeText: async (value) => { copied = value; } };
  const { button, status, manualLink } = render();
  await button("Copy link").click();
  assert.equal(copied, manualLink.value);
  assert.match(status.textContent, /Link copied/);
  assert.ok(manualLink.classList.contains("hidden"));
});

test("missing or rejected clipboard access offers a selected manual link", async () => {
  for (const clipboard of [
    undefined,
    { writeText: async () => { throw new Error("Permission denied"); } },
  ]) {
    navigator.clipboard = clipboard;
    mock.method(console, "error", () => {});
    const { button, status, manualLink } = render();
    await button("Copy link").click();
    assert.ok(!manualLink.classList.contains("hidden"));
    assert.ok(manualLink.focused && manualLink.selected);
    assert.match(status.textContent, /copy the link below/i);
    assert.ok(!status.textContent.includes("Link copied"));
  }
});

test("native sharing sends activity details without participant information", async () => {
  let shared;
  navigator.share = async (data) => { shared = data; };
  const { button, manualLink } = render();
  await button("Share").click();
  assert.deepEqual(shared, {
    title: `${name} - Mergington High School`,
    text: `Join me at ${name}! ${details.description}`,
    url: manualLink.value,
  });
});

test("native share cancellation is quiet but failures offer manual copying", async () => {
  navigator.share = async () => { throw new DOMException("Cancelled", "AbortError"); };
  const { button, status, manualLink } = render();
  await button("Share").click();
  assert.equal(status.textContent, "");
  assert.ok(manualLink.classList.contains("hidden"));

  mock.method(console, "error", () => {});
  navigator.share = async () => { throw new Error("Sharing unavailable"); };
  await button("Share").click();
  assert.match(status.textContent, /Sharing failed/);
  assert.ok(manualLink.focused && manualLink.selected);
});
