const API =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSC91DP2WHj3p8Ge7sbBGs1uDST_FA6fZXDkWLOKI1Q9eiSu033ay9zp8ZNvKmq80wzBFLTII2Jok-omSYQSfYQ2PcDwegolnAwy90Rh62FOV3uz-9q0Gf5GAn7Mx3CLccexg1A0i0yW57myKAq2BUG8d0eJ8nCqogC-b5S1QTBORDh11ijCDENcy0ftbA_he4EC2WnwnbxcZdRSdLiqxSjCvGAsDrcC3iz_hlOVRAuqkrs5S7cR0C8hoOobCVDQPaonB0CSgEtQ_tUlxZnj2C1plY6Ew&lib=MGVrbAM_pdBWdWWJzuiSu3Aoq0hkS1uT9";

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
    grey:   "#2e2e2e",
    gray:   "#2e2e2e",
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

    const response = await fetch(API);

    const teams = (await response.json()).sort((a, b) => b.Total - a.Total);

    const table = document.getElementById("leaderboard");

    // Record current row positions before update (FLIP: First)
    const oldPositions = {};
    table.querySelectorAll("tr[data-team]").forEach(row => {
        oldPositions[row.dataset.team] = row.getBoundingClientRect().top;
    });

    // Rebuild rows (FLIP: Last)
    table.innerHTML = "";
    teams.forEach((team, index) => {
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

    // Animate from old positions to new (FLIP: Invert + Play)
    table.querySelectorAll("tr[data-team]").forEach(row => {
        const oldTop = oldPositions[row.dataset.team];
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
    });

}