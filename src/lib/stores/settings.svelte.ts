export const DISPLAY_BYTES_AS = ['hex', 'ascii', 'decimal'] as const;
export const PADDING_SCHEMES = [
	'PKCS7',
	'ISO/IEC 7816-4',
	'ANSI X9.23 (random)',
	'ANSI X9.23 (zeros)'
] as const;

export const BLOCK_CIPHERS = ['TEA', 'OTP', 'TwoFish', 'AES', 'DES', 'IDEA'] as const;

export type DisplayBytesAs = (typeof DISPLAY_BYTES_AS)[number];
export type PaddingScheme = (typeof PADDING_SCHEMES)[number];
export type BlockCipher = (typeof BLOCK_CIPHERS)[number];

export const settingsState = $state({
	highlightChanges: true,
	displayBytesAs: 'hex' as DisplayBytesAs,
	paddingScheme: 'PKCS7' as PaddingScheme,
	blockCipher: 'OTP' as BlockCipher
});
