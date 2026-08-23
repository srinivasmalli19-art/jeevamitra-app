// Compresses an image in the browser (resize + JPEG quality) and returns
// a data URL string small enough to store directly in a Firestore document.
//
// Why this exists: Firebase Storage now requires the paid "Blaze" plan
// even to enable it, which means linking a credit card. This avoids that
// entirely — no new signup, no card — by keeping photos inside the same
// free Firestore database already in use.
//
// Trade-off: Firestore documents have a hard 1MB size limit, so this only
// works for a single, fairly small/compressed photo per listing — not a
// gallery of full-resolution images. Good enough for a v1 listing photo.
export function compressImageToDataUrl(file, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(null); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't process that image file."));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // Rough safety check — Firestore's limit is 1MB per document,
        // and this photo shares that document with all the other fields.
        if (dataUrl.length > 700_000) {
          reject(new Error("That photo is too large even after compression. Try a smaller or simpler photo."));
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
