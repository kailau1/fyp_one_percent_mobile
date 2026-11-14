// Runs once before any test worker starts, so every test sees the same timezone regardless
// of the machine (Windows, macOS, CI). Europe/London exercises GMT/BST daylight-saving changes.
module.exports = async () => {
  process.env.TZ = 'Europe/London';
};
