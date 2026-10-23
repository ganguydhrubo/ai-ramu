/**
 * AI RAMU — Lightweight Interactive Script
 * WhatsApp Conversation Scenarios, Social Sharing & Fast Interactions
 */

document.addEventListener("DOMContentLoaded", () => {
  // Scenario Data
  const scenarios = {
    daily: [
      {
        type: "out",
        text: "Hey Ramu, draft a polite message to my client explaining that their invoice will be ready by 4 PM today.",
        time: "10:14 AM"
      },
      {
        type: "in",
        text: "Namaste! Here is a clean, polite draft for your client:\n\n\"Dear Sharmaji, thank you for your patience. Your project invoice is being prepared and will be shared with you by 4:00 PM today. Please let me know if you need any specific PO details added. Regards.\"\n\nShall I send this or adjust the tone?",
        time: "10:14 AM"
      }
    ],
    hindi: [
      {
        type: "out",
        text: "Ramu, kal subah 10 baje CA ke saath meeting hai, reminder set kar do aur GST summary ready rakhna.",
        time: "02:30 PM"
      },
      {
        type: "in",
        text: "Haan bilkul! ⏰ Kal subah **10:00 AM** ke liye reminder set ho gaya hai.\n\nMaine aapke pichhle mahine ki GST summary bhi ready kar di hai. Meeting shuru hone se 15 minute pehle aapko WhatsApp pe alert bhej dunga!",
        time: "02:30 PM"
      }
    ],
    bengali: [
      {
        type: "out",
        text: "রামু, আজকের গুরুত্বপূর্ণ কাজের লিস্টটা একটু দেখে বলো তো?",
        time: "11:05 AM"
      },
      {
        type: "in",
        text: "নমস্কার! আজকের জন্য আপনার ৩টি প্রধান কাজ রয়েছে:\n\n1. সকাল ১১:৩০ — ক্লায়েন্টের প্রজেক্ট আপডেট\n2. দুপুর ২:০০ — নতুন ইনভয়েস জেনারেট করা\n3. সন্ধ্যে ৬:০০ — সাপ্তাহিক টিম কল\n\nসবকিছু প্রস্তুত আছে, কোনো সাহায্য লাগলে বলবেন!",
        time: "11:05 AM"
      }
    ],
    research: [
      {
        type: "out",
        text: "What is the standard GST rate for IT consulting services in India and how does RCM apply?",
        time: "04:12 PM"
      },
      {
        type: "in",
        text: "In India, IT & technical consulting services are taxed at **18% GST** (SAC code 998313).\n\n• Intra-state: 9% CGST + 9% SGST\n• Inter-state: 18% IGST\n\nReverse Charge Mechanism (RCM) generally does not apply if you are a registered entity, unless services are imported from an overseas supplier.",
        time: "04:12 PM"
      }
    ]
  };

  const chatContainer = document.getElementById("chat-stream");
  const scenarioButtons = document.querySelectorAll(".scenario-btn");

  // Render chat messages with realistic WhatsApp bubbles
  function renderScenario(key) {
    const list = scenarios[key] || scenarios.daily;
    chatContainer.innerHTML = "";

    // Add Date Pill
    const datePill = document.createElement("div");
    datePill.className = "wa-date-pill";
    datePill.textContent = "TODAY";
    chatContainer.appendChild(datePill);

    list.forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className = `wa-bubble ${msg.type === "out" ? "wa-bubble-out" : "wa-bubble-in"}`;

      const textParagraph = document.createElement("p");
      textParagraph.style.whiteSpace = "pre-line";
      textParagraph.innerHTML = escapeAndFormat(msg.text);
      bubble.appendChild(textParagraph);

      const meta = document.createElement("div");
      meta.className = "wa-msg-meta";
      meta.innerHTML = `<span>${msg.time}</span>${msg.type === "out" ? '<span class="wa-ticks">✓✓</span>' : ""}`;
      bubble.appendChild(meta);

      chatContainer.appendChild(bubble);
    });

    // Auto-scroll to bottom of chat
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function escapeAndFormat(text) {
    // Basic bold formatting support for **text**
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  // Handle Scenario Tab Switching
  scenarioButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      scenarioButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      renderScenario(btn.dataset.scenario);
    });
  });

  // Initial render
  renderScenario("daily");

  // One-Click Native or WhatsApp Sharing
  const shareBtn = document.getElementById("share-wa-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const shareData = {
        title: "AI Ramu — Your Personal AI Worker",
        text: "Check out AI Ramu — a free personal AI worker you install on your PC and control from WhatsApp in Hindi, English and Bengali:",
        url: "https://airamu.site"
      };

      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // Fall back to direct WhatsApp link if cancelled/failed
        }
      }

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    });
  }

  // Copy Link Button with Toast
  const copyBtn = document.getElementById("copy-url-btn");
  const toast = document.getElementById("toast");
  const copyText = document.getElementById("copy-text");

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const urlToCopy = "https://airamu.site/";
      try {
        await navigator.clipboard.writeText(urlToCopy);
      } catch {
        // Fallback
        const temp = document.createElement("input");
        temp.value = urlToCopy;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      if (copyText) copyText.textContent = "Copied!";
      if (toast) {
        toast.classList.add("show");
        setTimeout(() => {
          toast.classList.remove("show");
          if (copyText) copyText.textContent = "Copy Link";
        }, 2500);
      }
    });
  }

  // Copy Terminal Quickstart Command Button
  const cmdCopyBtn = document.getElementById("copy-hero-cmd-btn");
  const cmdStatus = document.getElementById("hero-cmd-copy-status");
  if (cmdCopyBtn) {
    cmdCopyBtn.addEventListener("click", async () => {
      const commandToCopy = "npm start";
      try {
        await navigator.clipboard.writeText(commandToCopy);
      } catch {
        const temp = document.createElement("input");
        temp.value = commandToCopy;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      if (cmdStatus) cmdStatus.textContent = "Copied!";
      if (toast) {
        toast.textContent = "Command 'npm start' copied to clipboard!";
        toast.classList.add("show");
        setTimeout(() => {
          toast.classList.remove("show");
          if (cmdStatus) cmdStatus.textContent = "Copy";
          toast.textContent = "Link copied to clipboard!";
        }, 2500);
      }
    });
  }
});
