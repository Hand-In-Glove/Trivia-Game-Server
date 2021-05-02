const formatHtmlEntities = (str) =>
  str
    .replace(/&amp;/g, "&")
    .replace(/&lt;|&#060;/g, "<")
    .replace(/&gt;|&#062;/g, ">")
    .replace(/&quot;|&#034;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#038;/g, "&");

module.exports = {
  formatHtmlEntities,
};
