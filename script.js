/* -------------------------------------------------------
   Les Bleus - France World Cup Squad
   Main Application Script
   ------------------------------------------------------- */

// Stat labels for outfield player radar
const STAT_LABELS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
// Stat labels for goalkeeper radar
const GK_STAT_LABELS = ["DIV", "HAN", "KIC", "REF", "SPD", "POS"];

// Radar chart instance (re-used in modal)
let radarChart = null;


/* -------------------------------------------------------
   ASYNC DATA LOADING
   Uses fetch + async/await to load JSON dataset
   ------------------------------------------------------- */

async function loadPlayerData() {
  try {
    const response = await fetch("players.json");
    if (!response.ok) {
      throw new Error(`Failed to load player data: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading player data:", error);
    document.getElementById("pitchContainer").innerHTML =
      '<p style="text-align:center;color:#f0883e;padding:2rem;">Error loading player data. Please check that players.json is in the same folder.</p>';
    return null;
  }
}


/* -------------------------------------------------------
   INTRO ANIMATION (GSAP)
   Crest fades in from behind, then site reveals
   ------------------------------------------------------- */

function playIntroAnimation(onComplete) {
  const tl = gsap.timeline({
    onComplete: onComplete
  });

  // Crest scales up from small (like coming from background)
  tl.fromTo("#crestImg",
    { scale: 0.3, opacity: 0 },
    { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }
  );

  // Title slides up
  tl.fromTo("#introTitle",
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
    "-=0.3"
  );

  // Gold underline draws out from the center
  tl.to("#introTitleUnderline", {
    scaleX: 1,
    duration: 0.45,
    ease: "power2.out",
    transformOrigin: "50% 50%"
  }, "-=0.15");

  // Gold glint sweeps across the title text once (CSS keyframe via class toggle)
  tl.add(() => {
    const titleText = document.getElementById("introTitleText");
    if (!titleText) return;
    titleText.classList.remove("title-glint"); // reset if re-played
    // Force reflow so the animation restarts cleanly
    void titleText.offsetWidth;
    titleText.classList.add("title-glint");
  }, "-=0.2");

  // Subtitle fades in
  tl.fromTo("#introSubtitle",
    { opacity: 0 },
    { opacity: 1, duration: 0.5 },
    "-=0.05"
  );

  // Hold, then fade out overlay
  tl.to("#introOverlay", {
    opacity: 0,
    duration: 0.6,
    delay: 0.8,
    ease: "power2.inOut"
  });

  // Show the site
  tl.to("#siteWrapper", {
    opacity: 1,
    duration: 0.5,
    ease: "power2.out"
  }, "-=0.3");

  return tl;
}


/* -------------------------------------------------------
   RENDER PLAYER CARDS ON PITCH
   ------------------------------------------------------- */

function avatarUrl(player, size) {
  const params = new URLSearchParams({
    seed: player.fullName,
    backgroundType: "solid",
    backgroundColor: "1a2236"
  });
  if (player.skinColor) params.set("skinColor", player.skinColor);
  if (size) params.set("size", String(size));
  return `https://api.dicebear.com/9.x/pixel-art/svg?${params.toString()}`;
}

function createMiniCard(player) {
  const card = document.createElement("div");
  card.className = "player-card-mini";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `View details for ${player.fullName}, ${player.position}, rated ${player.rating}`);

  card.innerHTML = `
    <div class="mini-rating">${player.rating}</div>
    <div class="mini-position">${player.position}</div>
    <div class="mini-avatar">
      <img src="${avatarUrl(player)}" alt="${player.name} avatar">
    </div>
    <div class="mini-name">${player.name}</div>
  `;

  // Click to open modal
  card.addEventListener("click", () => openModal(player));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(player);
    }
  });

  return card;
}

// Map formation row -> vertical position (% from top of full pitch).
// France defends the BOTTOM half: GK on the south goal line, attackers near halfway.
// Spread the XI across the full pitch (FUT-style), top to bottom.
const ROW_Y_PERCENT = {
  1: 22,  // Forwards (LW / ST / RW) - high up the pitch
  2: 45,  // Midfield (CM / CDM / CM)
  3: 67,  // Defense (LB / CB / CB / RB)
  4: 87   // Goalkeeper
};

