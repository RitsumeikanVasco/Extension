// ==========================================
// STATE MANAGEMENT
// ==========================================
let socket = null; // Global socket instance

let userData = {
    points: 0,
    team: null,
    hasVoted: false
};

let teamStats = {
    team1Count: 0,
    team2Count: 0
};

const shopItems = [
    { id: 'Health10', name: 'Health +10', icon: '❤️', price: 50 },
    { id: 'Health50', name: 'Health +50', icon: '💚', price: 250 },
    { id: 'Health100', name: 'Health +100', icon: '💙', price: 400 }
];

const attackOptions = [
    { id: 'STAND_FA', name: 'Punch', icon: '👊' },
    { id: 'CROUCH', name: 'Crouch', icon: '⬇️' },
    { id: 'FORWARD_WALK', name: 'Walk Forward', icon: '➡️' },
    { id: 'BACK_STEP', name: 'Step Back', icon: '⬅️' },
    { id: 'STAND_GUARD', name: 'Guard', icon: '🛡️' },
    { id: 'STAND_F_D_DFA', name: 'Punch Up', icon: '👊⬆️' }
];

// ==========================================
// STATE RESET FUNCTION - Easy to use!
// ==========================================
function resetState() {
    userData = {
        points: 0,
        team: null,
        hasVoted: false
    };
    renderUI();
    console.log('State has been reset!');
}

// Make resetState globally accessible - just type resetState() in console
window.resetState = resetState;

// ==========================================
// API MOCKS (Replace with real Fetch calls)
// ==========================================
async function fetchUserData() {
    return { points: 250, team: null };
}

async function fetchTeamStats() {
    return { team1Count: 42, team2Count: 38 };
}

// panel.js

// 1. Define your handler separately
function handleAuth(auth) {
    console.log('Twitch Extension Authorized', auth);
    
    // Connect to your server
    socket = io('https://declinatory-kayleigh-statesmanly.ngrok-free.dev', {
        transports: ['websocket'], // This skips the HTTP handshake and goes straight to TCP
        upgrade: false,
        auth: auth
    });

    socket.on('connect_error', (err) => {
        console.error("Connection Failed:", err.message);
    });

    socket.on('connect', () => {
        console.log('Connected to Socket.io!');

        function updatePoints(newPoints){
            userData.points = newPoints

            renderUI()
        }

        function updateTeamCounts(counts){
            teamStats.team1Count = counts.team1Count || 0;
            teamStats.team2Count = counts.team2Count || 0;

            renderUI()
        }

        // Points \\
        socket.on("updatedValues", (points)=>{
            updatePoints(points)
        })

        socket.emit("getPoints", (points) => {
            updatePoints(points)
        })

        // Team \\
        socket.on("joinedTeam", (team)=>{
            userData.team = team
            renderUI()
        })

        socket.on("leftTeam", ()=>{
            userData.team = null
            renderUI()
        })

        socket.on("teamCountsChanged", (counts) => {
            console.log("Team counts updated:", counts);
            updateTeamCounts(counts);
        });

        socket.emit("getTeamsCount", (counts) => {
            updateTeamCounts(counts);
        });

        // Votes \\
        socket.on("voted", ()=> {
            userData.hasVoted = true;
            renderUI()
        })

        socket.emit("getVoted", (voted) => {
            userData.hasVoted = voted
            renderUI()
        })

        socket.on("voteReset", () => {
            userData.hasVoted = false
            renderUI()
        });

        renderUI()
    });

    console.log("Loaded client auth")
}

// 2. Register it normally for Twitch
// window.Twitch.ext.onAuthorized(handleAuth);

// 3. MOCK: Manually trigger it ONLY if testing locally
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("Running in local mock mode...");
    setTimeout(() => {
        const mockAuth = { 
            token: "mock_jwt_token", 
            channelId: "123456", 
            userId: "U12345678" 
        }

        handleAuth(mockAuth); 
    }, 500);
}

// ==========================================
// UI LOGIC
// ==========================================

