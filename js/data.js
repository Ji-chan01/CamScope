/**
 * Data management script for fetching js/data.json and populating UI elements across the application.
 */

// Fetch data.json asynchronously
export async function loadData() {
  try {
    const response = await fetch("./js/data.json");
    if (!response.ok) {
      throw new Error(`Failed to load data.json: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data.json:", error);
    return null;
  }
}

/**
 * Types out text elements word by word like a real AI streaming response.
 */
export function animateTyping(
  speciesText,
  analysis,
  speedMs = 45,
  containerSelector = "#cap-sidebar-result",
) {
  const container = document.querySelector(containerSelector) || document;
  const speciesEls = container.querySelectorAll(".result-species");
  const bodyEls = container.querySelectorAll(".result-body");

  // Cancel any previous typing timers if running
  if (window._typingTimeouts) {
    window._typingTimeouts.forEach(clearTimeout);
  }
  window._typingTimeouts = [];

  // Prepare species title words
  const speciesWords = speciesText ? speciesText.split(" ") : [];

  // Prepare body structured tokens
  const bodyTokens = [];
  if (analysis) {
    if (analysis.introduction) {
      bodyTokens.push({ type: "p_start" });
      analysis.introduction
        .split(" ")
        .forEach((w) => bodyTokens.push({ type: "word", text: w }));
      bodyTokens.push({ type: "p_end" });
    }
    if (
      analysis.morphologyBullets &&
      Array.isArray(analysis.morphologyBullets)
    ) {
      bodyTokens.push({ type: "ul_start" });
      analysis.morphologyBullets.forEach((bullet) => {
        bodyTokens.push({ type: "li_start" });
        bullet
          .split(" ")
          .forEach((w) => bodyTokens.push({ type: "word", text: w }));
        bodyTokens.push({ type: "li_end" });
      });
      bodyTokens.push({ type: "ul_end" });
    }
    if (analysis.conclusion) {
      bodyTokens.push({ type: "p_start", style: "margin-top: 10px" });
      analysis.conclusion
        .split(" ")
        .forEach((w) => bodyTokens.push({ type: "word", text: w }));
      bodyTokens.push({ type: "p_end" });
    }
  }

  // 1. Type species title word by word
  speciesEls.forEach((el) => {
    el.textContent = "";
  });

  let currentDelay = 0;
  speciesWords.forEach((word, idx) => {
    const timeout = setTimeout(() => {
      speciesEls.forEach((el) => {
        el.textContent += (idx > 0 ? " " : "") + word;
      });
    }, currentDelay);
    window._typingTimeouts.push(timeout);
    currentDelay += speedMs;
  });

  // Small delay after species title before typing body text
  currentDelay += 150;

  // 2. Type body HTML word by word
  bodyEls.forEach((el) => {
    el.innerHTML = "";
  });

  bodyTokens.forEach((token) => {
    const timeout = setTimeout(() => {
      bodyEls.forEach((bodyEl) => {
        // Build html up to this token index
        let html = "";
        let inP = false;
        let inUl = false;
        let inLi = false;
        let pSt = "";

        for (let i = 0; i <= bodyTokens.indexOf(token); i++) {
          const t = bodyTokens[i];
          if (t.type === "p_start") {
            inP = true;
            pSt = t.style ? ` style="${t.style}"` : "";
            html += `<p${pSt}>`;
          } else if (t.type === "p_end") {
            inP = false;
            html += `</p>`;
          } else if (t.type === "ul_start") {
            inUl = true;
            html += `<ul>`;
          } else if (t.type === "ul_end") {
            inUl = false;
            html += `</ul>`;
          } else if (t.type === "li_start") {
            inLi = true;
            html += `<li>`;
          } else if (t.type === "li_end") {
            inLi = false;
            html += `</li>`;
          } else if (t.type === "word") {
            const needsSpace =
              html.length > 0 && !html.endsWith(">") && !html.endsWith(" ");
            html += (needsSpace ? " " : "") + t.text;
          }
        }

        // Close unclosed tags for valid HTML preview while typing
        if (inLi) html += `</li></ul>`;
        else if (inUl) html += `</ul>`;
        else if (inP) html += `</p>`;

        bodyEl.innerHTML = html;
      });
    }, currentDelay);

    window._typingTimeouts.push(timeout);
    if (token.type === "word") {
      currentDelay += speedMs;
    }
  });
}

/**
 * Applies data from data.json to DOM elements.
 * - Finds captured_image with highest ID (id: 2) and sets #frozen-img src
 * - Sets .result-img images, .result-species, and .result-body from ai_response
 * - Renders library images into GalleryData / gallery grid container
 * - Displays random or quotes from quotes array in quote blocks
 */
export async function initDataBinding() {
  const data = await loadData();
  if (!data) return;

  // Store data globally for access when switching views
  window.appData = data;

  // 1. Highest ID from captured_images to #frozen-img (id: 2)
  if (data.captured_images && data.captured_images.length > 0) {
    const highestCaptured = data.captured_images.reduce((prev, current) =>
      prev.id > current.id ? prev : current,
    );

    const frozenImg = document.getElementById("frozen-img");
    if (frozenImg && highestCaptured && highestCaptured.src) {
      frozenImg.src = highestCaptured.src;
    }
  }

  // 2. Result images, species, and body on AI Log
  if (data.ai_response && data.ai_response.length > 0) {
    // Pick the most recent/first ai_response
    const defaultResponse = data.ai_response[0];
    const { classification, analysis, images } = defaultResponse;

    // AI Log Result Images (.result-img) in the capture sidebar
    const resultImgContainers = document.querySelectorAll(
      "#cap-sidebar-result .result-img",
    );
    if (images) {
      if (resultImgContainers[0]) {
        const img1 = resultImgContainers[0].querySelector("img");
        if (img1 && images.relatedImage1) img1.src = images.relatedImage1;
      }
      if (resultImgContainers[1]) {
        const img2 = resultImgContainers[1].querySelector("img");
        if (img2 && images.relatedImage2) img2.src = images.relatedImage2;
      }
    }

    // Trigger word-by-word typing effect for AI Log text
    animateTyping(classification, analysis, 45, "#cap-sidebar-result");
  }

  // 3. Dynamic Library / Captured images binding from data.json
  if (
    data.captured_images &&
    data.captured_images.length > 0 &&
    window.GalleryData
  ) {
    window.GalleryData.clear();
    data.captured_images.forEach((cap) => {
      if (cap.src) {
        let ts = Date.now();
        if (cap.date) {
          // Extract time portion & pad parts if needed e.g. "12:3:00" -> "12:03:00"
          let rawTime = cap.time
            ? cap.time.includes("T")
              ? cap.time.split("T")[1]
              : cap.time
            : "00:00:00";
          const timeParts = rawTime.split(":").map((p) => p.padStart(2, "0"));
          const timePadded = timeParts.join(":");

          const parsedDate = new Date(`${cap.date}T${timePadded}`);
          if (!isNaN(parsedDate.getTime())) {
            ts = parsedDate.getTime();
          }
        }
        let label = `Specimen #${cap.id}`;
        if (data.ai_response) {
          const matched = data.ai_response.find(
            (r) => r.images && r.images.capturedImageId === cap.id
          );
          if (matched && matched.classification) {
            label = matched.classification;
          }
        }
        window.GalleryData.add(cap.src, ts, label);
      }
    });
  }

  if (data.quotes && data.quotes.length > 0) {
    startQuoteRotation(data.quotes);
  }

  return data;
}

