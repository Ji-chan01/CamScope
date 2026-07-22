(function () {
  "use strict";
  const btnStart = document.getElementById("cta-start");
  const modal = document.getElementById("code-modal");
  const backdrop = document.getElementById("modal-backdrop");
  const btnClose = document.getElementById("modal-close");
  const btnConfirm = document.getElementById("modal-confirm");
  const input = document.getElementById("code-input");
  const errorMsg = document.getElementById("code-error");

  function openModal(e) {
    e.preventDefault();
    modal.classList.remove("hidden");
    // Trigger reflow to ensure transition works
    void modal.offsetWidth;

    backdrop.classList.remove("bg-black/0", "backdrop-blur-none");
    backdrop.classList.add("bg-black/60", "backdrop-blur-md");

    const content = document.getElementById("modal-content");
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");

    input.value = "";
    errorMsg.classList.add("hidden");
    resetInputStyle();
    setTimeout(() => input.focus(), 100);
  }

  function closeModal() {
    backdrop.classList.remove("bg-black/60", "backdrop-blur-md");
    backdrop.classList.add("bg-black/0", "backdrop-blur-none");

    const content = document.getElementById("modal-content");
    content.classList.remove("scale-100", "opacity-100");
    content.classList.add("scale-95", "opacity-0");

    setTimeout(() => modal.classList.add("hidden"), 300);
  }

  function resetInputStyle() {
    input.classList.remove(
      "border-red-500",
      "focus:ring-red-500/50",
      "focus:border-red-500",
    );
    input.classList.add("focus:ring-[#c9a14b]/50", "focus:border-[#c9a14b]");
  }

  function checkCode() {
    if (input.value === "12345") {
      window.location.href = "room.html";
    } else {
      errorMsg.classList.remove("hidden");
      input.classList.add(
        "border-red-500",
        "focus:ring-red-500/50",
        "focus:border-red-500",
      );
      input.classList.remove(
        "focus:ring-[#c9a14b]/50",
        "focus:border-[#c9a14b]",
      );
    }
  }

  input.addEventListener("input", () => {
    errorMsg.classList.add("hidden");
    resetInputStyle();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkCode();
    if (e.key === "Escape") closeModal();
  });

  btnStart.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  btnConfirm.addEventListener("click", checkCode);
})();
