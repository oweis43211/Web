// js/sync.js - مزامنة بيانات المستخدم بين الصفحات
class DataSync {
    constructor() {
        this.STORAGE_KEY = 'homeLandUserData';
        this.events = {};
    }
    
    // حفظ بيانات المستخدم
    saveUserData(userData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
        this.trigger('userDataUpdated', userData);
    }
    
    // جلب بيانات المستخدم
    getUserData() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    }
    
    // مسح بيانات المستخدم
    clearUserData() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.trigger('userDataCleared');
    }
    
    // الاستماع لتغييرات البيانات
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    // تشغيل الأحداث
    trigger(event, data = null) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    // مزامنة مع Supabase
    async syncWithSupabase(supabaseClient) {
        const userData = this.getUserData();
        
        if (userData.id && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('users')
                    .update({
                        last_sync: new Date().toISOString(),
                        ...userData
                    })
                    .eq('auth_id', userData.id);
                
                if (!error) {
                    console.log('Data synced with Supabase');
                }
            } catch (error) {
                console.error('Sync error:', error);
            }
        }
    }
}

// إنشاء نسخة عامة
window.dataSync = new DataSync();