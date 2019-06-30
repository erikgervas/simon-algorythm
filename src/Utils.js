import { SimonCipher } from "./Simon";
import { BinaryText } from "./BinaryText";

export default {

  getImageData(canvas) {
    const context = canvas.getContext("2d");
    return context.getImageData(0, 0, canvas.width, canvas.height);
  },

  /**
   * @return {string}
   */
  RGBToHex(r, g, b) {
    r = '0'.repeat(2 - r.length) + r;
    g = '0'.repeat(2 - g.length) + g;
    b = '0'.repeat(2 - b.length) + b;
    return r + g + b;
  },

  getPixelAsHex(imageData, n) {
    const r = imageData.data[ n * 4 ];
    const g = imageData.data[ n * 4 + 1 ];
    const b = imageData.data[ n * 4 + 2 ];
    return this.RGBToHex(r.toString(16), g.toString(16), b.toString(16));
  },

  scanCanvasAndDo(srcCanvas, dstCanvas, fnc , key, blockMode, loading) {

    let simon = new SimonCipher(new BinaryText(key), 72, 48, blockMode);
    let width = srcCanvas.width;
    let height = srcCanvas.height;
    dstCanvas.width = width;
    dstCanvas.height = height;
    let ctx2 = dstCanvas.getContext("2d");
    let imageData = this.getImageData(srcCanvas);
    let x, y;

    for (y = 0; y < height; y++) {
      for (x = 0; x < width / 2; x++) {

        let pixel1 = this.getPixelAsHex(imageData, x * 2 + y * width);
        let pixel2 = this.getPixelAsHex(imageData, x * 2 + y * width + 1);
        let result = simon[fnc](new BinaryText('0x' + pixel1 + pixel2));

        //draw pixels in the meanwhile...
        let hex = result.hexRepresentation();
        ctx2.fillStyle = "#" + hex.substr(0, 6);
        ctx2.fillRect(x * 2, y, 1, 1);
        ctx2.fillStyle = "#" + hex.substr(6, 6);
        ctx2.fillRect(x * 2 + 1, y, 1, 1);

      }
    }
    loading();
  },
}