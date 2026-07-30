import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'zh' | 'ja' | 'fr';

type Translations = Record<string, Partial<Record<Language, string>>>;

export const translations: Translations = {
  // Common
  'common.signIn': { en: 'Sign in', zh: '登录', ja: 'ログイン', fr: 'Connexion' },
  'common.signOut': { en: 'Sign Out', zh: '退出登录', ja: 'ログアウト', fr: 'Déconnexion' },
  'common.settings': { en: 'Account Settings', zh: '账户设置', ja: 'アカウント設定', fr: 'Paramètres du compte' },
  'common.theme': { en: 'Theme', zh: '主题', ja: 'テーマ', fr: 'Thème' },
  'common.dark': { en: 'Dark', zh: '深色', ja: 'ダーク', fr: 'Sombre' },
  'common.light': { en: 'Light', zh: '浅色', ja: 'ライト', fr: 'Clair' },
  'common.system': { en: 'System', zh: '系统', ja: 'システム', fr: 'Système' },
  'common.language': { en: 'Language', zh: '语言', ja: '言語', fr: 'Langue' },
  'common.freePlan': { en: 'Free Plan', zh: '免费计划', ja: '無料プラン', fr: 'Plan gratuit' },
  'common.save': { en: 'Save', zh: '保存', ja: '保存', fr: 'Sauvegarder' },
  'common.cancel': { en: 'Cancel', zh: '取消', ja: 'キャンセル', fr: 'Annuler' },
  'common.loading': { en: 'Loading...', zh: '加载中...', ja: '読み込み中...', fr: 'Chargement...' },
  'common.error': { en: 'Error', zh: '错误', ja: 'エラー', fr: 'Erreur' },
  'common.success': { en: 'Success', zh: '成功', ja: '成功', fr: 'Succès' },
  'action.read': { en: 'Reading', zh: '阅读', ja: '読み取り', fr: 'Lecture' },
  'action.edited': { en: 'Editing', zh: '编辑', ja: '編集', fr: 'Modification' },
  'action.created': { en: 'Creating', zh: '创建', ja: '作成', fr: 'Création' },
  'action.analyzed_image': { en: 'Analyzing Image', zh: '分析图像', ja: '画像を分析', fr: 'Analyse de l\'image' },
  'action.deleted': { en: 'Deleting', zh: '删除', ja: '削除', fr: 'Suppression' },

  // Navigation
  'nav.pricing': { en: 'Pricing', zh: '定价', ja: '料金', fr: 'Tarifs' },
  'nav.docs': { en: 'Docs', zh: '文档', ja: 'ドキュメント', fr: 'Documentation' },
  'nav.resources': { en: 'Resources', zh: '资源', ja: 'リソース', fr: 'Ressources' },
  'nav.backToHome': { en: 'Back to Home', zh: '返回首页', ja: 'ホームに戻る', fr: 'Retour à l\'accueil' },

  // Home page
  'home.title1': { en: 'Dream It.', zh: '梦想它.', ja: '夢見て.', fr: 'Rêvez-le.' },
  'home.title2': { en: 'Prompt It.', zh: '描述它.', ja: '伝えて.', fr: 'Décrivez-le.' },
  'home.title3': { en: 'Ship It.', zh: '发布它.', ja: '届けて.', fr: 'Expédiez-le.' },
  'home.subtitle': { en: 'Build production-ready', zh: '构建生产就绪', ja: '本番対応の構築', fr: 'Créez des applications prêtes' },
  'home.placeholder': { en: 'What can I build for you today?', zh: '今天我能为您构建什么？', ja: '今日は何を作りましょうか？', fr: 'Que puis-je construire pour vous aujourd\'hui ?' },
  'home.import': { en: 'Import', zh: '导入', ja: 'インポート', fr: 'Importer' },
  'home.public': { en: 'Public', zh: '公开', ja: '公開', fr: 'Public' },
  'home.private': { en: 'Private', zh: '私有', ja: 'プライベート', fr: 'Privé' },
  'home.publicDesc': { en: 'Anyone can view & fork', zh: '任何人都可以查看和分叉', ja: '誰でも閲覧・フォーク可能', fr: 'Tout le monde peut voir et forker' },
  'home.privateDesc': { en: 'Only you can access', zh: '仅您可以访问', ja: 'あなただけがアクセス可能', fr: 'Vous seul pouvez y accéder' },
  'home.newBadge': { en: 'New', zh: '新', ja: '新着', fr: 'Nouveau' },
  'home.mobileAnnouncement': { en: 'Vivora X: HTML, CSS & JavaScript with AI', zh: 'Vivora X：AI 生成 HTML、CSS 和 JavaScript', ja: 'Vivora X：AIでHTML・CSS・JavaScriptを生成', fr: 'Vivora X : HTML, CSS et JavaScript avec l’IA' },
  'home.dropImage': { en: 'Drop image here', zh: '将图片拖放到此处', ja: 'ここに画像をドロップ', fr: 'Déposez l\'image ici' },

  // Typing words
  'typing.dashboard': { en: 'dashboard.', zh: '仪表板.', ja: 'ダッシュボード.', fr: 'tableau de bord.' },
  'typing.landingPage': { en: 'landing page.', zh: '着陆页.', ja: 'ランディングページ.', fr: 'page d\'atterrissage.' },
  'typing.ecommerce': { en: 'e-commerce site.', zh: '电商网站.', ja: 'ECサイト.', fr: 'site e-commerce.' },
  'typing.portfolio': { en: 'portfolio.', zh: '作品集.', ja: 'ポートフォリオ.', fr: 'portfolio.' },
  'typing.blog': { en: 'blog.', zh: '博客.', ja: 'ブログ.', fr: 'blog.' },

  // Editor
  'editor.share': { en: 'Share', zh: '分享', ja: '共有', fr: 'Partager' },
  'editor.publish': { en: 'Publish', zh: '发布', ja: '公開', fr: 'Publier' },
  'editor.download': { en: 'Download ZIP', zh: '下载ZIP', ja: 'ZIPをダウンロード', fr: 'Télécharger ZIP' },
  'editor.openRecent': { en: 'Open recent project', zh: '打开最近项目', ja: '最近のプロジェクトを開く', fr: 'Ouvrir un projet récent' },
  'editor.versionHistory': { en: 'Version history', zh: '版本历史', ja: 'バージョン履歴', fr: 'Historique des versions' },
  'editor.rename': { en: 'Rename...', zh: '重命名...', ja: '名前を変更...', fr: 'Renommer...' },
  'editor.export': { en: 'Export', zh: '导出', ja: 'エクスポート', fr: 'Exporter' },
  'editor.visibility': { en: 'Visibility', zh: '可见性', ja: '表示設定', fr: 'Visibilité' },
  'editor.chat': { en: 'Chat', zh: '聊天', ja: 'チャット', fr: 'Chat' },
  'editor.code': { en: 'Code', zh: '代码', ja: 'コード', fr: 'Code' },
  'editor.preview': { en: 'Preview', zh: '预览', ja: 'プレビュー', fr: 'Aperçu' },

  // Footer
  'footer.product': { en: 'Product', zh: '产品', ja: '製品', fr: 'Produit' },
  'footer.company': { en: 'Company', zh: '公司', ja: '会社', fr: 'Entreprise' },
  'footer.legal': { en: 'Legal', zh: '法律', ja: '法的情報', fr: 'Légal' },
  'footer.features': { en: 'Features', zh: '功能', ja: '機能', fr: 'Fonctionnalités' },
  'footer.integrations': { en: 'Integrations', zh: '集成', ja: '統合', fr: 'Intégrations' },
  'footer.changelog': { en: 'Changelog', zh: '更新日志', ja: '変更履歴', fr: 'Journal des modifications' },
  'footer.about': { en: 'About', zh: '关于', ja: 'について', fr: 'À propos' },
  'footer.careers': { en: 'Careers', zh: '招聘', ja: '採用', fr: 'Carrières' },
  'footer.blog': { en: 'Blog', zh: '博客', ja: 'ブログ', fr: 'Blog' },
  'footer.privacy': { en: 'Privacy Policy', zh: '隐私政策', ja: 'プライバシーポリシー', fr: 'Politique de confidentialité' },
  'footer.terms': { en: 'Terms of Service', zh: '服务条款', ja: '利用規約', fr: 'Conditions d\'utilisation' },
  'footer.copyright': { en: '© 2026 WebMax. All Rights Reserved.', zh: '© 2026 WebMax. 保留所有权利.', ja: '© 2026 WebMax. 全著作権所有.', fr: '© 2026 WebMax. Tous droits réservés.' },
  'footer.tagline': { en: 'Build production-ready web applications with AI-powered code generation.', zh: '使用AI代码生成构建生产就绪的Web应用程序。', ja: 'AI搭載のコード生成で本番対応のWebアプリケーションを構築。', fr: 'Créez des applications web prêtes pour la production avec la génération de code par IA.' },

  // Docs
  'docs.title': { en: 'Documentation', zh: '文档', ja: 'ドキュメント', fr: 'Documentation' },
  'docs.search': { en: 'Search docs...', zh: '搜索文档...', ja: 'ドキュメントを検索...', fr: 'Rechercher dans les docs...' },
  'docs.gettingStarted': { en: 'Getting Started', zh: '入门', ja: 'はじめに', fr: 'Démarrage' },
  'docs.aiGeneration': { en: 'AI Code Generation', zh: 'AI代码生成', ja: 'AIコード生成', fr: 'Génération de code IA' },
  'docs.publicPrivate': { en: 'Public & Private Projects', zh: '公开和私人项目', ja: '公開・プライベートプロジェクト', fr: 'Projets publics et privés' },
  'docs.editing': { en: 'Editing Your Project', zh: '编辑您的项目', ja: 'プロジェクトの編集', fr: 'Modifier votre projet' },
  'docs.images': { en: 'Working with Images', zh: '处理图片', ja: '画像の操作', fr: 'Travailler avec des images' },
  'docs.versions': { en: 'Version History', zh: '版本历史', ja: 'バージョン履歴', fr: 'Historique des versions' },
  'docs.exporting': { en: 'Exporting Projects', zh: '导出项目', ja: 'プロジェクトのエクスポート', fr: 'Exporter des projets' },
  'docs.publishing': { en: 'Publishing & Sharing', zh: '发布和分享', ja: '公開と共有', fr: 'Publication et partage' },
  'docs.multilingual': { en: 'Multi-language Support', zh: '多语言支持', ja: '多言語対応', fr: 'Support multilingue' },

  // Pricing
  'pricing.title': { en: 'Simple, Transparent', zh: '简单透明', ja: 'シンプルで透明', fr: 'Simple et transparent' },
  'pricing.subtitle': { en: 'Pricing', zh: '定价', ja: '料金', fr: 'Tarification' },
  'pricing.description': { en: 'Choose the plan that\'s right for you and start building amazing projects today.', zh: '选择适合您的计划，立即开始构建出色的项目。', ja: 'あなたに合ったプランを選んで、今日から素晴らしいプロジェクトを構築しましょう。', fr: 'Choisissez le plan qui vous convient et commencez à créer des projets incroyables dès aujourd\'hui.' },
  'pricing.free': { en: 'Free', zh: '免费', ja: '無料', fr: 'Gratuit' },
  'pricing.pro': { en: 'Pro', zh: '专业版', ja: 'プロ', fr: 'Pro' },
  'pricing.enterprise': { en: 'Enterprise', zh: '企业版', ja: 'エンタープライズ', fr: 'Entreprise' },
  'pricing.popular': { en: 'POPULAR', zh: '热门', ja: '人気', fr: 'POPULAIRE' },
  'pricing.getStarted': { en: 'Get Started', zh: '开始使用', ja: '始める', fr: 'Commencer' },
  'pricing.startTrial': { en: 'Start Free Trial', zh: '开始免费试用', ja: '無料トライアルを開始', fr: 'Commencer l\'essai gratuit' },
  'pricing.contactSales': { en: 'Contact Sales', zh: '联系销售', ja: '営業に連絡', fr: 'Contacter les ventes' },
  'pricing.faq': { en: 'Frequently Asked Questions', zh: '常见问题', ja: 'よくある質問', fr: 'Questions fréquentes' },
  'pricing.faqSubtitle': { en: 'Have questions? We\'re here to help.', zh: '有问题？我们随时为您提供帮助。', ja: 'ご質問がありますか？お手伝いします。', fr: 'Des questions ? Nous sommes là pour vous aider.' },

  // Auth
  'auth.loginRequired': { en: 'Login Required', zh: '需要登录', ja: 'ログインが必要です', fr: 'Connexion requise' },
  'auth.loginToAccess': { en: 'Please login to access this project', zh: '请登录以访问此项目', ja: 'このプロジェクトにアクセスするにはログインしてください', fr: 'Veuillez vous connecter pour accéder à ce projet' },
  'auth.goToLogin': { en: 'Go to Login', zh: '前往登录', ja: 'ログインへ', fr: 'Aller à la connexion' },
  'auth.email': { en: 'Email', zh: '邮箱', ja: 'メール', fr: 'E-mail' },
  'auth.password': { en: 'Password', zh: '密码', ja: 'パスワード', fr: 'Mot de passe' },
  'auth.signUp': { en: 'Sign Up', zh: '注册', ja: 'サインアップ', fr: 'S\'inscrire' },
  'auth.login': { en: 'Login', zh: '登录', ja: 'ログイン', fr: 'Connexion' },

  // Settings
  'settings.profile': { en: 'Profile', zh: '个人资料', ja: 'プロフィール', fr: 'Profil' },
  'settings.displayName': { en: 'Display Name', zh: '显示名称', ja: '表示名', fr: 'Nom d\'affichage' },
  'settings.avatarUrl': { en: 'Avatar URL', zh: '头像链接', ja: 'アバターURL', fr: 'URL de l\'avatar' },
  'settings.updateProfile': { en: 'Update Profile', zh: '更新资料', ja: 'プロフィールを更新', fr: 'Mettre à jour le profil' },
  'settings.profileUpdated': { en: 'Profile updated successfully', zh: '资料更新成功', ja: 'プロフィールを更新しました', fr: 'Profil mis à jour avec succès' },

  // Chat
  'chat.thinking': { en: 'Thinking...', zh: '思考中...', ja: '考え中...', fr: 'Réflexion...' },
  'chat.generating': { en: 'Generating...', zh: '生成中...', ja: '生成中...', fr: 'Génération...' },
  'chat.complete': { en: 'Complete!', zh: '完成!', ja: '完了!', fr: 'Terminé!' },
  'chat.readyMessage': { en: 'The website is now ready and built successfully!', zh: '网站已准备就绪并成功构建!', ja: 'ウェブサイトが正常に構築されました!', fr: 'Le site web est maintenant prêt et construit avec succès!' },
  'chat.version': { en: 'Version', zh: '版本', ja: 'バージョン', fr: 'Version' },
  'chat.active': { en: 'Active', zh: '当前', ja: 'アクティブ', fr: 'Actif' },
  'chat.rollback': { en: 'Rollback', zh: '回滚', ja: 'ロールバック', fr: 'Restaurer' },
  'chat.actionsTaken': { en: 'actions taken', zh: '已执行操作', ja: 'アクション実行', fr: 'actions effectuées' },
  'chat.planMode': { en: 'Plan', zh: '规划', ja: 'プラン', fr: 'Plan' },
  'chat.uploadImage': { en: 'Upload Image', zh: '上传图片', ja: '画像をアップロード', fr: 'Télécharger une image' },
  'chat.visualEdit': { en: 'Visual Edit', zh: '可视化编辑', ja: 'ビジュアル編集', fr: 'Édition visuelle' },
  'chat.placeholder': { en: 'What should Vivora X build or change?', zh: 'Vivora X 今天要构建或修改什么？', ja: 'Vivora Xで何を作成・変更しますか？', fr: 'Que doit créer ou modifier Vivora X ?' },
  'chat.planPlaceholder': { en: 'Plan with Vivora X (no file changes)...', zh: '与 Vivora X 规划（不更改文件）...', ja: 'Vivora Xと計画（ファイル変更なし）...', fr: 'Planifier avec Vivora X (sans modifier les fichiers)...' },
  'chat.analyzing': { en: 'Analyzing your request...', zh: '正在分析您的请求...', ja: 'リクエストを分析中...', fr: 'Analyse de votre demande...' },
  'chat.thinkingComplete': { en: 'Thinking complete!', zh: '思考完成!', ja: '思考完了!', fr: 'Réflexion terminée!' },
  'chat.makingChanges': { en: 'Making changes', zh: '正在进行更改', ja: '変更を行っています', fr: 'Modifications en cours' },
  'chat.changesApplied': { en: 'Changes applied!', zh: '更改已应用!', ja: '変更が適用されました!', fr: 'Modifications appliquées!' },
  'chat.generationStopped': { en: 'Generation stopped.', zh: '生成已停止。', ja: '生成が停止しました。', fr: 'Génération arrêtée.' },
  'chat.generationCancelled': { en: 'Code generation was cancelled.', zh: '代码生成已取消。', ja: 'コード生成がキャンセルされました。', fr: 'La génération de code a été annulée.' },
  'chat.rollbackConfirm': { en: 'Are you sure?', zh: '您确定吗？', ja: 'よろしいですか？', fr: 'Êtes-vous sûr ?' },
  'chat.rollbackDesc': { en: 'This will restore your project to Version {version}.', zh: '这将把您的项目恢复到版本 {version}。', ja: 'これにより、プロジェクトがバージョン {version} に復元されます。', fr: 'Cela restaurera votre projet à la version {version}.' },
  'chat.rollbackWarning': { en: 'Warning: All versions after this point will be permanently deleted. This action cannot be undone.', zh: '警告：此点之后的所有版本将被永久删除。此操作无法撤消。', ja: '警告：この時点以降のすべてのバージョンは完全に削除されます。この操作は元に戻せません。', fr: 'Attention : Toutes les versions après ce point seront définitivement supprimées. Cette action est irréversible.' },
  'chat.edited': { en: 'Edited', zh: '已编辑', ja: '編集済み', fr: 'Modifié' },
  'chat.wrote': { en: 'Wrote', zh: '已写', ja: '作成済み', fr: 'Écrit' },
  'chat.built': { en: 'Built the project to ensure everything works', zh: '构建项目以确保一切正常', ja: 'すべてが機能することを確認するためにプロジェクトをビルドしました', fr: 'Projet construit pour s\'assurer que tout fonctionne' },
  'chat.whatImBuilding': { en: "What I'm Building:", zh: "我正在构建的内容:", ja: "作成中のもの:", fr: "Ce que je construis :" },
  'chat.checkingAttachments': { en: 'Checking for attached images...', zh: '正在检查附件图片...', ja: '添付画像を確認中...', fr: 'Vérification des images jointes...' },
  'chat.analyzingImages': { en: 'Analyzing attached images...', zh: '正在分析附件图片...', ja: '添付画像を分析中...', fr: 'Analyse des images jointes...' },
  'chat.generatingLogo': { en: 'Generating logo image...', zh: '正在生成标志图片...', ja: 'ロゴ画像を生成中...', fr: 'Génération de l\'image du logo...' },
  'chat.copyingLogo': { en: 'Copying generated image to public folder...', zh: '正在将生成的图片复制到公共文件夹...', ja: '生成した画像をpublicフォルダにコピー中...', fr: 'Copie de l\'image générée dans le dossier public...' },
  'chat.details': { en: 'Details', zh: '详情', ja: '詳細', fr: 'Détails' },
  'chat.preview': { en: 'Preview', zh: '预览', ja: 'プレビュー', fr: 'Aperçu' },
  'chat.uploadFile': { en: 'Upload File', zh: '上传文件', ja: 'ファイルをアップロード', fr: 'Télécharger un fichier' },
  'chat.cancel': { en: 'Cancel', zh: '取消', ja: 'キャンセル', fr: 'Annuler' },
  'chat.takeScreenshot': { en: 'Take Screenshot', zh: '截屏', ja: 'スクリーンショットを撮る', fr: 'Prendre une capture d\'écran' },
  'chat.addReference': { en: 'Add Reference', zh: '添加引用', ja: '参照を追加', fr: 'Ajouter une référence' },
  'chat.referenceFile': { en: 'Reference a file', zh: '引用文件', ja: 'ファイルを参照', fr: 'Référencer un fichier' },

  // Models
  'models.selectModel': { en: 'Select AI Model', zh: '选择AI模型', ja: 'AIモデルを選択', fr: 'Sélectionner le modèle IA' },
  'models.upgradeAccess': { en: 'Upgrade for more models', zh: '升级以获取更多模型', ja: 'より多くのモデルにアクセスするにはアップグレード', fr: 'Passez à la version supérieure pour plus de modèles' },

  // Upgrade Modal
  'upgrade.title': { en: 'Upgrade Your Plan', zh: '升级您的计划', ja: 'プランをアップグレード', fr: 'Améliorez votre plan' },
  'upgrade.subtitle': { en: 'Unlock more features and credits', zh: '解锁更多功能和积分', ja: 'より多くの機能とクレジットをアンロック', fr: 'Débloquez plus de fonctionnalités et de crédits' },
  'upgrade.popular': { en: 'Most Popular', zh: '最受欢迎', ja: '最も人気', fr: 'Le plus populaire' },
  'upgrade.currentPlan': { en: 'Current Plan', zh: '当前计划', ja: '現在のプラン', fr: 'Plan actuel' },
  'upgrade.selectPlan': { en: 'Select Plan', zh: '选择计划', ja: 'プランを選択', fr: 'Sélectionner le plan' },
  'upgrade.month': { en: 'month', zh: '月', ja: '月', fr: 'mois' },
  'upgrade.footer': { en: 'All plans include our core features. Upgrade anytime.', zh: '所有计划都包含我们的核心功能。随时升级。', ja: 'すべてのプランにはコア機能が含まれています。いつでもアップグレードできます。', fr: 'Tous les plans incluent nos fonctionnalités de base. Passez à la version supérieure à tout moment.' },
  'upgrade.banner': { en: 'You\'ve used 50% of your credits! Upgrade for more.', zh: '您已使用50%的积分！升级以获取更多。', ja: 'クレジットの50%を使用しました！アップグレードして増やしましょう。', fr: 'Vous avez utilisé 50% de vos crédits ! Passez à la version supérieure pour en avoir plus.' },

  // Message Options
  'message.copyLink': { en: 'Copy message link', zh: '复制消息链接', ja: 'メッセージリンクをコピー', fr: 'Copier le lien du message' },
  'message.preview': { en: 'Preview', zh: '预览', ja: 'プレビュー', fr: 'Aperçu' },
  'message.workedFor': { en: 'Worked for', zh: '工作时间', ja: '作業時間', fr: 'Temps de travail' },
  'message.creditsUsed': { en: 'Credits used', zh: '使用的积分', ja: '使用したクレジット', fr: 'Crédits utilisés' },

  // Credits
  'credits.remaining': { en: 'Credits remaining', zh: '剩余积分', ja: '残りクレジット', fr: 'Crédits restants' },
  'credits.daily': { en: 'Daily credits', zh: '每日积分', ja: '毎日のクレジット', fr: 'Crédits quotidiens' },
  'credits.monthly': { en: 'Monthly credits', zh: '每月积分', ja: '月間クレジット', fr: 'Crédits mensuels' },
  'credits.resetsDaily': { en: 'Resets daily', zh: '每日重置', ja: '毎日リセット', fr: 'Réinitialisation quotidienne' },
  'credits.runningLow': { en: 'Running low on credits? Upgrade now!', zh: '积分即将用完？立即升级！', ja: 'クレジットが不足しています？今すぐアップグレード！', fr: 'Crédits presque épuisés ? Passez à la version supérieure !' },
  'credits.noCredits': { en: 'No credits remaining. Please upgrade your plan.', zh: '没有剩余积分。请升级您的计划。', ja: 'クレジットが残っていません。プランをアップグレードしてください。', fr: 'Aucun crédit restant. Veuillez améliorer votre plan.' },

  // Common
  'common.copied': { en: 'Copied!', zh: '已复制!', ja: 'コピーしました!', fr: 'Copié !' },
  'aiforall.title': { en: 'AI for All', zh: '全民 AI', ja: 'すべての人のためのAI', fr: 'L\'IA pour tous' },
  'aiforall.heroTitle': { en: 'AI for All', zh: '全民 AI', ja: 'すべての人のためのAI', fr: 'L\'IA pour tous' },
  'aiforall.heroSubtitle': { en: 'A free, unlimited AI gateway for developers. No API key. No billing. No rate limits. Just build.', zh: '面向开发者的免费、无限 AI 网关。无需 API 密钥。无需计费。无速率限制。尽情构建。', ja: '開発者のための無料・無制限のAIゲートウェイ。APIキー不要。課金なし。レート制限なし。ただ構築するだけ。', fr: 'Une passerelle IA gratuite et illimitée pour les développeurs. Pas de clé API. Pas de facturation. Pas de limite de débit. Construisez simplement.' },
  'aiforall.freeBadge': { en: 'Free for Developers · No API Key Required', zh: '开发者免费 · 无需 API 密钥', ja: '開発者向け無料 · APIキー不要', fr: 'Gratuit pour les développeurs · Aucune clé API requise' },
  'aiforall.liveStatus': { en: 'Live & Operational', zh: '在线且运行正常', ja: 'ライブ・稼働中', fr: 'En direct et opérationnel' },
  'aiforall.backToVivora': { en: 'Back to Vivora X', zh: '返回 Vivora X', ja: 'Vivora X に戻る', fr: 'Retour à Vivora X' },
  'aiforall.chatHeader': { en: 'AI Chat Bot', zh: 'AI 聊天机器人', ja: 'AIチャットボット', fr: 'Bot de chat IA' },
  'aiforall.inputPlaceholder': { en: 'Type your question...', zh: '输入您的问题...', ja: '質問を入力してください...', fr: 'Tapez votre question...' },
  'aiforall.send': { en: 'Send', zh: '发送', ja: '送信', fr: 'Envoyer' },
  'aiforall.thinking': { en: 'AI is thinking...', zh: 'AI 正在思考...', ja: 'AIが考えています...', fr: 'L\'IA réfléchit...' },
  'aiforall.error': { en: '❌ Error connecting to AI', zh: '❌ 连接 AI 出错', ja: '❌ AIへの接続エラー', fr: '❌ Erreur de connexion à l\'IA' },

  // Project Visibility
  'project.notFound': { en: 'Project not found or has been deleted', zh: '项目未找到或已删除', ja: 'プロジェクトが見つからないか削除されました', fr: 'Projet introuvable ou supprimé' },
  'project.private': { en: 'This project is private', zh: '此项目是私有的', ja: 'このプロジェクトはプライベートです', fr: 'Ce projet est privé' },
  'project.viewOnly': { en: 'View Only', zh: '仅查看', ja: '閲覧のみ', fr: 'Affichage seulement' },

  // Integrations
  'integrations.connected': { en: 'Connected', zh: '已连接', ja: '接続済み', fr: 'Connecté' },
  'integrations.syncAuto': { en: 'Changes will sync automatically', zh: '更改将自动同步', ja: '変更は自動的に同期されます', fr: 'Les modifications seront synchronisées automatiquement' },
  'integrations.connectedAccount': { en: 'Connected account', zh: '已连接帐户', ja: '接続済みアカウント', fr: 'Compte connecté' },
  'integrations.connectProject': { en: 'Connect project', zh: '连接项目', ja: 'プロジェクトを接続', fr: 'Connecter le projet' },
  'integrations.creatingRepo': { en: 'Creating repository...', zh: '正在创建仓库...', ja: 'リポジトリを作成中...', fr: 'Création du dépôt...' },
  'integrations.live': { en: 'Your site is live!', zh: '您的网站已上线!', ja: 'サイトが公開されました!', fr: 'Votre site est en ligne !' },
  'integrations.redeploy': { en: 'Redeploy', zh: '重新部署', ja: '再デプロイ', fr: 'Redéployer' },
  'integrations.projectName': { en: 'Project name', zh: '项目名称', ja: 'プロジェクト名', fr: 'Nom du projet' },
  'integrations.deploying': { en: 'Deploying...', zh: '正在部署...', ja: 'デプロイ中...', fr: 'Déploiement...' },
  'integrations.deploy': { en: 'Deploy', zh: '部署', ja: 'デプロイ', fr: 'Déployer' },
  'integrations.notConnected': { en: 'Not Connected', zh: '未连接', ja: '未接続', fr: 'Non connecté' },
  'integrations.disconnect': { en: 'Disconnect', zh: '断开连接', ja: '切断', fr: 'Déconnecter' },

  // Tab close warning during generation
  'editor.closeWarning': { en: 'Code generation is still in progress. If you leave now, the current generation will be lost. Are you sure you want to leave?', zh: '代码生成仍在进行中。如果现在离开，当前生成将会丢失。确定要离开吗？', ja: 'コード生成がまだ進行中です。今離れると、現在の生成は失われます。本当に離れますか？', fr: 'La génération de code est toujours en cours. Si vous partez maintenant, la génération en cours sera perdue. Êtes-vous sûr de vouloir partir ?' },
};

