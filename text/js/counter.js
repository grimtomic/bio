const counterImg = document.getElementById("visitor-counter-img");

// Using the new serverless instance you found
const rawCounterUrl =
  "https://counter.honk.li/cmoe?name=grimtomic?theme=love-and-deepspace&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto";

const cachedCounter = sessionStorage.getItem("cachedVisitorCount");

if (cachedCounter) {
  console.log("[Counter] Loading from session cache. Skipping server hit.");
  counterImg.src = cachedCounter;
} else {
  console.log(
    "[Counter] No cache found. Fetching from new serverless counter...",
  );

  // Attempting a direct fetch without a proxy first!
  fetch(rawCounterUrl)
    .then((response) => {
      console.log("[Counter] Response received. Status:", response.status);
      if (!response.ok) {
        throw new Error("Server responded with status: " + response.status);
      }
      return response.blob();
    })
    .then((blob) => {
      // Force the correct SVG MIME type
      const imageBlob = new Blob([blob], { type: "image/svg+xml" });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;

        // Save to session storage
        sessionStorage.setItem("cachedVisitorCount", base64data);

        // Render the image
        counterImg.src = base64data;
        console.log("[Counter] Image cached and rendered successfully.");
      };

      reader.readAsDataURL(imageBlob);
    })
    .catch((error) => {
      console.error(
        "[Counter] Fetch failed. Falling back to direct load.",
        error,
      );
      // Fallback: load directly (this will increment the counter)
      counterImg.src = rawCounterUrl;
    });
}
