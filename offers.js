// إدارة قاعدة البيانات للعروض
const OFFERS_DB = 'realEstateOffersDB';

// تهيئة قاعدة البيانات
function initOffersDatabase() {
    if (!localStorage.getItem(OFFERS_DB)) {
        localStorage.setItem(OFFERS_DB, JSON.stringify([]));
    }
}

// حفظ عرض جديد
function saveOfferToDB(offer) {
    initOffersDatabase();
    const db = JSON.parse(localStorage.getItem(OFFERS_DB));
    db.push(offer);
    localStorage.setItem(OFFERS_DB, JSON.stringify(db));
    return offer.id;
}

// جلب جميع العروض
function getAllOffersFromDB() {
    initOffersDatabase();
    return JSON.parse(localStorage.getItem(OFFERS_DB)) || [];
}

// جلب عرض بواسطة ID
function getOfferById(id) {
    const db = JSON.parse(localStorage.getItem(OFFERS_DB)) || [];
    return db.find(offer => offer.id === id);
}

// تحديث عرض
function updateOfferInDB(id, updatedData) {
    const db = JSON.parse(localStorage.getItem(OFFERS_DB)) || [];
    const index = db.findIndex(offer => offer.id === id);
    if (index !== -1) {
        db[index] = { ...db[index], ...updatedData };
        localStorage.setItem(OFFERS_DB, JSON.stringify(db));
        return true;
    }
    return false;
}

// حذف عرض
function deleteOfferFromDB(id) {
    const db = JSON.parse(localStorage.getItem(OFFERS_DB)) || [];
    const filteredDb = db.filter(offer => offer.id !== id);
    localStorage.setItem(OFFERS_DB, JSON.stringify(filteredDb));
    return true;
}

// تصفية العروض حسب النوع
function filterOffersByType(type) {
    const allOffers = getAllOffersFromDB();
    if (type === 'all') return allOffers;
    return allOffers.filter(offer => offer.type === type);
}

// تصدير البيانات
function exportOffersToJSON() {
    const data = getAllOffersFromDB();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offers_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// استيراد البيانات
function importOffersFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    localStorage.setItem(OFFERS_DB, JSON.stringify(data));
                    resolve(data.length);
                } else {
                    reject(new Error('الملف غير صالح'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsText(file);
    });
}

// توليد عروض تجريبية
function generateSampleOffers() {
    const sampleOffers = [
        {
            id: 1,
            type: 'house',
            area: '150',
            bathrooms: '3',
            reception: '2',
            excellence: '85',
            paidAmount: '500000',
            paidCurrency: 'EGP',
            offer: '2500000',
            governorate: 'القاهرة الجديدة',
            district: 'التجمع الخامس',
            image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            additionalInfo: 'شقة فاخرة بمساحة 150 م² في أفضل موقع بالتجمع الخامس',
            date: '2024-01-15',
            timestamp: 1705334400000
        },
        {
            id: 2,
            type: 'land',
            area: '500',
            district: 'الشيخ زايد',
            neighborhood: 'الحي الأول',
            excellence: '75',
            paidAmount: '100000',
            paidCurrency: 'USD',
            offer: '1650000',
            governorate: '6 أكتوبر',
            additionalInfo: 'قطعة أرض سكنية في موقع مميز بجوار جميع الخدمات',
            date: '2024-01-14',
            timestamp: 1705248000000
        },
        {
            id: 3,
            type: 'house',
            area: '200',
            bathrooms: '4',
            reception: '3',
            excellence: '90',
            paidAmount: '750000',
            paidCurrency: 'EGP',
            offer: '3500000',
            governorate: 'الشروق الجديدة',
            district: 'الحي السكني',
            image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            additionalInfo: 'دوبلكس راقي بمساحة 200 م² بموقع مميز',
            date: '2024-01-13',
            timestamp: 1705161600000
        }
    ];
    
    localStorage.setItem(OFFERS_DB, JSON.stringify(sampleOffers));
    return sampleOffers.length;
}