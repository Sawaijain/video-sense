const classifyFrame = async () => {
  // Simulate inference delay (200-800ms)
  const delay = 200 + Math.random() * 600;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // ~15% chance of being flagged
  const isFlagged = Math.random() > 0.85;
  const confidence = 0.6 + Math.random() * 0.4;

  return {
    label: isFlagged ? 'flagged' : 'safe',
    confidence: parseFloat(confidence.toFixed(3)),
  };
};

module.exports = { classifyFrame };