const arabicTranslations: Record<string, string> = {
  'common.signIn': 'تسجيل الدخول',
  'common.signOut': 'تسجيل الخروج',
  'common.settings': 'إعدادات الحساب',
  'common.language': 'اللغة',
  'common.freePlan': 'الخطة المجانية',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.loading': 'جارٍ التحميل…',
  'common.error': 'حدث خطأ',
  'common.success': 'تم بنجاح',
  'action.read': 'قراءة',
  'action.edited': 'تعديل',
  'action.created': 'إنشاء',
  'action.analyzed_image': 'تحليل الصورة',
  'action.deleted': 'حذف',
  'nav.backToHome': 'العودة للرئيسية',
  'home.title1': 'تخيّلها.',
  'home.title2': 'اوصفها.',
  'home.title3': 'وانشرها.',
  'home.subtitle': 'ابنِ مشروعًا جاهزًا للإطلاق',
  'home.placeholder': 'ماذا تريد أن أبني لك اليوم؟',
  'home.newBadge': 'جديد',
  'home.mobileAnnouncement': 'Vivora X: أنشئ HTML وCSS وJavaScript بالذكاء الاصطناعي',
  'home.dropImage': 'أفلت الصورة هنا',
  'home.projectType': 'نوع المشروع',
  'home.website': 'موقع إلكتروني',
  'home.store': 'متجر إلكتروني',
  'home.storePlaceholder': 'اوصف متجرك: الاسم، المنتجات، الهوية البصرية والأقسام التي تريدها…',
  'home.myStores': 'متاجري',
  'home.admin': 'الإدارة',
  'home.beta': 'تجريبي',
  'home.add': 'إضافة',
  'home.attachImage': 'إرفاق صورة',
  'home.oneImage': 'صورة واحدة · 3MB بحد أقصى',
  'home.proOnly': 'للخطط المدفوعة فقط',
  'home.themes': 'أنظمة التصميم',
  'home.choosePalette': 'اختر لوحة الألوان',
  'home.defaultThemes': 'أنظمة التصميم',
  'home.stopListening': 'إيقاف الاستماع',
  'home.voiceInput': 'إدخال صوتي',
  'home.meet': 'تعرّف على Vivora X',
  'typing.dashboard': 'لوحة تحكم.',
  'typing.landingPage': 'صفحة هبوط.',
  'typing.ecommerce': 'متجر إلكتروني.',
  'typing.portfolio': 'معرض أعمال.',
  'typing.blog': 'مدونة.',
  'editor.share': 'مشاركة',
  'editor.publish': 'نشر',
  'editor.download': 'تنزيل ZIP',
  'editor.openRecent': 'فتح مشروع حديث',
  'editor.versionHistory': 'سجل الإصدارات',
  'editor.rename': 'إعادة التسمية…',
  'editor.export': 'تصدير',
  'editor.visibility': 'الظهور',
  'editor.chat': 'المحادثة',
  'editor.code': 'الكود',
  'editor.preview': 'المعاينة',
  'editor.analytics': 'التحليلات',
  'editor.projectSettings': 'إعدادات المشروع',
  'editor.untitledProject': 'مشروع بدون اسم',
  'editor.credits': 'الرصيد',
  'editor.showChat': 'إظهار المحادثة',
  'editor.hideChat': 'إخفاء المحادثة',
  'editor.details': 'التفاصيل',
  'editor.noDetails': 'لا توجد تفاصيل متاحة',
  'editor.previewEmpty': 'ستظهر معاينة مشروعك هنا',
  'editor.closeWarning': 'ما زال إنشاء الكود جاريًا. إذا غادرت الآن ستفقد عملية الإنشاء الحالية. هل تريد المغادرة؟',
  'chat.pointsConsumption': 'استهلاك النقاط',
  'chat.siteCredits': 'رصيد المواقع',
  'chat.aiTokens': 'رموز الذكاء الاصطناعي',
  'chat.thinking': 'جارٍ التفكير…',
  'chat.generating': 'جارٍ الإنشاء…',
  'chat.complete': 'اكتمل!',
  'chat.readyMessage': 'الموقع جاهز وتم بناؤه بنجاح!',
  'chat.version': 'الإصدار',
  'chat.active': 'الحالي',
  'chat.rollback': 'استعادة',
  'chat.actionsTaken': 'إجراءات منفذة',
  'chat.planMode': 'خطة',
  'chat.uploadImage': 'رفع صورة',
  'chat.visualEdit': 'تعديل بصري',
  'chat.placeholder': 'ماذا تريد من Vivora X أن يبني أو يعدّل؟',
  'chat.planPlaceholder': 'خطّط مع Vivora X بدون تعديل الملفات…',
  'chat.analyzing': 'جارٍ تحليل طلبك…',
  'chat.thinkingComplete': 'اكتمل التفكير!',
  'chat.makingChanges': 'جارٍ تنفيذ التعديلات',
  'chat.changesApplied': 'تم تطبيق التعديلات!',
  'chat.generationStopped': 'تم إيقاف الإنشاء.',
  'chat.generationCancelled': 'تم إلغاء إنشاء الكود.',
  'chat.rollbackConfirm': 'هل أنت متأكد؟',
  'chat.rollbackDesc': 'سيتم استعادة مشروعك إلى الإصدار {version}.',
  'chat.rollbackWarning': 'تنبيه: سيتم حذف كل الإصدارات التالية نهائيًا ولا يمكن التراجع عن هذا الإجراء.',
  'chat.edited': 'تم تعديل',
  'chat.wrote': 'تم إنشاء',
  'chat.built': 'تم بناء المشروع للتأكد من أن كل شيء يعمل',
  'chat.whatImBuilding': 'ما سأقوم ببنائه:',
  'chat.checkingAttachments': 'جارٍ التحقق من الصور المرفقة…',
  'chat.analyzingImages': 'جارٍ تحليل الصور المرفقة…',
  'chat.generatingLogo': 'جارٍ إنشاء صورة الشعار…',
  'chat.copyingLogo': 'جارٍ إضافة الصورة إلى ملفات المشروع…',
  'chat.details': 'التفاصيل',
  'chat.preview': 'المعاينة',
  'chat.uploadFile': 'رفع ملف',
  'chat.cancel': 'إلغاء',
  'chat.takeScreenshot': 'التقاط صورة',
  'chat.addReference': 'إضافة مرجع',
  'chat.referenceFile': 'الإشارة إلى ملف',
  'chat.noFiles': 'لا توجد ملفات',
  'details.close': 'إغلاق',
  'details.changes': 'التغييرات',
  'details.changeCount': '{count} تغييرات',
  'details.totalCount': '{count} إجمالي',
  'code.explorer': 'الملفات',
  'code.noFiles': 'لم يتم إنشاء ملفات بعد',
  'code.undo': 'تراجع',
  'code.redo': 'إعادة',
  'code.save': 'حفظ',
  'code.proRequired': 'تعديل الكود متاح في خطط Pro وBusiness. يمكنك الترقية من قائمة الحساب.',
  'code.generating': 'جارٍ الإنشاء…',
  'code.new': 'جديد',
  'code.generatingFiles': 'جارٍ إنشاء الملفات…',
  'code.selectFile': 'اختر ملفًا لعرضه',
  'preview.size': 'حجم المعاينة',
  'preview.desktop': 'معاينة سطح المكتب',
  'preview.mobile': 'معاينة الهاتف',
  'preview.refresh': 'تحديث المعاينة',
  'preview.openTab': 'فتح في تبويب جديد',
  'preview.browser': 'معاينة المتصفح',
  'preview.ready': 'معاينة المتصفح جاهزة',
  'preview.waiting': 'في انتظار index.html',
  'preview.writing': 'جارٍ كتابة ملفات الموقع…',
  'preview.startsWhenReady': 'تبدأ المعاينة عندما يصبح index.html جاهزًا.',
  'preview.browserDescription': 'يعرض Vivora X ملفات HTML وCSS وJavaScript مباشرة داخل متصفحك.',
  'versions.empty': 'لا توجد إصدارات بعد',
  'visual.title': 'التعديل البصري',
  'visual.contentPlaceholder': 'اكتب المحتوى…',
  'visual.default': 'الافتراضي',
  'visual.text': 'النص',
  'visual.background': 'الخلفية',
  'visual.content': 'المحتوى',
  'visual.font': 'الخط',
  'visual.colors': 'الألوان',
  'analytics.loading': 'جارٍ تحميل التحليلات',
  'analytics.live': 'تحليلات المعاينة المباشرة',
  'analytics.activity': 'نشاط المشروع',
  'analytics.description': 'يتم تسجيل النشاط تلقائيًا دون الحاجة إلى نشر المشروع.',
  'analytics.empty': 'لا يوجد نشاط بعد',
  'analytics.countries': 'الزوار حسب الدولة',
  'analytics.clicks': 'العناصر الأكثر نقرًا',
  'analytics.noClicks': 'لم يتم تسجيل أي نقرات بعد.',
  'analytics.visitor': 'الزائر',
  'analytics.country': 'الدولة',
  'analytics.events': 'الأحداث',
  'analytics.refresh': 'تحديث',
  'analytics.visitors': 'الزوار',
  'analytics.pageviews': 'مشاهدات الصفحات',
  'analytics.totalClicks': 'إجمالي النقرات',
  'analytics.emptyDescription': 'افتح أو حدّث تبويب المعاينة ثم تفاعل مع الموقع. ستظهر الزيارات والنقرات هنا.',
  'analytics.localPreview': 'معاينة محلية',
  'analytics.local': 'محلي',
  'footer.features': 'المميزات',
  'footer.integrations': 'التكاملات',
  'footer.privacy': 'سياسة الخصوصية',
  'footer.terms': 'شروط الاستخدام',
  'footer.copyright': '© 2026 WebMax. جميع الحقوق محفوظة.',
  'credits.remaining': 'الرصيد المتبقي',
  'credits.daily': 'اليومي',
  'credits.monthly': 'الشهري',
  'credits.resetsDaily': 'يتجدد يوميًا',
  'credits.runningLow': 'رصيدك أوشك على النفاد',
  'models.upgradeAccess': 'ترقية الخطة',
  'menu.wallpaper': 'الخلفية',
  'menu.music': 'الموسيقى',
  'menu.billing': 'الفواتير',
  'menu.settings': 'الإعدادات',
};

