// إعداد Supabase المركزي
const SUPABASE_URL = 'https://drnmmtpddixgpobcxijt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybm1tdHBkZGl4Z3BvYmN4aWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDQ1ODgsImV4cCI6MjA4Mzk4MDU4OH0.Ym58ylN2hiyruuZ5NVoFyS9ZCHKvRE0QRKiiS0qXWGU';

// تهيئة Supabase
let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn('Supabase client initialization failed', e);
}

// حالة المستخدم الحالي
let currentUser = null;

// دالة لتحميل جلسة المستخدم
async function loadUserSession() {
    // محاولة تحميل من Supabase أولاً
    if (supabaseClient) {
        try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            if (sessionData.session) {
                const { data: userData } = await supabaseClient.auth.getUser();
                if (userData.user) {
                    // جلب بيانات المستخدم من جدول users
                    const { data: profileData } = await supabaseClient
                        .from('users')
                        .select('*')
                        .eq('auth_id', userData.user.id)
                        .single();
                    
                    currentUser = {
                        id: userData.user.id,
                        email: userData.user.email,
                        name: profileData?.name || userData.user.email.split('@')[0],
                        role: profileData?.role || 'user',
                        profile: profileData
                    };
                    
                    // حفظ في localStorage للنسخ الاحتياطي
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    return currentUser;
                }
            }
        } catch (error) {
            console.warn('Supabase session load failed:', error);
        }
    }
    
    // النسخ الاحتياطي من localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const savedUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn && savedUser) {
        currentUser = JSON.parse(savedUser);
        return currentUser;
    }
    
    return null;
}

// دالة لتحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
function updateAuthUI() {
    const userWelcome = document.getElementById('userWelcome');
    const loginHeaderBtn = document.getElementById('loginHeaderBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        if (userWelcome) {
            userWelcome.textContent = `مرحباً، ${currentUser.name}!`;
        }
        if (loginHeaderBtn) {
            loginHeaderBtn.style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
    } else {
        if (userWelcome) {
            userWelcome.textContent = 'مرحباً بك في HOME LAND';
        }
        if (loginHeaderBtn) {
            loginHeaderBtn.style.display = 'block';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

// دالة تسجيل الدخول
async function login(email, password) {
    try {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            // جلب بيانات المستخدم
            const { data: userData } = await supabaseClient.auth.getUser();
            if (userData.user) {
                const { data: profileData } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('auth_id', userData.user.id)
                    .single();
                
                currentUser = {
                    id: userData.user.id,
                    email: email,
                    name: profileData?.name || email.split('@')[0],
                    role: profileData?.role || 'user',
                    profile: profileData
                };
                
                // حفظ في localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('isLoggedIn', 'true');
                
                updateAuthUI();
                return { success: true, user: currentUser };
            }
        }
        
        throw new Error('فشل تسجيل الدخول');
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// دالة تسجيل الخروج
async function logout() {
    try {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        
        // مسح البيانات المحلية
        currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        
        updateAuthUI();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// دالة للتحقق من تسجيل الدخول
function isLoggedIn() {
    return currentUser !== null;
}

// دالة للحصول على بيانات المستخدم الحالي
function getCurrentUser() {
    return currentUser;
}

// تهيئة النظام عند تحميل الصفحة
async function initializeAuth() {
    await loadUserSession();
    updateAuthUI();
    
    // إضافة مستمعات الأحداث للأزرار المشتركة
    document.addEventListener('click', function(e) {
        // زر تسجيل الدخول في الهيدر
        if (e.target.closest('#loginHeaderBtn')) {
            e.preventDefault();
            showLoginModal();
        }
        
        // زر تسجيل الخروج
        if (e.target.closest('#logoutBtn')) {
            e.preventDefault();
            logout();
        }
    });
    
    // تحميل المستخدم في حالة انتقال بين الصفحات
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn' || e.key === 'currentUser') {
            loadUserSession().then(updateAuthUI);
        }
    });
}

// دالة لعرض نافذة تسجيل الدخول
function showLoginModal() {
    // يمكنك تنفيذ هذه الوظيفة حسب تصميمك
    // أو يمكنك ربطها بنافذة تسجيل الدخول الموجودة
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.classList.add('active');
    } else {
        // إذا لم تكن النافذة موجودة، افتح صفحة تسجيل الدخول
        window.location.href = 'login.html';
    }
}

// تصدير الوظائف للاستخدام في الصفحات الأخرى
window.authSystem = {
    initializeAuth,
    login,
    logout,
    isLoggedIn,
    getCurrentUser,
    showLoginModal,
    supabaseClient
};

// البدء التلقائي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeAuth);