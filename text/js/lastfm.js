function formatRelativeTime(unixTimestamp) {
  const now = new Date();
  const playedDate = new Date(unixTimestamp * 1000);
  const secondsAgo = Math.round((now - playedDate) / 1000);
  const minute = 60,
    hour = 3600,
    day = 86400,
    week = 604800,
    month = 2629800,
    year = 31557600;
  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (secondsAgo < minute) return rtf.format(-secondsAgo, "second");
  if (secondsAgo < hour)
    return rtf.format(-Math.floor(secondsAgo / minute), "minute");
  if (secondsAgo < day)
    return rtf.format(-Math.floor(secondsAgo / hour), "hour");
  if (secondsAgo < week)
    return rtf.format(-Math.floor(secondsAgo / day), "day");
  if (secondsAgo < month)
    return rtf.format(-Math.floor(secondsAgo / week), "week");
  if (secondsAgo < year)
    return rtf.format(-Math.floor(secondsAgo / month), "month");
  return rtf.format(-Math.floor(secondsAgo / year), "year");
}

const user = "grimtomic";
const url = `https://lastfm-last-played.biancarosa.com.br/${user}/latest-song`;
const songInfoElement = document.querySelector("#song-info");
const playStatusElement = document.querySelector("#play-status");

fetch(url)
  .then((response) => {
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  })
  .then((json) => {
    const trackName = json["track"]["name"];
    const artistName = json["track"]["artist"]["#text"];
    const trackUrl = json["track"]["url"];
    const songInfo = `<a href="${trackUrl}" target="_blank" rel="noopener noreferrer">${trackName} - ${artistName}</a>`;
    songInfoElement.innerHTML = songInfo;

    let playStatus = "";
    if (
      json["track"]["@attr"] &&
      json["track"]["@attr"]["nowplaying"] === "true"
    ) {
      playStatus = "Currently Playing";
    } else {
      const unixTimestamp = parseInt(json["track"]["date"]["uts"], 10);
      playStatus = formatRelativeTime(unixTimestamp);
    }
    playStatusElement.innerHTML = playStatus;
  })
  .catch((error) => {
    songInfoElement.innerHTML = "Could not fetch last played song.";
    playStatusElement.innerHTML = `Error: ${error.message}`;
    console.error("There has been a problem with your fetch operation:", error);
  });
