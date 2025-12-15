const targets = [
  60,
  2 * 60,
  4 * 60,
  8 * 60,
  5 * 8 * 60,
  22 * 8 * 60,
  12 * 22 * 8 * 60,
  10 * 12 * 22 * 8 * 60,
  80 * 1000 * 60, // 37.8788 years
];

const targetNames = [
  "1 hour",
  "2 hours",
  "Half workday",
  "1 workday",
  "1 workweek",
  "1 workmonth",
  "1 workyear",
  "1 workdecade",
  "1 career",
];

function estimateDateForTarget(t0_min, baseDateStr, target_min) {
  const t0 = t0_min;
  if (target_min <= t0) return new Date(baseDateStr);
  const ratio = target_min / t0;
  const monthsNeeded = 7 * Math.log2(ratio);
  const base = new Date(baseDateStr);
  const result = new Date(base);
  result.setMonth(result.getMonth() + Math.floor(monthsNeeded));
  const frac = monthsNeeded - Math.floor(monthsNeeded);
  result.setDate(result.getDate() + Math.round(frac * 30));
  return result;
}

function niceDiffFromNow(date) {
  const now = new Date();
  if (date <= now) return "already surpassed";

  let start = new Date(now);
  let years = 0;
  let months = 0;

  while (true) {
    const next = new Date(start);
    next.setFullYear(next.getFullYear() + 1);
    if (next <= date) {
      start = next;
      years++;
    } else {
      break;
    }
  }

  while (true) {
    const next = new Date(start);
    next.setMonth(next.getMonth() + 1);
    if (next <= date) {
      start = next;
      months++;
    } else {
      break;
    }
  }

  const diffMs = date - start;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let parts = [];
  if (years > 0) parts.push(years + (years === 1 ? " year" : " years"));
  if (months > 0) parts.push(months + (months === 1 ? " month" : " months"));
  if (days > 0) parts.push(days + (days === 1 ? " day" : " days"));

  return parts.join(", ");
}

function renderEstimates() {
  // Find models with maximum metr50 and metr80
  const modelsWithMetr50 = models.filter((m) => m.metr50 != null);
  const modelsWithMetr80 = models.filter((m) => m.metr80 != null);

  const maxModel50 =
    modelsWithMetr50.length > 0
      ? modelsWithMetr50.reduce((max, m) => (m.metr50 > max.metr50 ? m : max))
      : null;

  const maxModel80 =
    modelsWithMetr80.length > 0
      ? modelsWithMetr80.reduce((max, m) => (m.metr80 > max.metr80 ? m : max))
      : null;

  const h3Elements = document.querySelectorAll(".card h3");
  h3Elements.forEach((h3) => {
    if (h3.textContent === "With 50% success rate" && maxModel50) {
      const p = document.createElement("p");
      p.textContent = `Based on SOTA of ${formatMETRTime(maxModel50.metr50)} with ${maxModel50.name} on ${maxModel50.release}`;
      h3.parentNode.insertBefore(p, h3.nextSibling);
    } else if (h3.textContent === "With 80% success rate" && maxModel80) {
      const p = document.createElement("p");
      p.textContent = `Based on SOTA of ${formatMETRTime(maxModel80.metr80)} with ${maxModel80.name} on ${maxModel80.release}`;
      h3.parentNode.insertBefore(p, h3.nextSibling);
    }
  });

  const tbody50 = document.querySelector("#proj50 tbody");
  const tbody80 = document.querySelector("#proj80 tbody");

  targets.forEach((t, idx) => {
    const targetSeconds = t * 60; // Convert target from minutes to seconds

    // Check if target 50 is already surpassed
    const achieved50 = models.filter(
      (m) => m.metr50 != null && m.metr50 >= targetSeconds,
    );
    const earliestModel50 =
      achieved50.length > 0
        ? achieved50.reduce((earliest, m) =>
            new Date(m.release) < new Date(earliest.release) ? m : earliest,
          )
        : null;

    let eta50, howLong50;
    if (earliestModel50) {
      eta50 = `${earliestModel50.release} (${earliestModel50.name})`;
      howLong50 = "already surpassed";
    } else if (maxModel50) {
      const date50 = estimateDateForTarget(
        maxModel50.metr50 / 60,
        maxModel50.release,
        t,
      );
      eta50 = date50.toISOString().slice(0, 10);
      howLong50 = niceDiffFromNow(date50);
    } else {
      eta50 = "—";
      howLong50 = "—";
    }

    const tr50 = document.createElement("tr");
    tr50.innerHTML = `
       <td data-label="Milestone">${targetNames[idx]} (${Math.round(t / 60)}h)</td>
       <td data-label="ETA">${eta50}</td>
       <td data-label="How long till">${howLong50}</td>
     `;
    tbody50.appendChild(tr50);

    // Check if target 80 is already surpassed
    const achieved80 = models.filter(
      (m) => m.metr80 != null && m.metr80 >= targetSeconds,
    );
    const earliestModel80 =
      achieved80.length > 0
        ? achieved80.reduce((earliest, m) =>
            new Date(m.release) < new Date(earliest.release) ? m : earliest,
          )
        : null;

    let eta80, howLong80;
    if (earliestModel80) {
      eta80 = `${earliestModel80.release} (${earliestModel80.name})`;
      howLong80 = "already surpassed";
    } else if (maxModel80) {
      const date80 = estimateDateForTarget(
        maxModel80.metr80 / 60,
        maxModel80.release,
        t,
      );
      eta80 = date80.toISOString().slice(0, 10);
      howLong80 = niceDiffFromNow(date80);
    } else {
      eta80 = "—";
      howLong80 = "—";
    }

    const tr80 = document.createElement("tr");
    tr80.innerHTML = `
       <td data-label="Milestone">${targetNames[idx]} (${Math.round(t / 60)}h)</td>
       <td data-label="ETA">${eta80}</td>
       <td data-label="How long till">${howLong80}</td>
     `;
    tbody80.appendChild(tr80);
  });
}
