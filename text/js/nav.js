document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("#navigation a");
  const viewerTitle = document.querySelector("#about .title-text");
  const viewerContent = document.querySelector("#about .rest");

  function loadContentBlock(targetId) {
    const sourceElement = document.getElementById(targetId);

    if (sourceElement) {
      viewerTitle.innerText =
        sourceElement.getAttribute("data-title") || "Content";
      viewerContent.innerHTML = sourceElement.innerHTML;
    } else {
      console.error(`[Nav] Could not find content block with ID: ${targetId}`);
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("data-target");
      loadContentBlock(targetId);
    });
  });

  document.addEventListener("keydown", (e) => {
    const keyIndex = parseInt(e.key) - 1;

    if (!isNaN(keyIndex) && keyIndex >= 0 && keyIndex < navLinks.length) {
      const targetId = navLinks[keyIndex].getAttribute("data-target");
      loadContentBlock(targetId);
    }
  });

  loadContentBlock("block-home");
});
