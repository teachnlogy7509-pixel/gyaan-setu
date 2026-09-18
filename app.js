const SUPABASE_URL = "https://oicluhfdvaroqvhwfwyp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_iXAoOGZ0YppBP0Y1kJf02Q_E323DzKA";
const fallbackRooms = [
  { id: "botany", name: "Botany", count: "6.8k learners", description: "plants, diagrams, revision", accent: "green", icon: "❧" },
  { id: "physics", name: "Physics", count: "8.2k learners", description: "concepts, numericals, doubts", accent: "orange", icon: "∿" },
  { id: "chemistry", name: "Chemistry", count: "7.4k learners", description: "reactions, notes, practice", accent: "blue", icon: "⌬" },
  { id: "zoology", name: "Zoology", count: "5.1k learners", description: "human systems, NEET prep", accent: "purple", icon: "◒" },
  { id: "maths", name: "Maths", count: "4.6k learners", description: "shortcuts, problems, wins", accent: "ink", icon: "π" }
];
const fallbackPosts = [
  { id: "p1", subject_id: "physics", author_name: "Aarav K.", initials: "AK", role: "NEET 2027", minutes: 12, content: "Finally understood why the direction changes in circular motion. The diagram-first approach made it click — sharing it here in case someone else is stuck too.", likes: 42, comments: 8, avatar: "av-one" },
  { id: "p2", subject_id: "botany", author_name: "Priya S.", initials: "PS", role: "Botany room guide", minutes: 28, content: "Quick reminder: revise plant hormones with one real-life example each. I made a tiny memory map for auxin, gibberellin, cytokinin, ABA and ethylene.", likes: 67, comments: 14, avatar: "av-two" },
  { id: "p3", subject_id: "chemistry", author_name: "Naman M.", initials: "NM", role: "JEE / NEET", minutes: 41, content: "Small win: 30/30 in today's organic reaction sprint. Consistency is feeling better than motivation this week.", likes: 31, comments: 5, avatar: "av-three" }
];
const fallbackLeaders = [
  { rank: 1, name: "Mahi R.", initials: "MR", points: 492, avatar: "av-two" },
  { rank: 2, name: "Dev P.", initials: "DP", points: 411, avatar: "av-one" },
  { rank: 3, name: "You", initials: "RS", points: 268, avatar: "av-three" },
  { rank: 4, name: "Ishita S.", initials: "IS", points: 244, avatar: "av-four" }
];
let supabaseClient = null;
let rooms = [...fallbackRooms];
let posts = [...fallbackPosts];
let leaders = [...fallbackLeaders];
let activeRoom = "All";
let authMode = "signin";
try { const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2"); supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); } catch (error) { console.info("Preview mode: Supabase client could not load.", error); }
const $ = (selector) => document.querySelector(selector);
const toast = $("#toast");
const authDialog = $("#authDialog");
function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000); }
function renderRooms() { $("#roomGrid").innerHTML = rooms.map((room) => `<article class="room-card room-${room.accent} ${activeRoom === room.id ? "active" : ""}" data-room="${room.id}"><span class="room-count">${room.count.toUpperCase()}</span><span class="room-icon">${room.icon}</span><h3>${room.name}</h3><p>${room.description}</p></article>`).join(""); document.querySelectorAll("[data-room]").forEach((card) => card.addEventListener("click", () => selectRoom(card.dataset.room))); }
function renderPosts() { const query = $("#globalSearch").value.trim().toLowerCase(); const visible = posts.filter((post) => (activeRoom === "All" || post.subject_id === activeRoom) && (!query || `${post.author_name} ${post.content}`.toLowerCase().includes(query))); $("#activeRoomLabel").innerHTML = `${activeRoom === "All" ? "All rooms" : rooms.find((r) => r.id === activeRoom)?.name || activeRoom} <span>•</span> ${visible.length + 9} discussions today`; $("#feed").innerHTML = visible.length ? visible.map((post) => `<article class="post-card"><div class="post-top"><div class="post-avatar ${post.avatar}">${post.initials}</div><div class="post-author"><strong>${post.author_name}</strong><small>${post.role} · ${post.minutes} min ago</small></div><span class="post-room">${rooms.find((room) => room.id === post.subject_id)?.name || "Community"}</span></div><p>${post.content}</p><div class="post-actions"><button data-like="${post.id}">♡ <span>${post.likes}</span></button><button data-comment="${post.id}">◌ ${post.comments} comments</button><button data-share="${post.id}">↗ Share</button></div></article>`).join("") : `<div class="empty-state">No discussions found in this room yet.</div>`; document.querySelectorAll("[data-like]").forEach((button) => button.addEventListener("click", () => { const post = posts.find((item) => item.id === button.dataset.like); if (post) { post.likes += 1; button.classList.add("liked"); button.innerHTML = `♥ <span>${post.likes}</span>`; showToast("Added to your community pulse."); } })); document.querySelectorAll("[data-comment]").forEach((button) => button.addEventListener("click", () => { showToast("Discussion replies are coming next."); })); document.querySelectorAll("[data-share]").forEach((button) => button.addEventListener("click", () => showToast("Share link copied for this discussion."))); }
function renderLeaders() { $("#leaderboardList").innerHTML = leaders.map((leader) => `<div class="leader-row"><span class="rank">${leader.rank}</span><span class="leader-avatar ${leader.avatar}">${leader.initials}</span><span class="leader-name">${leader.name}</span><span class="leader-points">${leader.points} pts</span></div>`).join(""); }
function selectRoom(room) { activeRoom = room; renderRooms(); renderPosts(); document.querySelector("#community").scrollIntoView({ behavior: "smooth", block: "start" }); }
function openAuth() { authDialog.showModal(); }
function closeAuth() { authDialog.close(); }
function setAuthMode(mode) { authMode = mode; const signup = mode === "signup"; $("#authTitle").textContent = signup ? "Start your learning circle" : "Join your learning circle"; $("#authSubtitle").textContent = signup ? "Create an account and keep your streak close." : "Sign in to save your streak and join discussions."; $("#authSubmit").innerHTML = signup ? "Create account <span>→</span>" : "Sign in <span>→</span>"; $("#switchAuth").textContent = signup ? "Already have an account? Sign in" : "New here? Create an account"; $("#authStatus").textContent = ""; }
async function handleAuth(event) { event.preventDefault(); const email = $("#emailInput").value; const password = $("#passwordInput").value; const status = $("#authStatus"); if (!supabaseClient) { status.textContent = "Preview mode is ready. Supabase Auth will work when deployed online."; return; } status.textContent = "Working…"; const result = authMode === "signup" ? await supabaseClient.auth.signUp({ email, password }) : await supabaseClient.auth.signInWithPassword({ email, password }); if (result.error) { status.textContent = result.error.message; return; } status.textContent = authMode === "signup" ? "Account created — check your email if confirmation is enabled." : "Welcome back."; showToast(authMode === "signup" ? "Your learning circle is ready." : "Signed in successfully."); setTimeout(closeAuth, 900); }
async function checkIn() { const { data: { user } = {} } = supabaseClient ? await supabaseClient.auth.getUser() : { data: {} }; if (!user) { showToast("Sign in to save today's streak check-in."); openAuth(); return; } if (supabaseClient) { await supabaseClient.from("daily_activity").upsert({ user_id: user.id, activity_date: new Date().toISOString().slice(0, 10), points: 10 }, { onConflict: "user_id,activity_date" }); } showToast("Checked in! Your streak is safe for today."); }
async function loadRemoteContent() { if (!supabaseClient) return; const [subjectResult, postResult, leaderResult] = await Promise.all([supabaseClient.from("subjects").select("*").order("position"), supabaseClient.from("community_posts").select("*").order("created_at", { ascending: false }).limit(12), supabaseClient.from("leaderboard_points").select("*").order("points", { ascending: false }).limit(5)]); if (!subjectResult.error && subjectResult.data?.length) rooms = subjectResult.data.map((item) => ({ ...item, count: item.learner_count || "new room", description: item.description || "learn together", accent: item.accent || "green", icon: item.icon || "✦" })); if (!postResult.error && postResult.data?.length) posts = postResult.data; if (!leaderResult.error && leaderResult.data?.length) leaders = leaderResult.data.map((item, index) => ({ ...item, rank: index + 1, initials: item.initials || item.display_name?.slice(0, 2).toUpperCase(), name: item.display_name, avatar: item.avatar || "av-one" })); }
async function loadSession() { if (!supabaseClient) return; const { data: { session } = {} } = await supabaseClient.auth.getSession(); updateAccount(session?.user); supabaseClient.auth.onAuthStateChange((_event, nextSession) => updateAccount(nextSession?.user)); }
function updateAccount(user) { const label = user?.email ? user.email.slice(0, 2).toUpperCase() : "RS"; $("#accountButton").textContent = label; $("#mobileAccount").firstChild.textContent = label; }
$("#globalSearch").addEventListener("input", renderPosts);
$("#joinCommunity").addEventListener("click", openAuth);
$("#composeButton").addEventListener("click", openAuth);
$("#accountButton").addEventListener("click", openAuth);
$("#mobileAccount").addEventListener("click", openAuth);
$("#closeDialog").addEventListener("click", closeAuth);
$("#switchAuth").addEventListener("click", () => setAuthMode(authMode === "signin" ? "signup" : "signin"));
$("#authForm").addEventListener("submit", handleAuth);
$("#checkInTop").addEventListener("click", checkIn); $("#checkInButton").addEventListener("click", checkIn); $("#sideCheckIn").addEventListener("click", checkIn);
$("#allRoomsButton").addEventListener("click", () => { activeRoom = "All"; renderRooms(); renderPosts(); document.querySelector("#rooms").scrollIntoView({ behavior: "smooth" }); });
$("#sortButton").addEventListener("click", () => showToast("Showing the latest community discussions.")); $("#leaderboardButton").addEventListener("click", () => showToast("Your full rank history is coming next.")); $("#vaultButton").addEventListener("click", () => showToast("PDF vault saved for the next build phase."));
await loadRemoteContent(); renderRooms(); renderPosts(); renderLeaders(); await loadSession();