const supplementalEnglishTranslations: Record<string, string> = {
  'home.projectType': 'Project type',
  'home.website': 'Website',
  'home.store': 'Online Store',
  'home.storePlaceholder': 'Describe your store: name, products, visual direction, and the sections you need…',
  'home.myStores': 'My stores',
  'home.admin': 'Admin',
  'home.beta': 'BETA',
  'home.add': 'Add',
  'home.attachImage': 'Attach Image',
  'home.oneImage': 'One image · max 3 MB',
  'home.proOnly': 'Paid plans only',
  'home.themes': 'Design systems',
  'home.choosePalette': 'Choose a color palette',
  'home.defaultThemes': 'Design systems',
  'home.stopListening': 'Stop listening',
  'home.voiceInput': 'Voice input',
  'home.meet': 'Meet Vivora X',
  'editor.analytics': 'Analytics',
  'editor.projectSettings': 'Project Settings',
  'editor.untitledProject': 'Untitled Project',
  'editor.credits': 'Credits',
  'editor.showChat': 'Show chat',
  'editor.hideChat': 'Hide chat',
  'editor.details': 'Details',
  'editor.noDetails': 'No details available',
  'editor.previewEmpty': 'Your preview will appear here',
  'chat.pointsConsumption': 'Points Consumption',
  'chat.siteCredits': 'Site Credits',
  'chat.aiTokens': 'AI Tokens',
  'chat.noFiles': 'No files found',
  'details.close': 'Close',
  'details.changes': 'Changes',
  'details.changeCount': '{count} changes',
  'details.totalCount': '{count} total',
  'code.explorer': 'Explorer',
  'code.noFiles': 'No files generated yet',
  'code.undo': 'Undo',
  'code.redo': 'Redo',
  'code.save': 'Save',
  'code.proRequired': 'Code editing requires a Pro or Business plan. Upgrade from your account menu.',
  'code.generating': 'Generating…',
  'code.new': 'New',
  'code.generatingFiles': 'Generating files…',
  'code.selectFile': 'Select a file to view',
  'preview.size': 'Preview size',
  'preview.desktop': 'Desktop preview',
  'preview.mobile': 'Mobile preview',
  'preview.refresh': 'Refresh preview',
  'preview.openTab': 'Open in a browser tab',
  'preview.browser': 'Browser preview',
  'preview.ready': 'Browser preview ready',
  'preview.waiting': 'Waiting for index.html',
  'preview.writing': 'Writing the website files…',
  'preview.startsWhenReady': 'The preview starts when index.html is ready.',
  'preview.browserDescription': 'Vivora X renders HTML, CSS, and JavaScript directly in your browser.',
  'versions.empty': 'No versions yet',
  'visual.title': 'Visual Edit',
  'visual.contentPlaceholder': 'Enter content…',
  'visual.default': 'Default',
  'visual.text': 'Text',
  'visual.background': 'Background',
  'visual.content': 'Content',
  'visual.font': 'Font',
  'visual.colors': 'Colors',
  'analytics.loading': 'Loading analytics',
  'analytics.live': 'Live preview analytics',
  'analytics.activity': 'Project activity',
  'analytics.description': 'Tracking is injected automatically. Publishing is not required.',
  'analytics.empty': 'No activity yet',
  'analytics.countries': 'Visitors by country',
  'analytics.clicks': 'Most clicked elements',
  'analytics.noClicks': 'No clicks recorded yet.',
  'analytics.visitor': 'Visitor',
  'analytics.country': 'Country',
  'analytics.events': 'Events',
  'analytics.refresh': 'Refresh',
  'analytics.visitors': 'Visitors',
  'analytics.pageviews': 'Page views',
  'analytics.totalClicks': 'Total clicks',
  'analytics.emptyDescription': 'Open or refresh the Preview tab, then interact with the generated website. Visits and clicks will appear here.',
  'analytics.localPreview': 'Local preview',
  'analytics.local': 'Local',
  'menu.wallpaper': 'Wallpaper',
  'menu.music': 'Music',
  'menu.billing': 'Billing',
  'menu.settings': 'Settings',
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
    return saved && ['en', 'ar', 'zh', 'ja', 'fr'].includes(saved) ? saved as Language : 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('rocket-language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = (language === 'ar' ? arabicTranslations[key] : undefined)
      || translations[key]?.[language]
      || translations[key]?.en
      || supplementalEnglishTranslations[key]
      || key;

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
