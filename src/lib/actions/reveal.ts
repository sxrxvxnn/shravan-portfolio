export function reveal(node: HTMLElement, delay: number = 0) {
	node.style.opacity = '0';
	node.style.transform = 'translateY(36px)';
	node.style.transition = `opacity 0.65s ${delay}ms cubic-bezier(0.16,1,0.3,1), transform 0.65s ${delay}ms cubic-bezier(0.16,1,0.3,1)`;

	const obs = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting) {
			node.style.opacity = '1';
			node.style.transform = 'none';
			obs.disconnect();
		}
	}, { threshold: 0.08 });

	obs.observe(node);
	return { destroy: () => obs.disconnect() };
}
