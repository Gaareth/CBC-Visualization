export const settingsState = $state({
	highlightChanges: true,
	displayBytesAs: 'hex' as 'hex' | 'ascii' | 'decimal',
	byteWidth: 40,
	paddingScheme: "PKCS7" as "PKCS7" | "ISO/IEC 7816-4" | "ANSI X9.23 (random)" | "ANSI X9.23 (zeros)",
	BlockCipher: "OTP" as "TEA" | "OTP" | "TwoFish" | "AES" | "DES" | "IDEA",
});
