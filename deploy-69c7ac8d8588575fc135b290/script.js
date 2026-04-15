
const state = { data: null };

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const SHEETS = {
  site: 'Site',
  theme: 'Theme',
  seo: 'SEO',
  about: 'About',
  contact: 'Contact',
  stats: 'Stats',
  services: 'Services',
  projects: 'Projects',
  process: 'Process',
  socials: 'Socials'
};

function parseSpreadsheetId(url=''){
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}

async function fetchPublishedSheetTable(spreadsheetId, sheetName){
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error(`Failed to load ${sheetName}`);
  const text = await res.text();
  const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const payload = JSON.parse(jsonText);
  const cols = (payload.table?.cols || []).map(col => col.label || '');
  const rows = (payload.table?.rows || []).map(row => (row.c || []).map(cell => cell ? (cell.f ?? cell.v ?? '') : ''));
  return { cols, rows };
}

function cleanRows(rows){
  return rows.filter(row => row.some(value => String(value || '').trim() !== ''));
}

function pairSheetToObject(rows){
  const data = {};
  cleanRows(rows).slice(1).forEach(row => {
    const key = String(row[0] || '').trim();
    const value = row[1] ?? '';
    if(!key || key.toLowerCase() === 'key') return;
    data[key] = String(value ?? '').trim();
  });
  return data;
}

function yes(v){
  return String(v || '').trim().toUpperCase() === 'YES';
}

function tableRowsToObjects(rows, headers){
  return cleanRows(rows).slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = String(row[i] ?? '').trim());
    return obj;
  });
}

async function loadData(){
  const cfg = window.GSHEET_CONFIG || {};
  const spreadsheetId = parseSpreadsheetId(cfg.sheetUrl || '');

  if(!spreadsheetId){
    if(cfg.useLocalFallback){
      const res = await fetch(cfg.localJsonPath || 'data/site-data.json', { cache: 'no-store' });
      if(!res.ok) throw new Error('Failed to load fallback content data');
      return await res.json();
    }
    throw new Error('Google Sheet URL is missing in gsheet-config.js');
  }

  try {
    const [siteT, themeT, seoT, aboutT, contactT, statsT, servicesT, projectsT, processT, socialsT] = await Promise.all([
      fetchPublishedSheetTable(spreadsheetId, SHEETS.site),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.theme),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.seo),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.about),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.contact),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.stats),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.services),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.projects),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.process),
      fetchPublishedSheetTable(spreadsheetId, SHEETS.socials)
    ]);

    const site = pairSheetToObject(siteT.rows);
    const theme = pairSheetToObject(themeT.rows);
    const seo = pairSheetToObject(seoT.rows);
    const aboutObj = pairSheetToObject(aboutT.rows);
    const contactObj = pairSheetToObject(contactT.rows);

    const statsRows = tableRowsToObjects(statsT.rows, ['label','value']).filter(r => r.label && r.value);
    const servicesRows = tableRowsToObjects(servicesT.rows, ['title','description','icon','badge','enabled'])
      .filter(r => r.title && yes(r.enabled))
      .map(r => ({ title:r.title, description:r.description, icon:r.icon, badge:r.badge }));
    const projectsRows = tableRowsToObjects(projectsT.rows, ['name','category','summary','link','tag','enabled'])
      .filter(r => r.name && yes(r.enabled))
      .map(r => ({ name:r.name, category:r.category, summary:r.summary, link:r.link || '#', tag:r.tag }));
    const processRows = tableRowsToObjects(processT.rows, ['step','title','text','enabled'])
      .filter(r => r.title && yes(r.enabled))
      .map(r => ({ step:r.step, title:r.title, text:r.text }));
    const socialsRows = tableRowsToObjects(socialsT.rows, ['label','url','enabled'])
      .filter(r => r.label && r.url && yes(r.enabled))
      .map(r => ({ label:r.label, url:r.url }));

    return {
      site,
      theme,
      seo,
      about: {
        heading: aboutObj.heading || '',
        body: aboutObj.body || '',
        stats: statsRows
      },
      services: servicesRows,
      projects: projectsRows,
      process: processRows,
      contact: {
        heading: contactObj.heading || '',
        subheading: contactObj.subheading || '',
        form_endpoint: contactObj.form_endpoint || '',
        success_redirect: contactObj.success_redirect || 'index.html#home',
        services_list: servicesRows.map(item => item.title)
      },
      socials: socialsRows
    };
  } catch (error) {
    if(cfg.useLocalFallback){
      const res = await fetch(cfg.localJsonPath || 'data/site-data.json', { cache: 'no-store' });
      if(!res.ok) throw error;
      return await res.json();
    }
    throw error;
  }
}

function setMeta(name, content){
  const node = document.querySelector(name);
  if(node) node.setAttribute('content', content || '');
}

function setTheme(theme){
  const root = document.documentElement;
  Object.entries(theme || {}).forEach(([k,v]) => root.style.setProperty(`--${k.replace(/_/g,'-')}`, v));
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', theme?.bg || '#08111f');
}

function applySeo(data){
  const seo = data.seo || {};
  document.title = seo.title || 'Lokesh';
  setMeta('meta[name="description"]', seo.description);
  setMeta('meta[name="keywords"]', seo.keywords);
  const canonical = document.querySelector('link[rel="canonical"]');
  if(canonical && seo.canonical) canonical.href = seo.canonical;
  setMeta('meta[property="og:title"]', seo.title);
  setMeta('meta[property="og:description"]', seo.description);
  setMeta('meta[property="og:image"]', seo.og_image || 'assets/lokesh-profile.jpg');
  const schema = {
    "@context":"https://schema.org",
    "@type":"Person",
    "name": data.site.name,
    "jobTitle": data.site.title,
    "url": seo.canonical || window.location.href,
    "description": seo.description,
    "telephone": data.site.phone,
    "email": data.site.email,
    "address": data.site.location,
    "sameAs": (data.socials || []).map(item => item.url),
    "offers": (data.services || []).map(service => ({
      "@type":"Offer",
      "itemOffered": {"@type":"Service", "name": service.title, "description": service.description}
    }))
  };
  $('#schemaJson').textContent = JSON.stringify(schema);
}

