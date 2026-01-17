// js/init.js - تهيئة عامة لجميع الصفحات
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing ARAB HOME application...');
    
    // 1. تهيئة نظام المصادقة
    if (window.authSystem) {
        await window.authSystem.initializeAuth();
    }
    
    // 2. تحديث جميع واجهات المستخدم
    updateAllUI();
    
    // 3. حماية الصفحات المطلوبة
    protectPages();
    
    // 4. إضافة مستمعي الأحداث العامة
    addGlobalEventListeners();
    
    console.log('Application initialized successfully');
});

function updateAllUI() {
    // تحديث شريط التنقل
    updateNavigation();
    
    // تحديث أزرار المستخدم
    updateUserButtons();
    
    // تحديث المحتوى بناءً على حالة تسجيل الدخول
    updateContentBasedOnAuth();
}

function updateNavigation() {
    const isLoggedIn = window.authSystem?.isLoggedIn() || false;
    
    // تحديث جميع روابط القائمة
    document.querySelectorAll('.main-nav a').forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === 'offers.html' || href === 'add-house.html' || href === 'add-land.html') {
            if (!isLoggedIn) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    alert('يرجى تسجيل الدخول للوصول إلى هذه الصفحة');
                    window.authSystem?.showLoginModal();
                });
            }
        }
    });
}

function updateUserButtons() {
    const isLoggedIn = window.authSystem?.isLoggedIn() || false;
    
    // تحديث زر إضافة عرض
    const addOfferBtns = document.querySelectorAll('.add-offer-btn, #addOfferBtnMain');
    addOfferBtns.forEach(btn => {
        if (!isLoggedIn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('يرجى تسجيل الدخول لإضافة عرض جديد');
                window.authSystem?.showLoginModal();
            });
        }
    });
}

function protectPages() {
    const protectedPages = ['add-house.html', 'add-land.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const isLoggedIn = window.authSystem?.isLoggedIn() || false;
        
        if (!isLoggedIn) {
            alert('هذه الصفحة تتطلب تسجيل الدخول');
            window.location.href = 'index.html';
        }
    }
}

function addGlobalEventListeners() {
    // تحديث عند تغيير حالة تسجيل الدخول
    if (window.dataSync) {
        window.dataSync.on('userDataUpdated', function() {
            updateAllUI();
        });
        
        window.dataSync.on('userDataCleared', function() {
            updateAllUI();
        });
    }
    
    // تحديث عند تركيز/إلغاء تركيز النافذة
    window.addEventListener('focus', function() {
        // التحقق من تحديث حالة تسجيل الدخول
        window.authSystem?.checkAuthStatus().then(() => {
            updateAllUI();
        });
    });
}