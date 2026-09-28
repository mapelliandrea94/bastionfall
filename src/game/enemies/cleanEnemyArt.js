// Remove the neutral white studio floor baked into some enemy cutouts.
// Keep this at load time so animation frames only draw the cached result.
const cleanedArt = new Map();

export function getCleanEnemyArt(archetype) {
  if (cleanedArt.has(archetype)) return cleanedArt.get(archetype);

  const original = `/assets/enemies/${archetype}.png`;
  const promise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(original);
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = pixels;
        const floorStart = Math.floor(canvas.height * 0.62);

        for (let y = floorStart; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            const offset = (y * canvas.width + x) * 4;
            const red = data[offset];
            const green = data[offset + 1];
            const blue = data[offset + 2];
            const lightest = Math.max(red, green, blue);
            const darkest = Math.min(red, green, blue);
            if (lightest - darkest > 30 || darkest < 200) continue;
            const whiteness = Math.min(1, Math.max(0, (darkest - 200) / 30));
            data[offset + 3] = Math.round(data[offset + 3] * (1 - whiteness));
          }
        }

        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(original);
      }
    };
    image.onerror = () => resolve(original);
    image.src = original;
  });
  cleanedArt.set(archetype, promise);
  return promise;
}