function renderHero(data){
  $('#heroTitle').textContent = data.site.name;
  $('#heroTagline').textContent = data.site.tagline;
  $('#primaryCta').textContent = data.site.primary_cta_label;
  $('#primaryCta').setAttribute('href', data.site.primary_cta_link);
  $('#secondaryCta').textContent = data.site.secondary_cta_label;
  $('#secondaryCta').setAttribute('href', data.site.secondary_cta_link);
  $('#heroImage').src = data.seo.og_image || 'assets/lokesh-profile.jpg';
  $('#heroImage').alt = `${data.site.name} profile image`;
  $('#footerText').textContent = data.site.description;
}

function renderAbout(data){
  $('#aboutHeading').textContent = data.about.heading;
  $('#aboutBody').textContent = data.about.body;
  $('#statsGrid').innerHTML = data.about.stats.map(stat => `
    <article class="stat-card reveal">
      <strong>${stat.value}</strong>
      <span>${stat.label}</span>
    </article>
  `).join('');
}

function serviceIcon(icon){
  const icons = { globe: '◌', spark: '✦', refresh: '⟳', search: '⌕', megaphone: '◉', edit: '✎', shield: '⛨', chat: '☏' };
  return icons[icon] || '✦';
}

function renderServices(data){
  const grid = $('#servicesGrid');
  const loader = $('#servicesLoader');
  setTimeout(() => {
    grid.innerHTML = data.services.map(item => `
      <article class="service-card reveal">
        <span class="service-badge">${item.badge}</span>
        <div class="service-icon" aria-hidden="true" style="font-size:1.5rem">${serviceIcon(item.icon)}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </article>
    `).join('');
    loader.classList.add('hidden');
    grid.classList.remove('hidden');
    setupReveal();
  }, 450);
}

function renderProjects(data){
  $('#projectsGrid').innerHTML = data.projects.map(item => `
    <article class="project-card reveal">
      <span class="project-tag">${item.tag}</span>
      <small>${item.category}</small>
      <h3>${item.name}</h3>
      <p>${item.summary}</p>
      <a class="btn btn-outline" href="${item.link}">View Idea</a>
    </article>
  `).join('');
}

function renderProcess(data){
  $('#processGrid').innerHTML = data.process.map(item => `
    <article class="timeline-card reveal">
      <div class="timeline-step">${item.step}</div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </article>
  `).join('');
}

function renderContact(data){
  $('#contactHeading').textContent = data.contact.heading;
  $('#contactSubheading').textContent = data.contact.subheading;
  $('#contactMeta').innerHTML = `
    <div><strong>Email:</strong> ${data.site.email}</div>
    <div><strong>Phone:</strong> ${data.site.phone}</div>
    <div><strong>Location:</strong> ${data.site.location}</div>
  `;
  $('#serviceReason').innerHTML = '<option value="">Select a service</option>' + data.contact.services_list.map(item => `<option value="${item}">${item}</option>`).join('');
  $('#socialLinks').innerHTML = data.socials.map(item => `<a href="${item.url}" target="_blank" rel="noreferrer">${item.label}</a>`).join('');
}

function setupCookies(){
  const banner = $('#cookieBanner');
  if(localStorage.getItem('lokesh_cookie_accept') === 'yes') banner.classList.add('hidden');
  $('#acceptCookies').addEventListener('click', () => {
    localStorage.setItem('lokesh_cookie_accept', 'yes');
    banner.classList.add('hidden');
  });
}

function setupReveal(){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  $$('.reveal:not(.visible)').forEach(el => io.observe(el));
}

function setupForm(data){
  const form = $('#contactForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const endpoint = data.contact.form_endpoint;
    const message = $('#formMessage');
    if(!endpoint || endpoint.includes('your-form-id')){
      message.textContent = 'Add your Formspree endpoint in the Contact sheet.';
      return;
    }
    const formData = new FormData(form);
    formData.append('_replyto', $('#email').value.trim());
    formData.append('_subject', 'New inquiry from Lokesh website');
    try{
      message.textContent = 'Sending...';
      const res = await fetch(endpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
      if(!res.ok) throw new Error('Submission failed');
      message.textContent = 'Message sent successfully. Redirecting...';
      form.reset();
      setTimeout(() => { window.location.href = data.contact.success_redirect || 'index.html#home'; }, 800);
    }catch(error){
      message.textContent = 'Could not send right now. Please try again.';
      console.error(error);
    }
  });
}

async function init(){
  try{
    state.data = await loadData();
    setTheme(state.data.theme);
    applySeo(state.data);
    renderHero(state.data);
    renderAbout(state.data);
    renderServices(state.data);
    renderProjects(state.data);
    renderProcess(state.data);
    renderContact(state.data);
    setupCookies();
    setupReveal();
    setupForm(state.data);
  }catch(error){
    console.error(error);
    document.body.insertAdjacentHTML('beforeend', '<div style="padding:24px;color:#fff">Content failed to load. Check the published Google Sheet URL in gsheet-config.js.</div>');
  }finally{
    setTimeout(() => $('#pageLoader').classList.add('hidden-loader'), 500);
  }
}
document.addEventListener('DOMContentLoaded', init);
