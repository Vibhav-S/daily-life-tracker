if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch(err => console.error("SW failed", err));
  });
}

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const habits = [
  { id: "book", label: "Read 5 pages of a book" },
  { id: "study", label: "Studied 30 minutes" },
  { id: "cardio", label: "Did cardio / run" },
  { id: "gym", label: "Went to gym" },
  { id: "meals", label: "Had all meals" }
];

let today = new Date();
let todayKey = getLocalDateKey(today);
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

document.getElementById("saveBtn").onclick = saveDay;
document.getElementById("darkToggle").onclick = toggleDark;
document.getElementById("menuToggle").onclick = toggleMenu;
document.getElementById("prevMonth").onclick = () => changeMonth(-1);
document.getElementById("nextMonth").onclick = () => changeMonth(1);

init();

function init() {
  renderHabits();
  loadDay(todayKey);
  updateStats();
  updateStreak();
  renderCalendar();
  checkMissedDay();
  startDateTime();
  if (localStorage.getItem("dark") === "true") {
    document.body.classList.add("dark");
    document.getElementById("darkToggle").innerText = "☀️";
  }
}

function toggleMenu() {
  document.querySelector(".side").classList.toggle("hidden");
}

function renderHabits() {
  const box = document.getElementById("habits");
  box.innerHTML = "";
  habits.forEach(h => {
    box.innerHTML += `
      <div class="habit" id="wrap-${h.id}">
        <input type="checkbox" id="${h.id}">
        <label>${h.label}</label>
      </div>`;
    document.getElementById(h.id).onchange = () => liveTick(h.id);
  });
}

function liveTick(id) {
  const wrap = document.getElementById(`wrap-${id}`);
  wrap.classList.toggle("checked", document.getElementById(id).checked);
  wrap.classList.remove("missed");
}

function saveDay() {
  let data = {};
  habits.forEach(h => {
    const checked = document.getElementById(h.id).checked;
    const wrap = document.getElementById(`wrap-${h.id}`);
    data[h.id] = checked;
    wrap.className = "habit " + (checked ? "checked" : "missed");
  });
  localStorage.setItem(todayKey, JSON.stringify(data));
  updateStats();
  updateStreak();
  renderCalendar();
  checkMissedDay();
}

function loadDay(key) {
  const data = JSON.parse(localStorage.getItem(key));
  habits.forEach(h => {
    const cb = document.getElementById(h.id);
    const wrap = document.getElementById(`wrap-${h.id}`);
    const checked = data ? data[h.id] : false;
    cb.checked = checked;
    wrap.className = "habit" + (data ? (checked ? " checked" : " missed") : "");
  });
}

function getProgress(key) {
  const data = JSON.parse(localStorage.getItem(key));
  if (!data) return null;
  return (Object.values(data).filter(v => v).length / habits.length) * 100;
}

function updateStats() {
  setBar("today", getProgress(todayKey) || 0);

  let w = 0, wd = 0;
  for (let i = 0; i < 7; i++) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let p = getProgress(getLocalDateKey(d));
    if (p !== null) { w += p; wd++; }
  }
  setBar("week", wd ? w / wd : 0);

  let m = 0, md = 0;
  for (let i = 0; i < 30; i++) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let p = getProgress(getLocalDateKey(d));
    if (p !== null) { m += p; md++; }
  }
  setBar("month", md ? m / md : 0);
}

function setBar(type, val) {
  document.getElementById(type + "Bar").style.width = val + "%";
  document.getElementById(type + "Stat").innerText =
    `${type.charAt(0).toUpperCase() + type.slice(1)}: ${Math.round(val)}%`;
}

function updateStreak() {
  let s = 0;
  let d = new Date();
  while (localStorage.getItem(getLocalDateKey(d))) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  document.getElementById("streak").innerText = `🔥 ${s} day streak`;
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  document.getElementById("calendarTitle").innerText =
    new Date(currentYear, currentMonth)
      .toLocaleString("default", { month: "long", year: "numeric" });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) cal.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const key = getLocalDateKey(date);
    const cell = document.createElement("div");

    cell.innerHTML = d;
    if (key === todayKey) cell.classList.add("today");

    const p = getProgress(key);
    if (p !== null) {
      const span = document.createElement("span");
      span.innerText = `${Math.round(p)}%`;
      cell.appendChild(span);
    }

    cell.onclick = () => loadDay(key);
    cal.appendChild(cell);
  }
}

function checkMissedDay() {
  const warn = document.getElementById("missedWarning");
  let y = new Date();
  y.setDate(y.getDate() - 1);
  if (!localStorage.getItem(getLocalDateKey(y))) {
    warn.innerText = "You didn’t log yesterday 👀";
    warn.style.display = "block";
  } else {
    warn.style.display = "none";
  }
}

function updateGreeting(now) {
  const h = now.getHours();
  let text =
    h >= 5 && h < 12 ? "Good morning ☀️" :
    h >= 12 && h < 17 ? "Good afternoon 🌤️" :
    h >= 17 && h < 21 ? "Good evening 🌆" :
    "Late night grind 🌙";
  document.getElementById("greeting").innerText = text;
}

function startDateTime() {
  let lastKey = todayKey;
  setInterval(() => {
    const now = new Date();
    const newKey = getLocalDateKey(now);

    updateGreeting(now);

    document.getElementById("dateTimeBox").innerHTML = `
      <div class="day">${now.toLocaleDateString("en-US",{weekday:"long"})}</div>
      <div class="date">${now.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"})}</div>
      <div class="time">${now.toLocaleTimeString()}</div>
    `;

    if (newKey !== lastKey) location.reload();
  }, 1000);
}

function toggleDark() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("dark", isDark);
  document.getElementById("darkToggle").innerText = isDark ? "☀️" : "🌙";
}