(function () {
  "use strict";

  // Access Code Modal (Index Page)
  const codeModal = document.getElementById("code-modal");
  if (codeModal) {
    const btnStart = document.getElementById("cta-start");
    const backdrop = document.getElementById("modal-backdrop");
    const btnClose = document.getElementById("modal-close");
    const btnConfirm = document.getElementById("modal-confirm");
    const input = document.getElementById("code-input");
    const errorMsg = document.getElementById("code-error");

    function openModal(e) {
      e.preventDefault();
      codeModal.classList.remove("hidden");
      void codeModal.offsetWidth;

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

      setTimeout(() => codeModal.classList.add("hidden"), 300);
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

    if (btnStart) btnStart.addEventListener("click", openModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (btnConfirm) btnConfirm.addEventListener("click", checkCode);
  }

  // Exit Warning Modal (Room Page)
  const exitModal = document.getElementById("exit-warning-modal");
  if (exitModal) {
    // Prevent back button navigation and show warning modal
    // Push initial state to history stack when page loads
    history.pushState({ prevPage: 'room-entered' }, '', window.location.href);

    const backdrop = document.getElementById("exit-modal-backdrop");
    const content = document.getElementById("exit-modal-content");
    const btnCancel = document.getElementById("exit-btn-cancel");
    const btnConfirm = document.getElementById("exit-btn-confirm");

    let isLeaving = false;

    function showModal() {
      exitModal.classList.remove("hidden");
      void exitModal.offsetWidth;

      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-100");

      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }

    function closeModal() {
      backdrop.classList.remove("opacity-100");
      backdrop.classList.add("opacity-0");

      content.classList.remove("scale-100", "opacity-100");
      content.classList.add("scale-95", "opacity-0");

      setTimeout(() => {
        exitModal.classList.add("hidden");
      }, 300);
    }

    window.addEventListener("popstate", function(event) {
      history.pushState({ prevPage: 'room-entered' }, '', window.location.href);
      showModal();
    });

    window.addEventListener("beforeunload", function(e) {
      if (isLeaving) return;
      e.preventDefault();
      e.returnValue = "";
    });

    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    if (btnConfirm) {
      btnConfirm.addEventListener("click", function() {
        isLeaving = true;
        window.location.href = "index.html";
      });
    }
  }
})();
