import SYLLABLES from "@mansion/shared/constants/syllables";

export default function composeSyllables(): [string, string, string] {
	const syllables: string[] = [];
	const batch = [...SYLLABLES];

	for (let i = 0; i < 3; i++) {
		syllables.push(
			batch.splice(Math.floor(Math.random() * batch.length), 1)[0]!,
		);
	}

	return syllables as [string, string, string];
}
