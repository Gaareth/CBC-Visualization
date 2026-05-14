export interface Cipher {
    keySizeBytes?: number;
    blockSizeBytes?: number;

    encrypt(plaintext: Uint8Array, key: Uint8Array): Uint8Array;
    decrypt(ciphertext: Uint8Array, key: Uint8Array): Uint8Array;
    generateKey?(): Uint8Array;
    generateKeyWithLength?(length: number): Uint8Array;
    getFixedKey?(): Uint8Array; // Optional method for ciphers that want to provide a fixed key to use in the demo
}