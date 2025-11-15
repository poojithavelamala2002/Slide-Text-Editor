
/* ---------- Swiper init ---------- */
const swiper = new Swiper(".mySwiper", {
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

/* ---------- DOM refs ---------- */
const addTextBtn = document.getElementById("addTextBtn");
const textInput  = document.getElementById("textInput");
const fontSize   = document.getElementById("fontSize");
const fontColor  = document.getElementById("fontColor");
const fontFamily = document.getElementById("fontFamily");
const applyBtn   = document.getElementById("applyBtn");
const deselectBtn= document.getElementById("deselectBtn");

let selectedText = null;

/* ---------- Helpers ---------- */
function rgbToHex(rgb) {
  if (!rgb) return "#000000";
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return "#000000";
  return "#" + [m[0], m[1], m[2]].map(v => parseInt(v).toString(16).padStart(2,"0")).join("");
}

function loadControlsFrom(el){
  if (!el) return;
  textInput.value = el.innerText || "";
  const cs = window.getComputedStyle(el);
  fontSize.value = parseInt(cs.fontSize) || 24;
  fontColor.value = rgbToHex(cs.color || "#000000");
  fontFamily.value = (cs.fontFamily || "Arial").split(",")[0].replace(/["']/g,"").trim();
}

function selectElement(el){
  if (!el) return;
  if (selectedText && selectedText !== el) selectedText.classList.remove("active");
  selectedText = el;
  selectedText.classList.add("active");
  loadControlsFrom(selectedText);
}

function clearSelection(){
  if (selectedText) selectedText.classList.remove("active");
  selectedText = null;
  if (textInput) textInput.value = "";
}

/* ---------- Add new text box to active slide ---------- */
if (addTextBtn){
  addTextBtn.addEventListener("click", () => {
    const value = (textInput && textInput.value || "").trim();
    if (!value) return;

    const slide = swiper.slides[swiper.activeIndex];
    if (!slide) return;

    const box = document.createElement("div");
    box.className = "draggable-text";
    box.textContent = value;

    box.style.left = "40px";
    box.style.top  = "40px";
    if (fontSize) box.style.fontSize = (fontSize.value || 24) + "px";
    if (fontColor) box.style.color = fontColor.value || "#000";
    if (fontFamily) box.style.fontFamily = fontFamily.value || "Arial";

    slide.appendChild(box);

    enablePointerDrag(box);
    enableSelection(box);
    enableInlineEdit(box);

    selectElement(box);

    if (textInput) textInput.value = "";
  });
}

/* ---------- Selection ---------- */
function enableSelection(el){
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (el.isContentEditable) return; // don't change selection while editing
    selectElement(el);
  });
}

document.addEventListener("click", (ev) => {
  if (!ev.target.closest || !ev.target.closest(".draggable-text")) clearSelection();
});

if (deselectBtn) deselectBtn.addEventListener("click", (e) => { e.preventDefault(); clearSelection(); });

/* ---------- Apply controls ---------- */
if (applyBtn) applyBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!selectedText) { alert("Select a text box first."); return; }
  if (textInput) selectedText.textContent = textInput.value;
  if (fontSize) selectedText.style.fontSize = (fontSize.value || 24) + "px";
  if (fontColor) selectedText.style.color = fontColor.value || "#000";
  if (fontFamily) selectedText.style.fontFamily = fontFamily.value || "Arial";
});

/* ---------- Inline edit (double-click) ---------- */
function enableInlineEdit(el){
  el.addEventListener("dblclick", (ev) => {
    ev.stopPropagation();
    el.contentEditable = "true";
    el.focus();
    // caret end
    const sel = window.getSelection();
    if (sel){
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  el.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") { ev.preventDefault(); el.blur(); }
    if (ev.key === "Escape") { el.blur(); }
  });

  el.addEventListener("blur", () => {
    el.contentEditable = "false";
    if (selectedText === el && textInput) textInput.value = el.innerText;
  });
}

/* ---------- Pointer drag (robust) ---------- */
function enablePointerDrag(el){
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  el.addEventListener("pointerdown", (ev) => {
    if (!ev.isPrimary) return;
    if (el.isContentEditable) return; 

    selectElement(el);
    swiper.allowTouchMove = false;

    startX = ev.clientX;
    startY = ev.clientY;

    const elRect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();

    startLeft = parseFloat(el.style.left) || (elRect.left - parentRect.left);
    startTop  = parseFloat(el.style.top)  || (elRect.top  - parentRect.top);

    try { el.setPointerCapture(ev.pointerId); } catch(err) {}
  });

  el.addEventListener("pointermove", (ev) => {
    if (!ev.isPrimary) return;
    if (el.isContentEditable) return; 
    if (!el.hasPointerCapture(ev.pointerId)) return;

    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;

    const parent = el.parentElement;
    const pW = parent.clientWidth;
    const pH = parent.clientHeight;

    const newLeft = Math.max(0, Math.min(startLeft + dx, pW - el.offsetWidth));
    const newTop  = Math.max(0, Math.min(startTop  + dy, pH - el.offsetHeight));

    el.style.left = Math.round(newLeft) + "px";
    el.style.top  = Math.round(newTop)  + "px";
  });

  function finish(ev){
    try { if (ev && ev.pointerId) el.releasePointerCapture(ev.pointerId); } catch(e) {}
    swiper.allowTouchMove = true;
  }

  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", finish);
}

/* ---------- Initialize existing boxes in DOM ---------- */
document.querySelectorAll(".draggable-text").forEach(el => {
  enablePointerDrag(el);
  enableSelection(el);
  enableInlineEdit(el);
});

/* ---------- Slide change clears selection ---------- */
swiper.on("slideChange", () => { clearSelection(); });

