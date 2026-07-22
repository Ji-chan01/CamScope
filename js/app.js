import { initDataBinding, animateTyping } from "./data.js";
import { StreamController } from "./stream.js";
import { GalleryData } from "./gallery.js";

/**
 * UI CONTROLLER — SPA State Machine
 * States: loading | disconnected | live | capture-analyzing
 *         | capture-result | history | gallery | image-detail
 */
export const UIController = (() => {
  const $ = (id) => document.getElementById(id);

  // View root elements
  const views = {
    live: $("view-live"),
    capture: $("view-capture"),
    history: $("view-history"),
    gallery: $("view-gallery"),
    detail: $("view-image-detail"),
  };

  // Live sub-elements
  const overlayLoading = $("overlay-loading");
  const overlayDisconn = $("overlay-disconnected");
  const liveVideoWrap = $("live-video-wrapper");
  const liveBadge = $("live-badge");
  const sidebarWelcome = $("sidebar-welcome");
  const capAnalyzing = $("cap-sidebar-analyzing");
  const capResult = $("cap-sidebar-result");

  let _state = "loading";
  let _detailIndex = 0;

  /* ── Transition helper ── */
  /* ── Close any open mobile sidebar drawer ── */
  function closeAllMobileDrawers() {
    document
      .querySelectorAll(".sidebar.mobile-open, .full-sidebar.mobile-open")
      .forEach((el) => el.classList.remove("mobile-open"));
  }

  const viewTimeouts = {};

  function showView(name) {
    closeAllMobileDrawers();
    Object.entries(views).forEach(([key, el]) => {
      if (!el) return;
      if (viewTimeouts[key]) {
        clearTimeout(viewTimeouts[key]);
        viewTimeouts[key] = null;
      }
      if (key === name) {
        el.classList.remove("hidden");
        el.style.opacity = "0";
        requestAnimationFrame(() => {
          el.style.opacity = "1";
        });
      } else {
        el.style.opacity = "0";
        viewTimeouts[key] = setTimeout(() => {
          el.classList.add("hidden");
          viewTimeouts[key] = null;
        }, 310);
      }
    });
  }

  /* ── Utility ── */
  function updateLastCaptureThumbnail() {
    const thumbContainer = $("last-capture-thumb");
    if (!thumbContainer) return;
    const all = GalleryData.getAll();
    const valid = all.filter((c) => c && c.dataUrl && c.dataUrl.trim() !== "");
    if (valid.length > 0) {
      const latest = valid[0];
      thumbContainer.innerHTML = `<img src="${latest.dataUrl}" alt="Latest capture" style="width:100%; height:100%; object-fit:cover; display:block;" />`;
    } else {
      thumbContainer.innerHTML = "";
    }
  }

  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function setGreeting() {
    const h = new Date().getHours();
    const g =
      h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const el = $("greeting-text");
    if (el) el.textContent = `${g}, Visitor!`;
  }

  /* ── Gallery rendering ── */
  function renderGallery() {
    const container = $("gallery-groups-container");
    if (!container) return;
    container.innerHTML = "";
    const allCaptures = GalleryData.getAll();
    GalleryData.groupByDay().forEach((items, label) => {
      const labelEl = document.createElement("div");
      labelEl.className = "gallery-date-label";
      labelEl.textContent = label;
      container.appendChild(labelEl);

      const grid = document.createElement("div");
      grid.className = "gallery-grid";
      items.forEach((item) => {
        const idx = allCaptures.indexOf(item);
        const div = document.createElement("div");
        div.className = "gallery-thumb";
        div.setAttribute("role", "button");
        div.setAttribute("tabindex", "0");
        div.setAttribute("aria-label", `Open ${item.label || "specimen"}`);
        const img = document.createElement("img");
        img.src = item.dataUrl;
        img.alt = item.label || "Captured specimen";
        img.loading = "lazy";
        div.appendChild(img);
        const open = () => openDetail(item, idx >= 0 ? idx : 0);
        div.addEventListener("click", open);
        div.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") open();
        });
        grid.appendChild(div);
      });
      container.appendChild(grid);
    });
  }

  /* Helper to format timestamp as Today, Yesterday, or date */
  function getFormattedDate(timestamp) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);

    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) {
      return "Today";
    } else if (d.getTime() === yest.getTime()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  /* ── History rendering ── */
  function renderHistory() {
    const container = $("history-list-container");
    if (!container) return;
    container.innerHTML = "";
    const allCaptures = GalleryData.getAll();

    allCaptures.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.setAttribute("role", "listitem");
      div.setAttribute("data-idx", idx);
      div.setAttribute("tabindex", "0");

      const nameSpan = document.createElement("span");
      nameSpan.className = "history-item-name";
      nameSpan.textContent = item.label || "Specimen";

      const dateSpan = document.createElement("span");
      dateSpan.className = "history-item-date";
      dateSpan.textContent = getFormattedDate(item.timestamp);

      div.appendChild(nameSpan);
      div.appendChild(dateSpan);

      const open = () => openDetail(item, idx);
      div.addEventListener("click", open);
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open();
      });

      container.appendChild(div);
    });
  }

  /* ── State transitions ── */
  function gotoLoading() {
    _state = "loading";
    setGreeting();
    showView("live");
    if (liveBadge) liveBadge.style.display = "flex";
    if (overlayLoading) overlayLoading.style.display = "flex";
    if (overlayDisconn) overlayDisconn.style.display = "none";
    if (liveVideoWrap) liveVideoWrap.style.display = "none";
    if (sidebarWelcome) sidebarWelcome.style.display = "flex";
  }

  function gotoDisconnected() {
    _state = "disconnected";
    setGreeting();
    showView("live");
    if (liveBadge) liveBadge.style.display = "none";
    if (overlayLoading) overlayLoading.style.display = "none";
    if (overlayDisconn) overlayDisconn.style.display = "flex";
    if (liveVideoWrap) liveVideoWrap.style.display = "none";
    if (sidebarWelcome) sidebarWelcome.style.display = "flex";
  }

  function gotoLive() {
    _state = "live";
    setGreeting();
    showView("live");
    if (liveBadge) liveBadge.style.display = "flex";
    if (overlayLoading) overlayLoading.style.display = "none";
    if (overlayDisconn) overlayDisconn.style.display = "none";
    if (liveVideoWrap) liveVideoWrap.style.display = "flex";
    if (sidebarWelcome) sidebarWelcome.style.display = "flex";
  }

  let _captureTimeoutId = null;

  function gotoCaptureAnalyzing(snapshotUrl) {
    _state = "capture-analyzing";
    const now = Date.now();
    if ($("capture-date-label")) $("capture-date-label").textContent = "Today";
    if ($("capture-time-label"))
      $("capture-time-label").textContent = fmtTime(now);

    const frozenImg = $("frozen-img");
    const frozenOverlay = $("frozen-loading-overlay");

    // Show loading overlay and hide image while it loads
    if (frozenOverlay) frozenOverlay.classList.remove("hidden");
    if (frozenImg) frozenImg.classList.add("loading");

    const MIN_LOADING_MS = 500; // always show loading screen for at least this long
    const overlayShownAt = Date.now();

    const revealImage = () => {
      const elapsed = Date.now() - overlayShownAt;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => {
        if (frozenOverlay) frozenOverlay.classList.add("hidden");
        if (frozenImg) frozenImg.classList.remove("loading");
      }, remaining);
    };

    if (frozenImg) {
      // Remove old listeners to avoid stacking
      frozenImg.onload = null;
      frozenImg.onerror = null;

      if (snapshotUrl) {
        frozenImg.src = snapshotUrl;
      } else if (!frozenImg.src || frozenImg.src === window.location.href) {
        frozenImg.src =
          "https://res.cloudinary.com/dlqxpz9pu/image/upload/v1778333186/hannapp_vaer7g.jpg";
      }

      // Hide overlay once image loads (respecting minimum display time)
      const fallback = setTimeout(revealImage, 1500);
      frozenImg.onload = () => {
        clearTimeout(fallback);
        revealImage();
      };
      frozenImg.onerror = () => {
        clearTimeout(fallback);
        revealImage();
      };

      // If the image is already cached, still respect the minimum loading time
      if (frozenImg.complete && frozenImg.naturalWidth > 0) {
        clearTimeout(fallback);
        revealImage();
      }
    }

    if (capAnalyzing) capAnalyzing.style.display = "flex";
    if (capResult) capResult.style.display = "none";
    showView("capture");

    // Clear any existing analysis timeout to prevent multiple triggers
    if (_captureTimeoutId) clearTimeout(_captureTimeoutId);

    // BACKEND: Replace this timeout with real AI inference API call.
    _captureTimeoutId = setTimeout(() => {
      if (_state === "capture-analyzing") {
        gotoCaptureResult();
      }
    }, 2500);
  }

  function gotoCaptureResult() {
    _state = "capture-result";
    if (capAnalyzing) capAnalyzing.style.display = "none";
    if (capResult) {
      capResult.style.display = "flex";
      capResult.classList.add("animate-fade-in-result");
    }

    // Trigger word-by-word streaming typing effect
    if (
      window.appData &&
      window.appData.ai_response &&
      window.appData.ai_response.length > 0
    ) {
      const defaultResponse = window.appData.ai_response[0];
      animateTyping(
        defaultResponse.classification,
        defaultResponse.analysis,
        45,
        "#cap-sidebar-result",
      );
    }
  }

  function gotoHistory() {
    _state = "history";
    renderHistory();
    showView("history");
  }

  function gotoGallery() {
    _state = "gallery";
    renderGallery();
    showView("gallery");
  }

  function openDetail(item, index) {
    _state = "image-detail";
    _detailIndex = index;
    if ($("detail-img")) $("detail-img").src = item.dataUrl;

    const all = GalleryData.getAll();
    if ($("btn-detail-prev")) {
      $("btn-detail-prev").style.display = index === 0 ? "none" : "flex";
    }
    if ($("btn-detail-next")) {
      $("btn-detail-next").style.display =
        index === all.length - 1 ? "none" : "flex";
    }

    // Dynamic date label calculation
    if ($("detail-date-label")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);

      const d = new Date(item.timestamp);
      d.setHours(0, 0, 0, 0);

      let dateLabel = "Today";
      if (d.getTime() === today.getTime()) {
        dateLabel = "Today";
      } else if (d.getTime() === yest.getTime()) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
      }
      $("detail-date-label").textContent = dateLabel;
    }

    if ($("detail-time-label"))
      $("detail-time-label").textContent = fmtTime(item.timestamp);

    // Populate AI Log in detail view based on captured image id
    const detailLog = $("detail-sidebar-result");
    if (
      detailLog &&
      window.appData &&
      window.appData.ai_response &&
      window.appData.ai_response.length > 0
    ) {
      const match = item.label ? item.label.match(/#(\d+)/) : null;
      const imgId = match ? parseInt(match[1], 10) : null;

      const aiData =
        window.appData.ai_response.find(
          (r) => r.images && r.images.capturedImageId === imgId,
        ) || window.appData.ai_response[0];

      if (aiData) {
        const imgs = detailLog.querySelectorAll(".result-img img");
        if (imgs[0] && aiData.images.relatedImage1)
          imgs[0].src = aiData.images.relatedImage1;
        if (imgs[1] && aiData.images.relatedImage2)
          imgs[1].src = aiData.images.relatedImage2;

        animateTyping(
          aiData.classification,
          aiData.analysis,
          15,
          "#detail-sidebar-result",
        );
      }
    }

    showView("detail");
  }

  /* ── Event bindings ── */
  function bindEvents() {
    // Shutter / capture
    const btnCapture = $("btn-capture");
    if (btnCapture) {
      btnCapture.addEventListener("click", () => {
        if (_state !== "live" && _state !== "disconnected") return;
        const frame = StreamController.captureFrame();
        
        let label = "Cyanobacteria";
        if (
          window.appData &&
          window.appData.ai_response &&
          window.appData.ai_response.length > 0
        ) {
          label = window.appData.ai_response[0].classification || "Cyanobacteria";
        }
        
        GalleryData.add(frame, Date.now(), label);
        updateLastCaptureThumbnail();
        renderGallery();
        renderHistory();
        gotoCaptureAnalyzing(frame);
      });
    }

    // Refresh stream
    const btnRefresh = $("btn-refresh-stream");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        gotoLoading();
        StreamController.reconnect(gotoLive, gotoDisconnected);
      });
    }

    // Navigation buttons
    if ($("btn-last-capture"))
      $("btn-last-capture").addEventListener("click", gotoGallery);
    if ($("btn-capture-back"))
      $("btn-capture-back").addEventListener("click", gotoLive);
    if ($("tab-history-cap"))
      $("tab-history-cap").addEventListener("click", gotoHistory);
    if ($("tab-gallery-cap"))
      $("tab-gallery-cap").addEventListener("click", gotoGallery);

    if ($("btn-history-back"))
      $("btn-history-back").addEventListener("click", gotoLive);
    if ($("tab-gallery-from-history"))
      $("tab-gallery-from-history").addEventListener("click", gotoGallery);

    if ($("btn-gallery-back"))
      $("btn-gallery-back").addEventListener("click", gotoLive);
    if ($("tab-history-from-gallery"))
      $("tab-history-from-gallery").addEventListener("click", gotoHistory);

    if ($("btn-detail-back"))
      $("btn-detail-back").addEventListener("click", gotoGallery);
    if ($("tab-history-from-detail"))
      $("tab-history-from-detail").addEventListener("click", gotoHistory);
    if ($("tab-gallery-from-detail"))
      $("tab-gallery-from-detail").addEventListener("click", gotoGallery);

    if ($("btn-detail-prev")) {
      $("btn-detail-prev").addEventListener("click", () => {
        const all = GalleryData.getAll();
        if (_detailIndex > 0) {
          const img = $("detail-img");
          if (img) {
            img.classList.remove("detail-image-anim");
            void img.offsetWidth;
            img.classList.add("detail-image-anim");
          }
          openDetail(all[_detailIndex - 1], _detailIndex - 1);
        }
      });
    }
    if ($("btn-detail-next")) {
      $("btn-detail-next").addEventListener("click", () => {
        const all = GalleryData.getAll();
        if (_detailIndex < all.length - 1) {
          const img = $("detail-img");
          if (img) {
            img.classList.remove("detail-image-anim");
            void img.offsetWidth;
            img.classList.add("detail-image-anim");
          }
          openDetail(all[_detailIndex + 1], _detailIndex + 1);
        }
      });
    }

    // History search
    const historySearch = $("history-search");
    if (historySearch) {
      historySearch.addEventListener("input", (e) => {
        const q = e.target.value.trim().toLowerCase();
        document
          .querySelectorAll("#history-list-container .history-item")
          .forEach((row) => {
            const nameEl = row.querySelector(".history-item-name");
            const dateEl = row.querySelector(".history-item-date");
            const name = nameEl ? nameEl.textContent.toLowerCase() : "";
            const date = dateEl ? dateEl.textContent.toLowerCase() : "";
            row.style.display =
              !q || name.includes(q) || date.includes(q) ? "flex" : "none";
          });
      });
    }

    // Gallery search
    const gallerySearch = $("gallery-search");
    if (gallerySearch) {
      gallerySearch.addEventListener("input", (e) => {
        const q = e.target.value.trim().toLowerCase();
        document
          .querySelectorAll("#gallery-groups-container .gallery-thumb")
          .forEach((thumb) => {
            const img = thumb.querySelector("img");
            const alt = img ? img.alt.toLowerCase() : "";
            thumb.style.display = !q || alt.includes(q) ? "block" : "none";
          });
        document
          .querySelectorAll("#gallery-groups-container .gallery-date-label")
          .forEach((label) => {
            const grid = label.nextElementSibling;
            if (grid) {
              const visibleThumbs = Array.from(
                grid.querySelectorAll(".gallery-thumb"),
              ).filter((t) => t.style.display !== "none");
              label.style.display = visibleThumbs.length > 0 ? "block" : "none";
              grid.style.display = visibleThumbs.length > 0 ? "grid" : "none";
            }
          });
      });
    }

    // ── Mobile AI Log drawer (sidebar slide-in) ──
    [
      {
        open: "btn-mobile-ailog-live",
        close: "btn-close-live-sidebar",
        sel: "#view-live .sidebar",
      },
      {
        open: "btn-mobile-ailog-capture",
        close: "btn-close-capture-sidebar",
        sel: "#view-capture .sidebar",
      },
      {
        open: "btn-mobile-ailog-detail",
        close: "btn-close-detail-sidebar",
        sel: "#view-image-detail .sidebar",
      },
    ].forEach(({ open, close, sel }) => {
      const sidebar = document.querySelector(sel);
      const openBtn = $(open);
      const closeBtn = $(close);
      if (openBtn && sidebar) {
        openBtn.addEventListener("click", () => {
          sidebar.classList.add("mobile-open");
          // Remove the red dot notification badge from all mobile buttons globally
          document.querySelectorAll(".btn-mobile-ailog").forEach((btn) => {
            btn.classList.add("hide-badge");
          });
        });
      }
      if (closeBtn && sidebar)
        closeBtn.addEventListener("click", () =>
          sidebar.classList.remove("mobile-open"),
        );
    });

    // ── Custom Extensions ──

    // Download helper
    function downloadImage(imgEl) {
      if (imgEl && imgEl.src) {
        if (imgEl.src.startsWith("data:")) {
          const a = document.createElement("a");
          a.href = imgEl.src;
          a.download = `capture_${Date.now()}.png`;
          a.click();
        } else {
          fetch(imgEl.src)
            .then((r) => r.blob())
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `capture_${Date.now()}.png`;
              a.click();
              URL.revokeObjectURL(url);
            })
            .catch(() => {
              const a = document.createElement("a");
              a.href = imgEl.src;
              a.target = "_blank";
              a.download = `capture_${Date.now()}.png`;
              a.click();
            });
        }
      }
    }

    // Download capture
    const btnDownload = $("btn-download-capture");
    if (btnDownload) {
      btnDownload.addEventListener("click", () => {
        downloadImage($("frozen-img"));
      });
    }

    // Download detail
    const btnDownloadDetail = $("btn-download-detail");
    if (btnDownloadDetail) {
      btnDownloadDetail.addEventListener("click", () => {
        downloadImage($("detail-img"));
      });
    }

    // History item clicks
    document.querySelectorAll(".history-item").forEach((item) => {
      item.addEventListener("click", () => {
        const idx = parseInt(item.getAttribute("data-idx") || "0", 10);
        const all = GalleryData.getAll();
        if (all.length > 0) {
          const validIndex = Math.min(idx, all.length - 1);
          openDetail(all[validIndex], validIndex);
        }
      });
    });

    // Image Modal
    const imageModal = $("image-modal");
    const imageModalImg = $("image-modal-img");
    const imageModalClose = $("image-modal-close");

    if (imageModal && imageModalClose) {
      imageModalClose.addEventListener("click", () =>
        imageModal.classList.add("hidden"),
      );
      imageModal.addEventListener("click", (e) => {
        if (e.target.id === "image-modal-backdrop") {
          imageModal.classList.add("hidden");
        }
      });
    }

    // AI Result Image Click -> Open Modal
    document.addEventListener("click", (e) => {
      const resultImg = e.target.closest(".result-img");
      if (resultImg && imageModal && imageModalImg) {
        const img = resultImg.querySelector("img");
        if (img && img.src && !img.src.endsWith("undefined")) {
          imageModalImg.src = img.src;
          imageModal.classList.remove("hidden");
        }
      }
    });
  }

  /* ── Boot ── */
  async function init() {
    setGreeting();
    bindEvents();
    gotoLoading();
    await initDataBinding();
    updateLastCaptureThumbnail();
    renderGallery();
    renderHistory();

    StreamController.initStream(
      /* onReady */ gotoLive,
      /* onError */ gotoDisconnected,
    );
  }

  return { init };
})();

// Automatically boot UIController when DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => UIController.init());
} else {
  UIController.init();
}
