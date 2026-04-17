// State management
let leads = JSON.parse(localStorage.getItem('antigravity_leads')) || [];

// Constants
const SCRIPTS = [
  {
    type: 'WhatsApp Intro',
    hook: 'Observation-based',
    content: "Hey {name}, I saw your shop today and noticed you guys were busy! Just had a quick question about your {gap}—I might be able to help you streamline that with a simple WhatsApp system. No pressure at all, just thought it'd fit your vibe."
  },
  {
    type: 'Soft Follow-up (Day 3)',
    hook: 'Helpful nudge',
    content: "Hey {name}, just checking in to see if you saw my last message. I'm helping a few other {category}s nearby with their booking systems and thought of your shop again."
  },
  {
    type: 'Final Close (Day 7)',
    hook: 'Polite exit',
    content: "Hey {name}, I'll stop bugging you now! If you ever want to fix that {gap} and get more customers on autopilot, you know where to find me. Good luck with the business!"
  }
];

// DOM Elements
const form = document.getElementById('lead-form');
const pipelineList = document.getElementById('pipeline-list');
const statTotal = document.getElementById('stat-total');
const statHot = document.getElementById('stat-hot');
const scriptsContainer = document.getElementById('scripts-container');

// Tab logic
const tabs = document.querySelectorAll('.tab-btn');
const views = document.querySelectorAll('.view');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    views.forEach(v => v.classList.add('hidden'));
    const viewId = `view-${tab.id.split('-')[1]}`;
    document.getElementById(viewId).classList.remove('hidden');
    
    if(tab.id === 'tab-pipeline') renderPipeline();
    if(tab.id === 'tab-scripts') renderScripts();
  });
});

// Score range updates
const ranges = ['crowd', 'rep', 'price', 'gut'];
ranges.forEach(r => {
  const el = document.getElementById(`score-${r}`);
  const val = document.getElementById(`val-${r}`);
  el.addEventListener('input', () => {
    val.textContent = el.value;
  });
});

// Calculate total score
function calculateScore() {
  const crowd = parseInt(document.getElementById('score-crowd').value);
  const rep = parseInt(document.getElementById('score-rep').value);
  const price = parseInt(document.getElementById('score-price').value);
  const gut = parseInt(document.getElementById('score-gut').value);
  return crowd + rep + price + gut;
}

// Form Submission
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (!document.getElementById('trust-filter').checked) {
    alert("Discarded: Lead failed the Trust Filter.");
    form.reset();
    resetRangeDisplays();
    return;
  }

  const newLead = {
    id: Date.now(),
    name: document.getElementById('biz-name').value,
    category: document.getElementById('biz-category').value,
    location: document.getElementById('biz-location').value,
    phone: document.getElementById('biz-phone').value,
    score: calculateScore(),
    gap: document.getElementById('digital-gap').value,
    hook: document.getElementById('hook-angle').value,
    status: 'New',
    createdAt: new Date().toLocaleDateString(),
    nextFollowUp: 1 // 1, 3, or 7
  };

  leads.unshift(newLead);
  saveData();
  updateStats();
  
  alert(`Lead Saved! Total Score: ${newLead.score}`);
  form.reset();
  resetRangeDisplays();
});

function resetRangeDisplays() {
  ranges.forEach(r => document.getElementById(`val-${r}`).textContent = '0');
}

function saveData() {
  localStorage.setItem('antigravity_leads', JSON.stringify(leads));
}

function updateStats() {
  statTotal.textContent = leads.length;
  statHot.textContent = leads.filter(l => l.score >= 8).length;
}

function renderPipeline() {
  pipelineList.innerHTML = leads.length ? '' : '<p style="text-align:center; color:var(--text-muted);">No leads yet. Hit the streets!</p>';
  
  leads.forEach(lead => {
    const card = document.createElement('div');
    card.className = 'lead-card';
    
    let scoreClass = 'badge-low';
    if(lead.score >= 8) scoreClass = 'badge-high';
    else if(lead.score >= 5) scoreClass = 'badge-mid';

    card.innerHTML = `
      <div class="lead-info">
        <h3>${lead.name} <span class="badge ${scoreClass}">${lead.score}/10</span></h3>
        <div class="lead-meta">
          <span>📍 ${lead.location || 'Local'}</span>
          <span>📞 ${lead.phone || 'No Phone'}</span>
          <span>📅 Step: Day ${lead.nextFollowUp || 1}</span>
        </div>
        <p style="font-size: 0.8rem; margin-top:8px; color: var(--accent-secondary);">Hook: ${lead.hook || 'Generic'}</p>
      </div>
      <div class="actions">
        <button class="action-btn" onclick="nextStep(${lead.id})">Next Step</button>
        <button class="action-btn" onclick="deleteLead(${lead.id})" style="color:var(--danger)">×</button>
      </div>
    `;
    pipelineList.appendChild(card);
  });
}

window.nextStep = (id) => {
  const lead = leads.find(l => l.id === id);
  if (lead.nextFollowUp === 1) lead.nextFollowUp = 3;
  else if (lead.nextFollowUp === 3) lead.nextFollowUp = 7;
  else lead.status = 'Closed/Archived';
  saveData();
  renderPipeline();
}

window.deleteLead = (id) => {
  if (confirm('Delete this lead?')) {
    leads = leads.filter(l => l.id !== id);
    saveData();
    renderPipeline();
    updateStats();
  }
}

function renderScripts() {
  scriptsContainer.innerHTML = SCRIPTS.map(s => `
    <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:12px; margin-bottom:15px; border: 1px solid var(--glass-border);">
      <h4 style="color:var(--accent-secondary); margin-bottom:5px;">${s.type}</h4>
      <p style="font-size:0.875rem; font-style:italic; color:var(--text-muted); margin-bottom:10px;">Goal: ${s.hook}</p>
      <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; font-family:monospace; font-size:0.8rem; white-space:pre-wrap;">${s.content}</div>
      <button class="action-btn" style="margin-top:10px; width:100%;" onclick="copyToClipboard('${s.content.replace(/'/g, "\\'")}')">Copy Script</button>
    </div>
  `).join('');
}

window.exportLeads = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", "leads_backup.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

document.getElementById('import-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        leads = imported;
        saveData();
        updateStats();
        alert('Leads imported successfully!');
        if(document.getElementById('tab-pipeline').classList.contains('active')) renderPipeline();
      }
    } catch (err) { alert('Invalid file format'); }
  };
  reader.readAsText(file);
});

window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
}


// Init
updateStats();
