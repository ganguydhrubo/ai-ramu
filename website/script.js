// AI RAMU Interactive Engine

document.addEventListener('DOMContentLoaded', () => {
  // 1. Multilingual WhatsApp Conversation Data
  const conversations = {
    hi: [
      { sender: 'user', text: 'रामू, पिछले महीने के सारे जीएसटी इनवॉइस डाउनलोड करके एक एक्सेल शीट बना दो।' },
      { sender: 'bot', text: 'जी भैया! पोर्टल से 14 इनवॉइस डाउनलोड कर लिए हैं। GST_Sept_Report.xlsx डेस्कटॉप पर सेव कर दी है और सारा टैक्स ब्रेकअप तैयार है। 👍' },
      { sender: 'user', text: 'बढ़िया! और क्लाइंट शर्मा जी को व्हाट्सएप पर कोटेशन भी भेज दो।' },
      { sender: 'bot', text: 'शर्मा जी को ₹45,000 का कोटेशन पीडीएफ सहित व्हाट्सएप पर डिलीवर कर दिया गया है। Kaam Done! 🚀' }
    ],
    bn: [
      { sender: 'user', text: 'রামু, গত সপ্তাহের সব কাস্টমার অর্ডারের সামারি বানিয়ে এক্সেল ফাইলে রেডি করো।' },
      { sender: 'bot', text: 'হাঁ দাদা! মোট ১৮টি অর্ডার প্রসেস করা হয়েছে। Customer_Orders_Weekly.xlsx রেডি করে আপনার ফোল্ডারে রেখে দিয়েছি। 📊' },
      { sender: 'user', text: 'দুর্দান্ত! এবার আজকের ক্লায়েন্ট মিটিংয়ের জন্য গুগল মিট লিঙ্কটা পাঠিয়ে দাও।' },
      { sender: 'bot', text: 'মিটিং শিডিউলড! ক্লায়েন্ট ও আপনার ক্যালেন্ডারে লিঙ্ক অ্যাড করে হোয়াটসঅ্যাপে পাঠিয়ে দিয়েছি। কাজ শেষ! 🇮🇳' }
    ],
    en: [
      { sender: 'user', text: 'Ramu, scrape the competitor pricing for cloud servers and alert me on Slack.' },
      { sender: 'bot', text: 'On it! 8 competitor plans scraped across AWS, Azure & Hetzner. Price drop detected on Hetzner AX52. Detailed report sent! 📈' },
      { sender: 'user', text: 'Awesome. Now draft payment follow-ups for all overdue invoices.' },
      { sender: 'bot', text: 'Follow-up messages customized with invoice numbers sent to 4 clients via WhatsApp and Gmail. Bolo Ramu, Kaam Shuru!' }
    ]
  };

  const waContainer = document.getElementById('wa-chat-container');
  const langBtns = document.querySelectorAll('.lang-btn');

  function renderConversation(lang) {
    if (!waContainer) return;
    waContainer.innerHTML = '';
    const messages = conversations[lang] || conversations.hi;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messages.forEach((msg, idx) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = `wa-bubble ${msg.sender === 'user' ? 'wa-user' : 'wa-bot'}`;
        bubble.innerHTML = `
          <div>${msg.text}</div>
          <span class="time">${timeStr}</span>
        `;
        waContainer.appendChild(bubble);
        waContainer.scrollTop = waContainer.scrollHeight;
      }, idx * 450);
    });
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      renderConversation(lang);
    });
  });

  // Initial render in Hindi
  renderConversation('hi');

  // 2. Interactive ROI Calculator
  const taskSlider = document.getElementById('taskSlider');
  const hourlyRateSlider = document.getElementById('hourlyRateSlider');
  const taskCountDisplay = document.getElementById('taskCountDisplay');
  const rateDisplay = document.getElementById('rateDisplay');
  const hoursSavedDisplay = document.getElementById('hoursSavedDisplay');
  const inrSavedDisplay = document.getElementById('inrSavedDisplay');

  function calculateROI() {
    if (!taskSlider || !hourlyRateSlider) return;
    const tasksPerWeek = parseInt(taskSlider.value, 10);
    const hourlyRate = parseInt(hourlyRateSlider.value, 10);

    taskCountDisplay.textContent = tasksPerWeek;
    rateDisplay.textContent = '₹' + hourlyRate.toLocaleString('en-IN');

    // Each repetitive task takes on average 35 minutes (0.58 hours)
    const hoursSavedMonthly = Math.round(tasksPerWeek * 0.58 * 4.33);
    const inrSavedMonthly = hoursSavedMonthly * hourlyRate;

    hoursSavedDisplay.textContent = hoursSavedMonthly + ' hrs';
    inrSavedDisplay.textContent = '₹' + inrSavedMonthly.toLocaleString('en-IN');
  }

  if (taskSlider && hourlyRateSlider) {
    taskSlider.addEventListener('input', calculateROI);
    hourlyRateSlider.addEventListener('input', calculateROI);
    calculateROI();
  }

  // 3. One-Click Copy Command
  const copyButtons = document.querySelectorAll('.copy-trigger');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.copy || btn.textContent.trim();
      navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copied to Clipboard!';
        btn.style.borderColor = '#10B981';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.borderColor = '';
        }, 2000);
      });
    });
  });
});
