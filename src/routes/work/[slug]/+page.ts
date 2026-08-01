import { error } from '@sveltejs/kit';
import { resume } from '$lib/data/resume.js';
import type { PageLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = () => [
	{ slug: 'sonar' },
	{ slug: 'lookalike' },
	{ slug: 'linkedin-pipeline' },
	{ slug: 'chrome-extension' },
];

const slugMap: Record<string, number> = {
	sonar: 0,
	lookalike: 1,
	'linkedin-pipeline': 2,
	'chrome-extension': 3,
};

export const load: PageLoad = ({ params }) => {
	const idx = slugMap[params.slug];
	if (idx === undefined) error(404, 'Project not found');
	return { project: resume.projects[idx], slug: params.slug };
};