// Per-row vertical nudges by column index so the ST sits a bit higher
// than the wingers (mimics FUT's slightly-staggered front line).
const ROW_Y_OFFSET = {
  1: { 1: 4, 2: -4, 3: 4 } // LW slightly back, ST forward, RW slightly back
};

// Horizontal positions (% from left) keyed by total slots in that row.
// We re-index per row at render time so any formationPos.col lays out cleanly.
const ROW_X_LAYOUTS = {
  1: [50],
  3: [24, 50, 76],
  4: [17, 39, 61, 83]
};

function renderPitch(players) {
  const slots = document.getElementById("pitchSlots");
  slots.innerHTML = "";

  // Group by row, then sort each row by col so left-to-right matches the data
  const byRow = {};
  players.forEach(p => {
    (byRow[p.formationPos.row] ||= []).push(p);
  });
  Object.values(byRow).forEach(arr =>
    arr.sort((a, b) => a.formationPos.col - b.formationPos.col)
  );

  Object.entries(byRow).forEach(([row, rowPlayers]) => {
    const baseTop = ROW_Y_PERCENT[row];
    const xs      = ROW_X_LAYOUTS[rowPlayers.length] || [50];
    const yOffsets = ROW_Y_OFFSET[row] || {};

    rowPlayers.forEach((player, idx) => {
      const colIdx = idx + 1;
      const left = xs[idx] ?? 50;
      const top  = baseTop + (yOffsets[colIdx] || 0);

      const slot = document.createElement("div");
      slot.className = "pitch-slot";
      slot.style.top  = `${top}%`;
      slot.style.left = `${left}%`;
      slot.appendChild(createMiniCard(player));
      slots.appendChild(slot);
    });
  });
}

function renderSubs(substitutes) {
  const subsList = document.getElementById("subsList");
  subsList.innerHTML = "";

  substitutes.forEach(player => {
    const card = document.createElement("div");
    card.className = "sub-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `View details for substitute ${player.fullName}, ${player.position}, rated ${player.rating}`);

    card.innerHTML = `
      <div class="mini-rating" style="font-size:1.1rem;">${player.rating}</div>
      <div class="mini-position">${player.position}</div>
      <div class="mini-avatar" style="width:36px;height:36px;">
        <img src="${avatarUrl(player)}" alt="${player.name} avatar">
      </div>
      <div class="mini-name">${player.name}</div>
    `;

    card.addEventListener("click", () => openModal(player));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(player);
      }
    });

    subsList.appendChild(card);
  });
}


/* -------------------------------------------------------
   ANIMATE CARDS ONTO PITCH (GSAP)
   Each card emerges individually
   ------------------------------------------------------- */

function animateCardsIn() {
  // Fade in the hero emblem on the main page
  gsap.fromTo("#heroEmblem",
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }
  );

  // Animate starting XI cards
  gsap.fromTo(".player-card-mini",
    { opacity: 0, y: 30, scale: 0.8 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.4)",
      stagger: {
        each: 0.1,
        from: "end" // GK first, forwards last (bottom to top feel)
      }
    }
  );

  // Animate subs after starting XI
  gsap.fromTo(".sub-card",
    { opacity: 0, x: -20 },
    {
      opacity: 1,
      x: 0,
      duration: 0.4,
      ease: "power2.out",
      stagger: 0.1,
      delay: 1.2
    }
  );
}


/* -------------------------------------------------------
   SQUAD RATING CALCULATION
   ------------------------------------------------------- */

function calculateSquadRating(players) {
  if (!players.length) return 0;
  const sum = players.reduce((acc, p) => acc + p.rating, 0);
  return Math.round(sum / players.length);
}


/* -------------------------------------------------------
   MODAL: OPEN / CLOSE
   ------------------------------------------------------- */

