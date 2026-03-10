/**
 * Sample data for demo/preview across all platforms.
 * Each platform has 10 realistic posts with full analysis metadata.
 */

export type Platform = "x" | "tiktok" | "instagram" | "youtube";

export interface SamplePost {
  id: string;
  platform: Platform;
  text: string;
  author: string;
  authorName: string;
  authorAvatar: string;
  authorVerified: boolean;
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  createdAt: string;
  url: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  emotion: string;
  reason: string;
  keywords: string[];
  matchedAccount?: string;
}

export interface SampleAnalysis {
  id: string;
  created_at: string;
  search_terms: string[];
  total_tweets: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  insights: string;
  recommendations: string[];
  main_issues: string[];
  themes: string[];
  emotions: Record<string, number>;
  topKeywords: { keyword: string; count: number }[];
}

/* ═══════════════════════════════════════════════════
   X / Twitter Posts
   ═══════════════════════════════════════════════════ */

export const SAMPLE_X_POSTS: SamplePost[] = [
  {
    id: "x_1", platform: "x",
    text: "بودكاست فنجان من أفضل المحتويات العربية، كل حلقة تفتح آفاق جديدة. شكراً ثمانية على الجودة المستمرة",
    author: "khalid_m92", authorName: "خالد المطيري", authorAvatar: "خ", authorVerified: false,
    likes: 342, comments: 28, shares: 67, createdAt: "2026-03-08T14:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.95, emotion: "حماس",
    reason: "تعبير واضح عن الإعجاب والشكر للمحتوى", keywords: ["فنجان", "بودكاست", "جودة"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_2", platform: "x",
    text: "للأسف جودة الصوت في الحلقة الأخيرة كانت سيئة جداً، صدى وتقطيع مستمر. أتمنى الاهتمام بهذا الجانب أكثر",
    author: "sara_tech", authorName: "سارة التقنية", authorAvatar: "س", authorVerified: true,
    likes: 89, comments: 45, shares: 12, createdAt: "2026-03-07T09:15:00Z",
    url: "#", sentiment: "negative", confidence: 0.88, emotion: "إحباط",
    reason: "شكوى من مشكلة تقنية في جودة الصوت", keywords: ["صوت", "جودة", "تقطيع"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_3", platform: "x",
    text: "ثمانية رياضة غطّت مباراة الهلال بشكل ممتاز. التحليل التكتيكي كان عالي المستوى",
    author: "ahmed_sports", authorName: "أحمد الرياضي", authorAvatar: "أ", authorVerified: false,
    likes: 521, comments: 63, shares: 98, createdAt: "2026-03-06T22:45:00Z",
    url: "#", sentiment: "positive", confidence: 0.92, emotion: "فرح",
    reason: "إشادة بجودة التغطية الرياضية والتحليل", keywords: ["هلال", "تحليل", "رياضة"],
    matchedAccount: "thmanyahsports",
  },
  {
    id: "x_4", platform: "x",
    text: "حلقة اليوم مع وزير التعليم كانت سطحية ولم تتطرق للمشاكل الحقيقية. كنت أتوقع أسئلة أعمق",
    author: "noura_edu", authorName: "نورة العلم", authorAvatar: "ن", authorVerified: false,
    likes: 234, comments: 156, shares: 45, createdAt: "2026-03-06T18:20:00Z",
    url: "#", sentiment: "negative", confidence: 0.85, emotion: "غضب",
    reason: "انتقاد لمحتوى الحلقة وعمق الأسئلة", keywords: ["تعليم", "أسئلة", "سطحية"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_5", platform: "x",
    text: "ثمانية أعلنت عن بودكاست جديد يبدأ الأسبوع القادم. ننتظر التفاصيل",
    author: "media_watcher", authorName: "مراقب إعلامي", authorAvatar: "م", authorVerified: true,
    likes: 156, comments: 23, shares: 89, createdAt: "2026-03-05T12:00:00Z",
    url: "#", sentiment: "neutral", confidence: 0.91, emotion: "محايد",
    reason: "خبر إعلامي بدون توجه عاطفي واضح", keywords: ["بودكاست", "جديد", "إعلان"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_6", platform: "x",
    text: "تطبيق ثمانية الجديد رائع! التصميم نظيف والتنقل سهل. أخيراً تطبيق عربي بمستوى عالمي",
    author: "ux_designer_sa", authorName: "فهد المصمم", authorAvatar: "ف", authorVerified: false,
    likes: 678, comments: 42, shares: 134, createdAt: "2026-03-05T08:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.97, emotion: "فرح",
    reason: "إشادة قوية بالتطبيق والتصميم", keywords: ["تطبيق", "تصميم", "عالمي"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_7", platform: "x",
    text: "الاشتراك الشهري غالي مقارنة بالمحتوى المقدم. ٤٠ ريال كثير على بودكاستات فقط",
    author: "budget_listener", authorName: "عبدالله الحربي", authorAvatar: "ع", authorVerified: false,
    likes: 198, comments: 87, shares: 34, createdAt: "2026-03-04T16:45:00Z",
    url: "#", sentiment: "negative", confidence: 0.82, emotion: "إحباط",
    reason: "شكوى من ارتفاع سعر الاشتراك", keywords: ["اشتراك", "سعر", "غالي"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_8", platform: "x",
    text: "مقابلة عبدالرحمن أبومالح مع إيلون ماسك ستكون تاريخية لو حصلت. هل هناك خطط؟",
    author: "curious_sa", authorName: "يوسف المتابع", authorAvatar: "ي", authorVerified: false,
    likes: 445, comments: 123, shares: 201, createdAt: "2026-03-04T10:00:00Z",
    url: "#", sentiment: "neutral", confidence: 0.78, emotion: "حماس",
    reason: "سؤال وتمنّي بدون شكوى أو إشادة مباشرة", keywords: ["أبومالح", "مقابلة", "ماسك"],
    matchedAccount: "taborathmanyah",
  },
  {
    id: "x_9", platform: "x",
    text: "ثمانية رياضة أصبحت المصدر الأول للتحليل الرياضي السعودي. محتوى يفوق القنوات التلفزيونية",
    author: "sports_fan_ksa", authorName: "ماجد الرياضي", authorAvatar: "م", authorVerified: false,
    likes: 867, comments: 54, shares: 178, createdAt: "2026-03-03T20:15:00Z",
    url: "#", sentiment: "positive", confidence: 0.94, emotion: "حماس",
    reason: "مقارنة إيجابية مع المنافسين التقليديين", keywords: ["رياضة", "تحليل", "تلفزيون"],
    matchedAccount: "thmanyahsports",
  },
  {
    id: "x_10", platform: "x",
    text: "عدد الإعلانات في البودكاست زاد بشكل ملحوظ. ٣ إعلانات في حلقة ٤٥ دقيقة مبالغ فيه",
    author: "ad_hater", authorName: "ريم المستمعة", authorAvatar: "ر", authorVerified: false,
    likes: 312, comments: 98, shares: 56, createdAt: "2026-03-03T14:30:00Z",
    url: "#", sentiment: "negative", confidence: 0.86, emotion: "غضب",
    reason: "انتقاد لكثرة الإعلانات", keywords: ["إعلانات", "بودكاست", "كثرة"],
    matchedAccount: "taborathmanyah",
  },
];

/* ═══════════════════════════════════════════════════
   TikTok Posts
   ═══════════════════════════════════════════════════ */

export const SAMPLE_TIKTOK_POSTS: SamplePost[] = [
  {
    id: "tt_1", platform: "tiktok",
    text: "هذا المقطع من ثمانية ليڤنق عن تنظيم المطبخ غيّر حياتي! طبقت كل النصائح",
    author: "home_lover", authorName: "منيرة الديكور", authorAvatar: "م", authorVerified: false,
    likes: 45200, comments: 890, shares: 12300, views: 890000, createdAt: "2026-03-08T10:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.96, emotion: "فرح",
    reason: "تأثير إيجابي مباشر على حياة المتابع", keywords: ["مطبخ", "تنظيم", "نصائح"],
    matchedAccount: "thmanyahliving",
  },
  {
    id: "tt_2", platform: "tiktok",
    text: "فيديو ثمانية الجديد عن تاريخ القهوة السعودية، معلومات ما كنت أعرفها. محتوى ثري",
    author: "coffee_sa", authorName: "فيصل القهوجي", authorAvatar: "ف", authorVerified: false,
    likes: 23400, comments: 567, shares: 8900, views: 456000, createdAt: "2026-03-07T15:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.93, emotion: "مفاجأة",
    reason: "اكتشاف معلومات جديدة وتقدير للمحتوى", keywords: ["قهوة", "تاريخ", "سعودية"],
    matchedAccount: "thmanyah",
  },
  {
    id: "tt_3", platform: "tiktok",
    text: "مقاطع ثمانية اكزت القصيرة ممتازة لكن أتمنى ترجمة إنجليزية للمحتوى",
    author: "bilingual_viewer", authorName: "لينا ثنائية اللغة", authorAvatar: "ل", authorVerified: false,
    likes: 3400, comments: 234, shares: 120, views: 67000, createdAt: "2026-03-07T08:45:00Z",
    url: "#", sentiment: "neutral", confidence: 0.80, emotion: "محايد",
    reason: "إشادة مع اقتراح تحسين", keywords: ["ترجمة", "إنجليزي", "مقاطع"],
    matchedAccount: "thmanyahexit",
  },
  {
    id: "tt_4", platform: "tiktok",
    text: "حلقة راديو ثمانية عن الذكاء الاصطناعي كانت مرعبة! المستقبل مخيف بصراحة",
    author: "tech_worried", authorName: "هند التقنية", authorAvatar: "ه", authorVerified: false,
    likes: 18700, comments: 1200, shares: 5600, views: 340000, createdAt: "2026-03-06T19:00:00Z",
    url: "#", sentiment: "neutral", confidence: 0.75, emotion: "قلق",
    reason: "تفاعل عاطفي مع المحتوى دون شكوى أو إشادة مباشرة", keywords: ["ذكاء", "اصطناعي", "مستقبل"],
    matchedAccount: "radiothmanyah",
  },
  {
    id: "tt_5", platform: "tiktok",
    text: "الفيديو حلو بس الإضاءة سيئة والمونتاج مليان قطعات. ممكن تحسنون الجودة البصرية؟",
    author: "video_critic", authorName: "عمر المونتير", authorAvatar: "ع", authorVerified: false,
    likes: 890, comments: 156, shares: 23, views: 45000, createdAt: "2026-03-06T11:30:00Z",
    url: "#", sentiment: "negative", confidence: 0.84, emotion: "إحباط",
    reason: "انتقاد تقني لجودة الإنتاج", keywords: ["إضاءة", "مونتاج", "جودة"],
    matchedAccount: "thmanyah",
  },
  {
    id: "tt_6", platform: "tiktok",
    text: "ثمانية رياضة على تيك توك هي الأسرع في نشر أهداف الدوري! دائماً أول من ينزل المقطع",
    author: "goal_chaser", authorName: "بدر الأهداف", authorAvatar: "ب", authorVerified: false,
    likes: 34500, comments: 423, shares: 9800, views: 720000, createdAt: "2026-03-05T23:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.91, emotion: "حماس",
    reason: "إشادة بسرعة النشر والتغطية", keywords: ["أهداف", "دوري", "سرعة"],
    matchedAccount: "thmanyahsports",
  },
  {
    id: "tt_7", platform: "tiktok",
    text: "ليش ثمانية ما عندها محتوى عن الألعاب والقيمينق؟ جمهور كبير مهمل",
    author: "gamer_sa", authorName: "سلطان القيمر", authorAvatar: "س", authorVerified: false,
    likes: 5600, comments: 890, shares: 230, views: 120000, createdAt: "2026-03-05T16:15:00Z",
    url: "#", sentiment: "negative", confidence: 0.79, emotion: "إحباط",
    reason: "شكوى من غياب محتوى معين", keywords: ["ألعاب", "قيمينق", "محتوى"],
    matchedAccount: "thmanyah",
  },
  {
    id: "tt_8", platform: "tiktok",
    text: "فيديو ثمانية ليڤنق عن وصفة الكبسة الأصلية وصل مليون مشاهدة! يستاهل",
    author: "foodie_riyadh", authorName: "دانة الطبخ", authorAvatar: "د", authorVerified: true,
    likes: 67800, comments: 2300, shares: 18900, views: 1200000, createdAt: "2026-03-04T13:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.94, emotion: "فرح",
    reason: "احتفال بنجاح المحتوى وانتشاره", keywords: ["كبسة", "وصفة", "مليون"],
    matchedAccount: "thmanyahliving",
  },
  {
    id: "tt_9", platform: "tiktok",
    text: "ثمانية اكزت بدأت تنزل محتوى بالإنجليزي. خطوة ذكية للوصول لجمهور أوسع",
    author: "global_view", authorName: "ريان العالمي", authorAvatar: "ر", authorVerified: false,
    likes: 8900, comments: 345, shares: 1200, views: 190000, createdAt: "2026-03-04T07:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.87, emotion: "محايد",
    reason: "تقييم إيجابي لقرار استراتيجي", keywords: ["إنجليزي", "جمهور", "عالمي"],
    matchedAccount: "thmanyahexit",
  },
  {
    id: "tt_10", platform: "tiktok",
    text: "تعليقات ثمانية على التيك توك ما فيها تفاعل من الحساب الرسمي. شوي تواصل يا جماعة",
    author: "engagement_seeker", authorName: "مشعل المتابع", authorAvatar: "م", authorVerified: false,
    likes: 2100, comments: 567, shares: 89, views: 56000, createdAt: "2026-03-03T18:45:00Z",
    url: "#", sentiment: "negative", confidence: 0.81, emotion: "إحباط",
    reason: "شكوى من ضعف التفاعل مع الجمهور", keywords: ["تفاعل", "تعليقات", "تواصل"],
    matchedAccount: "thmanyah",
  },
];

/* ═══════════════════════════════════════════════════
   Instagram Posts
   ═══════════════════════════════════════════════════ */

export const SAMPLE_INSTAGRAM_POSTS: SamplePost[] = [
  {
    id: "ig_1", platform: "instagram",
    text: "تصميم بوستر الحلقة الجديدة من سقراط خرافي! فريق التصميم في ثمانية مبدعين",
    author: "design_fan_sa", authorName: "عائشة المصممة", authorAvatar: "ع", authorVerified: false,
    likes: 12400, comments: 234, shares: 890, createdAt: "2026-03-08T11:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.95, emotion: "حماس",
    reason: "إشادة قوية بالعمل البصري والتصميم", keywords: ["تصميم", "سقراط", "بوستر"],
    matchedAccount: "thmanyah",
  },
  {
    id: "ig_2", platform: "instagram",
    text: "ريلز ثمانية رياضة عن أفضل لحظات الجولة الأخيرة. مونتاج سينمائي احترافي",
    author: "reel_lover", authorName: "ناصر السينمائي", authorAvatar: "ن", authorVerified: false,
    likes: 34500, comments: 567, shares: 4500, createdAt: "2026-03-07T20:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.93, emotion: "فرح",
    reason: "تقدير عالي لجودة الإنتاج المرئي", keywords: ["ريلز", "مونتاج", "احترافي"],
    matchedAccount: "thmanyahsports",
  },
  {
    id: "ig_3", platform: "instagram",
    text: "ليش ما فيه ستوريز يومية من ثمانية ليڤنق؟ المحتوى الحالي حلو بس قليل",
    author: "daily_stories", authorName: "لمى المتابعة", authorAvatar: "ل", authorVerified: false,
    likes: 1200, comments: 89, shares: 23, createdAt: "2026-03-07T14:00:00Z",
    url: "#", sentiment: "negative", confidence: 0.76, emotion: "إحباط",
    reason: "طلب لزيادة المحتوى مع إشارة لقلته", keywords: ["ستوريز", "يومي", "محتوى"],
    matchedAccount: "thmanyahliving",
  },
  {
    id: "ig_4", platform: "instagram",
    text: "صور الكواليس من تصوير الحلقة الأخيرة من فنجان. عبدالرحمن أبومالح يبدو مرتاح وسعيد",
    author: "behind_scenes", authorName: "جود الكواليس", authorAvatar: "ج", authorVerified: false,
    likes: 23400, comments: 345, shares: 2100, createdAt: "2026-03-06T16:45:00Z",
    url: "#", sentiment: "neutral", confidence: 0.82, emotion: "محايد",
    reason: "وصف لمحتوى بدون توجه عاطفي قوي", keywords: ["كواليس", "فنجان", "أبومالح"],
    matchedAccount: "thmanyah",
  },
  {
    id: "ig_5", platform: "instagram",
    text: "إنستغرام ثمانية اكزت فيه أفضل محتوى وثائقي مختصر بالعربي. كل بوست فيه قيمة",
    author: "documentary_fan", authorName: "خلود الوثائقية", authorAvatar: "خ", authorVerified: false,
    likes: 8900, comments: 123, shares: 1500, createdAt: "2026-03-06T09:15:00Z",
    url: "#", sentiment: "positive", confidence: 0.91, emotion: "حماس",
    reason: "إشادة بقيمة المحتوى الوثائقي", keywords: ["وثائقي", "عربي", "قيمة"],
    matchedAccount: "thmanyahexit",
  },
  {
    id: "ig_6", platform: "instagram",
    text: "جودة الصور في حساب ثمانية الرئيسي انخفضت مؤخراً. الفلاتر والألوان مش زي قبل",
    author: "photo_critic", authorName: "طلال المصور", authorAvatar: "ط", authorVerified: true,
    likes: 2300, comments: 178, shares: 45, createdAt: "2026-03-05T18:30:00Z",
    url: "#", sentiment: "negative", confidence: 0.83, emotion: "إحباط",
    reason: "ملاحظة سلبية على انخفاض الجودة البصرية", keywords: ["صور", "جودة", "فلاتر"],
    matchedAccount: "thmanyah",
  },
  {
    id: "ig_7", platform: "instagram",
    text: "راديو ثمانية نزّل كليب من حلقة البارحة عن ريادة الأعمال. مقطع ملهم جداً",
    author: "entrepreneur_sa", authorName: "سلمى الريادية", authorAvatar: "س", authorVerified: false,
    likes: 15600, comments: 234, shares: 3400, createdAt: "2026-03-05T12:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.90, emotion: "حماس",
    reason: "تأثر إيجابي بالمحتوى الملهم", keywords: ["ريادة", "أعمال", "ملهم"],
    matchedAccount: "radiothmanyah",
  },
  {
    id: "ig_8", platform: "instagram",
    text: "مسابقة ثمانية رياضة الأخيرة كانت ممتعة! فزت بكتاب. شكراً على التفاعل مع المتابعين",
    author: "contest_winner", authorName: "وائل الفائز", authorAvatar: "و", authorVerified: false,
    likes: 4500, comments: 89, shares: 234, createdAt: "2026-03-04T15:15:00Z",
    url: "#", sentiment: "positive", confidence: 0.93, emotion: "فرح",
    reason: "تجربة إيجابية مباشرة مع العلامة التجارية", keywords: ["مسابقة", "فوز", "تفاعل"],
    matchedAccount: "thmanyahsports",
  },
  {
    id: "ig_9", platform: "instagram",
    text: "الإعلانات المدمجة في بوستات ثمانية صارت كثيرة ومزعجة. صعب تفرّق بين المحتوى والإعلان",
    author: "ad_free_please", authorName: "ندى بلا إعلانات", authorAvatar: "ن", authorVerified: false,
    likes: 3400, comments: 267, shares: 78, createdAt: "2026-03-04T08:00:00Z",
    url: "#", sentiment: "negative", confidence: 0.87, emotion: "غضب",
    reason: "استياء من كثرة الإعلانات المدمجة", keywords: ["إعلانات", "مدمجة", "مزعجة"],
    matchedAccount: "thmanyah",
  },
  {
    id: "ig_10", platform: "instagram",
    text: "ثمانية وصلت ٢ مليون متابع على إنستغرام. إنجاز يستحق الاحتفال",
    author: "milestone_tracker", authorName: "حسن الإنجازات", authorAvatar: "ح", authorVerified: false,
    likes: 45600, comments: 890, shares: 5600, createdAt: "2026-03-03T17:00:00Z",
    url: "#", sentiment: "neutral", confidence: 0.85, emotion: "محايد",
    reason: "ذكر إحصائية بدون توجه عاطفي قوي", keywords: ["متابعين", "مليون", "إنجاز"],
    matchedAccount: "thmanyah",
  },
];

/* ═══════════════════════════════════════════════════
   YouTube Posts (Comments)
   ═══════════════════════════════════════════════════ */

export const SAMPLE_YOUTUBE_POSTS: SamplePost[] = [
  {
    id: "yt_1", platform: "youtube",
    text: "حلقة فنجان مع الدكتور أحمد من أقوى الحلقات! ٣ ساعات مرّت مثل ١٠ دقائق. محتوى استثنائي",
    author: "podcast_addict", authorName: "عبدالعزيز المستمع", authorAvatar: "ع", authorVerified: false,
    likes: 4500, comments: 0, shares: 890, views: 2300000, createdAt: "2026-03-08T08:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.97, emotion: "حماس",
    reason: "إعجاب شديد بالمحتوى مع وصف تجربة إيجابية", keywords: ["فنجان", "حلقة", "استثنائي"],
    matchedAccount: "Thmanyah",
  },
  {
    id: "yt_2", platform: "youtube",
    text: "الإعلان في بداية الفيديو طويل جداً ١٠ دقائق! خلاص فهمنا إن عندكم راعي. اختصروا",
    author: "skip_ad", authorName: "فاطمة المشاهدة", authorAvatar: "ف", authorVerified: false,
    likes: 2300, comments: 0, shares: 120, views: 890000, createdAt: "2026-03-07T18:00:00Z",
    url: "#", sentiment: "negative", confidence: 0.89, emotion: "غضب",
    reason: "شكوى حادة من طول الإعلانات", keywords: ["إعلان", "طويل", "اختصروا"],
    matchedAccount: "Thmanyah",
  },
  {
    id: "yt_3", platform: "youtube",
    text: "ثمانية اكزت أنتجوا فيلم وثائقي بمستوى نتفلكس. جودة التصوير والقصة لا تُصدَّق",
    author: "netflix_compare", authorName: "محمد السينمائي", authorAvatar: "م", authorVerified: true,
    likes: 8900, comments: 0, shares: 3400, views: 4500000, createdAt: "2026-03-07T10:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.96, emotion: "مفاجأة",
    reason: "مقارنة إيجابية جداً مع منصات عالمية", keywords: ["وثائقي", "نتفلكس", "تصوير"],
    matchedAccount: "ThmanyahExit",
  },
  {
    id: "yt_4", platform: "youtube",
    text: "راديو ثمانية أحتاج حلقات أطول! الحلقة خلصت وأنا لسا أبي أسمع. المحتوى يسرقك",
    author: "more_content", authorName: "هاجر المستمعة", authorAvatar: "ه", authorVerified: false,
    likes: 3400, comments: 0, shares: 567, views: 780000, createdAt: "2026-03-06T14:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.88, emotion: "حماس",
    reason: "طلب للمزيد نابع من الإعجاب", keywords: ["راديو", "حلقات", "أطول"],
    matchedAccount: "RadioThmanyah",
  },
  {
    id: "yt_5", platform: "youtube",
    text: "الترجمة الإنجليزية في الفيديوهات الأخيرة فيها أخطاء كثيرة. يرجى المراجعة",
    author: "subtitle_checker", authorName: "ريم المترجمة", authorAvatar: "ر", authorVerified: false,
    likes: 890, comments: 0, shares: 45, views: 230000, createdAt: "2026-03-06T09:00:00Z",
    url: "#", sentiment: "negative", confidence: 0.85, emotion: "محايد",
    reason: "ملاحظة سلبية بنّاءة على جودة الترجمة", keywords: ["ترجمة", "أخطاء", "إنجليزية"],
    matchedAccount: "Thmanyah",
  },
  {
    id: "yt_6", platform: "youtube",
    text: "حلقة ثمانية رياضة عن تاريخ كأس العالم ممتازة. أسلوب السرد شدّني من أول ثانية",
    author: "sports_history", authorName: "تركي المؤرخ", authorAvatar: "ت", authorVerified: false,
    likes: 5600, comments: 0, shares: 1200, views: 1500000, createdAt: "2026-03-05T20:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.92, emotion: "فرح",
    reason: "إشادة بالأسلوب السردي والمحتوى", keywords: ["كأس", "عالم", "سرد"],
    matchedAccount: "ThmanyahSports",
  },
  {
    id: "yt_7", platform: "youtube",
    text: "جودة الصوت في فيديوهات راديو ثمانية الأخيرة ممتازة. واضح إنكم غيرتوا المعدات",
    author: "audio_nerd", authorName: "باسل الصوتي", authorAvatar: "ب", authorVerified: false,
    likes: 1200, comments: 0, shares: 89, views: 340000, createdAt: "2026-03-05T12:30:00Z",
    url: "#", sentiment: "positive", confidence: 0.89, emotion: "فرح",
    reason: "ملاحظة إيجابية على تحسن تقني", keywords: ["صوت", "جودة", "معدات"],
    matchedAccount: "RadioThmanyah",
  },
  {
    id: "yt_8", platform: "youtube",
    text: "ثمانية تنزل فيديوهات بجدول غير منتظم. صعب تتابع إذا ما عندك إشعارات. حددوا أيام ثابتة",
    author: "schedule_please", authorName: "غادة المنظمة", authorAvatar: "غ", authorVerified: false,
    likes: 1800, comments: 0, shares: 56, views: 190000, createdAt: "2026-03-04T16:00:00Z",
    url: "#", sentiment: "negative", confidence: 0.80, emotion: "إحباط",
    reason: "شكوى من عدم انتظام جدول النشر", keywords: ["جدول", "نشر", "انتظام"],
    matchedAccount: "Thmanyah",
  },
  {
    id: "yt_9", platform: "youtube",
    text: "كمية التعليقات الإيجابية على فيديوهات ثمانية تدل على ثقة الجمهور. مجتمع حقيقي",
    author: "community_fan", authorName: "سعد المحلل", authorAvatar: "س", authorVerified: false,
    likes: 2300, comments: 0, shares: 345, views: 560000, createdAt: "2026-03-04T10:00:00Z",
    url: "#", sentiment: "neutral", confidence: 0.83, emotion: "محايد",
    reason: "ملاحظة تحليلية بدون توجه شخصي واضح", keywords: ["مجتمع", "ثقة", "تعليقات"],
    matchedAccount: "Thmanyah",
  },
  {
    id: "yt_10", platform: "youtube",
    text: "حلقة اكزت الوثائقية عن العمارة السعودية فازت بجائزة دولية. فخر للمحتوى العربي!",
    author: "proud_viewer", authorName: "أمل الفخورة", authorAvatar: "أ", authorVerified: false,
    likes: 12300, comments: 0, shares: 4500, views: 3400000, createdAt: "2026-03-03T13:00:00Z",
    url: "#", sentiment: "positive", confidence: 0.95, emotion: "فرح",
    reason: "فخر بإنجاز وجائزة دولية", keywords: ["جائزة", "وثائقي", "عمارة"],
    matchedAccount: "ThmanyahExit",
  },
];

/* ═══════════════════════════════════════════════════
   All posts combined
   ═══════════════════════════════════════════════════ */

export const ALL_SAMPLE_POSTS: SamplePost[] = [
  ...SAMPLE_X_POSTS,
  ...SAMPLE_TIKTOK_POSTS,
  ...SAMPLE_INSTAGRAM_POSTS,
  ...SAMPLE_YOUTUBE_POSTS,
];

/* ═══════════════════════════════════════════════════
   Sample History Analyses (for tweet analysis history)
   ═══════════════════════════════════════════════════ */

export const SAMPLE_ANALYSES: SampleAnalysis[] = [
  {
    id: "demo_1",
    created_at: "2026-03-08T15:30:00Z",
    search_terms: ["ثمانية", "فنجان"],
    total_tweets: 245,
    positive_count: 142, negative_count: 58, neutral_count: 45,
    insights: "الجمهور يُظهر ارتياحاً كبيراً تجاه محتوى فنجان، خاصة الحلقات التي تتناول مواضيع اجتماعية. أبرز نقاط القوة هي جودة الضيوف وعمق الحوار. التعليقات السلبية تتركز حول طول الإعلانات وعدم تنوع المواضيع.",
    recommendations: [
      "تقليل مدة الإعلانات المدمجة في الحلقات إلى أقل من 3 دقائق",
      "التنويع في اختيار الضيوف ليشمل مجالات جديدة مثل التقنية والفن",
      "إضافة ملخصات مكتوبة للحلقات لتحسين الوصول",
      "تفعيل التفاعل مع التعليقات بشكل أسرع",
    ],
    main_issues: [
      "طول الإعلانات في بداية الحلقات",
      "ضعف التفاعل مع تعليقات الجمهور على المنصات",
      "عدم انتظام جدول النشر أحياناً",
    ],
    themes: ["بودكاست فنجان", "جودة المحتوى", "الإعلانات", "التفاعل المجتمعي"],
    emotions: { "حماس": 78, "فرح": 64, "إحباط": 35, "غضب": 23, "محايد": 45 },
    topKeywords: [
      { keyword: "فنجان", count: 89 }, { keyword: "بودكاست", count: 76 },
      { keyword: "حلقة", count: 65 }, { keyword: "محتوى", count: 54 },
      { keyword: "ثمانية", count: 48 }, { keyword: "إعلان", count: 32 },
      { keyword: "ضيف", count: 28 }, { keyword: "جودة", count: 25 },
    ],
  },
  {
    id: "demo_2",
    created_at: "2026-03-05T10:00:00Z",
    search_terms: ["ثمانية رياضة", "thmanyahsports"],
    total_tweets: 180,
    positive_count: 112, negative_count: 28, neutral_count: 40,
    insights: "حساب ثمانية رياضة يحظى بتفاعل إيجابي قوي خاصة مع التغطيات الحية للمباريات. سرعة النشر والتحليل التكتيكي من أبرز نقاط القوة. بعض المتابعين يطالبون بتغطية رياضات متنوعة غير كرة القدم.",
    recommendations: [
      "توسيع التغطية لتشمل رياضات أخرى مثل الفورمولا 1 والتنس",
      "إطلاق بودكاست رياضي أسبوعي متخصص",
      "تحسين جودة البث المباشر وإضافة ضيوف محللين",
    ],
    main_issues: [
      "التركيز المفرط على كرة القدم فقط",
      "غياب التحليل للرياضات الفردية",
    ],
    themes: ["كرة القدم", "الدوري السعودي", "التحليل التكتيكي", "البث المباشر"],
    emotions: { "حماس": 89, "فرح": 45, "محايد": 40, "إحباط": 18, "غضب": 10 },
    topKeywords: [
      { keyword: "رياضة", count: 67 }, { keyword: "مباراة", count: 54 },
      { keyword: "تحليل", count: 43 }, { keyword: "هلال", count: 38 },
      { keyword: "دوري", count: 35 }, { keyword: "أهداف", count: 29 },
    ],
  },
  {
    id: "demo_3",
    created_at: "2026-03-01T08:00:00Z",
    search_terms: ["ثمانية اكزت", "ثمانية ليڤنق", "راديو ثمانية"],
    total_tweets: 320,
    positive_count: 178, negative_count: 72, neutral_count: 70,
    insights: "العلامات الفرعية لثمانية تُظهر أداءً متفاوتاً. ثمانية اكزت تتصدر من حيث جودة المحتوى الوثائقي، بينما ثمانية ليڤنق تحقق انتشاراً واسعاً بمحتوى نمط الحياة. راديو ثمانية يواجه تحدياً في الوصول لجمهور أصغر سناً.",
    recommendations: [
      "زيادة إنتاج المحتوى الوثائقي لثمانية اكزت — الطلب مرتفع",
      "تطوير محتوى تفاعلي لثمانية ليڤنق على تيك توك وريلز",
      "استقطاب مقدمين شباب لراديو ثمانية لتوسيع الجمهور",
      "إنشاء محتوى مشترك بين العلامات الفرعية لتبادل الجمهور",
    ],
    main_issues: [
      "ضعف وصول راديو ثمانية للفئة العمرية 18-25",
      "قلة المحتوى المنشور في ثمانية ليڤنق",
      "طول فترة الإنتاج للأفلام الوثائقية",
    ],
    themes: ["محتوى وثائقي", "نمط الحياة", "راديو", "الجمهور الشاب", "التوسع"],
    emotions: { "حماس": 95, "فرح": 83, "محايد": 70, "إحباط": 42, "مفاجأة": 30 },
    topKeywords: [
      { keyword: "وثائقي", count: 78 }, { keyword: "ليڤنق", count: 65 },
      { keyword: "راديو", count: 54 }, { keyword: "اكزت", count: 48 },
      { keyword: "محتوى", count: 45 }, { keyword: "جودة", count: 38 },
      { keyword: "تصوير", count: 32 }, { keyword: "قصة", count: 28 },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   Helper: Aggregate stats per platform
   ═══════════════════════════════════════════════════ */

export function getPlatformStats(platform: Platform) {
  const posts = ALL_SAMPLE_POSTS.filter((p) => p.platform === platform);
  const positive = posts.filter((p) => p.sentiment === "positive").length;
  const negative = posts.filter((p) => p.sentiment === "negative").length;
  const neutral = posts.filter((p) => p.sentiment === "neutral").length;
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments, 0);
  const totalShares = posts.reduce((s, p) => s + p.shares, 0);
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);

  return { posts, positive, negative, neutral, totalLikes, totalComments, totalShares, totalViews, total: posts.length };
}
