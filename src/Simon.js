class BinaryText {
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
        var result = []
        for (var i = 1; i <= Math.min(this.length(), bin2.length()); i++) {
            var a = this.value().substr(-i, 1)
            var b = bin2.value().substr(-i, 1)
            result.unshift(('0b' + a) & ('0b' + b))
        }
        return new BinaryText(result.join(''))
    }

    or(bin2) {
        var result = []
        var carry = false
        var newBin = this._trimzeros(this.value())
        bin2 = this._trimzeros(bin2.value())
        for (var i = 1; i <= Math.max(newBin.length, bin2.length); i++) {
			var a = newBin[newBin.length - i];
            a = a === undefined ? '0' : a
            var b = bin2[bin2.length - i];
            b = b === undefined ? '0' : b
            if (!carry) {
                if (a == '1' && b == '1') {
                    carry = true
                }
                result.unshift(a != b ? '1' : '0')
            } else {
                if (a == '0' && b == '0') {
                    carry = false
                }
                result.unshift(a == b ? '1' : '0')
            }
        }
        if (carry)
            result.unshift('1')
        return new BinaryText(result.join(''))
    }

    xor(bin2) {
        var result = []
        var carry = false
        var newBin = this._trimzeros(this.value())
        bin2 = this._trimzeros(bin2.value())
        for (var i = 1; i <= Math.max(newBin.length, bin2.length); i++) {
            var a = newBin[newBin.length - i];
            a = a === undefined ? '0' : a
            var b = bin2[bin2.length - i];
            b = b === undefined ? '0' : b
            result.unshift(a == b ? '0' : '1')
        }
        return new BinaryText(result.join(''))
    }

    shl(places) {
        return new BinaryText(this.value() + '0'.repeat(places))
    }

    shr(places) {
        var newBin = this.value().substr(0, this.length() - places)
        if (newBin === '')
            newBin = '0'
        return new BinaryText(newBin)
    }

    hexRepresentation() {
        var result = ''
        for (var i = 1; i <= Math.floor(this.length() / 4); i++) {
            var h = this.value().substr(-i * 4, 4)
            result = parseInt(h, 2).toString(16) + result
        }
        var last = ''
        for (var i = 0; i < this.length() - Math.floor(this.length() / 4) * 4; i++)
            last += this.value()[i]
        if (last !== '')
            result = parseInt(last, 2).toString(16) + result
        return result
    }

    intRepresentation() {
        //May have integer precision error with big numbers
        return parseInt(this.value(), 2)
    }

    value() {
        return this.bin
    }
    length() {
        return this.bin.length
    }

    _trimzeros(bin) {
        while (bin.charAt(0) === '0' && bin.length > 1) {
            bin = bin.substr(1);
        }
        return bin
    }

    _fromNumber(bin) {
        return bin.toString(2)
    }

    _fromHexa(hex) {
		var b;
        return hex.substr(2).split('').map(function(h) {
            b = parseInt(h, 16).toString(2);
            b = '0'.repeat(4 - b.length) + b;
            return b
        }).join('')
    }
}

