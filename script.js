 console.log("SCRIPT LOADED");
function showHome() {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("leaderboardPage").style.display = "none";

  document.getElementById("homeBtn").classList.add("active-nav");
  document.getElementById("leaderboardBtn").classList.remove("active-nav");
}

function showLeaderboard() {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("leaderboardPage").style.display = "block";

  document.getElementById("homeBtn").classList.remove("active-nav");
  document.getElementById("leaderboardBtn").classList.add("active-nav");

  window.showHome = showHome;
window.showLeaderboard = showLeaderboard;

loadLeaderboard();
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAw4cJY7oXYrXRyvawehCU7TKCRg5ZS6GY",
  authDomain: "world-cup-prediction-1ebca.firebaseapp.com",
  projectId: "world-cup-prediction-1ebca",
  storageBucket: "world-cup-prediction-1ebca.firebasestorage.app",
  messagingSenderId: "950989220636",
  appId: "1:950989220636:web:cd9f82db31549fad3068d9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FINAL_RESULT_COLLECTION = "phase6_results";
const FINAL_RESULT_DOCUMENT = "match1";
const finalistDetails = {
  SPA: {
    name: "Spain",
    logo: "spa.png",
    colors: ["#aa151b", "#f1bf00", "#aa151b"]
  },
  ARG: {
    name: "Argentina",
    logo: "argentina.png",
    colors: ["#74acdf", "#ffffff", "#74acdf"]
  }
};

let officialWorldWinner = null;
let predictionChampion = null;
let topScore = 0;

function showCelebration(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
}

function hideCelebration(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
}

function createConfetti(modalId, colors) {
  const layer = document.querySelector(`#${modalId} .confetti-layer`);
  if (!layer || layer.childElementCount) return;

  Array.from({ length: 34 }, (_, index) => {
    const piece = document.createElement("span");
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-left", `${(index * 31) % 100}%`);
    piece.style.setProperty("--confetti-delay", `${(index % 9) * -0.23}s`);
    piece.style.setProperty("--confetti-rotate", `${(index * 47) % 360}deg`);
    layer.appendChild(piece);
  });
}

function prepareCelebrations() {
  if (!officialWorldWinner || predictionChampion.length === 0) return;
  if (sessionStorage.getItem("wcFinalCelebrationShown")) return;

  const winner = finalistDetails[officialWorldWinner];
  if (!winner) return;

  document.getElementById("worldWinnerFlag").innerHTML =
`<img src="${winner.logo}" class="winner-logo" alt="${winner.name}">`;
  document.getElementById("worldWinnerTitle").textContent = winner.name;
  document.getElementById("worldWinnerMessage").textContent = `${winner.name} are the champions of the world!`;
 
 const names = predictionChampion.map(user => user.name);

document.getElementById("predictionWinnerTitle").textContent =
predictionChampion.length === 1
  ? "Prediction Champion"
  : `${predictionChampion.length} Prediction Champions`;

document.getElementById("predictionWinnerMessage").innerHTML =
`
<strong>${names.join("<br>")}</strong>
<br><br>
${topScore} Points • Top of the Prediction Hub Leaderboard
`;

  createConfetti("winnerCelebration", winner.colors);
  createConfetti("predictionCelebration", ["#facc15", "#ffffff", "#22c55e"]);
  sessionStorage.setItem("wcFinalCelebrationShown", "true");
  setTimeout(() => showCelebration("winnerCelebration"), 700);
}

async function loadOfficialFinalWinner() {
  try {
    const result = await getDoc(doc(db, FINAL_RESULT_COLLECTION, FINAL_RESULT_DOCUMENT));
    if (!result.exists()) return;

    const data = result.data();
    const winnerCode = String(data.winnerCode || data.winner || data.result || data.team || "").trim().toUpperCase();
    if (finalistDetails[winnerCode]) {
      officialWorldWinner = winnerCode;
      prepareCelebrations();
    }
  } catch (error) {
    console.warn("Could not load official final winner:", error);
  }
}

async function loadFinalProbability() {
  const status = document.getElementById("probabilityStatus");
  const totalLabel = document.getElementById("probabilityTotal");

  try {
    const snapshot = await getDocs(collection(db, "predictions_phase6"));
    let spain = 0;
    let argentina = 0;

    snapshot.forEach((prediction) => {
      const pick = prediction.data().match1;
      if (pick === "SPA") spain++;
      if (pick === "ARG") argentina++;
    });

    const total = spain + argentina;
    const spainPct = total ? Math.round((spain / total) * 100) : 0;
    const argentinaPct = total ? 100 - spainPct : 0;

    document.getElementById("spainProbability").textContent = `${spainPct}%`;
    document.getElementById("argentinaProbability").textContent = `${argentinaPct}%`;
    document.getElementById("spainProbabilityBar").style.width = `${spainPct}%`;
    document.getElementById("argentinaProbabilityBar").style.width = `${argentinaPct}%`;
    status.textContent = "Live";
    totalLabel.textContent = total
      ? `${total} community prediction${total === 1 ? "" : "s"}`
      : "No final predictions submitted yet.";
  } catch (error) {
    console.error("Could not load final probability:", error);
    status.textContent = "Unavailable";
    totalLabel.textContent = "Probability data is temporarily unavailable.";
  }
}

async function loadLeaderboard() {

  const leaderboard = document.getElementById("leaderboardList");

  leaderboard.innerHTML = "Loading...";

 const phase1Snapshot = await getDocs(collection(db,"predictions"));
const phase2Snapshot = await getDocs(collection(db,"predictions_phase2"));
const phase3Snapshot = await getDocs(collection(db,"predictions_phase3"));
const phase4Snapshot = await getDocs(collection(db,"predictions_phase4"));
const phase5Snapshot = await getDocs(collection(db,"predictions_phase5"));
const phase6Snapshot = await getDocs(collection(db,"predictions_phase6"));

  leaderboard.innerHTML = "";

 const leaderboardMap = new Map();

  phase1Snapshot.forEach((doc)=>{

const user = doc.data();

const key =
user.role === "Faculty"
? user.name.trim().toLowerCase()
: user.rollno;

leaderboardMap.set(key,{
...user,
points:user.points || 0
});

});

  phase2Snapshot.forEach((doc)=>{

const user = doc.data();

const key =
user.role === "Faculty"
? user.name.trim().toLowerCase()
: user.rollno;

if(leaderboardMap.has(key)){

leaderboardMap.get(key).points +=
(user.points || 0);

}else{

leaderboardMap.set(key,{
...user,
points:user.points || 0
});

}

});

  phase3Snapshot.forEach((doc)=>{

const user = doc.data();

const key =
user.role === "Faculty"
? user.name.trim().toLowerCase()
: user.rollno;

if(leaderboardMap.has(key)){

leaderboardMap.get(key).points +=
(user.points || 0);

}else{

leaderboardMap.set(key,{
...user,
points:user.points || 0
});

}

});
 phase4Snapshot.forEach((doc)=>{

const user = doc.data();

const key =
user.role === "Faculty"
? user.name.trim().toLowerCase()
: user.rollno;

if(leaderboardMap.has(key)){

leaderboardMap.get(key).points +=
(user.points || 0);

}else{

leaderboardMap.set(key,{
...user,
points:user.points || 0
});

}

});

phase5Snapshot.forEach((doc)=>{

const user = doc.data();

const key =
user.role === "Faculty"
? user.name.trim().toLowerCase()
: user.rollno;

if(leaderboardMap.has(key)){

leaderboardMap.get(key).points +=
(user.points || 0);

}else{

leaderboardMap.set(key,{
...user,
points:user.points || 0
});

}

});

phase6Snapshot.forEach((doc)=>{

const user = doc.data();

const key =
user.role === "Faculty"
? user.name.trim().toLowerCase()
: user.rollno;

if(leaderboardMap.has(key)){

leaderboardMap.get(key).points +=
(user.points || 0);

}else{

leaderboardMap.set(key,{
...user,
points:user.points || 0
});

}

});


  const users = [...leaderboardMap.values()];

users.sort((a,b)=>
(b.points || 0) - (a.points || 0)
);
  // Stats Update

document.getElementById("activeStage").textContent =
"Final";

document.getElementById("totalParticipants").textContent =
users.length;

document.getElementById("currentTopper").textContent =
users.length > 0 ? users[0].name : "-";

document.getElementById("totalPredictions").textContent =
users.length;

topScore = users[0]?.points || 0;

predictionChampion = users.filter(user => user.points === topScore);

prepareCelebrations();

  leaderboard.innerHTML += `
<div class="podium-row">

<div class="podium second">
<h1>🥈</h1>
<h2>${users[1]?.name || "-"}</h2>
<p>
${users[1]?.role === "Faculty"
? "Faculty"
: `${users[1]?.department} • ${users[1]?.year}`}
</p>

<p>${users[1]?.points || 0} pts</p>
</div>

<div class="podium first">
<h1>🥇</h1>
<h2>${users[0]?.name || "-"}</h2>
<p>
${users[0]?.role === "Faculty"
? "Faculty"
: `${users[0]?.department} • ${users[0]?.year}`}
</p>-------

<p>${users[0]?.points || 0} pts</p>
</div>

<div class="podium third">
<h1>🥉</h1>
<h2>${users[2]?.name || "-"}</h2>
<p>
${users[2]?.role === "Faculty"
? "Faculty"
: `${users[2]?.department} • ${users[2]?.year}`}
</p>

<p>${users[2]?.points || 0} pts</p>
</div>

</div>
`;

  // 4th onwards
  for(let i = 3; i < users.length; i++){

    leaderboard.innerHTML += `
    <div class="stage">
      <div>
        <h3>#${i+1} ${users[i].name}</h3>
        <p>
${users[i].role === "Faculty"
? "Faculty"
: `${users[i].department} • ${users[i].year}`}
</p>
      </div>

      <span>${users[i].points} pts</span>
    </div>
    `;
  }

}
window.showHome = showHome;
window.showLeaderboard = showLeaderboard;

loadLeaderboard();
loadFinalProbability();
loadOfficialFinalWinner();

document.querySelectorAll("[data-close-celebration]").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".celebration-modal");
    if (!modal) return;
    hideCelebration(modal.id);
  });
});

document.getElementById("showPredictionChampion").addEventListener("click", () => {
  hideCelebration("winnerCelebration");
  setTimeout(() => showCelebration("predictionCelebration"), 180);
});
