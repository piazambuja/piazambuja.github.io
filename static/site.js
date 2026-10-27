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