function openModal(player) {
  const overlay = document.getElementById("modalOverlay");

  // Determine if player is a GK
  const isGK = player.position === "GK";
  const labels = isGK ? GK_STAT_LABELS : STAT_LABELS;
  const statsSource = isGK ? player.gkStats : player.stats;

  // Fill card
  document.getElementById("modalRating").textContent = player.rating;
  document.getElementById("modalPosition").textContent = player.position;
  document.getElementById("modalName").textContent = player.name;
  document.getElementById("modalClub").textContent = player.club;
  document.getElementById("modalAvatar").src = avatarUrl(player);
  document.getElementById("modalAvatar").alt = `${player.name} avatar`;

  // Card stats
  const statsEl = document.getElementById("modalCardStats");
  statsEl.innerHTML = labels.map(s => `
    <div class="modal-stat">
      <span class="modal-stat-label">${s}</span>
      <span class="modal-stat-val">${statsSource[s]}</span>
    </div>
  `).join("");

  // Details
  document.getElementById("modalFullName").textContent = player.fullName;
  document.getElementById("modalBio").textContent = player.bio || "";

  // Meta tags
  const metaEl = document.getElementById("modalMeta");
  metaEl.innerHTML = [
    player.age ? `${player.age} yrs` : "",
    player.height || "",
    player.club || "",
    player.league || "",
    player.preferredFoot ? `${player.preferredFoot} foot` : ""
  ].filter(Boolean).map(t => `<span class="meta-tag">${t}</span>`).join("");

  // Show modal
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Animate modal content
  gsap.fromTo("#modalContent",
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
  );

  // Render radar chart
  renderRadarChart(labels, statsSource, player.name);
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  gsap.to("#modalContent", {
    scale: 0.9,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// Close button
document.getElementById("modalClose").addEventListener("click", closeModal);

// Click outside to close
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Escape key to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});


/* -------------------------------------------------------
   RADAR CHART (Chart.js)
   ------------------------------------------------------- */

function renderRadarChart(labels, stats, playerName) {
  const ctx = document.getElementById("modalRadarChart").getContext("2d");

  // Destroy previous chart instance if it exists
  if (radarChart) {
    radarChart.destroy();
  }

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: playerName,
        data: labels.map(l => stats[l]),
        backgroundColor: "rgba(201, 161, 74, 0.18)",
        borderColor: "rgba(201, 161, 74, 0.95)",
        borderWidth: 2,
        pointBackgroundColor: "#c9a14a",
        pointBorderColor: "#c9a14a",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            display: false
          },
          grid: {
            color: "rgba(244, 244, 244, 0.10)"
          },
          angleLines: {
            color: "rgba(244, 244, 244, 0.10)"
          },
          pointLabels: {
            color: "#eaf6f0",
            font: {
              family: "'Oswald', sans-serif",
              size: 12,
              weight: "500"
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(14, 32, 24, 0.96)",
          titleFont: { family: "'Oswald', sans-serif", size: 12, weight: "700" },
          bodyFont: { family: "'Source Sans 3', sans-serif", size: 11 },
          titleColor: "#c9a14a",
          bodyColor: "#eaf6f0",
          borderColor: "rgba(201, 161, 74, 0.35)",
          borderWidth: 1,
          padding: 8,
          cornerRadius: 4,
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => ` ${item.raw} / 100`
          }
        }
      },
      animation: {
        duration: 500,
        easing: "easeOutQuart"
      }
    }
  });
}


/* -------------------------------------------------------
   INITIALIZATION
   ------------------------------------------------------- */

async function init() {
  const data = await loadPlayerData();
  if (!data) return;

  // Render players on pitch
  renderPitch(data.players);
  renderSubs(data.substitutes);

  // Calculate and display squad rating
  const allPlayers = [...data.players, ...data.substitutes];
  const startingXI = data.players;
  document.getElementById("squadRating").textContent = calculateSquadRating(startingXI);

  // Play intro animation, then animate cards
  playIntroAnimation(() => {
    // Remove overlay from DOM after animation
    const overlay = document.getElementById("introOverlay");
    overlay.style.pointerEvents = "none";
    animateCardsIn();
  });
}

// Run on page load
init();
