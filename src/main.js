import "./style.css";

import { loadLeaderboard } from "./leaderboard";

loadLeaderboard();

// Refresh every 10 seconds
setInterval(loadLeaderboard,20000);