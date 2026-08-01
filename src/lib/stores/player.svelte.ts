// "Now Playing" store — current featured project shown in the bottom bar

export const PROJECT_COLORS: Record<string, string> = {
	'Sonar': '#1DB954',
	'Lookalike Search Engine': '#2D46B9',
	'LinkedIn DM Pipeline': '#E91429',
	'Sonar Chrome Extension': '#FF6B35',
};

export const player = $state({
	trackName: 'Sonar',
	artist: 'Beagle Security · Intern',
	color: '#1DB954',
	playing: true,
	progress: 0.35,
	volume: 0.72,
	duration: '4:20',
	elapsed: '1:31',
});

export function setTrack(name: string, artist: string) {
	player.trackName = name;
	player.artist = artist;
	player.color = PROJECT_COLORS[name] ?? '#1DB954';
	player.playing = true;
	player.progress = 0;
}

export function togglePlay() {
	player.playing = !player.playing;
}
