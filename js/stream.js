/**
 * StreamController
 * All WebRTC / MediaMTX signaling lives here.
 */
export const StreamController = (() => {
  const videoEl = document.getElementById("microscope-stream");
  let _pc = null; // RTCPeerConnection instance

  /**
   * initStream(onReady, onError)
   * BACKEND: Kick off WebRTC handshake with MediaMTX.
   */
  async function initStream(onReady, onError) {
    console.log(
      "[StreamController] initStream() — plug in MediaMTX WHEP signaling here."
    );

    // ── PLACEHOLDER: simulates a 2s load then connection failure ──
    return new Promise((resolve) => {
      setTimeout(() => {
        onError(
          new Error(
            "Stream not configured — replace placeholder in StreamController.initStream()"
          )
        );
        resolve();
      }, 2000);
    });
  }

  /**
   * mountStream(mediaStream)
   * BACKEND: Call this once you have a live MediaStream from WebRTC.
   * @param {MediaStream} mediaStream
   */
  function mountStream(mediaStream) {
    if (!videoEl) return;
    videoEl.srcObject = mediaStream;
    videoEl
      .play()
      .catch((err) =>
        console.warn("[StreamController] Autoplay blocked:", err)
      );
  }

  /**
   * reconnect(onReady, onError)
   * Tears down existing connection and retries initStream().
   */
  async function reconnect(onReady, onError) {
    console.log("[StreamController] reconnect() called.");
    if (_pc) {
      _pc.close();
      _pc = null;
    }
    if (videoEl) videoEl.srcObject = null;
    await initStream(onReady, onError);
  }

  /**
   * captureFrame()
   * Snapshots current video frame to data URL (PNG).
   */
  function captureFrame() {
    if (!videoEl || !videoEl.srcObject || videoEl.readyState < 2) return "";
    const canvas = document.getElementById("snapshot-canvas");
    if (!canvas) return "";
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    canvas
      .getContext("2d")
      .drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  return { initStream, mountStream, reconnect, captureFrame };
})();
