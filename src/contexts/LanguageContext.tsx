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
  'common.save': { en: 'Save', ar: 'حفظ', zh: '保存', ja: '保存', fr: 'Sauvegarder' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء', zh: '取消', ja: 'キャンセル', fr: 'Annuler' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...', zh: '加载中...', ja: '読み込み中...', fr: 'Chargement...' },
  'common.error': { en: 'Error', ar: 'خطأ', zh: '错误', ja: 'エラー', fr: 'Erreur' },
  'common.success': { en: 'Success', ar: 'نجاح', zh: '成功', ja: '成功', fr: 'Succès' },
  
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
  'home.dropImage': { en: 'Drop image here', ar: 'أفلت الصورة هنا', zh: '将图片拖放到此处', ja: 'ここに画像をドロップ', fr: 'Déposez l\'image ici' },
  
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
  'editor.chat': { en: 'Chat', ar: 'المحادثة', zh: '聊天', ja: 'チャット', fr: 'Chat' },
  'editor.code': { en: 'Code', ar: 'الكود', zh: '代码', ja: 'コード', fr: 'Code' },
  'editor.preview': { en: 'Preview', ar: 'المعاينة', zh: '预览', ja: 'プレビュー', fr: 'Aperçu' },
  'editor.database': { en: 'Database', ar: 'قاعدة البيانات', zh: '数据库', ja: 'データベース', fr: 'Base de données' },
  'editor.repoName': { en: 'Repository name', ar: 'اسم المستودع', zh: '仓库名称', ja: 'リポジトリ名', fr: 'Nom du dépôt' },
  'editor.syncToGitHub': { en: 'Sync to GitHub', ar: 'مزامنة مع GitHub', zh: '同步到 GitHub', ja: 'GitHubに同期', fr: 'Synchroniser avec GitHub' },
  
  // Projects
  'projects.title': { en: 'Your Projects', ar: 'مشاريعك', zh: '您的项目', ja: 'あなたのプロジェクト', fr: 'Vos projets' },
  'projects.empty': { en: 'No projects yet', ar: 'لا توجد مشاريع بعد', zh: '暂无项目', ja: 'プロジェクトはまだありません', fr: 'Aucun projet' },
  'projects.createFirst': { en: 'Create your first project', ar: 'أنشئ أول مشروع لك', zh: '创建您的第一个项目', ja: '最初のプロジェクトを作成', fr: 'Créez votre premier projet' },
  'projects.newProject': { en: 'New Project', ar: 'مشروع جديد', zh: '新项目', ja: '新規プロジェクト', fr: 'Nouveau projet' },
  'projects.openProject': { en: 'Open Project', ar: 'فتح المشروع', zh: '打开项目', ja: 'プロジェクトを開く', fr: 'Ouvrir le projet' },
  'projects.fork': { en: 'Fork', ar: 'نسخ', zh: '分叉', ja: 'フォーク', fr: 'Forker' },
  'projects.delete': { en: 'Delete', ar: 'حذف', zh: '删除', ja: '削除', fr: 'Supprimer' },
  'projects.viewAll': { en: 'View all {count} projects', ar: 'عرض جميع المشاريع ({count})', zh: '查看所有 {count} 个项目', ja: '全 {count} 件のプロジェクトを表示', fr: 'Voir les {count} projets' },
  'projects.count': { en: '{count} project{s}', ar: '{count} مشروع', zh: '{count} 个项目', ja: '{count} 件のプロジェクト', fr: '{count} projet{s}' },
  
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
  'docs.publicPrivate': { en: 'Public & Private Projects', ar: 'المشاريع العامة والخاصة', zh: '公开和私人项目', ja: '公開・プライベートプロジェクト', fr: 'Projets publics et privés' },
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

  // Auth
  'auth.loginRequired': { en: 'Login Required', ar: 'يجب تسجيل الدخول', zh: '需要登录', ja: 'ログインが必要です', fr: 'Connexion requise' },
  'auth.loginToAccess': { en: 'Please login to access this project', ar: 'يرجى تسجيل الدخول للوصول لهذا المشروع', zh: '请登录以访问此项目', ja: 'このプロジェクトにアクセスするにはログインしてください', fr: 'Veuillez vous connecter pour accéder à ce projet' },
  'auth.goToLogin': { en: 'Go to Login', ar: 'الذهاب لتسجيل الدخول', zh: '前往登录', ja: 'ログインへ', fr: 'Aller à la connexion' },
  'auth.email': { en: 'Email', ar: 'البريد الإلكتروني', zh: '邮箱', ja: 'メール', fr: 'E-mail' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور', zh: '密码', ja: 'パスワード', fr: 'Mot de passe' },
  'auth.signUp': { en: 'Sign Up', ar: 'إنشاء حساب', zh: '注册', ja: 'サインアップ', fr: 'S\'inscrire' },
  'auth.login': { en: 'Login', ar: 'تسجيل الدخول', zh: '登录', ja: 'ログイン', fr: 'Connexion' },

  // Settings
  'settings.profile': { en: 'Profile', ar: 'الملف الشخصي', zh: '个人资料', ja: 'プロフィール', fr: 'Profil' },
  'settings.displayName': { en: 'Display Name', ar: 'الاسم المعروض', zh: '显示名称', ja: '表示名', fr: 'Nom d\'affichage' },
  'settings.avatarUrl': { en: 'Avatar URL', ar: 'رابط الصورة الشخصية', zh: '头像链接', ja: 'アバターURL', fr: 'URL de l\'avatar' },
  'settings.updateProfile': { en: 'Update Profile', ar: 'تحديث الملف الشخصي', zh: '更新资料', ja: 'プロフィールを更新', fr: 'Mettre à jour le profil' },
  'settings.profileUpdated': { en: 'Profile updated successfully', ar: 'تم تحديث الملف الشخصي بنجاح', zh: '资料更新成功', ja: 'プロフィールを更新しました', fr: 'Profil mis à jour avec succès' },

  // Chat
  'chat.thinking': { en: 'Thinking...', ar: 'جاري التفكير...', zh: '思考中...', ja: '考え中...', fr: 'Réflexion...' },
  'chat.generating': { en: 'Generating...', ar: 'جاري التوليد...', zh: '生成中...', ja: '生成中...', fr: 'Génération...' },
  'chat.complete': { en: 'Complete!', ar: 'اكتمل!', zh: '完成!', ja: '完了!', fr: 'Terminé!' },
  'chat.readyMessage': { en: 'The website is now ready and built successfully!', ar: 'الموقع جاهز الآن وتم بناؤه بنجاح!', zh: '网站已准备就绪并成功构建!', ja: 'ウェブサイトが正常に構築されました!', fr: 'Le site web est maintenant prêt et construit avec succès!' },
  'chat.version': { en: 'Version', ar: 'الإصدار', zh: '版本', ja: 'バージョン', fr: 'Version' },
  'chat.active': { en: 'Active', ar: 'نشط', zh: '当前', ja: 'アクティブ', fr: 'Actif' },
  'chat.rollback': { en: 'Rollback', ar: 'استعادة', zh: '回滚', ja: 'ロールバック', fr: 'Restaurer' },
  'chat.actionsTaken': { en: 'actions taken', ar: 'إجراءات تمت', zh: '已执行操作', ja: 'アクション実行', fr: 'actions effectuées' },
  'chat.planMode': { en: 'Plan', ar: 'خطة', zh: '规划', ja: 'プラン', fr: 'Plan' },
  'chat.uploadImage': { en: 'Upload Image', ar: 'رفع صورة', zh: '上传图片', ja: '画像をアップロード', fr: 'Télécharger une image' },
  'chat.visualEdit': { en: 'Visual Edit', ar: 'تحرير مرئي', zh: '可视化编辑', ja: 'ビジュアル編集', fr: 'Édition visuelle' },
  'chat.placeholder': { en: 'How can Rocket help you today?', ar: 'كيف يمكن لـ Rocket مساعدتك اليوم؟', zh: 'Rocket今天能为您做什么?', ja: '今日はRocketがどのようにお手伝いできますか?', fr: 'Comment Rocket peut-il vous aider aujourd\'hui?' },
  'chat.planPlaceholder': { en: 'Plan with Rocket (no code changes)...', ar: 'خطط مع Rocket (بدون تغييرات في الكود)...', zh: '与Rocket规划（不更改代码）...', ja: 'Rocketと計画（コード変更なし）...', fr: 'Planifier avec Rocket (pas de changement de code)...' },
  'chat.analyzing': { en: 'Analyzing your request...', ar: 'جاري تحليل طلبك...', zh: '正在分析您的请求...', ja: 'リクエストを分析中...', fr: 'Analyse de votre demande...' },
  'chat.thinkingComplete': { en: 'Thinking complete!', ar: 'اكتمل التفكير!', zh: '思考完成!', ja: '思考完了!', fr: 'Réflexion terminée!' },
  'chat.makingChanges': { en: 'Making changes', ar: 'جاري إجراء التغييرات', zh: '正在进行更改', ja: '変更を行っています', fr: 'Modifications en cours' },
  'chat.changesApplied': { en: 'Changes applied!', ar: 'تم تطبيق التغييرات!', zh: '更改已应用!', ja: '変更が適用されました!', fr: 'Modifications appliquées!' },
  'chat.generationStopped': { en: 'Generation stopped.', ar: 'تم إيقاف التوليد.', zh: '生成已停止。', ja: '生成が停止しました。', fr: 'Génération arrêtée.' },
  'chat.generationCancelled': { en: 'Code generation was cancelled.', ar: 'تم إلغاء توليد الكود.', zh: '代码生成已取消。', ja: 'コード生成がキャンセルされました。', fr: 'La génération de code a été annulée.' },
  'chat.rollbackConfirm': { en: 'Are you sure?', ar: 'هل أنت متأكد؟', zh: '您确定吗？', ja: 'よろしいですか？', fr: 'Êtes-vous sûr ?' },
  'chat.rollbackDesc': { en: 'This will restore your project to Version {version}.', ar: 'سيقوم هذا باستعادة مشروعك إلى الإصدار {version}.', zh: '这将把您的项目恢复到版本 {version}。', ja: 'これにより、プロジェクトがバージョン {version} に復元されます。', fr: 'Cela restaurera votre projet à la version {version}.' },
  'chat.rollbackWarning': { en: 'Warning: All versions after this point will be permanently deleted. This action cannot be undone.', ar: 'تحذير: سيتم حذف جميع الإصدارات بعد هذه النقطة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.', zh: '警告：此点之后的所有版本将被永久删除。此操作无法撤消。', ja: '警告：この時点以降のすべてのバージョンは完全に削除されます。この操作は元に戻せません。', fr: 'Attention : Toutes les versions après ce point seront définitivement supprimées. Cette action est irréversible.' },
  'chat.edited': { en: 'Edited', ar: 'تم التعديل', zh: '已编辑', ja: '編集済み', fr: 'Modifié' },
  'chat.wrote': { en: 'Wrote', ar: 'تمت الكتابة', zh: '已写', ja: '作成済み', fr: 'Écrit' },
  'chat.built': { en: 'Built the project to ensure everything works', ar: 'تم بناء المشروع للتأكد من أن كل شيء يعمل', zh: '构建项目以确保一切正常', ja: 'すべてが機能することを確認するためにプロジェクトをビルドしました', fr: 'Projet construit pour s\'assurer que tout fonctionne' },
  'chat.whatImBuilding': { en: "What I'm Building:", ar: "ما أقوم ببنائه:", zh: "我正在构建的内容:", ja: "作成中のもの:", fr: "Ce que je construis :" },

  // Models
  'models.selectModel': { en: 'Select AI Model', ar: 'اختر نموذج الذكاء الاصطناعي', zh: '选择AI模型', ja: 'AIモデルを選択', fr: 'Sélectionner le modèle IA' },
  'models.upgradeAccess': { en: 'Upgrade for more models', ar: 'قم بالترقية للمزيد من النماذج', zh: '升级以获取更多模型', ja: 'より多くのモデルにアクセスするにはアップグレード', fr: 'Passez à la version supérieure pour plus de modèles' },

  // Upgrade Modal
  'upgrade.title': { en: 'Upgrade Your Plan', ar: 'قم بترقية خطتك', zh: '升级您的计划', ja: 'プランをアップグレード', fr: 'Améliorez votre plan' },
  'upgrade.subtitle': { en: 'Unlock more features and credits', ar: 'افتح المزيد من الميزات والنقاط', zh: '解锁更多功能和积分', ja: 'より多くの機能とクレジットをアンロック', fr: 'Débloquez plus de fonctionnalités et de crédits' },
  'upgrade.popular': { en: 'Most Popular', ar: 'الأكثر شيوعاً', zh: '最受欢迎', ja: '最も人気', fr: 'Le plus populaire' },
  'upgrade.currentPlan': { en: 'Current Plan', ar: 'الخطة الحالية', zh: '当前计划', ja: '現在のプラン', fr: 'Plan actuel' },
  'upgrade.selectPlan': { en: 'Select Plan', ar: 'اختر الخطة', zh: '选择计划', ja: 'プランを選択', fr: 'Sélectionner le plan' },
  'upgrade.month': { en: 'month', ar: 'شهر', zh: '月', ja: '月', fr: 'mois' },
  'upgrade.footer': { en: 'All plans include our core features. Upgrade anytime.', ar: 'جميع الخطط تشمل ميزاتنا الأساسية. قم بالترقية في أي وقت.', zh: '所有计划都包含我们的核心功能。随时升级。', ja: 'すべてのプランにはコア機能が含まれています。いつでもアップグレードできます。', fr: 'Tous les plans incluent nos fonctionnalités de base. Passez à la version supérieure à tout moment.' },
  'upgrade.banner': { en: 'You\'ve used 50% of your credits! Upgrade for more.', ar: 'لقد استخدمت 50% من نقاطك! قم بالترقية للمزيد.', zh: '您已使用50%的积分！升级以获取更多。', ja: 'クレジットの50%を使用しました！アップグレードして増やしましょう。', fr: 'Vous avez utilisé 50% de vos crédits ! Passez à la version supérieure pour en avoir plus.' },

  // Message Options
  'message.copyLink': { en: 'Copy message link', ar: 'نسخ رابط الرسالة', zh: '复制消息链接', ja: 'メッセージリンクをコピー', fr: 'Copier le lien du message' },
  'message.preview': { en: 'Preview', ar: 'معاينة', zh: '预览', ja: 'プレビュー', fr: 'Aperçu' },
  'message.workedFor': { en: 'Worked for', ar: 'مدة العمل', zh: '工作时间', ja: '作業時間', fr: 'Temps de travail' },
  'message.creditsUsed': { en: 'Credits used', ar: 'النقاط المستخدمة', zh: '使用的积分', ja: '使用したクレジット', fr: 'Crédits utilisés' },

  // Credits
  'credits.remaining': { en: 'Credits remaining', ar: 'النقاط المتبقية', zh: '剩余积分', ja: '残りクレジット', fr: 'Crédits restants' },
  'credits.daily': { en: 'Daily credits', ar: 'النقاط اليومية', zh: '每日积分', ja: '毎日のクレジット', fr: 'Crédits quotidiens' },
  'credits.monthly': { en: 'Monthly credits', ar: 'النقاط الشهرية', zh: '每月积分', ja: '月間クレジット', fr: 'Crédits mensuels' },

  // Common
  'common.copied': { en: 'Copied!', ar: 'تم النسخ!', zh: '已复制!', ja: 'コピーしました!', fr: 'Copié !' },

  // Project Visibility
  'project.notFound': { en: 'Project not found or has been deleted', ar: 'المشروع غير موجود أو تم حذفه', zh: '项目未找到或已删除', ja: 'プロジェクトが見つからないか削除されました', fr: 'Projet introuvable ou supprimé' },
  'project.private': { en: 'This project is private', ar: 'هذا المشروع خاص', zh: '此项目是私有的', ja: 'このプロジェクトはプライベートです', fr: 'Ce projet est privé' },
  'project.viewOnly': { en: 'View Only', ar: 'عرض فقط', zh: '仅查看', ja: '閲覧のみ', fr: 'Affichage seulement' },

  // Integrations
  'integrations.githubConnected': { en: 'Your project is connected to GitHub!', ar: 'مشروعك متصل بـ GitHub!', zh: '您的项目已连接到 GitHub!', ja: 'プロジェクトはGitHubに接続されています!', fr: 'Votre projet est connecté à GitHub !' },
  'integrations.githubConnectDesc': { en: 'Connect your project to GitHub for 2-way sync.', ar: 'اربط مشروعك بـ GitHub للمزامنة ثنائية الاتجاه.', zh: '将您的项目连接到 GitHub 以进行双向同步。', ja: 'プロジェクトをGitHubに接続して双方向同期を行います。', fr: 'Connectez votre projet à GitHub pour une synchronisation bidirectionnelle.' },
  'integrations.githubNotConnected': { en: 'GitHub not connected', ar: 'GitHub غير متصل', zh: 'GitHub 未连接', ja: 'GitHubが接続されていません', fr: 'GitHub non connecté' },
  'integrations.githubConnectSettings': { en: 'Please connect your GitHub account in Settings first.', ar: 'يرجى ربط حساب GitHub الخاص بك في الإعدادات أولاً.', zh: '请先在设置中连接您的 GitHub 帐户。', ja: 'まず設定でGitHubアカウントを接続してください。', fr: 'Veuillez d\'abord connecter votre compte GitHub dans les paramètres.' },
  'integrations.goToSettingsGithub': { en: 'Go to Settings to connect your GitHub account first.', ar: 'اذهب إلى الإعدادات لربط حساب GitHub الخاص بك أولاً.', zh: '前往设置以先连接您的 GitHub 帐户。', ja: '設定に移動して、まずGitHubアカウントを接続してください。', fr: 'Allez dans les paramètres pour connecter votre compte GitHub d\'abord.' },
  'integrations.connected': { en: 'Connected', ar: 'متصل', zh: '已连接', ja: '接続済み', fr: 'Connecté' },
  'integrations.syncAuto': { en: 'Changes will sync automatically', ar: 'ستتم مزامنة التغييرات تلقائيًا', zh: '更改将自动同步', ja: '変更は自動的に同期されます', fr: 'Les modifications seront synchronisées automatiquement' },
  'integrations.syncDesc': { en: 'Any changes made in GitHub will sync back to your project and create a new version.', ar: 'أي تغييرات يتم إجراؤها في GitHub ستتم مزامنتها مرة أخرى مع مشروعك وإنشاء إصدار جديد.', zh: '在 GitHub 中所做的任何更改都将同步回您的项目并创建一个新版本。', ja: 'GitHubで行われた変更はプロジェクトに同期され、新しいバージョンが作成されます。', fr: 'Toute modification apportée dans GitHub sera synchronisée avec votre projet et créera une nouvelle version.' },
  'integrations.connectedAccount': { en: 'Connected account', ar: 'الحساب المتصل', zh: '已连接帐户', ja: '接続済みアカウント', fr: 'Compte connecté' },
  'integrations.connectProject': { en: 'Connect project', ar: 'ربط المشروع', zh: '连接项目', ja: 'プロジェクトを接続', fr: 'Connecter le projet' },
  'integrations.creatingRepo': { en: 'Creating repository...', ar: 'جاري إنشاء المستودع...', zh: '正在创建仓库...', ja: 'リポジトリを作成中...', fr: 'Création du dépôt...' },
  'integrations.vercelDeployed': { en: 'Your site is deployed!', ar: 'تم نشر موقعك!', zh: '您的网站已部署!', ja: 'サイトがデプロイされました!', fr: 'Votre site est déployé !' },
  'integrations.vercelDeployDesc': { en: 'Deploy your project to Vercel.', ar: 'انشر مشروعك على Vercel.', zh: '将您的项目部署到 Vercel。', ja: 'プロジェクトをVercelにデプロイします。', fr: 'Déployez votre projet sur Vercel.' },
  'integrations.vercelNotConnected': { en: 'Vercel not connected', ar: 'Vercel غير متصل', zh: 'Vercel 未连接', ja: 'Vercelが接続されていません', fr: 'Vercel non connecté' },
  'integrations.vercelConnectSettings': { en: 'Please connect your Vercel account in Settings first.', ar: 'يرجى ربط حساب Vercel الخاص بك في الإعدادات أولاً.', zh: '请先在设置中连接您的 Vercel 帐户。', ja: 'まず設定でVercelアカウントを接続してください。', fr: 'Veuillez d\'abord connecter votre compte Vercel dans les paramètres.' },
  'integrations.goToSettingsVercel': { en: 'Go to Settings to connect your Vercel account first.', ar: 'اذهب إلى الإعدادات لربط حساب Vercel الخاص بك أولاً.', zh: '前往设置以先连接您的 Vercel 帐户。', ja: '設定に移動して、まずVercelアカウントを接続してください。', fr: 'Allez dans les paramètres pour connecter votre compte Vercel d\'abord.' },
  'integrations.live': { en: 'Your site is live!', ar: 'موقعك مباشر الآن!', zh: '您的网站已上线!', ja: 'サイトが公開されました!', fr: 'Votre site est en ligne !' },
  'integrations.redeploy': { en: 'Redeploy', ar: 'إعادة النشر', zh: '重新部署', ja: '再デプロイ', fr: 'Redéployer' },
  'integrations.projectName': { en: 'Project name', ar: 'اسم المشروع', zh: '项目名称', ja: 'プロジェクト名', fr: 'Nom du projet' },
  'integrations.deploying': { en: 'Deploying...', ar: 'جاري النشر...', zh: '正在部署...', ja: 'デプロイ中...', fr: 'Déploiement...' },
  'integrations.deploy': { en: 'Deploy', ar: 'نشر', zh: '部署', ja: 'デプロイ', fr: 'Déployer' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key]?.[language] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return translation;
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