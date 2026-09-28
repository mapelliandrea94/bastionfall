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
        const width = canvas.width;
        const height = canvas.height;
        // White cutout remnants can extend above the feet (wings, shields, void trails).
        const floorStart = 0;
        const visited = new Uint8Array(width * height);
        const isPale = (index) => {
          const offset = index * 4;
          const red = data[offset];
          const green = data[offset + 1];
          const blue = data[offset + 2];
          return data[offset + 3] > 0
            && Math.min(red, green, blue) >= 185
            && Math.max(red, green, blue) - Math.min(red, green, blue) <= 38;
        };

        // Follow pale connected regions rather than erasing isolated armor highlights.
        for (let y = floorStart; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const start = y * width + x;
            if (visited[start] || !isPale(start)) continue;
            visited[start] = 1;
            const region = [start];
            let bright = 0;
            let bottom = 0;
            let touchesClear = false;

            for (let head = 0; head < region.length; head += 1) {
              const index = region[head];
              const py = Math.floor(index / width);
              const px = index % width;
              if (Math.min(data[index * 4], data[index * 4 + 1], data[index * 4 + 2]) > 230) bright += 1;
              if (py >= height * 0.68) bottom += 1;
              for (const neighbor of [px ? index - 1 : -1, px < width - 1 ? index + 1 : -1, py > floorStart ? index - width : -1, py < height - 1 ? index + width : -1]) {
                if (neighbor < 0) continue;
                if (data[neighbor * 4 + 3] < 20) touchesClear = true;
                if (visited[neighbor] || !isPale(neighbor)) continue;
                visited[neighbor] = 1;
                region.push(neighbor);
              }
            }

            // Ignore small bright details on the creature; remove exposed studio
            // backdrop even if it runs up between limbs or around flying wings.
            if (region.length < 100 || bright < 20 || !touchesClear ||
              (bottom < region.length * 0.2 && region.length < width * height * 0.01)) continue;
            for (const index of region) {
              const offset = index * 4;
              const neutral = Math.min(data[offset], data[offset + 1], data[offset + 2]);
              const remaining = Math.max(0, Math.min(1, (215 - neutral) / 50));
              data[offset + 3] = Math.round(data[offset + 3] * remaining);
            }
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
