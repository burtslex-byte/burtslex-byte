// js/ads-manager.js
class AdsManager {
    constructor() {
        this.adsKey = 'userAds';
        this.init();
    }

    init() {
        try {
            // Если нет сохранённых объявлений, при наличии глобальных adsData — используем его,
            // иначе инициализируем пустым массивом
            const exist = localStorage.getItem(this.adsKey);
            if (!exist) {
                if (typeof window.adsData !== 'undefined' && Array.isArray(window.adsData)) {
                    this.saveAds(window.adsData);
                } else {
                    this.saveAds([]);
                }
            }
        } catch (e) {
            console.error('adsManager.init error:', e);
            this.saveAds([]);
        }
    }

    getAds() {
        const raw = localStorage.getItem(this.adsKey);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('getAds JSON parse error', e);
            return [];
        }
    }

    saveAds(ads) {
        try {
            localStorage.setItem(this.adsKey, JSON.stringify(ads));
        } catch (e) {
            console.error('saveAds error', e);
        }
    }

    getAdById(id) {
        const ads = this.getAds();
        console.log('All ads:', ads);
        console.log('Looking for ad with id:', id);
        const found = ads.find(a => String(a.id) === String(id));
        console.log('Found ad:', found);
        return found;
    }

    addAd(adData) {
        const ads = this.getAds();
        const newId = ads.length > 0 ? Math.max(...ads.map(ad => Number(ad.id) || 0)) + 1 : 1;

        const currentUser = (window.authManager && typeof window.authManager.getCurrentUser === 'function')
            ? window.authManager.getCurrentUser()
            : null;

        const newAd = {
            id: newId,
            title: adData.title || '',
            price: adData.price || '',
            image: adData.image || '',
            description: adData.description || '',
            date: new Date().toISOString(),
            authorName: currentUser ? (currentUser.name || '') : '',
            authorEmail: currentUser ? (currentUser.email || '') : '',
            authorPhone: currentUser ? (currentUser.phone || '') : '',
            responses: []
        };

        ads.unshift(newAd);
        this.saveAds(ads);
        return newAd;
    }

    addResponse(adId, responder) {
        const ads = this.getAds();
        const ad = ads.find(a => String(a.id) === String(adId));
        if (!ad) return { ok: false, error: 'Ad not found' };
        ad.responses = ad.responses || [];
        if (ad.responses.find(r => r.email === responder.email)) {
            return { ok: false, error: 'Already responded' };
        }
        ad.responses.push({ name: responder.name, phone: responder.phone, email: responder.email, createdAt: new Date().toISOString() });
        this.saveAds(ads);
        return { ok: true };
    }

    deleteAd(adId) {
        const ads = this.getAds().filter(ad => String(ad.id) !== String(adId));
        this.saveAds(ads);
    }
}

// Глобальный экземпляр — записываем на window (если уже есть, не затираем)
if (!window.adsManager) {
    window.adsManager = new AdsManager();
} else {
    // если объект уже был, но без методов — безопасно восстановим
    if (typeof window.adsManager.getAds !== 'function') {
        window.adsManager = new AdsManager();
    }
}