function SimonCipher(key, key_size, block_size, _mode = 'ECB', initial_vector = new BinaryText(0)) {
    //key: BinaryText 
    //key_size: Int 
    //block_size: Int 
    //_mode: String 

    // Z Arrays (stored bit reversed for easier usage)
    z0 = new BinaryText('01100111000011010100100010111110110011100001101010010001011111');
    z1 = new BinaryText('01011010000110010011111011100010101101000011001001111101110001');
    z2 = new BinaryText('11001101101001111110001000010100011001001011000000111011110101');
    z3 = new BinaryText('11110000101100111001010001001000000111101001100011010111011011');
    z4 = new BinaryText('11110111001001010011000011101000000100011011010110011110001011');

    // valid cipher configurations stored:
    // block_size:{key_size:(number_rounds,z sequence)}
    __valid_setups = {
        32: [],
        48: [],
        64: [],
        96: [],
        128: []
    };
    __valid_setups[32][64] = [32, z0];
    __valid_setups[48][72] = [36, z0];
    __valid_setups[48][96] = [36, z1];
    __valid_setups[64][96] = [42, z2];
    __valid_setups[64][128] = [44, z3];
    __valid_setups[96][96] = [52, z2];
    __valid_setups[96][144] = [54, z3];
    __valid_setups[128][128] = [68, z2];
    __valid_setups[128][192] = [69, z3];
    __valid_setups[128][256] = [72, z4];

    __valid_modes = ['ECB','CBC'];

    var word_size, mod_mask, k_reg, k_schedule, mode
    var iv, iv_upper, iv_lower
    
    // Setup block/word size
    try {
        possible_setups = __valid_setups[block_size]
        block_size = block_size
        this.word_size = block_size >> 1
    } catch (ex) {
        console.log('Invalid block size!')
    }
    // Setup Number of Rounds, Z Sequence, and Key Size
    try {
        [rounds, zseq] = possible_setups[key_size]
        key_size = key_size
    } catch (ex) {
        console.log('Invalid key size for selected block size!!')
    }

    // Create Properly Sized bit mask for truncating addition and left shift outputs
    this.mod_mask = new BinaryText('1'.repeat(this.word_size))

    // Check Cipher Mode
    try {
        position = __valid_modes.indexOf(_mode)
        this.mode = __valid_modes[position]
    } catch (ex) {
        console.log('Invalid cipher mode!')
        console.log('Please use one of the following block cipher modes:', __valid_modes)
    }

    // Parse the given key and truncate it to the key length
    try {
        key = key.and(new BinaryText('1'.repeat(key_size)))
    } catch (ex) {
        console.log('Invalid Key Value!')
        console.log('Please Provide Key as BinaryText')
    }
    
    // Parse the given IV and truncate it to the block length
    try {
        this.iv = initial_vector.and(new BinaryText('1'.repeat(block_size)))
        this.iv_upper = this.iv.shr(this.word_size)
        this.iv_lower = this.iv.and(this.mod_mask)
    }
    catch(ex) {
        console.log('Invalid IV Value!')
        console.log('Please Provide IV as BinaryText')
    }

    // Pre-compile key schedule
    m = Math.floor(key_size / this.word_size)
    this.key_schedule = []

    // Create list of subwords from encryption key
    k_init = []
    for (x = 0; x < m; x++) {
        k_init[x] = key.shr(this.word_size * (m - 1 - x)).and(this.mod_mask)
    }


    this.k_reg = k_init // Use queue to manage key subwords

    round_constant = this.mod_mask.xor(new BinaryText(3)) // Round Constant is 0xFFFF..FC

    // Generate all round keys
    for (x = 0; x < rounds; x++) {

        rs_3 = ((this.k_reg[0].shl(this.word_size - 3)).or(this.k_reg[0].shr(3))).and(this.mod_mask)

        if (m == 4) {
            rs_3 = rs_3.xor(this.k_reg[2])
        }

        rs_1 = rs_3.shl(this.word_size - 1).or(rs_3.shr(1)).and(this.mod_mask)

        c_z = zseq.shr(x % 62).and(new BinaryText(1)).xor(round_constant)

        new_k = c_z.xor(rs_1).xor(rs_3).xor(this.k_reg[m - 1])

        this.key_schedule.push(this.k_reg.pop())
        this.k_reg.unshift(new_k)
    }

}

SimonCipher.prototype.encrypt = function (plaintext) {
    //Process new plaintext into ciphertext based on current cipher object setup
    //param plaintext
    var a, b

    try {
        b = plaintext.shr(this.word_size).and(this.mod_mask)
        a = plaintext.and(this.mod_mask)
    } catch (ex) {
        console.log('Invalid plaintext!')
        console.log('Please provide plaintext as BinaryText')
    }

    if (this.mode == 'ECB') {
        [b, a] = this.encrypt_function(b, a)
    }
    else if (this.mode == 'CBC') {
        b = b.xor(this.iv_upper)
        a = a.xor(this.iv_lower);
        [b, a] = this.encrypt_function(b, a)

        this.iv_upper = b
        this.iv_lower = a
        this.iv = b.shl(this.word_size).or(a)
    }
    ciphertext = b.shl(this.word_size).or(a)

    return ciphertext
}

SimonCipher.prototype.encrypt_function = function (upper_word, lower_word) {

    //Completes appropriate number of Simon Fiestel function to encrypt provided words
    //Round number is based off of number of elements in key schedule

    x = upper_word
    y = lower_word

    // Run Encryption Steps For Appropriate Number of Rounds
    for (var k in this.key_schedule) {
        // Generate all circular shifts
        ls_1_x = x.shr(this.word_size - 1).or(x.shl(1)).and(this.mod_mask)
        ls_8_x = x.shr(this.word_size - 8).or(x.shl(8)).and(this.mod_mask)
        ls_2_x = x.shr(this.word_size - 2).or(x.shl(2)).and(this.mod_mask)

        // XOR Chain
        xor_1 = ls_1_x.and(ls_8_x).xor(y)
        xor_2 = xor_1.xor(ls_2_x)
        y = x
        x = this.key_schedule[k].xor(xor_2)

    }
    return [x, y]
}

