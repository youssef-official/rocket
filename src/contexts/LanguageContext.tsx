import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh' | 'ja' | 'fr';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

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
  'home.mobileAnnouncement': { en: 'Webo: HTML, CSS & JavaScript with AI', zh: 'Webo：AI 生成 HTML、CSS 和 JavaScript', ja: 'Webo：AIでHTML・CSS・JavaScriptを生成', fr: 'Webo : HTML, CSS et JavaScript avec l’IA' },
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
  'footer.copyright': { en: '© 2026 Force Digital. All Rights Reserved.', zh: '© 2026 Force Digital. 保留所有权利.', ja: '© 2026 Force Digital. 全著作権所有.', fr: '© 2026 Force Digital. Tous droits réservés.' },
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
  'chat.placeholder': { en: 'What should Webo build or change?', zh: 'Webo 今天要构建或修改什么？', ja: 'Weboで何を作成・変更しますか？', fr: 'Que doit créer ou modifier Webo ?' },
  'chat.planPlaceholder': { en: 'Plan with Webo (no file changes)...', zh: '与 Webo 规划（不更改文件）...', ja: 'Weboと計画（ファイル変更なし）...', fr: 'Planifier avec Webo (sans modifier les fichiers)...' },
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
  zh: '中文',
  ja: '日本語',
  fr: 'Français',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rocket-language');
    if (saved === 'ar') return 'en'; // migrate Arabic users to English
    return (saved as Language) || 'en';
  });

  const isRTL = false; // No RTL languages remain

  useEffect(() => {
    localStorage.setItem('rocket-language', language);
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key]?.[language] || translations[key]?.['en'] || key;

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
