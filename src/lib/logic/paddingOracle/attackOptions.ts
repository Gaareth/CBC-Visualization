import type { UIBlock } from '$lib/utils/arrayConversion';
import { autoGate, type Gate } from '$lib/utils/generic';
import type { AttackEvent } from './attackEvents';

type AttackProgress = {
	onBlockStart?: (blockIndex: number) => void;
	onBlockEnd?: (blockIndex: number) => void;
	onByteStart?: (byteIndex: number) => void;
	onByteEnd?: (byteIndex: number) => void;
	onGuess?: (guess: number) => void;
	onProgressUpdate?: (event: AttackEvent) => void;

	// to trigger reactivity in svelte components when the ciphertext or output (outGuessed or outPlaintextBlocks) changes
	onCiphertextChange?: () => void;
	onOutputChange?: () => void;
};

type AttackSharedOptions = {
	interactionGate?: Gate;
	guessGate?: Gate;

	skipEdgeCaseCheck?: boolean;
	progress?: AttackProgress;
};

type OutBlock = {
	outGuessedDecBlock?: UIBlock;
	outGuessedPlaintextBlock?: UIBlock;
};

type OutBlocks = {
	outGuessedDecBlocks?: UIBlock[];
	outGuessedPlaintextBlocks?: UIBlock[];
};

type AttackBlockGates = {
	byteGate?: { wait: () => Promise<void> };
};

// exports
export type AttackByteOptions = AttackSharedOptions & OutBlock;

export type AttackBlockOptions = AttackByteOptions & AttackBlockGates;

export type AttackOptions = AttackSharedOptions &
	AttackBlockGates &
	OutBlocks & {
		blockGate?: { wait: () => Promise<void> };
	};

export function normalizeShared(opts: AttackSharedOptions) {
	return {
		interactionGate: opts.interactionGate ?? autoGate,
		guessGate: opts.guessGate ?? autoGate,
		skipEdgeCaseCheck: opts.skipEdgeCaseCheck ?? false,
		progress: opts.progress
	};
}
