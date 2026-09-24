// ===== Config — replace with the real WhatsApp number (international format, digits only) =====
const WHATSAPP_NUMBER = "255000000000";

// Header background on scroll
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Mobile menu
const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", open);
});
document.querySelectorAll("#nav a").forEach((a) =>
  a.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

// Language switcher — drives the hidden Google Translate widget
const lang = document.getElementById("lang");
const langBtn = document.getElementById("langBtn");
const langCurrent = document.getElementById("langCurrent");
const getLang = () => (document.cookie.match(/googtrans=\/en\/([a-z-]+)/i) || [, "en"])[1];

let currentLang = getLang();
function markLang(code) {
  currentLang = code;
  langCurrent.textContent = code.toUpperCase();
  lang.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-selected", b.dataset.lang === code));
}
function setLang(code) {
  if (code === "en") {
    // Clear the translation cookie on every domain level and reload the original page
    const host = location.hostname;
    const parts = host.split(".");
    const domains = ["", host, ...parts.map((_, i) => "." + parts.slice(i).join("."))];
    domains.forEach((d) => {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? "; domain=" + d : ""}`;
    });
    location.reload();
    return;
  }
  markLang(code);
  // Google's widget loads asynchronously — wait briefly for it, else fall back to cookie + reload
  let tries = 0;
  (function apply() {
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      // Google sometimes ignores the first change event — re-fire until the page reports it's translated
      let fired = 0;
      (function fire() {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
        setTimeout(() => {
          const done = /translated-/.test(document.documentElement.className);
          if (!done && ++fired < 4) fire();
        }, 700);
      })();
    } else if (++tries < 30) {
      setTimeout(apply, 150);
    } else {
      document.cookie = `googtrans=/en/${code}; path=/`;
      location.reload();
    }
  })();
}
const toggleLang = (open) => {
  lang.classList.toggle("open", open);
  langBtn.setAttribute("aria-expanded", open);
};
langBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleLang(!lang.classList.contains("open")); });
lang.querySelectorAll("[data-lang]").forEach((b) =>
  b.addEventListener("click", () => { toggleLang(false); if (b.dataset.lang !== currentLang) setLang(b.dataset.lang); })
);
document.addEventListener("click", (e) => { if (!lang.contains(e.target)) toggleLang(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleLang(false); });
markLang(getLang());

// Hero video — respect reduced-motion (the poster image stays visible instead)
const heroVideo = document.getElementById("heroVideo");
if (heroVideo && matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroVideo.removeAttribute("autoplay");
  heroVideo.pause();
}

// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Quote parallax
const quoteBg = document.querySelector(".quote-bg");
if (quoteBg && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("scroll", () => {
    const r = quoteBg.parentElement.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) quoteBg.style.transform = `translateY(${r.top * -0.12}px)`;
  }, { passive: true });
}

// Gallery lightbox
const lb = document.createElement("div");
lb.className = "lightbox";
lb.innerHTML = '<img alt=""><button aria-label="Close">×</button>';
document.body.appendChild(lb);
const lbImg = lb.querySelector("img");
document.querySelectorAll(".masonry img").forEach((img) =>
  img.addEventListener("click", () => {
    lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add("open");
  })
);
lb.addEventListener("click", (e) => { if (e.target !== lbImg) lb.classList.remove("open"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });

// "Add to journey" list
const journey = new Set();
const journeyBox = document.getElementById("journey");
const journeyList = document.getElementById("journeyList");
const journeyCount = document.getElementById("journeyCount");

function renderJourney() {
  journeyList.innerHTML = "";
  journey.forEach((trip) => {
    const li = document.createElement("li");
    li.textContent = trip;
    const rm = document.createElement("button");
    rm.type = "button"; rm.textContent = "×"; rm.setAttribute("aria-label", `Remove ${trip}`);
    rm.addEventListener("click", () => { journey.delete(trip); syncLinks(); renderJourney(); });
    li.appendChild(rm);
    journeyList.appendChild(li);
  });
  journeyCount.textContent = journey.size;
  journeyBox.hidden = journey.size === 0;
}
function syncLinks() {
  document.querySelectorAll(".add-link[data-trip]").forEach((a) => {
    const on = journey.has(a.dataset.trip);
    a.classList.toggle("added", on);
    a.textContent = on ? "✓ In your journey" : "+ Add to journey";
  });
}
document.querySelectorAll("[data-trip]").forEach((el) =>
  el.addEventListener("click", () => {
    journey.add(el.dataset.trip);
    syncLinks(); renderJourney();
  })
);

// Enquiry form → WhatsApp
const form = document.getElementById("enquiryForm");
const note = document.getElementById("formNote");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;
  ["name", "email"].forEach((id) => {
    const input = form.elements[id];
    const bad = !input.value.trim() || (id === "email" && !input.checkValidity());
    input.parentElement.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { note.textContent = "Please add your name and a valid email."; return; }

  const f = form.elements;
  const lines = [
    "Hello Red Bubbles Tours! I'd like to plan a journey.",
    `Name: ${f.name.value}`,
    `Email: ${f.email.value}`,
    f.phone.value && `Phone: ${f.phone.value}`,
    f.dates.value && `Dates: ${f.dates.value}`,
    `Travellers: ${f.guests.value}`,
    journey.size && `Interested in: ${[...journey].join(", ")}`,
    f.message.value && `Notes: ${f.message.value}`,
  ].filter(Boolean);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  note.textContent = "Thank you — WhatsApp is opening with your enquiry.";
});

document.querySelectorAll(".wa-link").forEach((a) => {
  a.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  a.target = "_blank"; a.rel = "noopener";
});

// Newsletter (front-end only)
document.getElementById("subscribeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.innerHTML = '<span style="padding:.7rem 0;color:var(--champagne)">Thank you — asante sana.</span>';
});

document.getElementById("year").textContent = new Date().getFullYear();
