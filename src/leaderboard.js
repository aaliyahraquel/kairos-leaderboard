const SHEET_ID = "1FtnIg2ORYBQvSFKRpidMLFW5aUpKiKZW";
const GAME_SHEETS = ["229388511", "530821742", "2019959769"];
const API = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const COLOUR_MAP = {
    red: "#ce0e0e",
    blue: "#2563eb",
    green: "#00bf63",
    yellow: "#ffce09",
    orange: "#ff5f1f",
    purple: "#731d8c",
    pink: "#c4789b",
    white: "#3a3a3a",
    black: "#1a1a1a",
    grey: "#2563eb",
    gray: "#2563eb",
    cyan: "#005f6b",
    teal: "#1a5c55",
    brown: "#4a2800",
};

function getTeamColour(teamName) {
    const lower = teamName.toLowerCase();
    for (const [word, colour] of Object.entries(COLOUR_MAP)) {
        if (lower.includes(word)) return colour;
    }
    return "#1a1a2e";
}

function getDisplayTeamName(teamName) {
    return teamName.replace(/grey|gray/gi, match =>
        match === match.toUpperCase() ? "BLUE" :
        match[0] === match[0].toUpperCase() ? "Blue" : "blue"
    );
}

async function fetchGameSheet(gid) {
    const response = await fetch(`${API}&gid=${gid}&_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load game scores (${response.status})`);
    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/);
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

async function fetchTeams() {
    const gameRows = await Promise.all(GAME_SHEETS.map(fetchGameSheet));
    const totals = new Map();

    gameRows.forEach(rows => {
        rows.forEach(team => {
            if (!team.Teams) return;
            const name = String(team.Teams).trim();
            const roundTotal = Object.keys(team)
                .filter(header => /^round(?:\s|$)/i.test(header))
                .reduce((sum, header) => {
                    const score = Number(team[header]);
                    return sum + (Number.isFinite(score) ? score : 0);
                }, 0);
            totals.set(name, (totals.get(name) || 0) + roundTotal);
        });
    });

    return Array.from(totals, ([Teams, CalculatedTotal]) => ({ Teams, CalculatedTotal }));
}

export async function loadLeaderboard() {

    const top5 = (await fetchTeams())
        .sort((a, b) => b.CalculatedTotal - a.CalculatedTotal)
        .slice(0, 5);

    const table = document.getElementById("leaderboard");
    const splash = document.getElementById("splash");
    const hasData = top5.some(t => t.CalculatedTotal > 0);

    if (!hasData) {
        table.innerHTML = "";
        document.body.classList.remove("has-data");
        splash.classList.remove("hidden");
        return;
    }

    if (!document.body.classList.contains("has-data")) {
        document.body.classList.add("has-data");
        splash.classList.add("hidden");
    }

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
            <td>${getDisplayTeamName(team.Teams)}</td>
            <td>${team.CalculatedTotal}</td>
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