const tiles = document.querySelector(".community-tiles");
const stories = document.querySelector(".community-stories");
const dialog = document.querySelector("#community-dialog");
const content = dialog.querySelector(".dialog-content");
const closeButton = dialog.querySelector(".dialog-close");
let activeStory = null;
let nextStory = null;
let trigger = null;
let backdropPointerDown = false;

function openTopic(topic) {
  if (dialog.open) return;
  const heading = document.getElementById(topic);
  const story = heading?.closest(".community-stories > .editorial-row");
  if (!story) return;

  activeStory = story;
  nextStory = story.nextSibling;
  trigger = tiles.querySelector(`[data-topic="${story.getAttribute("aria-labelledby")}"]`);
  content.append(story);
  content.scrollTop = 0;
  dialog.setAttribute("aria-labelledby", story.getAttribute("aria-labelledby"));
  document.documentElement.classList.add("community-modal-open");
  dialog.showModal();
  closeButton.focus({ preventScroll: true });
}

function isOutsideDialog(event) {
  const bounds = dialog.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
}

if (typeof dialog.showModal === "function") {
  tiles.addEventListener("click", (event) => {
    const tile = event.target.closest("button[data-topic]");
    if (tile) openTopic(tile.dataset.topic);
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });

  dialog.addEventListener("pointerdown", (event) => {
    backdropPointerDown = event.target === dialog && isOutsideDialog(event);
  });

  dialog.addEventListener("click", (event) => {
    if (backdropPointerDown && event.target === dialog && isOutsideDialog(event)) {
      dialog.close();
    }
    backdropPointerDown = false;
  });

  function restoreStory() {
    if (activeStory) stories.insertBefore(activeStory, nextStory);
    activeStory = null;
    nextStory = null;
    document.documentElement.classList.remove("community-modal-open");
    trigger?.focus({ preventScroll: true });
    dialog.removeAttribute("aria-labelledby");
  }

  dialog.addEventListener("close", restoreStory);

  window.addEventListener("beforeprint", () => {
    if (dialog.open) {
      dialog.close();
      restoreStory();
    }
  });

  function openLinkedTopic() {
    if (location.hash) openTopic(location.hash.slice(1));
  }

  document.body.classList.add("community-enhanced");
  tiles.hidden = false;
  window.addEventListener("hashchange", openLinkedTopic);
  openLinkedTopic();
}
