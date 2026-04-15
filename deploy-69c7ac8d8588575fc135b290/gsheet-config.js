window.GSHEET_CONFIG = {
  // Paste your Google Sheet link here after you publish it to the web.
  // Example: https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit?gid=0#gid=0
  sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR58gP9_rGzfnzaMPYMEI0XIeJ8JSbgAx3285Rplc4ZmdrYUTZM5fLzULyhDamtwaFjDp0tCbvw0Ckn/pub?output=csv",

  // Optional: keep true while testing to fall back to local JSON when no sheet URL is set.
  useLocalFallback: true,

  // Local fallback JSON used only when sheetUrl is blank or the published sheet cannot be read.
  localJsonPath: "data/site-data.json"
};
