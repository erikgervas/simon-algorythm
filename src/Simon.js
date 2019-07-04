import { BinaryText } from "./BinaryText";

export function SimonCipher(key, key_size, block_size, _mode = 'ECB', initial_vector = new BinaryText(0)) {
  //key: BinaryText
  //key_size: Int
  //block_size: Int
  //_mode: String

  // Z Arrays (stored bit reversed for easier usage)
  const z0 = new BinaryText('01100111000011010100100010111110110011100001101010010001011111');
  const z1 = new BinaryText('01011010000110010011111011100010101101000011001001111101110001');
  const z2 = new BinaryText('11001101101001111110001000010100011001001011000000111011110101');
  const z3 = new BinaryText('11110000101100111001010001001000000111101001100011010111011011');
  const z4 = new BinaryText('11110111001001010011000011101000000100011011010110011110001011');

  // valid cipher configurations stored:
  // block_size:{key_size:(number_rounds,z sequence)}
  let __valid_setups = {
    32: [],
    48: [],
    64: [],
    96: [],
    128: []
  };
  __valid_setups[ 32 ][ 64 ] = [ 32, z0 ];
  __valid_setups[ 48 ][ 72 ] = [ 36, z0 ];
  __valid_setups[ 48 ][ 96 ] = [ 36, z1 ];
  __valid_setups[ 64 ][ 96 ] = [ 42, z2 ];
  __valid_setups[ 64 ][ 128 ] = [ 44, z3 ];
  __valid_setups[ 96 ][ 96 ] = [ 52, z2 ];
  __valid_setups[ 96 ][ 144 ] = [ 54, z3 ];
  __valid_setups[ 128 ][ 128 ] = [ 68, z2 ];
  __valid_setups[ 128 ][ 192 ] = [ 69, z3 ];
  __valid_setups[ 128 ][ 256 ] = [ 72, z4 ];

  let __valid_modes = [ 'ECB', 'CBC', 'PCBC' ];
  let possible_setups;

  let word_size, mod_mask, k_reg, k_schedule, mode;
  let iv, iv_upper, iv_lower;

  // Setup block/word size
  try {
    possible_setups = __valid_setups[ block_size ];
    this.word_size = block_size >> 1
  } catch (ex) {
    console.log('Invalid block size!')
  }

  let [ rounds, zseq ] = [ 0, 0 ];
  // Setup Number of Rounds, Z Sequence, and Key Size
  try {
    [ rounds, zseq ] = possible_setups[ key_size ];
  } catch (ex) {
    console.log('Invalid key size for selected block size!!')
  }

  // Create Properly Sized bit mask for truncating addition and left shift outputs
  this.mod_mask = new BinaryText('1'.repeat(this.word_size));

  // Check Cipher Mode
  try {
    this.mode = __valid_modes[ __valid_modes.indexOf(_mode) ];
  } catch (ex) {
    console.log('Invalid cipher mode!');
    console.log('Please use one of the following block cipher modes:', __valid_modes);
  }

  // Parse the given key and truncate it to the key length
  try {
    key = key.and(new BinaryText('1'.repeat(key_size)))
  } catch (ex) {
    console.log('Invalid Key Value!');
    console.log('Please Provide Key as BinaryText');
  }

  // Parse the given IV and truncate it to the block length
  try {
    this.iv = initial_vector.and(new BinaryText('1'.repeat(block_size)));
    this.iv_upper = this.iv.shr(this.word_size);
    this.iv_lower = this.iv.and(this.mod_mask);
  } catch (ex) {
    console.log('Invalid IV Value!');
    console.log('Please Provide IV as BinaryText')
  }

  // Pre-compile key schedule
  const m = Math.floor(key_size / this.word_size);
  this.key_schedule = [];

  // Create list of subwords from encryption key
  let k_init = [];
  for (var x = 0; x < m; x++) {
    k_init[ x ] = key.shr(this.word_size * ( m - 1 - x )).and(this.mod_mask)
  }

  this.k_reg = k_init; // Use queue to manage key subwords

  const round_constant = this.mod_mask.xor(new BinaryText(3));// Round Constant is 0xFFFF..FC

  let rs_3, rs_1, c_z, new_k;

  // Generate all round keys
  for (x = 0; x < rounds; x++) {

    rs_3 = ( ( this.k_reg[ 0 ].shl(this.word_size - 3) ).or(this.k_reg[ 0 ].shr(3)) ).and(this.mod_mask)

    if (m === 4) rs_3 = rs_3.xor(this.k_reg[ 2 ]);

    rs_1 = rs_3.shl(this.word_size - 1).or(rs_3.shr(1)).and(this.mod_mask);

    c_z = zseq.shr(x % 62).and(new BinaryText(1)).xor(round_constant);

    new_k = c_z.xor(rs_1).xor(rs_3).xor(this.k_reg[ m - 1 ]);

    this.key_schedule.push(this.k_reg.pop());
    this.k_reg.unshift(new_k)
  }
}

