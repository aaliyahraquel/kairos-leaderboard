const SHEET_ID = "1FtnIg2ORYBQvSFKRpidMLFW5aUpKiKZW";
const GID = "1589135017";
const API = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

async function fetchTeams() {
    const response = await fetch(API);
    const csv = await response.text();
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = isNaN(values[i]) || values[i] === '' ? values[i] : Number(values[i]);
            });
            return obj;
        });
}

const COLOUR_MAP = {
    red:    "#ce0e0e",
    blue:   "#2563eb",
    green:  "#00bf63",
    yellow: "#ffce09",
    orange: "#ff5f1f",
    purple: "#731d8c",
    pink:   "#c4789b",
    white:  "#3a3a3a",
    black:  "#1a1a1a",
    grey:   "#6b6b6b",
    gray:   "#6b6b6b",
    cyan:   "#005f6b",
    teal:   "#1a5c55",
    brown:  "#4a2800",
};

function getTeamColour(teamName) {
    const lower = teamName.toLowerCase();
    for (const [word, colour] of Object.entries(COLOUR_MAP)) {
        if (lower.includes(word)) return colour;
    }
    return "#1a1a2e";
}

export async function loadLeaderboard() {

    const top5 = (await fetchTeams()).sort((a, b) => b.Total - a.Total).slice(0, 5);

    // Only reveal the leaderboard once at least one team has a score
    const hasData = top5.some(t => t.Total > 0);
    if (hasData && !document.body.classList.contains("has-data")) {
        document.body.classList.add("has-data");
        document.getElementById("splash").classList.add("hidden");
    }

    if (!hasData) return;

    const table = document.getElementById("leaderboard");

    // Record current row positions and which teams are already in top 5 (FLIP: First)
    const oldPositions = {};
    const previousTop5 = new Set();
    table.querySelectorAll("tr[data-team]").forEach(row => {
        oldPositions[row.dataset.team] = row.getBoundingClientRect().top;
        previousTop5.add(row.dataset.team);
    });

    // Rebuild rows (FLIP: Last)
    table.innerHTML = "";
    top5.forEach((team, index) => {
        const tr = document.createElement("tr");
        tr.dataset.team = team.Teams;
        tr.style.background = getTeamColour(team.Teams);
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${team.Teams}</td>
            <td>${team.Total}</td>
        `;
        table.appendChild(tr);
    });

    // Animate rows (FLIP: Invert + Play)
    table.querySelectorAll("tr[data-team]").forEach(row => {
        const teamName = row.dataset.team;

        if (!previousTop5.has(teamName)) {
            // New entrant: slide in from below
            row.style.transition = "none";
            row.style.opacity = "0";
            row.style.transform = "translateY(60px)";
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    row.style.transition = "transform 0.6s ease, opacity 0.6s ease";
                    row.style.transform = "";
                    row.style.opacity = "";
                });
            });
        } else {
            // Existing top-5 team: FLIP to new position
            const oldTop = oldPositions[teamName];
            if (oldTop === undefined) return;
            const delta = oldTop - row.getBoundingClientRect().top;
            if (delta === 0) return;
            row.style.transition = "none";
            row.style.transform = `translateY(${delta}px)`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    row.style.transition = "transform 0.6s ease";
                    row.style.transform = "";
                });
            });
        }
    });

}