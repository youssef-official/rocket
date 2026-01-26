import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'zh' | 'ja' | 'fr';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  // Common
  'common.signIn': { en: 'Sign in', ar: 'تسجيل الدخول', zh: '登录', ja: 'ログイン', fr: 'Connexion' },
  'common.signOut': { en: 'Sign Out', ar: 'تسجيل الخروج', zh: '退出登录', ja: 'ログアウト', fr: 'Déconnexion' },
  'common.settings': { en: 'Account Settings', ar: 'إعدادات الحساب', zh: '账户设置', ja: 'アカウント設定', fr: 'Paramètres du compte' },
  'common.theme': { en: 'Theme', ar: 'المظهر', zh: '主题', ja: 'テーマ', fr: 'Thème' },
  'common.dark': { en: 'Dark', ar: 'داكن', zh: '深色', ja: 'ダーク', fr: 'Sombre' },
  'common.light': { en: 'Light', ar: 'فاتح', zh: '浅色', ja: 'ライト', fr: 'Clair' },
  'common.system': { en: 'System', ar: 'النظام', zh: '系统', ja: 'システム', fr: 'Système' },
  'common.language': { en: 'Language', ar: 'اللغة', zh: '语言', ja: '言語', fr: 'Langue' },
  'common.freePlan': { en: 'Free Plan', ar: 'الخطة المجانية', zh: '免费计划', ja: '無料プラン', fr: 'Plan gratuit' },
  
  // Navigation
  'nav.pricing': { en: 'Pricing', ar: 'الأسعار', zh: '定价', ja: '料金', fr: 'Tarifs' },
  'nav.docs': { en: 'Docs', ar: 'المستندات', zh: '文档', ja: 'ドキュメント', fr: 'Documentation' },
  'nav.resources': { en: 'Resources', ar: 'الموارد', zh: '资源', ja: 'リソース', fr: 'Ressources' },
  'nav.backToHome': { en: 'Back to Home', ar: 'العودة للرئيسية', zh: '返回首页', ja: 'ホームに戻る', fr: 'Retour à l\'accueil' },
  
  // Home page
  'home.title1': { en: 'Think It.', ar: 'فكر بها.', zh: '想一想.', ja: '考えて.', fr: 'Pensez-y.' },
  'home.title2': { en: 'Type It.', ar: 'اكتبها.', zh: '输入它.', ja: '入力して.', fr: 'Tapez-le.' },
  'home.title3': { en: 'Launch It.', ar: 'أطلقها.', zh: '启动它.', ja: '起動して.', fr: 'Lancez-le.' },
  'home.subtitle': { en: 'Build production-ready', ar: 'ابنِ منتجات جاهزة للإنتاج', zh: '构建生产就绪', ja: '本番対応の構築', fr: 'Créez des applications prêtes' },
  'home.placeholder': { en: 'What can I build for you today?', ar: 'ماذا يمكنني أن أبني لك اليوم؟', zh: '今天我能为您构建什么？', ja: '今日は何を作りましょうか？', fr: 'Que puis-je construire pour vous aujourd\'hui ?' },
  'home.import': { en: 'Import', ar: 'استيراد', zh: '导入', ja: 'インポート', fr: 'Importer' },
  'home.public': { en: 'Public', ar: 'عام', zh: '公开', ja: '公開', fr: 'Public' },
  'home.private': { en: 'Private', ar: 'خاص', zh: '私有', ja: 'プライベート', fr: 'Privé' },
  'home.publicDesc': { en: 'Anyone can view & fork', ar: 'يمكن للجميع المشاهدة والنسخ', zh: '任何人都可以查看和分叉', ja: '誰でも閲覧・フォーク可能', fr: 'Tout le monde peut voir et forker' },
  'home.privateDesc': { en: 'Only you can access', ar: 'أنت فقط من يمكنه الوصول', zh: '仅您可以访问', ja: 'あなただけがアクセス可能', fr: 'Vous seul pouvez y accéder' },
  'home.newBadge': { en: 'New', ar: 'جديد', zh: '新', ja: '新着', fr: 'Nouveau' },
  'home.mobileAnnouncement': { en: 'Rocket Mobile for iPhone is here', ar: 'تطبيق Rocket للآيفون متاح الآن', zh: 'Rocket iPhone 版已上线', ja: 'Rocket iPhone版が登場', fr: 'Rocket Mobile pour iPhone est disponible' },
  
  // Typing words
  'typing.dashboard': { en: 'dashboard.', ar: 'لوحة تحكم.', zh: '仪表板.', ja: 'ダッシュボード.', fr: 'tableau de bord.' },
  'typing.landingPage': { en: 'landing page.', ar: 'صفحة هبوط.', zh: '着陆页.', ja: 'ランディングページ.', fr: 'page d\'atterrissage.' },
  'typing.ecommerce': { en: 'e-commerce site.', ar: 'موقع تجارة إلكترونية.', zh: '电商网站.', ja: 'ECサイト.', fr: 'site e-commerce.' },
  'typing.portfolio': { en: 'portfolio.', ar: 'معرض أعمال.', zh: '作品集.', ja: 'ポートフォリオ.', fr: 'portfolio.' },
  'typing.blog': { en: 'blog.', ar: 'مدونة.', zh: '博客.', ja: 'ブログ.', fr: 'blog.' },
  
  // Editor
  'editor.share': { en: 'Share', ar: 'مشاركة', zh: '分享', ja: '共有', fr: 'Partager' },
  'editor.publish': { en: 'Publish', ar: 'نشر', zh: '发布', ja: '公開', fr: 'Publier' },
  'editor.download': { en: 'Download ZIP', ar: 'تحميل ZIP', zh: '下载ZIP', ja: 'ZIPをダウンロード', fr: 'Télécharger ZIP' },
  'editor.openRecent': { en: 'Open recent project', ar: 'فتح مشروع حديث', zh: '打开最近项目', ja: '最近のプロジェクトを開く', fr: 'Ouvrir un projet récent' },
  'editor.versionHistory': { en: 'Version history', ar: 'سجل الإصدارات', zh: '版本历史', ja: 'バージョン履歴', fr: 'Historique des versions' },
  'editor.rename': { en: 'Rename...', ar: 'إعادة تسمية...', zh: '重命名...', ja: '名前を変更...', fr: 'Renommer...' },
  'editor.export': { en: 'Export', ar: 'تصدير', zh: '导出', ja: 'エクスポート', fr: 'Exporter' },
  'editor.visibility': { en: 'Visibility', ar: 'الرؤية', zh: '可见性', ja: '表示設定', fr: 'Visibilité' },
  'editor.connectGitHub': { en: 'Connect to GitHub', ar: 'ربط بـ GitHub', zh: '连接到 GitHub', ja: 'GitHubに接続', fr: 'Connecter à GitHub' },
  'editor.connectedGitHub': { en: 'Connected to GitHub', ar: 'متصل بـ GitHub', zh: '已连接到 GitHub', ja: 'GitHubに接続済み', fr: 'Connecté à GitHub' },
  'editor.deployVercel': { en: 'Deploy to Vercel', ar: 'نشر على Vercel', zh: '部署到 Vercel', ja: 'Vercelにデプロイ', fr: 'Déployer sur Vercel' },
  'editor.deployedVercel': { en: 'Deployed to Vercel', ar: 'تم النشر على Vercel', zh: '已部署到 Vercel', ja: 'Vercelにデプロイ済み', fr: 'Déployé sur Vercel' },
  
  // Projects
  'projects.title': { en: 'Your Projects', ar: 'مشاريعك', zh: '您的项目', ja: 'あなたのプロジェクト', fr: 'Vos projets' },
  'projects.empty': { en: 'No projects yet', ar: 'لا توجد مشاريع بعد', zh: '暂无项目', ja: 'プロジェクトはまだありません', fr: 'Aucun projet' },
  'projects.createFirst': { en: 'Create your first project', ar: 'أنشئ أول مشروع لك', zh: '创建您的第一个项目', ja: '最初のプロジェクトを作成', fr: 'Créez votre premier projet' },
  
  // Footer
  'footer.product': { en: 'Product', ar: 'المنتج', zh: '产品', ja: '製品', fr: 'Produit' },
  'footer.company': { en: 'Company', ar: 'الشركة', zh: '公司', ja: '会社', fr: 'Entreprise' },
  'footer.legal': { en: 'Legal', ar: 'القانونية', zh: '法律', ja: '法的情報', fr: 'Légal' },
  'footer.features': { en: 'Features', ar: 'الميزات', zh: '功能', ja: '機能', fr: 'Fonctionnalités' },
  'footer.integrations': { en: 'Integrations', ar: 'التكاملات', zh: '集成', ja: '統合', fr: 'Intégrations' },
  'footer.changelog': { en: 'Changelog', ar: 'سجل التغييرات', zh: '更新日志', ja: '変更履歴', fr: 'Journal des modifications' },
  'footer.about': { en: 'About', ar: 'حول', zh: '关于', ja: 'について', fr: 'À propos' },
  'footer.careers': { en: 'Careers', ar: 'الوظائف', zh: '招聘', ja: '採用', fr: 'Carrières' },
  'footer.blog': { en: 'Blog', ar: 'المدونة', zh: '博客', ja: 'ブログ', fr: 'Blog' },
  'footer.privacy': { en: 'Privacy Policy', ar: 'سياسة الخصوصية', zh: '隐私政策', ja: 'プライバシーポリシー', fr: 'Politique de confidentialité' },
  'footer.terms': { en: 'Terms of Service', ar: 'شروط الخدمة', zh: '服务条款', ja: '利用規約', fr: 'Conditions d\'utilisation' },
  'footer.copyright': { en: '© 2025 Rocket. All rights reserved.', ar: '© 2025 Rocket. جميع الحقوق محفوظة.', zh: '© 2025 Rocket. 保留所有权利.', ja: '© 2025 Rocket. 全著作権所有.', fr: '© 2025 Rocket. Tous droits réservés.' },
  'footer.tagline': { en: 'Build production-ready web applications with AI-powered code generation.', ar: 'ابنِ تطبيقات ويب جاهزة للإنتاج بتوليد الكود بالذكاء الاصطناعي.', zh: '使用AI代码生成构建生产就绪的Web应用程序。', ja: 'AI搭載のコード生成で本番対応のWebアプリケーションを構築。', fr: 'Créez des applications web prêtes pour la production avec la génération de code par IA.' },
  
  // Docs
  'docs.title': { en: 'Documentation', ar: 'المستندات', zh: '文档', ja: 'ドキュメント', fr: 'Documentation' },
  'docs.search': { en: 'Search docs...', ar: 'البحث في المستندات...', zh: '搜索文档...', ja: 'ドキュメントを検索...', fr: 'Rechercher dans les docs...' },
  'docs.gettingStarted': { en: 'Getting Started', ar: 'البدء', zh: '入门', ja: 'はじめに', fr: 'Démarrage' },
  'docs.aiGeneration': { en: 'AI Code Generation', ar: 'توليد الكود بالذكاء الاصطناعي', zh: 'AI代码生成', ja: 'AIコード生成', fr: 'Génération de code IA' },
  'docs.publicPrivate': { en: 'Public & Private Projects', ar: 'المشاريع العامة والخاصة', zh: '公开和私有项目', ja: '公開・プライベートプロジェクト', fr: 'Projets publics et privés' },
  'docs.editing': { en: 'Editing Your Project', ar: 'تحرير مشروعك', zh: '编辑您的项目', ja: 'プロジェクトの編集', fr: 'Modifier votre projet' },
  'docs.images': { en: 'Working with Images', ar: 'العمل مع الصور', zh: '处理图片', ja: '画像の操作', fr: 'Travailler avec des images' },
  'docs.versions': { en: 'Version History', ar: 'سجل الإصدارات', zh: '版本历史', ja: 'バージョン履歴', fr: 'Historique des versions' },
  'docs.exporting': { en: 'Exporting Projects', ar: 'تصدير المشاريع', zh: '导出项目', ja: 'プロジェクトのエクスポート', fr: 'Exporter des projets' },
  'docs.publishing': { en: 'Publishing & Sharing', ar: 'النشر والمشاركة', zh: '发布和分享', ja: '公開と共有', fr: 'Publication et partage' },
  'docs.github': { en: 'GitHub Integration', ar: 'تكامل GitHub', zh: 'GitHub集成', ja: 'GitHub連携', fr: 'Intégration GitHub' },
  'docs.vercel': { en: 'Vercel Deployment', ar: 'نشر Vercel', zh: 'Vercel部署', ja: 'Vercelデプロイ', fr: 'Déploiement Vercel' },
  'docs.multilingual': { en: 'Multi-language Support', ar: 'دعم اللغات المتعددة', zh: '多语言支持', ja: '多言語対応', fr: 'Support multilingue' },
  
  // Pricing
  'pricing.title': { en: 'Simple, Transparent', ar: 'بسيط وشفاف', zh: '简单透明', ja: 'シンプルで透明', fr: 'Simple et transparent' },
  'pricing.subtitle': { en: 'Pricing', ar: 'التسعير', zh: '定价', ja: '料金', fr: 'Tarification' },
  'pricing.description': { en: 'Choose the plan that\'s right for you and start building amazing projects today.', ar: 'اختر الخطة المناسبة لك وابدأ ببناء مشاريع رائعة اليوم.', zh: '选择适合您的计划，立即开始构建出色的项目。', ja: 'あなたに合ったプランを選んで、今日から素晴らしいプロジェクトを構築しましょう。', fr: 'Choisissez le plan qui vous convient et commencez à créer des projets incroyables dès aujourd\'hui.' },
  'pricing.free': { en: 'Free', ar: 'مجاني', zh: '免费', ja: '無料', fr: 'Gratuit' },
  'pricing.pro': { en: 'Pro', ar: 'احترافي', zh: '专业版', ja: 'プロ', fr: 'Pro' },
  'pricing.enterprise': { en: 'Enterprise', ar: 'المؤسسات', zh: '企业版', ja: 'エンタープライズ', fr: 'Entreprise' },
  'pricing.popular': { en: 'POPULAR', ar: 'الأكثر شيوعاً', zh: '热门', ja: '人気', fr: 'POPULAIRE' },
  'pricing.getStarted': { en: 'Get Started', ar: 'ابدأ الآن', zh: '开始使用', ja: '始める', fr: 'Commencer' },
  'pricing.startTrial': { en: 'Start Free Trial', ar: 'ابدأ الفترة التجريبية', zh: '开始免费试用', ja: '無料トライアルを開始', fr: 'Commencer l\'essai gratuit' },
  'pricing.contactSales': { en: 'Contact Sales', ar: 'تواصل مع المبيعات', zh: '联系销售', ja: '営業に連絡', fr: 'Contacter les ventes' },
  'pricing.faq': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة', zh: '常见问题', ja: 'よくある質問', fr: 'Questions fréquentes' },
  'pricing.faqSubtitle': { en: 'Have questions? We\'re here to help.', ar: 'لديك أسئلة؟ نحن هنا للمساعدة.', zh: '有问题？我们随时为您提供帮助。', ja: 'ご質問がありますか？お手伝いします。', fr: 'Des questions ? Nous sommes là pour vous aider.' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  languageNames: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const languageNames: Record<Language, string> = {
  en: 'English',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  fr: 'Français',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rocket-language');
    return (saved as Language) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('rocket-language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