SimonCipher.prototype.decrypt = function (ciphertext) {

    //Process new ciphertest into plaintext based on current cipher object setup
    //param ciphertext
    var a, b

    try {
        b = ciphertext.shr(this.word_size).and(this.mod_mask)
        a = ciphertext.and(this.mod_mask)
    } catch (ex) {
        console.log('Invalid ciphertext!')
        console.log('Please provide ciphertext as BinaryText')
    }

    if (this.mode == 'ECB') {
        [a, b] = this.decrypt_function(a, b)
    }
    else if (this.mode == 'CBC') {
        [a, b] = this.decrypt_function(a, b)
        b = b.xor(this.iv_upper)
        a = a.xor(this.iv_lower)

        this.iv_upper = b
        this.iv_lower = a
        this.iv = b.shl(this.word_size).or(a)
    }
    plaintext = b.shl(this.word_size).or(a)

    return plaintext
}

SimonCipher.prototype.decrypt_function = function (upper_word, lower_word) {

    //Completes appropriate number of Simon Fiestel function to decrypt provided words
    //Round number is based off of number of elements in key schedule

    x = upper_word
    y = lower_word

    // Run Encryption Steps For Appropriate Number of Rounds
    for (var k in this.key_schedule) {
        // Generate all circular shifts
        ls_1_x = x.shr(this.word_size - 1).or(x.shl(1)).and(this.mod_mask)
        ls_8_x = x.shr(this.word_size - 8).or(x.shl(8)).and(this.mod_mask)
        ls_2_x = x.shr(this.word_size - 2).or(x.shl(2)).and(this.mod_mask)

        // XOR Chain
        xor_1 = ls_1_x.and(ls_8_x).xor(y)
        xor_2 = xor_1.xor(ls_2_x)
        y = x
        x = this.key_schedule[this.key_schedule.length - k - 1].xor(xor_2)
    }
    return [x, y]
}

//Examples shown here were taken from the following PDF at page 43: https://eprint.iacr.org/2013/404.pdf

//                        KEY,       KEY_SIZE,WORD_SIZE,MODE, PLAINTEXT,    EXPECTED ENCRYPTION
test_cases_encryption = [['0x1918111009080100', 64,32, 'ECB', '0x65656877', 'c69be9bb'],
						['0x1211100a0908020100', 72, 48, 'ECB', '0x6120676e696c', 'dae5ac292cac'],
						['0x1a19181211100a0908020100', 96, 48, 'ECB', '0x72696320646e', '6e06a5acf156'],
						['0x131211100b0a090803020100', 96, 64, 'ECB', '0x6f7220676e696c63', '5ca2e27f111a8fc8'],
						['0x1b1a1918131211100b0a090803020100', 128, 64, 'ECB', '0x656b696c20646e75', '44c8fc20b9dfa07a'],
						['0x0d0c0b0a0908050403020100', 96, 96, 'ECB', '0x2072616c6c69702065687420', '602807a462b469063d8ff082'],
						['0x1514131211100d0c0b0a0908050403020100', 144, 96, 'ECB', '0x74616874207473756420666f', 'ecad1c6c451e3f59c5db1ae9'],
						['0x0f0e0d0c0b0a09080706050403020100', 128, 128, 'ECB', '0x63736564207372656c6c657661727420', '49681b1e1e54fe3f65aa832af84e0bbc'],
						['0x17161514131211100f0e0d0c0b0a09080706050403020100', 192, 128, 'ECB', '0x206572656874206e6568772065626972', 'c4ac61effcdc0d4f6c9c8d6e2597b85b'],
						['0x1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100', 256, 128, 'ECB', '0x74206e69206d6f6f6d69732061207369', '8d2b5579afc8a3a03bf72a87efe7b868']]

for (var i in test_cases_encryption) {
	config = test_cases_encryption[i]
	simon = new SimonCipher(new BinaryText(config[0]), config[1], config[2], config[3])
	result = simon.encrypt(new BinaryText(config[4]))
	console.log("Input text: "+config[4]+" Encryption result: "+result.hexRepresentation()+" Expected result: "+config[5])
}