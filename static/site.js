// Copy-to-clipboard for command blocks.
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy");
  if (!button) return;
  const label = button.querySelector("span");
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    label.textContent = "Copiado";
    button.classList.add("done");
  } catch {
    label.textContent = "Selecione e copie";
  }
  setTimeout(() => {
    label.textContent = "Copiar";
    button.classList.remove("done");
  }, 1800);
});

// Open a skill when the URL points at it (e.g. #skill-k8s-triage).
const target = location.hash && document.querySelector(location.hash);
if (target && target.tagName === "DETAILS") target.open = true;

// On narrow screens the chart scrolls sideways; start at the most recent years.
const chart = document.querySelector(".chart-scroll");
if (chart) chart.scrollLeft = chart.scrollWidth;

// Tool picker: every install box on the page follows the same tool, remembered per browser.
const KEY = "install-tool";
function pickTool(tool, focus) {
  document.querySelectorAll(".installer").forEach((box) => {
    if (!box.querySelector(`[role="tab"][data-tool="${tool}"]`)) return;
    box.querySelectorAll('[role="tab"]').forEach((tab) => {
      const on = tab.dataset.tool === tool;
      tab.setAttribute("aria-selected", on);
      tab.tabIndex = on ? 0 : -1;
      if (on && focus === box) tab.focus();
    });
    box.querySelectorAll(".installer-panel").forEach((panel) => { panel.hidden = panel.dataset.tool !== tool; });
  });
  try { localStorage.setItem(KEY, tool); } catch {}
}
document.addEventListener("click", (event) => {
  const tab = event.target.closest('.installer [role="tab"]');
  if (tab) pickTool(tab.dataset.tool);
});
document.addEventListener("keydown", (event) => {
  const tab = event.target.closest('.installer [role="tab"]');
  if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...tab.parentElement.children];
  let i = tabs.indexOf(tab);
  i = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  pickTool(tabs[i].dataset.tool, tab.closest(".installer"));
});
try {
  const saved = localStorage.getItem(KEY);
  if (saved) pickTool(saved);
} catch {}
