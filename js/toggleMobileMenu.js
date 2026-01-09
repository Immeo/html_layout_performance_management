const mobileMenu = document.querySelector('.mobile-menu');

const mobileBurger = document.querySelector('.nav__burger');

const mobileMenuBody = document.querySelector('.mobile-menu__body');

function toggleMobileMenu() {
	switch (true) {
		case mobileMenu.classList.contains('hidden'):
			mobileMenu.classList.remove('hidden');
			mobileMenu.style.animation = 'mobile-menu-show 0.5s ease-in-out';
			mobileMenu.style.transform = 'translateY(0px)';
			mobileMenu.classList.add('show');
			break;

		case mobileMenu.classList.contains('show'):
			mobileMenu.classList.add('hidden');
			mobileMenu.classList.remove('show');
			break;
	}
}
