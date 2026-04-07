import { createContext, type Snippet } from 'svelte';

export type SectionRegistration = {
	id: string;
	element: HTMLElement;
	visualSnippet: Snippet;
};

export type RegisterSection = (section: SectionRegistration) => void;

export type SectionContext = {
	register: RegisterSection;
	ctxt?: SectionContextValue;
};

export type SectionContextValue = {
	shouldWrap?: boolean;
	visualColumnWidth?: number;
	activeId?: string;
};

export const [getSectionContext, setSectionContext] = createContext<SectionContext>();
