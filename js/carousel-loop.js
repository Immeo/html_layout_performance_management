document.addEventListener('DOMContentLoaded', () => {
	const carousel = document.querySelector('.carousel');
	if (!carousel) return;

	const viewport = carousel.querySelector('.carousel__viewport');
	const cardsTrack = carousel.querySelector('.carousel__cards');
	if (!viewport || !cardsTrack) return;

	const mediaQuery = window.matchMedia('(max-width: 500px)');

	const originalCards = Array.from(cardsTrack.children);
	const realCardsCount = originalCards.length;

	if (!realCardsCount) return;

	let allCards = [];
	let isEnabled = false;
	let isInteracting = false;
	let currentIndex = 0;

	let autoplayTimer = null;
	let scrollEndTimer = null;
	let resumeTimer = null;

	const AUTOPLAY_DELAY = 3000;
	const RESUME_DELAY = 2200;
	const SCROLL_END_DELAY = 120;

	function normalizeIndex(index) {
		return ((index % realCardsCount) + realCardsCount) % realCardsCount;
	}

	function createClone(card) {
		const clone = card.cloneNode(true);

		clone.dataset.clone = 'true';
		clone.setAttribute('aria-hidden', 'true');

		if (clone.id) clone.removeAttribute('id');
		clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

		const img = clone.querySelector('img');
		if (img) {
			img.setAttribute('alt', '');
		}

		return clone;
	}

	function buildInfiniteTrack() {
		if (cardsTrack.dataset.infiniteReady === 'true') return;

		const beforeClones = originalCards.map(createClone);
		const afterClones = originalCards.map(createClone);

		beforeClones.reverse().forEach(clone => {
			cardsTrack.insertBefore(clone, cardsTrack.firstChild);
		});

		afterClones.forEach(clone => {
			cardsTrack.appendChild(clone);
		});

		allCards = Array.from(cardsTrack.children);
		cardsTrack.dataset.infiniteReady = 'true';
	}

	function destroyInfiniteTrack() {
		if (cardsTrack.dataset.infiniteReady !== 'true') return;

		cardsTrack.innerHTML = '';
		originalCards.forEach(card => cardsTrack.appendChild(card));

		allCards = Array.from(cardsTrack.children);
		delete cardsTrack.dataset.infiniteReady;
	}

	function getCardScrollLeft(card) {
		const left =
			card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
		return Math.max(0, left);
	}

	function scrollToCard(card, behavior = 'smooth') {
		viewport.scrollTo({
			left: getCardScrollLeft(card),
			behavior
		});
	}

	function getRealCardByIndex(index) {
		const safeIndex = normalizeIndex(index);
		return allCards[realCardsCount + safeIndex];
	}

	function getNearestCardIndexInTrack() {
		const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;

		let nearestIndex = 0;
		let minDistance = Infinity;

		allCards.forEach((card, index) => {
			const cardCenter = card.offsetLeft + card.offsetWidth / 2;
			const distance = Math.abs(viewportCenter - cardCenter);

			if (distance < minDistance) {
				minDistance = distance;
				nearestIndex = index;
			}
		});

		return nearestIndex;
	}

	function jumpFromCloneToRealIfNeeded() {
		let trackIndex = getNearestCardIndexInTrack();

		if (trackIndex < realCardsCount) {
			trackIndex += realCardsCount;
			scrollToCard(allCards[trackIndex], 'auto');
		} else if (trackIndex >= realCardsCount * 2) {
			trackIndex -= realCardsCount;
			scrollToCard(allCards[trackIndex], 'auto');
		}

		currentIndex = normalizeIndex(trackIndex - realCardsCount);
		return trackIndex;
	}

	function snapToNearestCard() {
		const trackIndex = getNearestCardIndexInTrack();
		scrollToCard(allCards[trackIndex], 'smooth');
		currentIndex = normalizeIndex(trackIndex - realCardsCount);
	}

	function stopAutoplay() {
		if (autoplayTimer) {
			clearInterval(autoplayTimer);
			autoplayTimer = null;
		}
	}

	function startAutoplay() {
		if (!isEnabled || autoplayTimer || realCardsCount < 2) return;

		autoplayTimer = setInterval(() => {
			if (isInteracting) return;

			currentIndex = normalizeIndex(currentIndex + 1);
			const targetCard = getRealCardByIndex(currentIndex);
			scrollToCard(targetCard, 'smooth');
		}, AUTOPLAY_DELAY);
	}

	function restartAutoplay(delay = RESUME_DELAY) {
		stopAutoplay();
		clearTimeout(resumeTimer);

		if (!isEnabled) return;

		resumeTimer = setTimeout(() => {
			startAutoplay();
		}, delay);
	}

	function handleInteractionStart() {
		if (!isEnabled) return;

		isInteracting = true;
		stopAutoplay();
		clearTimeout(resumeTimer);
	}

	function handleInteractionEnd() {
		if (!isEnabled) return;

		isInteracting = false;
		snapToNearestCard();
		restartAutoplay();
	}

	function handleScroll() {
		if (!isEnabled) return;

		clearTimeout(scrollEndTimer);

		scrollEndTimer = setTimeout(() => {
			if (isInteracting) return;

			snapToNearestCard();

			requestAnimationFrame(() => {
				setTimeout(() => {
					jumpFromCloneToRealIfNeeded();
				}, 220);
			});

			restartAutoplay();
		}, SCROLL_END_DELAY);
	}

	function handleVisibilityChange() {
		if (document.hidden) {
			stopAutoplay();
		} else if (isEnabled) {
			restartAutoplay(400);
		}
	}

	function enableCarousel() {
		if (isEnabled) return;

		buildInfiniteTrack();
		isEnabled = true;

		allCards = Array.from(cardsTrack.children);
		currentIndex = 0;

		viewport.addEventListener('scroll', handleScroll, { passive: true });
		viewport.addEventListener('touchstart', handleInteractionStart, {
			passive: true
		});
		viewport.addEventListener('touchend', handleInteractionEnd, {
			passive: true
		});
		viewport.addEventListener('touchcancel', handleInteractionEnd, {
			passive: true
		});
		viewport.addEventListener('pointerdown', handleInteractionStart, {
			passive: true
		});
		window.addEventListener('pointerup', handleInteractionEnd, {
			passive: true
		});
		document.addEventListener('visibilitychange', handleVisibilityChange);

		requestAnimationFrame(() => {
			scrollToCard(getRealCardByIndex(0), 'auto');
		});

		startAutoplay();
	}

	function disableCarousel() {
		if (!isEnabled) return;

		isEnabled = false;
		isInteracting = false;

		stopAutoplay();
		clearTimeout(scrollEndTimer);
		clearTimeout(resumeTimer);

		viewport.removeEventListener('scroll', handleScroll);
		viewport.removeEventListener('touchstart', handleInteractionStart);
		viewport.removeEventListener('touchend', handleInteractionEnd);
		viewport.removeEventListener('touchcancel', handleInteractionEnd);
		viewport.removeEventListener('pointerdown', handleInteractionStart);
		window.removeEventListener('pointerup', handleInteractionEnd);
		document.removeEventListener('visibilitychange', handleVisibilityChange);

		destroyInfiniteTrack();
	}

	function handleBreakpointChange() {
		if (mediaQuery.matches) {
			enableCarousel();
		} else {
			disableCarousel();
		}
	}

	function handleResize() {
		if (!isEnabled || !mediaQuery.matches) return;

		clearTimeout(scrollEndTimer);
		scrollEndTimer = setTimeout(() => {
			scrollToCard(getRealCardByIndex(currentIndex), 'auto');
		}, 100);
	}

	if (mediaQuery.addEventListener) {
		mediaQuery.addEventListener('change', handleBreakpointChange);
	} else {
		mediaQuery.addListener(handleBreakpointChange);
	}

	window.addEventListener('resize', handleResize, { passive: true });

	handleBreakpointChange();
});