function renderUI() {
    document.getElementById('pointsValue').textContent = userData.points;

    // Enable/disable tabs based on team selection
    const attacksTabBtn = document.getElementById('attacksTabBtn');
    const shopTabBtn = document.getElementById('shopTabBtn');
    const headerTeamBadge = document.getElementById('headerTeamBadge');
    
    if (userData.team) {
        attacksTabBtn.classList.remove('disabled');
        shopTabBtn.classList.remove('disabled');
        
        document.getElementById('currentTeam').style.display = 'block';
        document.getElementById('teamSelection').style.display = 'none';
        const badge = document.getElementById('teamBadge');
        badge.textContent = `Team ${userData.team}`;
        badge.className = `team-badge team-${userData.team}`;
        
        // Show team badge in header
        headerTeamBadge.textContent = `Team ${userData.team}`;
        headerTeamBadge.className = `header-team-badge team-${userData.team}`;
        headerTeamBadge.style.display = 'block';
    } else {
        attacksTabBtn.classList.add('disabled');
        shopTabBtn.classList.add('disabled');
        
        document.getElementById('currentTeam').style.display = 'none';
        document.getElementById('teamSelection').style.display = 'block';
        
        // Hide team badge in header
        headerTeamBadge.style.display = 'none';
    }

    document.getElementById('team1Count').textContent = teamStats.team1Count;
    document.getElementById('team2Count').textContent = teamStats.team2Count;

    renderShop();
    renderAttacks();
}

function renderShop() {
    const shopGrid = document.getElementById('shopGrid');
    shopGrid.innerHTML = ''; // Clear current grid

    shopItems.forEach(item => {
        const canAfford = userData.points >= item.price;
        const itemEl = document.createElement('div');
        itemEl.className = `shop-item ${canAfford ? '' : 'disabled'}`;
        itemEl.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-price"><span>💎</span><span>${item.price}</span></div>
        `;
        
        if (canAfford) {
            itemEl.addEventListener('click', () => purchaseItem(item));
        }
        shopGrid.appendChild(itemEl);
    });
}

function renderAttacks() {
    // Show voting interface or "Voted" message
    const votingEl = document.getElementById('attackVoting');
    const votedEl = document.getElementById('attackVoted');
    
    if (userData.hasVoted) {
        votingEl.style.display = 'none';
        votedEl.style.display = 'flex';
    } else {
        votingEl.style.display = 'block';
        votedEl.style.display = 'none';
        
        const attackGrid = document.getElementById('attackGrid');
        attackGrid.innerHTML = ''; // Clear current grid

        attackOptions.forEach(attack => {
            const itemEl = document.createElement('div');
            itemEl.className = 'attack-item';
            itemEl.innerHTML = `
                <div class="attack-item-icon">${attack.icon}</div>
                <div class="attack-item-name">${attack.name}</div>
            `;
            
            itemEl.addEventListener('click', () => voteForAttack(attack));
            attackGrid.appendChild(itemEl);
        });
    }
}

async function voteForAttack(attack) {
    try {
        // Emit vote to server via socket
        if (socket && socket.connected) {
            socket.emit('voteAttack', attack.id);
            console.log(`Emitted voteAttack: ${attack.id}`);
        }
        
        userData.hasVoted = true;
        console.log(`Voted for attack: ${attack.name}`);
        renderUI();
        
        // Add your custom logic here based on attack.id
        switch(attack.id) {
            case 'STAND_FA': // Punch
                console.log('Voted for Punch attack');
                break;
            case 'CROUCH': // Crouch
                console.log('Voted for Crouch action');
                break;
            case 'FORWARD_WALK': // Walk Forward
                console.log('Voted for Walk Forward action');
                break;
            case 'BACK_STEP': // Step Back
                console.log('Voted for Step Back action');
                break;
            case 'STAND_GUARD': // Guard
                console.log('Voted for Guard action');
                break;
            case 'STAND_F_D_DFA': // Punch Up
                console.log('Voted for Punch Up attack');
                break;
        }
    } catch (error) {
        console.error('Error voting for attack:', error);
    }
}

async function selectTeam(teamNumber) {
    userData.team = teamNumber;
    renderUI();
}

async function purchaseItem(item) {
    if (userData.points >= item.price) {
        // Emit purchase to server via socket
        if (socket && socket.connected) {
            socket.emit('purchaseItem', item.id);
            console.log(`Emitted purchaseItem: ${item.id}`);
        }
        
        userData.points -= item.price;
        console.log(`Purchased ${item.name}`);
        renderUI();
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================

// 1. Setup Tab Switching
document.getElementById('tabContainer').addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab');
    if (tabBtn) switchTab(tabBtn.dataset.tab);
});

// 2. Setup Team Selection
document.getElementById('teamOptions').addEventListener('click', (e) => {
    const option = e.target.closest('.team-option');
    if (option) selectTeam(parseInt(option.dataset.team));
});

// 3. Twitch Extension Initialization
window.Twitch.ext.onAuthorized(async (auth) => {
    console.log('Twitch Authorized');
    handleAuth(auth)
    
    // Fetch initial data
    const [uData, tStats] = await Promise.all([fetchUserData(), fetchTeamStats()]);
    userData = uData;
    teamStats = tStats;
    
    renderUI();
});