function jump() {
  let url = document.getElementById("urlInput").value.trim();
  if (!url) return;

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  window.location.href = url;
}

document.getElementById("jumpBtn").addEventListener("click", jump);

document.getElementById("urlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") jump();
});

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

