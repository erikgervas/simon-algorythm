export class BinaryText {
  //new BinaryText("1100111010101000100")
  //new BinaryText(994827521)
  //new BinaryText("0x11afbeed")
  constructor(bin) {
    if (typeof bin == 'number')
      this.bin = this._fromNumber(bin)
    else if (bin.substr(0, 2) == '0x')
      this.bin = this._fromHexa(bin)
    else
      this.bin = bin;
  }

  and(bin2) {
    var result = [];
    for (var i = 1; i <= Math.min(this.length(), bin2.length()); i++) {
      const a = this.value().substr(-i, 1);
      const b = bin2.value().substr(-i, 1);
      result.unshift(( '0b' + a ) & ( '0b' + b ))
    }
    return new BinaryText(result.join(''))
  }

  or(bin2) {
    var result = [];
    var carry = false;
    var newBin = this.value();
    bin2 = bin2.value();

    for (var i = 1; i <= Math.max(newBin.length, bin2.length); i++) {
      var a = newBin[ newBin.length - i ];
      a = a === undefined ? '0' : a;
      var b = bin2[ bin2.length - i ];
      b = b === undefined ? '0' : b;
      if (!carry) {
        if (a === '1' && b === '1') {
          carry = true
        }
        result.unshift(a !== b ? '1' : '0')
      } else {
        if (a === '0' && b === '0') {
          carry = false
        }
        result.unshift(a === b ? '1' : '0')
      }
    }
    if (carry) {
      result.unshift('1')
    }
    return new BinaryText(result.join(''))
  }

  xor(bin2) {
    var result = [];
    var carry = false;
    var newBin = this.value();
    bin2 = bin2.value();
    for (var i = 1; i <= Math.max(newBin.length, bin2.length); i++) {
      let a = newBin[ newBin.length - i ];
      a = a === undefined ? '0' : a;
      let b = bin2[ bin2.length - i ];
      b = b === undefined ? '0' : b;
      result.unshift(a === b ? '0' : '1')
    }
    return new BinaryText(result.join(''))
  }

  shl(places) {
    return new BinaryText(this.value() + '0'.repeat(places))
  }

  shr(places) {
    let newBin = this.value().substr(0, this.length() - places);
    if (newBin === '') newBin = '0';
    return new BinaryText(newBin)
  }

  hexRepresentation() {
    var result = '';
    for (var i = 1; i <= Math.floor(this.length() / 4); i++) {
      var h = this.value().substr(-i * 4, 4);
      result = parseInt(h, 2).toString(16) + result
    }
    var last = '';
    for (var i = 0; i < this.length() - Math.floor(this.length() / 4) * 4; i++)
      last += this.value()[ i ];
    if (last !== '') result = parseInt(last, 2).toString(16) + result;
    return result;
  }

  intRepresentation() {
    //May have integer precision error with big numbers
    return parseInt(this.value(), 2)
  }

  value() {
    return this.bin;
  }

  length() {
    return this.bin.length;
  }

  _fromNumber(bin) {
    return bin.toString(2);
  }

  _fromHexa(hex) {
    let b;
    return hex.substr(2).split('').map(function (h) {
      b = parseInt(h, 16).toString(2);
      b = '0'.repeat(4 - b.length) + b;
      return b
    }).join('')
  }
}