SimonCipher.prototype.encrypt = function (plaintext) {
  //Process new plaintext into ciphertext based on current cipher object setup
  //param plaintext
  let a, b, old_a, old_b;

  try {
    b = plaintext.shr(this.word_size).and(this.mod_mask);
    a = plaintext.and(this.mod_mask)
  } catch (ex) {
    console.log('Invalid plaintext!');
    console.log('Please provide plaintext as BinaryText');
  }

  if (this.mode === 'ECB') {
    [ b, a ] = this.encrypt_function(b, a)
  } else if (this.mode === 'CBC') {
    b = b.xor(this.iv_upper);
    a = a.xor(this.iv_lower);
    [ b, a ] = this.encrypt_function(b, a);

    this.iv_upper = b;
    this.iv_lower = a;
    this.iv = b.shl(this.word_size).or(a)
  } else if (this.mode === 'PCBC') {
	  old_a = a;
	  old_b = b;
	  b = b.xor(this.iv_upper);
	  a = a.xor(this.iv_lower);
	  [ b, a ] = this.encrypt_function(b, a);
	  this.iv_upper = old_b.xor(b);
	  this.iv_lower = old_a.xor(a);
  }
  return b.shl(this.word_size).or(a);
};

SimonCipher.prototype.encrypt_function = function (upper_word, lower_word) {

  //Completes appropriate number of Simon Fiestel function to encrypt provided words
  //Round number is based off of number of elements in key schedule

  let x = upper_word;
  let y = lower_word;

  // Run Encryption Steps For Appropriate Number of Rounds
  for (var k in this.key_schedule) {
    // Generate all circular shifts
    let ls_1_x = x.shr(this.word_size - 1).or(x.shl(1)).and(this.mod_mask);
    let ls_8_x = x.shr(this.word_size - 8).or(x.shl(8)).and(this.mod_mask);
    let ls_2_x = x.shr(this.word_size - 2).or(x.shl(2)).and(this.mod_mask);

    // XOR Chain
    let xor_1 = ls_1_x.and(ls_8_x).xor(y);
    let xor_2 = xor_1.xor(ls_2_x);
    y = x;
    x = this.key_schedule[ k ].xor(xor_2);
  }
  return [ x, y ]
};

SimonCipher.prototype.decrypt = function (ciphertext) {

  //Process new ciphertest into plaintext based on current cipher object setup
  //param ciphertext
  let a, b, old_a, old_b;

  try {
    b = ciphertext.shr(this.word_size).and(this.mod_mask);
    a = ciphertext.and(this.mod_mask);
  } catch (ex) {
    console.log('Invalid ciphertext!');
    console.log('Please provide ciphertext as BinaryText');
  }

  if (this.mode === 'ECB') {
    [ a, b ] = this.decrypt_function(a, b)
  } else if (this.mode === 'CBC') {
    old_a = a;
    old_b = b;
    [ a, b ] = this.decrypt_function(a, b);
    b = b.xor(this.iv_upper);
    a = a.xor(this.iv_lower);

    this.iv_upper = old_b;
    this.iv_lower = old_a;
    this.iv = old_b.shl(this.word_size).or(old_a)
  } else if (this.mode === 'PCBC') {
	  old_a = a;
	  old_b = b;
	  [ a, b ] = this.decrypt_function(a, b);
	  b = b.xor(this.iv_upper);
	  a = a.xor(this.iv_lower);
	  this.iv_upper = old_b.xor(b);
	  this.iv_lower = old_a.xor(a);
  }
  return b.shl(this.word_size).or(a);
};