let _quoteInterval = null;
export function startQuoteRotation(quotes) {
  if (_quoteInterval) clearInterval(_quoteInterval);

  const quoteBlocks = document.querySelectorAll("blockquote");
  let lastIndex = -1;

  function updateQuote() {
    if (!quotes || quotes.length === 0 || quoteBlocks.length === 0) return;

    let randomIndex;
    if (quotes.length > 1) {
      do {
        randomIndex = Math.floor(Math.random() * quotes.length);
      } while (randomIndex === lastIndex);
    } else {
      randomIndex = 0;
    }
    lastIndex = randomIndex;
    const selectedQuote = quotes[randomIndex];

    quoteBlocks.forEach((block) => block.classList.add("quote-fade-out"));

    setTimeout(() => {
      quoteBlocks.forEach((block) => {
        const textEl = block.querySelector(".quote-text");
        const authorEl = block.querySelector(".quote-author");
        if (textEl) textEl.textContent = `"${selectedQuote.quote}"`;
        if (authorEl) authorEl.textContent = `— ${selectedQuote.author}`;

        block.classList.remove("quote-fade-out");
      });
    }, 500);
  }

  updateQuote();

  _quoteInterval = setInterval(updateQuote, 15000);
}

// Automatically execute data binding on DOMContentLoaded if script loaded as module or script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initDataBinding());
} else {
  initDataBinding();
}
