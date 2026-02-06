// --- Game Data ---
const prompts = [
    { title: "Waterfall", desc: "Everyone starts drinking. You can't stop until the person to your right stops.", type: "physical", icon: "🌊" },
    { title: "Floor is Lava", desc: "Last person to touch the floor drinks.", type: "physical", icon: "🔥" },
    { title: "Categories", desc: "Pick a category (e.g., Car Brands). Go around circle. First to freeze or repeat drinks.", type: "mental", icon: "🧠" },
    { title: "Rhyme Time", desc: "Pick a word. Go around rhyming. First to fail drinks.", type: "mental", icon: "🎤" },
    { title: "Mate", desc: "Pick a drinking buddy. Whenever you drink, they drink.", type: "social", icon: "🤝" },
    { title: "Thumb Master", desc: "You are the Thumb Master. Place thumb on table anytime. Last one to copy you drinks.", type: "wild", icon: "👍" },
    { title: "Question Master", desc: "If anyone answers a question you ask, they drink. Lasts until next Question Master.", type: "wild", icon: "❓" },
    { title: "Never Have I Ever", desc: "Say something you've never done. Anyone who has done it drinks.", type: "social", icon: "🙊" },
    { title: "Rule Maker", desc: "Create a new rule (e.g., 'No using first names'). Anyone who breaks it drinks.", type: "wild", icon: "📜" },
    { title: "Medusa", desc: "Everyone look down. On 3, look up at someone. If you lock eyes, yell 'Medusa!' and drink.", type: "physical", icon: "🐍" },
    { title: "T-Rex Arms", desc: "You must keep your elbows tucked into your sides like a T-Rex until your next turn. Break it, you drink.", type: "physical", icon: "🦖" },
    { title: "Most Likely To", desc: "Count to 3 and point at the person most likely to get arrested. Person with most fingers pointed at them drinks.", type: "social", icon: "👉" },
    { title: "Heaven", desc: "Point to the sky! Last one to point drinks.", type: "physical", icon: "☝️" },
    { title: "Viking", desc: "You are the Viking. When you make horns on your helmet, everyone must row. Last one drinks.", type: "physical", icon: "🛶" },
    { title: "Story Time", desc: "Start a story with one word. Next person adds a word. First to mess up drinks.", type: "mental", icon: "📖" },
    { title: "Buffalo", desc: "You must drink with your non-dominant hand for the rest of the game.", type: "wild", icon: "🐃" },
    { title: "Straight Face", desc: "The person to your left tells you a joke. If you laugh, you drink.", type: "social", icon: "😐" },
    { title: "Gecko", desc: "Last person to put a hand on the wall drinks.", type: "physical", icon: "🦎" },
    { title: "Swap", desc: "Switch drinks with the person to your right.", type: "wild", icon: "🔄" },
    { title: "Silence", desc: "Complete silence until the next card is drawn. Whoever speaks first drinks.", type: "wild", icon: "🤫" }
];

// --- State ---
let players = [];
let currentPlayerIndex = 0;
let isCardFlipped = false;
let cardCount = 0;

// --- Setup Logic ---
function handleEnter(e) {
    if (e.key === 'Enter') addPlayer();
}

function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    if (name) {
        players.push(name);
        renderPlayers();
        input.value = '';
        input.focus();
    }
}

function removePlayer(index) {
    players.splice(index, 1);
    renderPlayers();
}

function renderPlayers() {
    const list = document.getElementById('player-list');
    list.innerHTML = players.map((p, i) => `
        <div class="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2 animate-[fadeIn_0.2s]">
            <span class="text-sm font-bold">${p}</span>
            <button onclick="removePlayer(${i})" class="text-gray-400 hover:text-red-400">×</button>
        </div>
    `).join('');
}

function startGame() {
    if (players.length === 0) {
        // Add default players if none added
        players = ["Player 1", "Player 2"];
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('flex');

    updatePlayerDisplay();
}

function restartGame() {
    if(confirm("End the game and return to setup?")) {
        location.reload();
    }
}

// --- Game Logic ---

function updatePlayerDisplay() {
    const display = document.getElementById('current-player-display');
    display.innerText = players[currentPlayerIndex];
    display.classList.remove('animate-pulse');
    void display.offsetWidth; // Trigger reflow
    display.classList.add('animate-pulse');
}

function getRandomCard() {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
}

function drawCard() {
    if (isCardFlipped) return; // Prevent double clicks

    const cardData = getRandomCard();

    // Populate card face
    document.getElementById('card-title').innerText = cardData.title;
    document.getElementById('card-desc').innerText = cardData.desc;
    document.getElementById('card-icon').innerText = cardData.icon;

    // Style based on type
    const typeBadge = document.getElementById('card-type');
    typeBadge.innerText = cardData.type;

    // Define Tailwind classes for each type
    const badgeClasses = {
        physical: "bg-red-500 text-white shadow-red-500/50",
        mental: "bg-blue-500 text-white shadow-blue-500/50",
        social: "bg-purple-500 text-white shadow-purple-500/50",
        wild: "bg-yellow-500 text-black shadow-yellow-500/50"
    };

    const baseClasses = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide";
    const specificClasses = badgeClasses[cardData.type] || badgeClasses.wild; // Fallback to wild if undefined

    typeBadge.className = `${baseClasses} ${specificClasses}`;

    // Flip Animation
    const card = document.getElementById('main-card');
    card.classList.add('flipped');
    isCardFlipped = true;

    // Enable Next Button
    document.getElementById('next-btn').disabled = false;

    // Update stats
    cardCount++;
    document.getElementById('card-counter').innerText = cardCount;
}

function nextTurn() {
    if (!isCardFlipped) return;

    // Reset Card Position
    const card = document.getElementById('main-card');
    card.classList.remove('flipped');
    isCardFlipped = false;

    // Disable Next Button until draw
    document.getElementById('next-btn').disabled = true;

    // Rotate Player
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Small delay to allow card flip back before name change
    setTimeout(() => {
        updatePlayerDisplay();
    }, 300);
}
