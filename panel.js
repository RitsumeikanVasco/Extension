// ==========================================
// STATE MANAGEMENT
// ==========================================
let userData = {
    points: 0,
    team: null
};

let teamStats = {
    team1Count: 0,
    team2Count: 0
};

const shopItems = [
    { id: 1, name: 'Power Up', icon: '⚡', price: 100 },
    { id: 2, name: 'Shield', icon: '🛡️', price: 150 },
    { id: 3, name: 'Boost', icon: '🚀', price: 200 },
    { id: 4, name: 'Health', icon: '❤️', price: 80 },
    { id: 5, name: 'Speed', icon: '💨', price: 120 },
    { id: 6, name: 'Coin x2', icon: '💰', price: 300 }
];

// ==========================================
// API MOCKS (Replace with real Fetch calls)
// ==========================================
async function fetchUserData() {
    return { points: 250, team: null };
}

async function fetchTeamStats() {
    return { team1Count: 42, team2Count: 38 };
}

// ==========================================
// UI LOGIC
// ==========================================

function renderUI() {
    document.getElementById('pointsValue').textContent = userData.points;

    if (userData.team) {
        document.getElementById('currentTeam').style.display = 'block';
        document.getElementById('teamSelection').style.display = 'none';
        const badge = document.getElementById('teamBadge');
        badge.textContent = `Team ${userData.team}`;
        badge.className = `team-badge team-${userData.team}`;
    } else {
        document.getElementById('currentTeam').style.display = 'none';
        document.getElementById('teamSelection').style.display = 'block';
    }

    document.getElementById('team1Count').textContent = teamStats.team1Count;
    document.getElementById('team2Count').textContent = teamStats.team2Count;

    renderShop();
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

async function selectTeam(teamNumber) {
    userData.team = teamNumber;
    renderUI();
}

async function purchaseItem(item) {
    if (userData.points >= item.price) {
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
    
    // Fetch initial data
    const [uData, tStats] = await Promise.all([fetchUserData(), fetchTeamStats()]);
    userData = uData;
    teamStats = tStats;
    
    renderUI();
});