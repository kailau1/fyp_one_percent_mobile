// Every test runs in London time, so dates and "today" behave the same on any machine (as on the web).
module.exports = async () => {
  process.env.TZ = 'Europe/London'
}
