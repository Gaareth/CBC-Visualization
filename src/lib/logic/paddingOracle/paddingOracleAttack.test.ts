import { describe, expect, it } from 'vitest';
import { _cbcEncryptBlocks, cbcDecrypt } from '../cbc';
import { TeaCipher } from '../ciphers/tea/cipherTEA';
import {
	ATTACKABLE_PADDING_SCHEMES,
	recoverPlaintextWithOracle,
	type SupportedAttackablePaddingSchemes
} from './paddingOracleAttack';

import { uint8ArraysToUI, type UIBlock } from '$lib/utils/arrayConversion';
import { getPadder } from '../cbc-service';
import type { Cipher } from '../ciphers/ciphers';
import { OTPCipher } from '../ciphers/otp/cipherOTP';
import type { Padder } from '../padding/padding';

const CIPHERS = [
	{
		name: 'TEA',
		cipher: new TeaCipher()
	},

	{
		name: 'OTP',
		cipher: new OTPCipher()
	}
];

const CIPHER_CASES = CIPHERS.map((c) => [c.name, c.cipher] as const);

function paddingOracleParametric(
	ciphertextBlocks: Uint8Array[],
	key: Uint8Array,
	padder: Padder,
	blockCipherFn: Cipher['decrypt']
) {
	const decryptedPlaintextBlocks = cbcDecrypt(ciphertextBlocks, key, blockCipherFn);
	const lastBlock = decryptedPlaintextBlocks[decryptedPlaintextBlocks.length - 1];
	const result = padder.validatePadding(lastBlock);
	return result.valid;
}

type TestSetup = {
	cipher: Cipher;
	key: Uint8Array;
	iv: Uint8Array;
	plaintextBlocks: Uint8Array[];
};

// Create random key, iv, and plaintext blocks for testing
function setup(cipher: Cipher, numBlocks: number): TestSetup {
	const blockSize = cipher.blockSizeBytes ?? 16;

	const iv = crypto.getRandomValues(new Uint8Array(blockSize));
	const key = cipher.generateKey
		? cipher.generateKey()
		: crypto.getRandomValues(new Uint8Array(blockSize));

	const plaintextBlocks: Uint8Array[] = [];
	for (let i = 0; i < numBlocks; i++) {
		const block = crypto.getRandomValues(new Uint8Array(blockSize));
		plaintextBlocks.push(block);
	}

	return {
		cipher,
		key,
		iv,
		plaintextBlocks
	};
}

async function testPaddingOracle(
	testSetup: TestSetup,
	paddingScheme: SupportedAttackablePaddingSchemes
) {
	// setup
	const { cipher, key, iv, plaintextBlocks } = testSetup;

	const padder = getPadder(paddingScheme);

	const { ciphertextBlocks, blockCipherEncInput } = _cbcEncryptBlocks(
		plaintextBlocks,
		key,
		iv,
		cipher.encrypt
	);

	const paddingOracle = (blocks: Uint8Array[]) =>
		paddingOracleParametric(blocks, key, padder, cipher.decrypt);
	// ---------------------------------------------------------------

	// recover using padding oracle attack
	const recoveredPlaintext: UIBlock[] = [];
	const recoveredBlockcipherDecOutput: UIBlock[] = [];

	await recoverPlaintextWithOracle(ciphertextBlocks, paddingOracle, paddingScheme, {
		outGuessedPlaintextBlocks: recoveredPlaintext,
		outGuessedDecBlocks: recoveredBlockcipherDecOutput
	});

	// remove IV block
	recoveredPlaintext.shift();
	recoveredBlockcipherDecOutput.shift();

	expect(recoveredPlaintext).toEqual(uint8ArraysToUI(plaintextBlocks));
	expect(recoveredBlockcipherDecOutput).toEqual(uint8ArraysToUI(blockCipherEncInput));
}

describe.each(CIPHER_CASES)('Padding Oracle Attack - %s cipher', (cipherName, create) => {
	describe.each(ATTACKABLE_PADDING_SCHEMES)('padding: %s', (paddingScheme) => {
		it('recovers plaintext and blockcipher output', async () => {
			for (let numBlocks = 1; numBlocks <= 10; numBlocks++) {
				const testSetup = setup(create, numBlocks);
				await testPaddingOracle(testSetup, paddingScheme);
			}
		});
	});
});
