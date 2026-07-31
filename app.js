(() => {
  const steps = Array.from(document.querySelectorAll(".step"));
  const music = document.getElementById("bg-music");
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const answers = { nap: null, affirmations: [] };
  let current = 0;
  let musicStarted = false;
  let saved = false;

  function startMusic() {
    if (!music || musicStarted) return;
    music.volume = 0.85;
    const play = music.play();
    if (play && typeof play.then === "function") {
      play
        .then(() => {
          musicStarted = true;
        })
        .catch(() => {
          musicStarted = false;
        });
    } else {
      musicStarted = true;
    }
  }

  startMusic();
  document.addEventListener(
    "pointerdown",
    () => {
      startMusic();
    },
    { passive: true }
  );

  function showStep(index) {
    steps.forEach((step, i) => {
      const active = i === index;
      step.classList.toggle("is-active", active);
      if (active) {
        step.removeAttribute("hidden");
      } else {
        step.setAttribute("hidden", "");
      }
    });
    current = index;

    // After the nap step (index 3), switch to red hearts theme
    const afterNap = index > 3;
    document.body.classList.toggle("theme-romance", afterNap);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", afterNap ? "#8b1e2d" : "#2d5a3d");
    }
  }

  async function saveResponse() {
    if (saved) return { ok: false, message: "Already sent." };
    saved = true;

    const { error } = await supabase.from("responses").insert({
      nap_feeling: answers.nap,
      affirmations: answers.affirmations,
    });

    if (error) {
      saved = false;
      console.error("Could not save response:", error.message);
      return { ok: false, message: "Couldn’t send right now. Try again." };
    }

    return { ok: true, message: "Sent  he’ll see it soon ♡" };
  }

  const sendBtn = document.getElementById("send-response");
  const sendStatus = document.getElementById("send-status");

  sendBtn?.addEventListener("click", async () => {
    if (sendBtn.disabled) return;
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    const result = await saveResponse();
    sendStatus.hidden = false;
    sendStatus.textContent = result.message;
    if (result.ok) {
      sendBtn.textContent = "Sent with love";
    } else {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send to my love";
    }
  });

  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (current < steps.length - 1) {
        showStep(current + 1);
      }
    });
  });

  document.querySelectorAll("[data-choice-group]").forEach((group) => {
    const key = group.getAttribute("data-choice-group");
    const nextBtn = group.closest(".step")?.querySelector("[data-next]");

    group.querySelectorAll(".choice").forEach((choice) => {
      choice.addEventListener("click", () => {
        if (choice.hasAttribute("data-tease")) {
          choice.classList.remove("is-bouncing");
          void choice.offsetWidth;
          choice.classList.add("is-bouncing");
          return;
        }

        group.querySelectorAll(".choice").forEach((c) => {
          c.classList.remove("is-selected");
          c.setAttribute("aria-selected", "false");
        });
        choice.classList.add("is-selected");
        choice.setAttribute("aria-selected", "true");
        answers[key] = choice.getAttribute("data-value");
        if (nextBtn) nextBtn.disabled = false;
      });

      choice.addEventListener("animationend", () => {
        choice.classList.remove("is-bouncing");
      });
    });
  });

  document.querySelectorAll("[data-affirmations]").forEach((group) => {
    const nextBtn = group.closest(".step")?.querySelector("[data-next]");
    const items = group.querySelectorAll("[data-affirm]");

    items.forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.add("is-selected");
        const text = item.textContent.trim();
        if (!answers.affirmations.includes(text)) {
          answers.affirmations.push(text);
        }
        const done = group.querySelectorAll("[data-affirm].is-selected").length;
        if (nextBtn && done === items.length) {
          nextBtn.disabled = false;
        }
      });
    });
  });

  showStep(0);
})();
