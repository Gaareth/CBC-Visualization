import { browser } from '$app/environment';

export const DISPLAY_BYTES_AS = ['hex', 'ascii', 'decimal'] as const;

// export const PADDING_SCHEMES = [
// 	'PKCS7',
// 	'ISO/IEC 7816-4',
// 	'ANSI X9.23 (random)',
// 	'ANSI X9.23 (zeros)'
// ] as const;

export const PADDING_SCHEMES = ['PKCS7'] as const;

// export const BLOCK_CIPHERS = ['TEA', 'OTP', 'TwoFish', 'AES', 'DES', 'IDEA'] as const;
export const BLOCK_CIPHERS = ['TEA', 'OTP'] as const;

export type DisplayBytesAs = (typeof DISPLAY_BYTES_AS)[number];
export type PaddingScheme = (typeof PADDING_SCHEMES)[number];
export type BlockCipher = (typeof BLOCK_CIPHERS)[number];

const DEFAULT_SETTINGS = {
	highlightChanges: true,
	displayBytesAs: 'hex' as const,
	paddingScheme: 'PKCS7' as const,
	blockCipher: 'OTP' as const
};

function loadSettings() {
	if (!browser) return DEFAULT_SETTINGS;

	const raw = localStorage.getItem('settings');
	if (!raw) return DEFAULT_SETTINGS;

	try {
		return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export const settingsState: typeof DEFAULT_SETTINGS = $state(loadSettings());
