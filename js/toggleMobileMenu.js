'use strict';

document.addEventListener('DOMContentLoaded', () => {
	const menu = document.getElementById('mobileDialog');
	const btnOpen = document.getElementById('openMenu');
	const btnClose = document.getElementById('closeMenu');

	if (!menu || !btnOpen || !btnClose) return;

	const openMenu = () => {
		menu.showModal();
		document.body.style.overflow = 'hidden';
	};

	const closeMenu = () => {
		menu.close();
		document.body.style.overflow = '';
	};

	btnOpen.addEventListener('click', openMenu);
	btnClose.addEventListener('click', closeMenu);

	menu.addEventListener('mousedown', e => {
		if (e.target === menu) {
			closeMenu();
		}
	});

	const menuLinks = menu.querySelectorAll('.nav__link');
	menuLinks.forEach(link => {
		link.addEventListener('click', closeMenu);
	});
});
