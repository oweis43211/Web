// js/auth.js - نظام إدارة المصادقة المركزي
class AuthSystem {
    constructor() {
        this.SUPABASE_URL = 'https://drnmmtpddixgpobcxijt.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybm1tdHBkZGl4Z3BvYmN4aWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDQ1ODgsImV4cCI6MjA4Mzk4MDU4OH0.Ym58ylN2hiyruuZ5NVoFyS9ZCHKvRE0QRKiiS0qXWGU';
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    // تهيئة Supabase
    initialize() {
        if (!this.isInitialized && typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            this.isInitialized = true;
        }
        return this.supabase;
    }

    // التحقق من حالة تسجيل الدخول
    async checkAuthStatus() {
        try {
            // محاولة الحصول على الجلسة من Supabase
            if (this.supabase) {
                const { data: sessionData } = await this.supabase.auth.getSession();
                
                if (sessionData.session) {
                    const { data: userData } = await this.supabase.auth.getUser();
                    
                    if (userData.user) {
                        // جلب بيانات المستخدم من جدول users
                        const { data: profileData } = await this.supabase
                            .from('users')
                            .select('*')
                            .eq('auth_id', userData.user.id)
                            .single();
                        
                        this.currentUser = {
                            id: userData.user.id,
                            email: userData.user.email,
                            ...(profileData || {})
                        };
                        
                        // حفظ في localStorage للاستخدام عبر الصفحات
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('userData', JSON.stringify(this.currentUser));
                        return true;
                    }
                }
            }
            
            // التحقق من localStorage كحالة احتياطية
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            if (isLoggedIn && userData.id) {
                this.currentUser = userData;
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    // تسجيل الدخول
    async login(email, password) {
        try {
            if (!this.supabase) this.initialize();
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            if (data.user) {
                // جلب بيانات المستخدم
                const { data: profileData } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('auth_id', data.user.id)
                    .single();
                
                this.currentUser = {
                    id: data.user.id,
                    email: data.user.email,
                    ...(profileData || {})
                };
                
                // حفظ في localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                
                return { success: true, user: this.currentUser };
            }
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // التسجيل
    async register(userData) {
        try {
            if (!this.supabase) this.initialize();
            
            // 1. إنشاء حساب المصادقة
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password
            });
            
            if (authError) throw authError;
            
            if (authData.user) {
                // 2. إنشاء ملف المستخدم في جدول users
                const userProfile = {
                    auth_id: authData.user.id,
                    email: userData.email,
                    name: userData.name,
                    mobile: userData.mobile,
                    role: userData.role,
                    mediator_type: userData.mediator_type || 'none',
                    company_name: userData.company_name || 'none',
                    company_address: userData.company_address || 'none',
                    created_at: new Date().toISOString()
                };
                
                const { data: profileData, error: profileError } = await this.supabase
                    .from('users')
                    .insert([userProfile]);
                
                if (profileError) throw profileError;
                
                // 3. تسجيل الدخول تلقائيًا
                const loginResult = await this.login(userData.email, userData.password);
                
                return loginResult;
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            // مسح البيانات المحلية
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userData');
            this.currentUser = null;
            
            return { success: true };
            
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // التحقق إذا كان المستخدم مسجل دخول
    isLoggedIn() {
        return !!this.currentUser || localStorage.getItem('isLoggedIn') === 'true';
    }

    // الحصول على بيانات المستخدم الحالي
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return userData.id ? userData : null;
    }

    // تحديث واجهة المستخدم حسب حالة تسجيل الدخول
    updateUI() {
        const userWelcome = document.getElementById('userWelcome');
        const loginHeaderBtn = document.getElementById('loginHeaderBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.isLoggedIn()) {
            const user = this.getCurrentUser();
            if (userWelcome) {
                userWelcome.textContent = `مرحباً، ${user.name || user.email.split('@')[0]}!`;
            }
            if (loginHeaderBtn) loginHeaderBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
        } else {
            if (userWelcome) {
                userWelcome.textContent = 'مرحباً بك في ARAB HOME';
            }
            if (loginHeaderBtn) loginHeaderBtn.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    // تهيئة النظام في كل صفحة
    async initializeAuth() {
        // تهيئة Supabase
        this.initialize();
        
        // التحقق من حالة تسجيل الدخول
        await this.checkAuthStatus();
        
        // تحديث واجهة المستخدم
        this.updateUI();
        
        // إضافة مستمعي الأحداث
        this.addEventListeners();
        
        return this;
    }

    // إضافة مستمعي الأحداث
    addEventListeners() {
        // زر تسجيل الخروج
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await this.logout();
            this.updateUI();
            window.location.reload();
        });
        
        // زر تسجيل الدخول
        document.getElementById('loginHeaderBtn')?.addEventListener('click', () => {
            this.showLoginModal();
        });
    }

    // عرض نافذة تسجيل الدخول (إذا كانت موجودة في الصفحة)
    showLoginModal() {
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) {
            loginOverlay.classList.add('active');
        } else {
            // إذا لم تكن النافذة موجودة، انتقل إلى الصفحة الرئيسية
            window.location.href = 'index.html';
        }
    }
}

// إنشاء نسخة عامة يمكن الوصول إليها من جميع الصفحات
window.authSystem = new AuthSystem();

// تهيئة النظام تلقائيًا عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    await window.authSystem.initializeAuth();
});