SimonCipher.prototype.decrypt_function = function (upper_word, lower_word) {

  //Completes appropriate number of Simon Fiestel function to decrypt provided words
  //Round number is based off of number of elements in key schedule

  let x = upper_word;
  let y = lower_word;

  // Run Encryption Steps For Appropriate Number of Rounds
  for (var k in this.key_schedule) {
    // Generate all circular shifts
    let ls_1_x = x.shr(this.word_size - 1).or(x.shl(1)).and(this.mod_mask)
    let ls_8_x = x.shr(this.word_size - 8).or(x.shl(8)).and(this.mod_mask)
    let ls_2_x = x.shr(this.word_size - 2).or(x.shl(2)).and(this.mod_mask)

    // XOR Chain
    let xor_1 = ls_1_x.and(ls_8_x).xor(y);
    let xor_2 = xor_1.xor(ls_2_x);
    y = x;
    x = this.key_schedule[ this.key_schedule.length - k - 1 ].xor(xor_2);
  }
  return [ x, y ]
};

//Examples shown here were taken from the following PDF at page 43: https://eprint.iacr.org/2013/404.pdf

//                        KEY,       KEY_SIZE,WORD_SIZE,MODE, PLAINTEXT,    EXPECTED ENCRYPTION
const test_cases_encryption = [ [ '0x1918111009080100', 64, 32, 'ECB', '0x65656877', 'c69be9bb' ],
  [ '0x1211100a0908020100', 72, 48, 'ECB', '0x6120676e696c', 'dae5ac292cac' ],
  [ '0x1a19181211100a0908020100', 96, 48, 'ECB', '0x72696320646e', '6e06a5acf156' ],
  [ '0x131211100b0a090803020100', 96, 64, 'ECB', '0x6f7220676e696c63', '5ca2e27f111a8fc8' ],
  [ '0x1b1a1918131211100b0a090803020100', 128, 64, 'ECB', '0x656b696c20646e75', '44c8fc20b9dfa07a' ],
  [ '0x0d0c0b0a0908050403020100', 96, 96, 'ECB', '0x2072616c6c69702065687420', '602807a462b469063d8ff082' ],
  [ '0x1514131211100d0c0b0a0908050403020100', 144, 96, 'ECB', '0x74616874207473756420666f', 'ecad1c6c451e3f59c5db1ae9' ],
  [ '0x0f0e0d0c0b0a09080706050403020100', 128, 128, 'ECB', '0x63736564207372656c6c657661727420', '49681b1e1e54fe3f65aa832af84e0bbc' ],
  [ '0x17161514131211100f0e0d0c0b0a09080706050403020100', 192, 128, 'ECB', '0x206572656874206e6568772065626972', 'c4ac61effcdc0d4f6c9c8d6e2597b85b' ],
  [ '0x1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100', 256, 128, 'ECB', '0x74206e69206d6f6f6d69732061207369', '8d2b5579afc8a3a03bf72a87efe7b868' ] ]

for (var i in test_cases_encryption) {
  const config = test_cases_encryption[ i ];
  const simon = new SimonCipher(new BinaryText(config[ 0 ]), config[ 1 ], config[ 2 ], config[ 3 ]);
  const result = simon.encrypt(new BinaryText(config[ 4 ]));
  console.log("Input text: " + config[ 4 ] + " Encryption result: " + result.hexRepresentation() + " Expected result: " + config[ 5 ])
}