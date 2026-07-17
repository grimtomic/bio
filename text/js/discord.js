const USER_ID = "222448590025523200";

const avatarImg = document.getElementById("discord-avatar");
const statusDot = document.getElementById("discord-dot");
const usernameText = document.getElementById("discord-username");
const statusLabel = document.getElementById("discord-status-label");
const statusText = document.getElementById("discord-status-text");
const activityText = document.getElementById("discord-activity");

let socket;
function connectLanyard() {
  socket = new WebSocket("wss://api.lanyard.rest/socket");

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        op: 2,
        d: { subscribe_to_id: USER_ID },
      }),
    );
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.op === 1) {
      setInterval(() => {
        socket.send(JSON.stringify({ op: 3 }));
      }, data.d.heartbeat_interval);
    } else if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
      updateDiscordStatus(data.d);
    }
  };

  socket.onclose = () => {
    setTimeout(connectLanyard, 5000);
  };
}

const statusColors = {
  online: "#43b581",
  idle: "#faa61a",
  dnd: "#f04747",
  offline: "#747f8d",
};

function updateDiscordStatus(presence) {
  const discordUser = presence.discord_user;

  if (discordUser.avatar) {
    const ext = discordUser.avatar.startsWith("a_") ? "gif" : "png";
    avatarImg.src = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=512`;
  }

  statusDot.style.backgroundColor =
    statusColors[presence.discord_status] || statusColors.offline;

  let mainStatus = "Online";
  if (presence.discord_status === "dnd") mainStatus = "Do Not Disturb";
  if (presence.discord_status === "idle") mainStatus = "Idle";
  if (presence.discord_status === "offline") mainStatus = "Offline";

  statusLabel.innerText = `(${mainStatus})`;

  usernameText.innerText = discordUser.display_name
    ? discordUser.display_name
    : `@${discordUser.username}`;

  statusText.innerText = "";
  activityText.innerHTML = "";

  const playing = presence.activities.find((act) => act.type !== 4);

  if (playing) {
    statusText.innerText = `Playing ${playing.name}`;

    let detailsStr = "";
    if (playing.details) detailsStr += playing.details;
    if (playing.state) detailsStr += `<br>${playing.state}`;

    activityText.innerHTML = detailsStr;
  } else {
    const customStatus = presence.activities.find((act) => act.type === 4);
    if (customStatus && customStatus.state) {
      statusText.innerText = customStatus.state;
    } else {
      statusText.innerText = "Chilling";
    }
  }
}

connectLanyard();
